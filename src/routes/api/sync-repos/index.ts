import type { RequestHandler } from '@qwik.dev/router';
import { isSameOrigin } from '~/lib/server/security';
import { runRepoSync } from '~/lib/server/sync';

// POST. Only the signed-in explicit owner may sync or request a dry run.
// New public repos become hidden drafts; existing ids stay unchanged.
export const onPost: RequestHandler = async (event) => {
	if (!isSameOrigin(event.request, event.url)) {
		throw event.json(403, { ok: false, error: 'cross_origin_request' });
	}
	const result = await runRepoSync(event);
	if (!result.ok) throw event.json(result.status, { ok: false, error: result.error });
	throw event.json(200, result);
};
