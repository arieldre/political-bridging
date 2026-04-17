<script lang="ts">
  import { goto } from '$app/navigation';
  import { createClient } from '$lib/supabase/client';

  const supabase = createClient();

  let mode = $state<'login' | 'signup'>('signup');
  let email = $state('');
  let password = $state('');
  let displayName = $state('');
  let birthYear = $state('');
  let loading = $state(false);
  let error = $state('');
  let ageConsent = $state(false);

  async function handleSubmit() {
    error = '';
    if (!ageConsent && mode === 'signup') {
      error = 'יש לאשר שגילך 18+';
      return;
    }
    loading = true;
    try {
      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName, birth_year: parseInt(birthYear) }
          }
        });
        if (err) throw err;
        // Profile created by trigger; redirect to consent
        goto('/consent');
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        goto('/home');
      }
    } catch (e: any) {
      error = e.message === 'Invalid login credentials' ? 'אימייל או סיסמה שגויים' : e.message;
    } finally {
      loading = false;
    }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  }

  async function handleGuest() {
    loading = true;
    error = '';
    try {
      const { error: err } = await supabase.auth.signInAnonymously();
      if (err) throw err;
      goto('/questionnaire');
    } catch (e: any) {
      error = 'כניסה כאורח אינה זמינה כרגע. נסה להירשם.';
    } finally {
      loading = false;
    }
  }
</script>

<main class="min-h-screen flex items-center justify-center bg-[#F8FAFF] px-4">
  <div class="card w-full max-w-md p-8">
    <div class="text-center mb-8">
      <span class="text-4xl">🌉</span>
      <h1 class="text-3xl font-bold mt-2" style="font-family: Rubik">גשר</h1>
    </div>

    <div class="flex mb-6 bg-gray-100 rounded-full p-1">
      <button class="flex-1 py-2 rounded-full text-sm font-semibold transition-all {mode === 'signup' ? 'bg-white shadow text-[#1E6FEB]' : 'text-gray-500'}" onclick={() => mode = 'signup'}>הרשמה</button>
      <button class="flex-1 py-2 rounded-full text-sm font-semibold transition-all {mode === 'login' ? 'bg-white shadow text-[#1E6FEB]' : 'text-gray-500'}" onclick={() => mode = 'login'}>כניסה</button>
    </div>

    {#if error}
      <div class="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">{error}</div>
    {/if}

    <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
      {#if mode === 'signup'}
        <input type="text" bind:value={displayName} placeholder="שם תצוגה" required
          class="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-[#1E6FEB]" />
        <input type="number" bind:value={birthYear} placeholder="שנת לידה (לדוגמה: 1995)" required min="1940" max="2007"
          class="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-[#1E6FEB]" />
      {/if}
      <input type="email" bind:value={email} placeholder="אימייל" required
        class="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-[#1E6FEB]" />
      <input type="password" bind:value={password} placeholder="סיסמה" required minlength="6"
        class="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-[#1E6FEB]" />

      {#if mode === 'signup'}
        <label class="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" bind:checked={ageConsent} class="mt-1 accent-[#1E6FEB]" />
          <span class="text-sm text-[#475569]">אני מאשר/ת שגילי 18 ומעלה ומסכים/ה לתנאי השירות ולמדיניות הפרטיות</span>
        </label>
      {/if}

      <button type="submit" class="btn-primary w-full" disabled={loading}>
        {loading ? 'טוען...' : mode === 'signup' ? 'יצירת חשבון' : 'כניסה'}
      </button>
    </form>

    <div class="my-4 text-center text-gray-400 text-sm">או</div>

    <button class="w-full border border-gray-200 rounded-full py-3 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors" onclick={handleGoogle}>
      <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
      המשך עם Google
    </button>

    <div class="mt-3">
      <button
        class="w-full text-[#475569] text-sm py-2 hover:text-[#1E6FEB] transition-colors"
        onclick={handleGuest}
        disabled={loading}
      >
        כניסה כאורח (ללא הרשמה)
      </button>
    </div>
  </div>
</main>
