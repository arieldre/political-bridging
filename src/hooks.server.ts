import type { Handle } from '@sveltejs/kit';
import { createServerSupabase } from '$lib/supabase/server';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerSupabase(event.cookies);
  const { data: { session } } = await event.locals.supabase.auth.getSession();
  event.locals.session = session;
  event.locals.user = session?.user ?? null;
  return resolve(event, {
    filterSerializedResponseHeaders: (name) => name === 'content-range' || name === 'x-supabase-api-version'
  });
};
