<script lang="ts">
  import { goto } from '$app/navigation';
  let { data } = $props();
  $effect(() => { if (data.user) goto('/home'); });
</script>

<main class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 text-center">
  <div class="mb-8">
    <span class="text-7xl">🌉</span>
  </div>
  <h1 class="text-5xl font-bold text-[#0F172A] mb-4" style="font-family: Rubik, sans-serif;">גֶּשֶׁר</h1>
  <p class="text-xl text-[#475569] mb-2 max-w-md">מדברים עם מי שחושבים אחרת.</p>
  <p class="text-base text-[#475569] mb-10 max-w-sm">אפליקציה ישראלית לשיחות וידאו עם אנשים שמנוגדים לך פוליטית — ומפתיעים אותך.</p>
  <button class="btn-primary text-xl px-10 py-4" onclick={() => goto('/auth')}>
    בואו נתחיל
  </button>
  <button class="mt-3 text-[#475569] text-base underline underline-offset-2" onclick={() => goto('/auth?guest=1')}>
    כניסה כאורח
  </button>
  <p class="mt-6 text-sm text-[#94A3B8]">לגילאי 18+ בלבד · שמירה על פרטיות מלאה</p>
</main>
