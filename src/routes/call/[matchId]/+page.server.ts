import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.user) throw redirect(303, '/auth');
  // Verify user is part of this match
  const { data: match } = await locals.supabase
    .from('matches')
    .select('id, user_a, user_b, level')
    .eq('id', params.matchId)
    .single();
  if (!match || (match.user_a !== locals.user.id && match.user_b !== locals.user.id)) {
    throw redirect(303, '/home');
  }
  return { match };
};
