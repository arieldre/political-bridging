<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { createClient } from '$lib/supabase/client';

  let { data, children } = $props();

  const supabase = createClient();
  const PUBLIC_ROUTES = ['/', '/auth', '/auth/callback', '/privacy'];

  onMount(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') goto('/auth');
    });
    return () => subscription.unsubscribe();
  });

  $effect(() => {
    const path = $page.url.pathname;
    const isPublic = PUBLIC_ROUTES.some(r => path.startsWith(r));
    if (!isPublic && !data.user) goto('/auth');
    if (data.user && data.profile && !data.profile.questionnaire_completed) {
      if (!path.startsWith('/consent') && !path.startsWith('/questionnaire')) goto('/consent');
    }
  });
</script>

{@render children()}
