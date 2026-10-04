import type { RequestHandler } from '@qwik.dev/router';
import { runRepoSync } from '~/lib/server/sync';

// POST. With the service key configured, only the signed-in owner (validated
// with getUser) may sync: 401 otherwise. New public repos are inserted as
// hidden drafts; existing ids are never overwritten. Without a store it
// returns a dry run of what a sync would insert.
export const onPost: RequestHandler = async (event) => {
	const result = await runRepoSync(event);
	if (!result.ok) throw event.json(result.status, { ok: false, error: result.error });
	throw event.json(200, result);
};
