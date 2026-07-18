// Maps a stack label to its brand logo file in /static/tech. Logos are first-party
// assets; the browser never calls an icon cdn. Labels with no real logo (fastmcp,
// recharts, phaser 3, sensors, serial, webhooks, email) return null and render as a
// text chip in <StackLogos>. Some labels reuse a parent logo where that is honest:
// sqlite-vec -> sqlite, drf/django rest -> django, esp32 -> espressif.

const FILES: Record<string, string> = {
	react: 'react',
	fastapi: 'fastapi',
	supabase: 'supabase',
	groq: 'groq',
	n8n: 'n8n',
	cloudflare: 'cloudflare',
	python: 'python',
	sqlite: 'sqlite',
	'sqlite-vec': 'sqlite',
	opentelemetry: 'opentelemetry',
	ollama: 'ollama',
	sveltekit: 'svelte',
	svelte: 'svelte',
	typescript: 'typescript',
	javascript: 'javascript',
	django: 'django',
	drf: 'django',
	'django rest': 'django',
	'django rest framework': 'django',
	postgres: 'postgresql',
	postgresql: 'postgresql',
	docker: 'docker',
	'raspberry pi': 'raspberrypi',
	raspberrypi: 'raspberrypi',
	arduino: 'arduino',
	'c++': 'cplusplus',
	cplusplus: 'cplusplus',
	gsap: 'gsap',
	esp32: 'espressif'
};

// Returns the logo src for a stack label, or null when there is no logo for it.
export function techIcon(label: string): string | null {
	const file = FILES[label.trim().toLowerCase()];
	return file ? `/tech/${file}.svg` : null;
}
