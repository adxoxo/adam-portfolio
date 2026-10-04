/**
 * SSR renderer used by Qwik Router. This is the only place the Qwik renderer
 * runs; in the browser the container resumes instead of re-rendering.
 */
import { createRenderer } from '@qwik.dev/router';
import Root from './root';

export default createRenderer((opts) => {
	return {
		jsx: <Root />,
		options: {
			...opts,
			containerAttributes: {
				lang: 'en',
				...opts.containerAttributes
			}
		}
	};
});
