<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { createClient } from '$lib/supabase/client';

  let { data } = $props();
  const supabase = createClient();

  let waitingSeconds = $state(0);
  let matchFound = $state(false);
  let cancelled = $state(false);
  let matchPreview = $state<{hobbyOverlap: string[]} | null>(null);

  // Waiting game state
  let targetX = $state(50);
  let targetY = $state(50);
  let score = $state(0);
  let gameActive = $state(false);

  let pollInterval: ReturnType<typeof setInterval>;
  let timerInterval: ReturnType<typeof setInterval>;
  let matchChannel: any;

  function moveTarget() {
    targetX = 10 + Math.random() * 80;
    targetY = 20 + Math.random() * 60;
  }

  function tapTarget() {
    score++;
    moveTarget();
  }

  async function cancelSearch() {
    cancelled = true;
    await supabase.from('match_queue').delete().eq('user_id', data.user!.id);
    goto('/home');
  }

  async function checkForMatch() {
    if (!data.user) return;
    // Check if a match was created for this user
    const { data: match } = await supabase
      .from('matches')
      .select('id, hobby_overlap, level')
      .or(`user_a.eq.${data.user.id},user_b.eq.${data.user.id}`)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (match) {
      matchFound = true;
      matchPreview = { hobbyOverlap: match.hobby_overlap ?? [] };
      clearInterval(pollInterval);
      clearInterval(timerInterval);
      // Show preview for 2 seconds then navigate
      setTimeout(() => goto(`/call/${match.id}`), 2500);
    }
  }

  onMount(async () => {
    if (!data.user) { goto('/auth'); return; }

    // Make sure user is in queue
    await supabase.from('match_queue').upsert({
      user_id: data.user.id,
      level: data.profile?.level ?? 1,
      queued_at: new Date().toISOString()
    });

    // Start timer
    timerInterval = setInterval(() => {
      waitingSeconds++;
      if (waitingSeconds > 300) cancelSearch(); // 5 min timeout
    }, 1000);

    // Start polling every 3 seconds
    pollInterval = setInterval(checkForMatch, 3000);
    await checkForMatch(); // immediate first check

    // Start game after 5 seconds
    setTimeout(() => { gameActive = true; moveTarget(); }, 5000);

    // Subscribe to realtime for instant match notification
    matchChannel = supabase
      .channel(`queue:${data.user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `user_a=eq.${data.user.id}`
      }, () => checkForMatch())
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `user_b=eq.${data.user.id}`
      }, () => checkForMatch())
      .subscribe();
  });

  onDestroy(() => {
    clearInterval(pollInterval);
    clearInterval(timerInterval);
    matchChannel?.unsubscribe();
  });

  function formatWait(secs: number) {
    if (secs < 60) return `${secs} שניות`;
    return `${Math.floor(secs / 60)} דקות`;
  }
</script>

<main class="min-h-screen bg-[#F8FAFF] flex flex-col">
  {#if matchFound && matchPreview}
    <!-- Match found screen -->
    <div class="flex-1 flex items-center justify-center px-5">
      <div class="card p-8 text-center w-full max-w-sm">
        <div class="text-6xl mb-4 animate-bounce">🎉</div>
        <h2 class="text-2xl font-bold mb-2">נמצאה התאמה!</h2>
        {#if matchPreview.hobbyOverlap.length > 0}
          <p class="text-[#475569] mb-4">יש לכם תחומי עניין משותפים:</p>
          <div class="flex flex-wrap gap-2 justify-center mb-4">
            {#each matchPreview.hobbyOverlap as hobby}
              <span class="bg-[#E8F0FE] text-[#1E6FEB] text-sm px-3 py-1 rounded-full">{hobby}</span>
            {/each}
          </div>
        {/if}
        <p class="text-sm text-[#475569]">מתחיל שיחה...</p>
        <div class="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-[#1E6FEB] rounded-full animate-pulse" style="width: 100%"></div>
        </div>
      </div>
    </div>
  {:else}
    <!-- Waiting screen -->
    <header class="px-5 pt-12 pb-5">
      <button onclick={cancelSearch} class="text-[#475569] text-sm flex items-center gap-1">
        ← ביטול
      </button>
    </header>

    <div class="flex-1 flex flex-col items-center px-5">
      <div class="text-center mb-8">
        <div class="text-6xl mb-4 animate-spin" style="animation-duration: 3s">🌉</div>
        <h2 class="text-xl font-bold">מחפש התאמה...</h2>
        <p class="text-[#475569] text-sm mt-1">ממתין {formatWait(waitingSeconds)}</p>
        <p class="text-xs text-[#94A3B8] mt-1">מחפש מישהו שחושב אחרת ממך עם תחומי עניין דומים</p>
      </div>

      <!-- Waiting game -->
      {#if gameActive}
        <div class="card w-full max-w-sm p-4 mb-4">
          <div class="flex justify-between items-center mb-2">
            <p class="text-sm font-semibold">שחק בזמן ההמתנה 🎮</p>
            <span class="text-[#1E6FEB] font-bold">{score} נקודות</span>
          </div>
          <div
            class="relative bg-[#F8FAFF] rounded-xl overflow-hidden"
            style="height: 200px"
          >
            <button
              onclick={tapTarget}
              class="absolute w-12 h-12 bg-[#1E6FEB] rounded-full flex items-center justify-center text-white text-xl shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
              style="left: {targetX}%; top: {targetY}%; transform: translate(-50%, -50%)"
            >
              🌉
            </button>
            <p class="absolute bottom-2 inset-x-0 text-center text-xs text-[#94A3B8]">לחץ על הגשר!</p>
          </div>
        </div>
      {:else}
        <div class="card w-full max-w-sm p-6 text-center">
          <div class="flex justify-center gap-2 mb-4">
            {#each [0,1,2] as i}
              <div class="w-3 h-3 bg-[#1E6FEB] rounded-full animate-bounce" style="animation-delay: {i * 0.15}s"></div>
            {/each}
          </div>
          <p class="text-sm text-[#475569]">מנתח פרופילים התואמים לך...</p>
        </div>
      {/if}

      <p class="text-xs text-center text-[#94A3B8] mt-6 max-w-xs">
        ההתאמה דורשת שיהיה הבדל פוליטי משמעותי — אנחנו מחפשים מישהו שחושב אחרת ממך!
      </p>
    </div>
  {/if}
</main>
