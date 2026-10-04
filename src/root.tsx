import { component$ } from '@qwik.dev/core';
import { DocumentHeadTags, RouterOutlet, useQwikRouter } from '@qwik.dev/router';

/**
 * Document shell for every route. Routes set their own title, description,
 * canonical, social meta and styles through `head` exports; public pages and
 * the admin each load their own scoped CSS, so nothing here styles content.
 */
export default component$(() => {
	useQwikRouter();

	return (
		<>
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="theme-color" content="#FAFBF7" />
				<link rel="icon" type="image/png" sizes="32x32" href="/brand/favicon-32.png" />
				<link rel="icon" type="image/png" sizes="192x192" href="/brand/icon-192.png" />
				<link rel="apple-touch-icon" sizes="180x180" href="/brand/apple-touch-icon.png" />
				<DocumentHeadTags />
				<style dangerouslySetInnerHTML="body{margin:0}" />
			</head>
			<body>
				<RouterOutlet />
			</body>
		</>
	);
});
