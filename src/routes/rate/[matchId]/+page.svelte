<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { createClient } from '$lib/supabase/client';

  let { data } = $props();
  const supabase = createClient();
  const matchId = $page.params.matchId as string;

  let stars = $state(0);
  let hoveredStar = $state(0);
  let reportCategory = $state<string | null>(null);
  let reportText = $state('');
  let submitting = $state(false);
  let talkAgain = $state<boolean | null>(null);

  const REPORT_CATEGORIES = [
    { key: 'hate_speech', label: 'שפת שנאה' },
    { key: 'harassment', label: 'הטרדה' },
    { key: 'sexual_content', label: 'תוכן לא הולם' },
    { key: 'off_platform', label: 'הסחה לפלטפורמה אחרת' },
    { key: 'other', label: 'אחר' },
  ];

  // XP awarded based on rating quality (shown after submit)
  function calcXP(starsGiven: number) {
    const base = 10; // L1 base XP
    return starsGiven >= 4 ? base : Math.floor(base * 0.3);
  }

  async function submit() {
    if (stars === 0) return;
    submitting = true;

    // Fetch match to get the other user
    const { data: match } = await supabase
      .from('matches')
      .select('user_a, user_b')
      .eq('id', matchId)
      .single();

    if (!match || !data.user) { goto('/home'); return; }
    const rateeId = match.user_a === data.user.id ? match.user_b : match.user_a;

    // Insert rating
    await supabase.from('ratings').insert({
      match_id: matchId,
      rater_id: data.user.id,
      ratee_id: rateeId,
      stars,
      talk_again: talkAgain,
      report_category: reportCategory as any ?? null,
      report_text: reportText || null,
    });

    // Award XP (simple client-side for MVP — TODO: move to server action)
    const xpGain = calcXP(stars);
    await supabase.from('xp_events').insert({
      user_id: data.user.id,
      match_id: matchId,
      amount: xpGain,
      reason: 'completed_call',
    });
    // Update profile XP
    const { data: prof } = await supabase.from('profiles').select('xp, level').eq('id', data.user.id).single();
    if (prof) {
      const newXp = prof.xp + xpGain;
      await supabase.from('profiles').update({ xp: newXp }).eq('id', data.user.id);
    }

    goto('/home?rated=true');
  }
</script>

<!-- Blocks back navigation until rated -->
<svelte:window onbeforeunload={(e) => { if (stars === 0) { e.preventDefault(); e.returnValue = ''; } }} />

<main class="min-h-screen bg-[#F8FAFF] flex flex-col items-center justify-center px-5">
  <div class="card w-full max-w-md p-8">
    <!-- Header -->
    <div class="text-center mb-8">
      <span class="text-6xl block mb-3">🌉</span>
      <h1 class="text-2xl font-bold">השיחה הסתיימה</h1>
      <p class="text-[#475569] mt-1 text-sm">אנא דרג/י את השיחה לפני שנמשיך</p>
    </div>

    <!-- Star rating -->
    <div class="mb-6">
      <p class="text-sm font-semibold text-center mb-3">איך הייתה השיחה?</p>
      <div class="flex justify-center gap-3">
        {#each [1,2,3,4,5] as s}
          <button
            onclick={() => stars = s}
            onmouseenter={() => hoveredStar = s}
            onmouseleave={() => hoveredStar = 0}
            class="text-4xl transition-transform hover:scale-110"
          >
            {(hoveredStar || stars) >= s ? '⭐' : '☆'}
          </button>
        {/each}
      </div>
      {#if stars > 0}
        <p class="text-center text-sm text-[#475569] mt-2">
          {stars === 1 ? 'גרועה' : stars === 2 ? 'סבירה' : stars === 3 ? 'טובה' : stars === 4 ? 'מצוינת' : 'נפלאה! 🎉'}
        </p>
      {/if}
    </div>

    <!-- Talk again? -->
    {#if stars >= 4}
      <div class="mb-6">
        <p class="text-sm font-semibold text-center mb-3">האם תרצה/י לדבר שוב עם אותו אדם?</p>
        <div class="flex gap-3">
          <button
            onclick={() => talkAgain = true}
            class="flex-1 py-2 rounded-full text-sm font-semibold border-2 transition-colors {talkAgain === true ? 'border-[#1E6FEB] bg-[#E8F0FE] text-[#1E6FEB]' : 'border-gray-200'}"
          >
            כן, בשמחה
          </button>
          <button
            onclick={() => talkAgain = false}
            class="flex-1 py-2 rounded-full text-sm font-semibold border-2 transition-colors {talkAgain === false ? 'border-gray-400 bg-gray-100' : 'border-gray-200'}"
          >
            לא בהכרח
          </button>
        </div>
      </div>
    {/if}

    <!-- Report (optional, shown for low ratings) -->
    {#if stars > 0 && stars <= 2}
      <div class="mb-6">
        <p class="text-sm font-semibold mb-2">רצית לדווח על משהו? (אופציונלי)</p>
        <div class="grid grid-cols-2 gap-2 mb-3">
          {#each REPORT_CATEGORIES as cat}
            <button
              onclick={() => reportCategory = reportCategory === cat.key ? null : cat.key}
              class="text-xs py-2 px-3 rounded-xl border transition-colors {reportCategory === cat.key ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200'}"
            >
              {cat.label}
            </button>
          {/each}
        </div>
        {#if reportCategory}
          <textarea
            bind:value={reportText}
            placeholder="פרטים נוספים (אופציונלי)"
            rows="2"
            class="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-[#1E6FEB]"
          ></textarea>
        {/if}
      </div>
    {/if}

    <!-- XP preview -->
    {#if stars > 0}
      <div class="bg-[#E8F0FE] rounded-xl p-3 mb-6 text-center">
        <span class="text-[#1E6FEB] font-bold">+{calcXP(stars)} XP</span>
        <span class="text-[#475569] text-sm"> יתווספו לחשבונך</span>
      </div>
    {/if}

    <button
      onclick={submit}
      disabled={stars === 0 || submitting}
      class="btn-primary w-full"
    >
      {submitting ? 'שומר...' : 'שלח דירוג'}
    </button>
  </div>
</main>
