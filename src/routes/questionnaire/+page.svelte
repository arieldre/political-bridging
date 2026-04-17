<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { createClient } from '$lib/supabase/client';
  import { QUESTIONS, HOBBY_OPTIONS } from '$lib/questionnaire/data';
  import { calcAxisScore } from '$lib/matching/algorithm';

  const supabase = createClient();

  // ── State ────────────────────────────────────────────────────────────────────

  // Step 1 = hobbies, 2 = values, 3 = politics, 4 = summary
  let step = $state(1);
  let submitting = $state(false);
  let error = $state('');

  // Hobby selections
  let selectedHobbies = $state<Set<string>>(new Set());

  // Values answers: questionId -> 0-4
  let valuesAnswers = $state<Record<string, number>>({});

  // Politics answers: questionId -> 0-4
  let politicsAnswers = $state<Record<string, number>>({});

  // Current question index within the current step's list
  let qIndex = $state(0);

  // Animation direction
  let slideDir = $state(1); // 1 = forward, -1 = back

  // Derived question lists
  const valueQuestions = QUESTIONS.filter(q => q.section === 'values');
  const politicsQuestions = QUESTIONS.filter(q => q.section === 'politics');

  let currentValueQ = $derived(valueQuestions[qIndex] ?? null);
  let currentPoliticsQ = $derived(politicsQuestions[qIndex] ?? null);

  // ── Progress ─────────────────────────────────────────────────────────────────

  // Total "screens": 1 hobbies + 10 values + 12 politics + 1 summary = 24
  let progressTotal = $derived(1 + valueQuestions.length + politicsQuestions.length + 1);
  let progressCurrent = $derived((() => {
    if (step === 1) return 1;
    if (step === 2) return 1 + qIndex + 1;
    if (step === 3) return 1 + valueQuestions.length + qIndex + 1;
    return progressTotal;
  })());
  let progressPct = $derived((progressCurrent / progressTotal) * 100);

  // ── Validation ───────────────────────────────────────────────────────────────

  let canContinueHobbies = $derived(selectedHobbies.size >= 3);
  let canContinueValues = $derived(currentValueQ ? valuesAnswers[currentValueQ.id] !== undefined : false);
  let canContinuePolitics = $derived(currentPoliticsQ ? politicsAnswers[currentPoliticsQ.id] !== undefined : false);

  // ── Navigation helpers ───────────────────────────────────────────────────────

  function toggleHobby(id: string) {
    const next = new Set(selectedHobbies);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selectedHobbies = next;
  }

  function setValueAnswer(id: string, val: number) {
    valuesAnswers = { ...valuesAnswers, [id]: val };
  }

  function setPoliticsAnswer(id: string, val: number) {
    politicsAnswers = { ...politicsAnswers, [id]: val };
  }

  function advance() {
    slideDir = 1;
    if (step === 1) {
      step = 2;
      qIndex = 0;
    } else if (step === 2) {
      if (qIndex < valueQuestions.length - 1) {
        qIndex = qIndex + 1;
      } else {
        step = 3;
        qIndex = 0;
      }
    } else if (step === 3) {
      if (qIndex < politicsQuestions.length - 1) {
        qIndex = qIndex + 1;
      } else {
        step = 4;
      }
    }
  }

  function goBack() {
    slideDir = -1;
    if (step === 2 && qIndex === 0) {
      step = 1;
    } else if (step === 2) {
      qIndex = qIndex - 1;
    } else if (step === 3 && qIndex === 0) {
      step = 2;
      qIndex = valueQuestions.length - 1;
    } else if (step === 3) {
      qIndex = qIndex - 1;
    } else if (step === 4) {
      step = 3;
      qIndex = politicsQuestions.length - 1;
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    submitting = true;
    error = '';

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('לא מחובר');

      // Build axis score inputs
      const secAnswers = politicsQuestions
        .filter(q => q.axis === 'security')
        .map(q => ({ value: politicsAnswers[q.id] ?? 2, weight: q.weight ?? 1 }));

      const relAnswers = politicsQuestions
        .filter(q => q.axis === 'religion')
        .map(q => ({ value: politicsAnswers[q.id] ?? 2, weight: q.weight ?? 1 }));

      const ecoAnswers = politicsQuestions
        .filter(q => q.axis === 'economics')
        .map(q => ({ value: politicsAnswers[q.id] ?? 2, weight: q.weight ?? 1 }));

      const vector = {
        security: calcAxisScore(secAnswers),
        religion: calcAxisScore(relAnswers),
        economics: calcAxisScore(ecoAnswers),
      };

      // Save questionnaire row
      const { error: qErr } = await supabase.from('questionnaires').upsert({
        user_id: user.id,
        hobbies: Array.from(selectedHobbies),
        values_answers: valuesAnswers,
        politics_answers: politicsAnswers,
        political_vector: vector,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (qErr) throw qErr;

      // Mark profile as completed
      const { error: pErr } = await supabase.from('profiles').update({
        questionnaire_completed: true,
        hobbies: Array.from(selectedHobbies),
        political_vector: vector,
      }).eq('id', user.id);

      if (pErr) throw pErr;

      goto('/home');
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'שגיאה בשמירה, נסה/י שוב';
    } finally {
      submitting = false;
    }
  }

  // ── Axis label for politics section header ───────────────────────────────────
  const axisLabels: Record<string, string> = {
    security: 'ביטחון ומדיניות',
    religion: 'דת ומדינה',
    economics: 'כלכלה וחברה',
  };

  let prevKey = $state('');
  let key = $derived(`${step}-${qIndex}`);
</script>

<div class="min-h-screen flex flex-col bg-[--color-bg]" dir="rtl">

  <!-- Progress bar -->
  <div class="w-full h-1.5 bg-gray-100 fixed top-0 right-0 z-50">
    <div
      class="h-full bg-[--color-primary] transition-all duration-500 ease-out"
      style="width: {progressPct}%"
    ></div>
  </div>

  <!-- Header -->
  <header class="pt-6 pb-2 px-5 flex items-center gap-3 mt-1.5">
    {#if step > 1 || (step === 1)}
      <button
        onclick={goBack}
        class="p-2 rounded-full hover:bg-gray-100 transition-colors text-[--color-muted]"
        aria-label="חזור"
        disabled={step === 1}
        style={step === 1 ? 'visibility:hidden' : ''}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
    {/if}
    <span class="text-sm text-[--color-muted] mr-auto">
      {progressCurrent} / {progressTotal}
    </span>
  </header>

  <!-- Content area -->
  <main class="flex-1 flex flex-col px-5 pb-8 max-w-lg mx-auto w-full">

    {#key key}
      <div
        in:fly={{ x: slideDir * 40, duration: 260, easing: cubicOut }}
        out:fly={{ x: -slideDir * 40, duration: 200, easing: cubicOut }}
        class="flex-1 flex flex-col"
      >

        <!-- ── STEP 1: HOBBIES ──────────────────────────────────────────────── -->
        {#if step === 1}
          <div class="mt-6 mb-8">
            <h1 class="text-2xl font-bold text-[--color-text] leading-snug mb-2">
              מה הדברים שאתה/את הכי אוהב/ת לעשות?
            </h1>
            <p class="text-sm text-[--color-muted]">בחר/י לפחות 3 תחומי עניין (אפשר יותר)</p>
          </div>

          <div class="grid grid-cols-4 gap-2.5 mb-8">
            {#each HOBBY_OPTIONS as hobby}
              <button
                onclick={() => toggleHobby(hobby.id)}
                class="
                  flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-xl
                  border-2 transition-all duration-150 cursor-pointer select-none
                  {selectedHobbies.has(hobby.id)
                    ? 'border-[--color-primary] bg-[--color-primary-soft] shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'}
                "
              >
                <span class="text-2xl leading-none">{hobby.emoji}</span>
                <span class="text-[11px] font-medium text-center leading-tight text-[--color-text]">
                  {hobby.label}
                </span>
              </button>
            {/each}
          </div>

          <div class="mt-auto pt-4">
            <button
              class="btn-primary w-full"
              disabled={!canContinueHobbies}
              onclick={advance}
            >
              הבא
            </button>
            {#if selectedHobbies.size < 3}
              <p class="text-center text-xs text-[--color-muted] mt-2">
                בחר/י עוד {3 - selectedHobbies.size} לפחות
              </p>
            {/if}
          </div>

        <!-- ── STEP 2: VALUES ───────────────────────────────────────────────── -->
        {:else if step === 2 && currentValueQ}
          <div class="mt-6 mb-10">
            <div class="text-xs font-semibold text-[--color-primary] uppercase tracking-wide mb-3">
              ערכים ואמונות
            </div>
            <h2 class="text-xl font-bold text-[--color-text] leading-snug">
              {currentValueQ.text}
            </h2>
          </div>

          <!-- Likert 5-point circles -->
          <div class="flex flex-col gap-3 mb-10">
            <div class="flex justify-between gap-2">
              {#each [0, 1, 2, 3, 4] as val}
                <button
                  onclick={() => setValueAnswer(currentValueQ.id, val)}
                  class="
                    flex-1 aspect-square rounded-full border-2 font-semibold text-sm
                    transition-all duration-150 flex items-center justify-center
                    {valuesAnswers[currentValueQ.id] === val
                      ? 'border-[--color-primary] bg-[--color-primary] text-white shadow-md scale-110'
                      : 'border-gray-300 bg-white text-[--color-muted] hover:border-[--color-primary]'}
                  "
                  aria-label="ערך {val + 1}"
                >
                  {val + 1}
                </button>
              {/each}
            </div>
            <div class="flex justify-between text-xs text-[--color-muted] px-0.5">
              <span>{currentValueQ.rightLabel}</span>
              <span>{currentValueQ.leftLabel}</span>
            </div>
          </div>

          <div class="mt-auto flex gap-3 pt-4">
            <button class="btn-secondary flex-1" onclick={goBack}>חזור</button>
            <button
              class="btn-primary flex-1"
              disabled={!canContinueValues}
              onclick={advance}
            >
              {qIndex === valueQuestions.length - 1 ? 'לשאלות פוליטיקה' : 'הבא'}
            </button>
          </div>

        <!-- ── STEP 3: POLITICS ─────────────────────────────────────────────── -->
        {:else if step === 3 && currentPoliticsQ}
          <div class="mt-6 mb-10">
            {#if currentPoliticsQ.axis}
              <div class="text-xs font-semibold text-[--color-primary] uppercase tracking-wide mb-3">
                {axisLabels[currentPoliticsQ.axis] ?? currentPoliticsQ.axis}
              </div>
            {/if}
            <h2 class="text-xl font-bold text-[--color-text] leading-snug">
              {currentPoliticsQ.text}
            </h2>
          </div>

          <!-- Scale slider 0-4 -->
          <div class="mb-3">
            <input
              type="range"
              min="0"
              max="4"
              step="1"
              value={politicsAnswers[currentPoliticsQ.id] ?? 2}
              oninput={(e) => setPoliticsAnswer(currentPoliticsQ.id, parseInt(e.currentTarget.value))}
              class="w-full accent-[--color-primary] h-2 cursor-pointer"
              style="direction: ltr;"
            />
          </div>

          <div class="flex justify-between text-xs text-[--color-muted] mb-8 px-0.5">
            <span>{currentPoliticsQ.leftLabel}</span>
            <span>{currentPoliticsQ.rightLabel}</span>
          </div>

          <!-- Visual tick dots below slider -->
          <div class="flex justify-between px-1 -mt-6 mb-10 pointer-events-none">
            {#each [0, 1, 2, 3, 4] as val}
              <div class="
                w-2 h-2 rounded-full transition-all duration-150
                {(politicsAnswers[currentPoliticsQ.id] ?? 2) === val
                  ? 'bg-[--color-primary] scale-125'
                  : 'bg-gray-300'}
              "></div>
            {/each}
          </div>

          <!-- Privacy note -->
          <p class="text-xs text-[--color-muted] text-center bg-gray-50 rounded-lg px-3 py-2 mb-6">
            🔒 דעות פוליטיות ישמשו להתאמה בלבד ולא יוצגו לאף אחד
          </p>

          <div class="mt-auto flex gap-3 pt-2">
            <button class="btn-secondary flex-1" onclick={goBack}>חזור</button>
            <button
              class="btn-primary flex-1"
              onclick={advance}
            >
              {qIndex === politicsQuestions.length - 1 ? 'לסיכום' : 'הבא'}
            </button>
          </div>

        <!-- ── STEP 4: SUMMARY ──────────────────────────────────────────────── -->
        {:else if step === 4}
          <div class="mt-8 mb-8 text-center">
            <div class="text-5xl mb-4">🎉</div>
            <h1 class="text-2xl font-bold text-[--color-text] mb-2">סיימת!</h1>
            <p class="text-[--color-muted]">
              מוכן/ה למצוא מישהו שחושב אחרת — ולדבר איתו.
            </p>
          </div>

          <!-- Summary cards -->
          <div class="flex flex-col gap-3 mb-8">
            <div class="card p-4 flex items-center gap-3">
              <span class="text-2xl">🎯</span>
              <div>
                <div class="text-sm font-semibold text-[--color-text]">תחומי עניין</div>
                <div class="text-xs text-[--color-muted]">
                  {selectedHobbies.size} תחומים נבחרו
                </div>
              </div>
            </div>
            <div class="card p-4 flex items-center gap-3">
              <span class="text-2xl">💡</span>
              <div>
                <div class="text-sm font-semibold text-[--color-text]">ערכים ואמונות</div>
                <div class="text-xs text-[--color-muted]">
                  {valueQuestions.length} שאלות הושלמו
                </div>
              </div>
            </div>
            <div class="card p-4 flex items-center gap-3">
              <span class="text-2xl">🗳️</span>
              <div>
                <div class="text-sm font-semibold text-[--color-text]">עמדות פוליטיות</div>
                <div class="text-xs text-[--color-muted]">
                  {politicsQuestions.length} שאלות הושלמו — פרטיות מוגנת
                </div>
              </div>
            </div>
          </div>

          {#if error}
            <p class="text-red-500 text-sm text-center mb-4">{error}</p>
          {/if}

          <div class="mt-auto flex gap-3 pt-2">
            <button class="btn-secondary" onclick={goBack} disabled={submitting}>חזור</button>
            <button
              class="btn-primary flex-1"
              disabled={submitting}
              onclick={handleSubmit}
            >
              {#if submitting}
                שומר...
              {:else}
                בוא/י נתחיל!
              {/if}
            </button>
          </div>
        {/if}

      </div>
    {/key}
  </main>
</div>

<style>
  input[type='range'] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: linear-gradient(
      to right,
      var(--color-primary) 0%,
      var(--color-primary) calc(var(--val, 50%) * 1%),
      #e2e8f0 calc(var(--val, 50%) * 1%),
      #e2e8f0 100%
    );
    outline: none;
  }

  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--color-primary);
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(30, 111, 235, 0.35);
    border: 3px solid white;
    transition: transform 0.15s;
  }

  input[type='range']::-webkit-slider-thumb:hover {
    transform: scale(1.15);
  }

  input[type='range']::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--color-primary);
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(30, 111, 235, 0.35);
    border: 3px solid white;
  }
</style>
