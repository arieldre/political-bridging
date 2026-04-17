<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { createClient } from '$lib/supabase/client';
  import { SignalingChannel } from '$lib/webrtc/signaling';
  import { PeerConnection } from '$lib/webrtc/peer';

  let { data } = $props();

  const supabase = createClient();
  const matchId = $page.params.matchId as string;

  // Video elements
  let localVideo = $state<HTMLVideoElement | null>(null);
  let remoteVideo = $state<HTMLVideoElement | null>(null);

  // State
  let connected = $state(false);
  let localStream = $state<MediaStream | null>(null);
  let callEnded = $state(false);
  let audioEnabled = $state(true);
  let videoEnabled = $state(true);
  let currentPromptIndex = $state(0);
  let timeLeft = $state(300); // 5 min in seconds
  let timerActive = $state(false);
  let connectionState = $state<RTCPeerConnectionState>('new');
  let showPrompt = $state(true);

  let signaling: SignalingChannel | null = null;
  let peer: PeerConnection | null = null;
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let prompts = $state<Array<{id: string; text: string}>>([]);

  // Load prompts
  async function loadPrompts() {
    try {
      const res = await fetch('/prompts/level_1.json');
      prompts = await res.json();
      // Pick 3 random prompts for this session
      prompts = prompts.sort(() => Math.random() - 0.5).slice(0, 3);
    } catch { prompts = [
      { id: '1', text: 'ספר לי על הדבר האחרון שעשה אותך מאושר/ת' },
      { id: '2', text: 'מה המקום האהוב עליך בישראל?' },
      { id: '3', text: 'מה הדבר שהכי גאה/ת בו?' }
    ]; }
  }

  function startTimer() {
    timerActive = true;
    timerInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(timerInterval!);
        endCall('completed');
      }
    }, 1000);
  }

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function toggleAudio() {
    if (!localStream) return;
    audioEnabled = !audioEnabled;
    localStream.getAudioTracks().forEach(t => t.enabled = audioEnabled);
  }

  function toggleVideo() {
    if (!localStream) return;
    videoEnabled = !videoEnabled;
    localStream.getVideoTracks().forEach(t => t.enabled = videoEnabled);
  }

  async function endCall(reason: 'completed' | 'left_early' | 'technical' = 'left_early') {
    if (callEnded) return;
    callEnded = true;
    timerInterval && clearInterval(timerInterval);

    // Signal partner
    signaling?.send({ type: 'end_call' });

    // Update match in DB
    if (data.user) {
      await supabase.from('matches').update({
        ended_at: new Date().toISOString(),
        completed: reason === 'completed',
        end_reason: reason
      }).eq('id', matchId);
    }

    // Cleanup
    localStream?.getTracks().forEach(t => t.stop());
    peer?.close();
    signaling?.destroy();

    // Navigate to rating
    goto(`/rate/${matchId}`);
  }

  onMount(async () => {
    if (!data.user) { goto('/auth'); return; }

    await loadPrompts();

    // Get media
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream = stream;
      if (localVideo) localVideo.srcObject = stream;
    } catch (e) {
      console.error('Camera/mic error:', e);
    }

    // Check if initiator (user_a) by fetching match
    const { data: match } = await supabase.from('matches').select('user_a, user_b').eq('id', matchId).single();
    if (!match) { goto('/home'); return; }

    const isInitiator = match.user_a === data.user!.id;

    // Guard: initiator sends offer only once
    let offerSent = false;

    // Set up signaling + WebRTC
    signaling = new SignalingChannel(supabase, matchId, data.user!.id, async (msg) => {
      if (msg.type === 'end_call') { endCall('left_early'); return; }
      // When non-initiator announces they're ready, initiator sends the offer
      if (msg.type === 'ready' && isInitiator && !offerSent) {
        offerSent = true;
        await peer?.startCall();
        return;
      }
      await peer?.handleSignal(msg);
    });

    peer = new PeerConnection(signaling, isInitiator);
    peer.onConnectionStateChange = (state) => {
      connectionState = state;
      if (state === 'connected') { connected = true; startTimer(); }
    };
    peer.onRemoteStream = (stream) => {
      if (remoteVideo) remoteVideo.srcObject = stream;
    };

    if (localStream) peer.addLocalStream(localStream);

    // Announce ready to the other peer
    await signaling.send({ type: 'ready' });

    // Initiator fallback: if non-initiator was already in the channel and missed
    // our subscription window, send the offer after a short delay if not yet sent.
    if (isInitiator) {
      setTimeout(async () => {
        if (!offerSent) {
          offerSent = true;
          await peer?.startCall();
        }
      }, 2000);
    }
  });

  onDestroy(() => {
    timerInterval && clearInterval(timerInterval);
    signaling?.destroy();
    peer?.close();
    localStream?.getTracks().forEach(t => t.stop());
  });
</script>

<div class="min-h-screen bg-black flex flex-col relative">
  <!-- Connection status -->
  {#if !connected}
    <div class="absolute inset-0 flex items-center justify-center z-10 bg-black/80">
      <div class="text-center text-white">
        <div class="text-5xl mb-4">⏳</div>
        <p class="text-xl font-semibold">מתחבר...</p>
        <p class="text-sm text-gray-400 mt-2">
          {#if connectionState === 'connecting'}מתחבר לשותף...
          {:else if connectionState === 'failed'}חיבור נכשל — נסה שוב
          {:else}ממתין לשותף...{/if}
        </p>
      </div>
    </div>
  {/if}

  <!-- Remote video (main, full screen) -->
  <video
    bind:this={remoteVideo}
    autoplay
    playsinline
    class="w-full h-screen object-cover"
  ></video>

  <!-- Local video (PiP, top-left) -->
  <div class="absolute top-4 start-4 w-28 h-40 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 z-20">
    <video
      bind:this={localVideo}
      autoplay
      muted
      playsinline
      class="w-full h-full object-cover scale-x-[-1]"
    ></video>
    {#if !videoEnabled}
      <div class="absolute inset-0 bg-gray-800 flex items-center justify-center">
        <span class="text-2xl">📷</span>
      </div>
    {/if}
  </div>

  <!-- Timer + prompt area -->
  {#if connected}
    <div class="absolute top-4 inset-x-4 z-20 flex justify-center">
      <div class="bg-black/60 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-3">
        <span class="text-white font-mono font-bold text-lg {timeLeft < 60 ? 'text-red-400' : ''}">
          {formatTime(timeLeft)}
        </span>
        <span class="text-gray-400">•</span>
        <span class="text-white/80 text-sm">רמה 1</span>
      </div>
    </div>

    <!-- Prompt card -->
    {#if showPrompt && prompts.length > 0}
      <div class="absolute bottom-28 inset-x-4 z-20">
        <div class="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl">
          <div class="flex justify-between items-start mb-2">
            <span class="text-xs text-[#1E6FEB] font-semibold">שאלת פתיחה {currentPromptIndex + 1}/{prompts.length}</span>
            <button onclick={() => showPrompt = false} class="text-gray-400 text-lg leading-none">×</button>
          </div>
          <p class="text-[#0F172A] font-medium text-center text-base leading-relaxed">
            {prompts[currentPromptIndex]?.text}
          </p>
          {#if currentPromptIndex < prompts.length - 1}
            <button
              onclick={() => currentPromptIndex++}
              class="btn-secondary w-full mt-3 py-2 text-sm"
            >
              שאלה הבאה ←
            </button>
          {/if}
        </div>
      </div>
    {:else if !showPrompt}
      <button
        onclick={() => showPrompt = true}
        class="absolute bottom-28 end-4 z-20 bg-white/80 rounded-full p-3 shadow text-sm font-semibold"
      >
        💬 שאלות
      </button>
    {/if}
  {/if}

  <!-- Controls bar -->
  <div class="absolute bottom-0 inset-x-0 z-20 bg-black/70 backdrop-blur-sm px-6 py-4 safe-area-inset-bottom">
    <div class="flex justify-around items-center max-w-sm mx-auto">
      <!-- Audio toggle -->
      <button
        onclick={toggleAudio}
        class="flex flex-col items-center gap-1"
      >
        <div class="w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-colors {audioEnabled ? 'bg-white/20' : 'bg-red-500'}">
          {audioEnabled ? '🎤' : '🔇'}
        </div>
        <span class="text-white/60 text-xs">{audioEnabled ? 'השתק' : 'בטל השתקה'}</span>
      </button>

      <!-- End call -->
      <button onclick={() => endCall('left_early')} class="flex flex-col items-center gap-1">
        <div class="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-2xl shadow-lg">
          📵
        </div>
        <span class="text-white/60 text-xs">סיים שיחה</span>
      </button>

      <!-- Video toggle -->
      <button onclick={toggleVideo} class="flex flex-col items-center gap-1">
        <div class="w-14 h-14 rounded-full flex items-center justify-center text-2xl {videoEnabled ? 'bg-white/20' : 'bg-red-500'}">
          {videoEnabled ? '📹' : '🚫'}
        </div>
        <span class="text-white/60 text-xs">{videoEnabled ? 'כבה וידאו' : 'הפעל וידאו'}</span>
      </button>
    </div>
  </div>
</div>
