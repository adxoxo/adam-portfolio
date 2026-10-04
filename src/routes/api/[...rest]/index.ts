import type { RequestHandler } from '@qwik.dev/router';

// Unknown /api paths answer a JSON 404 instead of the HTML not-found page, so
// an API client can never mistake a page for a response.
export const onRequest: RequestHandler = ({ json, headers }) => {
	headers.set('Cache-Control', 'no-store');
	throw json(404, { ok: false, error: 'not_found' });
};
