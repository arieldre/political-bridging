<script lang="ts">
  import { goto } from '$app/navigation';
  import { createClient } from '$lib/supabase/client';

  const supabase = createClient();
  let consent1 = $state(false);
  let consent2 = $state(false);
  let loading = $state(false);

  async function handleConsent() {
    loading = true;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').upsert({ id: user.id, consented_at: new Date().toISOString() });
    goto('/questionnaire');
  }
</script>

<main class="min-h-screen bg-[#F8FAFF] flex items-center justify-center px-4">
  <div class="card max-w-lg w-full p-8">
    <div class="text-center mb-6">
      <span class="text-5xl">🔒</span>
      <h1 class="text-2xl font-bold mt-3">פרטיות ונתונים</h1>
      <p class="text-[#475569] mt-2">לפני שנמשיך, כמה דברים חשובים</p>
    </div>

    <div class="bg-blue-50 rounded-xl p-4 mb-6 text-sm text-[#1E3A5F] space-y-2">
      <p>✅ <strong>מה נאסף:</strong> דעות פוליטיות, ערכים, ותחומי עניין — לצורך ההתאמה בלבד.</p>
      <p>🔒 <strong>מה לא קורה:</strong> הנתונים לעולם לא נמכרים, לא משותפים עם צד שלישי ולא משמשים לפרסום.</p>
      <p>👁️ <strong>מה הצד השני רואה:</strong> רק תחומי עניין משותפים — אף פעם לא את דעותיך הפוליטיות.</p>
      <p>🗑️ <strong>מחיקה:</strong> מחיקת חשבון = מחיקת כל הנתונים תוך 30 יום.</p>
    </div>

    <div class="space-y-4 mb-6">
      <label class="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" bind:checked={consent1} class="mt-1 accent-[#1E6FEB] w-5 h-5" />
        <span class="text-sm">אני מסכים/ה לאיסוף דעותיי הפוליטיות לצורך ההתאמה בלבד, ומבין/ה שהן לא יוצגו לאף משתמש/ת אחר/ת</span>
      </label>
      <label class="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" bind:checked={consent2} class="mt-1 accent-[#1E6FEB] w-5 h-5" />
        <span class="text-sm">קראתי את <a href="/privacy" class="text-[#1E6FEB] underline">מדיניות הפרטיות</a> ומסכים/ה לה</span>
      </label>
    </div>

    <button class="btn-primary w-full" disabled={!consent1 || !consent2 || loading} onclick={handleConsent}>
      {loading ? 'שומר...' : 'אני מסכים/ה — נמשיך'}
    </button>
  </div>
</main>
