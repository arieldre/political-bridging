<script lang="ts">
  import { goto } from '$app/navigation';
  import { createClient } from '$lib/supabase/client';
  import { onMount } from 'svelte';

  let { data } = $props();
  const supabase = createClient();

  let recentMatches = $state<Array<{id: string; started_at: string; completed: boolean; hobby_overlap: string[] | null}>>([]);
  let xp = $state(0);
  let level = $state(1);
  let streak = $state(0);

  const XP_PER_LEVEL = 100;
  let xpProgress = $derived(xp % XP_PER_LEVEL);
  let xpPercent = $derived(Math.round((xpProgress / XP_PER_LEVEL) * 100));

  onMount(async () => {
    if (!data.user) { goto('/auth'); return; }

    xp = data.profile?.xp ?? 0;
    level = data.profile?.level ?? 1;

    // Load recent matches
    const { data: matches } = await supabase
      .from('matches')
      .select('id, started_at, completed, hobby_overlap')
      .or(`user_a.eq.${data.user.id},user_b.eq.${data.user.id}`)
      .order('started_at', { ascending: false })
      .limit(5);

    if (matches) recentMatches = matches;

    // Load streak
    const { data: streakRow } = await supabase
      .from('streaks')
      .select('current_days')
      .eq('user_id', data.user.id)
      .single();
    if (streakRow) streak = streakRow.current_days;
  });

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
  }
</script>

<svelte:head>
  <title>גשר — בית</title>
</svelte:head>

<main class="min-h-screen bg-[#F8FAFF]">
  <!-- Header -->
  <header class="bg-white shadow-sm px-5 pt-12 pb-4 flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold">שלום, {data.profile?.display_name ?? 'משתמש'} 👋</h1>
      <p class="text-[#475569] text-sm mt-0.5">מוכן לשיחה חדשה?</p>
    </div>
    <button onclick={() => goto('/profile')} class="w-10 h-10 bg-[#E8F0FE] rounded-full flex items-center justify-center text-lg">
      👤
    </button>
  </header>

  <div class="px-5 py-6 space-y-5">
    <!-- XP Card -->
    <div class="card p-5">
      <div class="flex items-center justify-between mb-3">
        <div>
          <p class="text-xs text-[#94A3B8] uppercase tracking-wide">רמה</p>
          <p class="text-3xl font-bold text-[#1E6FEB]">{level}</p>
        </div>
        <div class="text-left">
          <p class="text-xs text-[#94A3B8] uppercase tracking-wide">נקודות XP</p>
          <p class="text-xl font-semibold">{xp}</p>
        </div>
        <div class="text-left">
          <p class="text-xs text-[#94A3B8] uppercase tracking-wide">רצף ימים</p>
          <div class="flex items-center gap-1">
            <span class="text-xl">🔥</span>
            <p class="text-xl font-semibold">{streak}</p>
          </div>
        </div>
      </div>
      <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div class="h-full bg-[#1E6FEB] rounded-full transition-all duration-500" style="width: {xpPercent}%"></div>
      </div>
      <p class="text-xs text-[#94A3B8] mt-1 text-left">{xpProgress}/{XP_PER_LEVEL} XP לרמה הבאה</p>
    </div>

    <!-- Find Match CTA -->
    <button onclick={() => goto('/match/waiting')} class="btn-primary w-full text-xl py-5 rounded-2xl shadow-lg">
      🌉 מצא שיחה חדשה
    </button>

    <!-- Quest placeholder -->
    <div class="card p-4">
      <div class="flex justify-between items-center mb-2">
        <p class="font-semibold text-sm">משימת השבוע</p>
        <span class="text-xs text-[#1E6FEB] font-semibold">0/3</span>
      </div>
      <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div class="h-full bg-[#1E6FEB] rounded-full" style="width: 0%"></div>
      </div>
      <p class="text-xs text-[#94A3B8] mt-1.5">השלם 3 שיחות השבוע לבונוס XP</p>
    </div>

    <!-- Recent matches -->
    {#if recentMatches.length > 0}
      <div>
        <h2 class="font-bold text-base mb-3">שיחות אחרונות</h2>
        <div class="space-y-3">
          {#each recentMatches as match}
            <div class="card p-4 flex items-center justify-between">
              <div>
                <p class="text-sm font-medium">{formatDate(match.started_at)}</p>
                {#if (match.hobby_overlap?.length ?? 0) > 0}
                  <p class="text-xs text-[#94A3B8] mt-0.5">{(match.hobby_overlap ?? []).slice(0,2).join(', ')}</p>
                {/if}
              </div>
              <span class="text-xs px-2 py-1 rounded-full {match.completed ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}">
                {match.completed ? '✓ הושלם' : 'לא הושלם'}
              </span>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="card p-6 text-center">
        <div class="text-4xl mb-3">💬</div>
        <p class="text-[#475569] text-sm">עדיין לא ניהלת שיחות.</p>
        <p class="text-xs text-[#94A3B8] mt-1">לחץ על "מצא שיחה חדשה" להתחיל!</p>
      </div>
    {/if}
  </div>
</main>
