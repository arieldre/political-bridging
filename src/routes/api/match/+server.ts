import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { meetsOppositionFilterRelaxed, scoreCandidate } from '$lib/matching/algorithm';

export const POST: RequestHandler = async ({ locals }) => {
  // Require the caller to be authenticated — protects queue data
  if (!locals.user) return json({ error: 'unauthorized' }, { status: 401 });

  const supabase = locals.supabase;

  // Get all queued users with their questionnaire data
  const { data: queue } = await supabase
    .from('match_queue')
    .select('user_id, level, queued_at')
    .order('queued_at', { ascending: true });

  if (!queue || queue.length < 2) return json({ matched: 0 });

  const userIds = queue.map(q => q.user_id);
  const { data: questionnaires } = await supabase
    .from('questionnaires')
    .select('user_id, hobbies, political_vector')
    .in('user_id', userIds);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, level, avg_rating')
    .in('id', userIds);

  if (!questionnaires || !profiles) return json({ matched: 0 });

  const qMap = new Map(questionnaires.map(q => [q.user_id, q]));
  const pMap = new Map(profiles.map(p => [p.id, p]));

  const matched = new Set<string>();
  let matchCount = 0;

  for (let i = 0; i < queue.length; i++) {
    if (matched.has(queue[i].user_id)) continue;
    const a = queue[i];
    const aQ = qMap.get(a.user_id);
    const aP = pMap.get(a.user_id);
    if (!aQ || !aP) continue;

    const aPV = aQ.political_vector as { security: number; religion: number; economics: number } | null;
    const aVec = {
      security: aPV?.security ?? 0,
      religion: aPV?.religion ?? 0,
      economics: aPV?.economics ?? 0
    };

    const aWaitSeconds = (Date.now() - new Date(a.queued_at).getTime()) / 1000;

    let bestScore = -1;
    let bestCandidate: string | null = null;
    let bestOverlap: string[] = [];

    for (let j = i + 1; j < queue.length; j++) {
      if (matched.has(queue[j].user_id)) continue;
      const b = queue[j];
      if (b.user_id === a.user_id) continue;

      const bQ = qMap.get(b.user_id);
      const bP = pMap.get(b.user_id);
      if (!bQ || !bP) continue;

      const bPV = bQ.political_vector as { security: number; religion: number; economics: number } | null;
      const bVec = {
        security: bPV?.security ?? 0,
        religion: bPV?.religion ?? 0,
        economics: bPV?.economics ?? 0
      };

      const bWaitSeconds = (Date.now() - new Date(b.queued_at).getTime()) / 1000;
      const avgWaitSeconds = (aWaitSeconds + bWaitSeconds) / 2;

      if (!meetsOppositionFilterRelaxed(aVec, bVec, avgWaitSeconds)) continue;

      const aCandidate = {
        userId: a.user_id,
        vector: aVec,
        hobbies: aQ.hobbies ?? [],
        level: aP.level,
        avgRating: aP.avg_rating
      };
      const bCandidate = {
        userId: b.user_id,
        vector: bVec,
        hobbies: bQ.hobbies ?? [],
        level: bP.level,
        avgRating: bP.avg_rating
      };

      const score = scoreCandidate(aCandidate, bCandidate);
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = b.user_id;
        const aHobbies = new Set(aQ.hobbies ?? []);
        bestOverlap = (bQ.hobbies ?? []).filter(h => aHobbies.has(h));
      }
    }

    if (bestCandidate && bestScore >= 0) {
      // Guard against concurrent double-match: check if either user already has an open match
      const { data: existing } = await supabase
        .from('matches')
        .select('id')
        .or(`user_a.eq.${a.user_id},user_b.eq.${a.user_id},user_a.eq.${bestCandidate},user_b.eq.${bestCandidate}`)
        .is('ended_at', null)
        .limit(1)
        .single();
      if (existing) {
        // One of the users was already matched by a concurrent call — skip
        continue;
      }

      // Create match
      await supabase.from('matches').insert({
        user_a: a.user_id,
        user_b: bestCandidate,
        level: Math.min(aP.level, pMap.get(bestCandidate)?.level ?? 1),
        hobby_overlap: bestOverlap
      });
      // Remove from queue
      await supabase.from('match_queue').delete().in('user_id', [a.user_id, bestCandidate]);
      matched.add(a.user_id);
      matched.add(bestCandidate);
      matchCount++;
    }
  }

  return json({ matched: matchCount });
};
