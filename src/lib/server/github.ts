// Fetch + normalize public repos for the archive sync. Mirrors GitDashboard:
// the browser never calls GitHub; this runs server-side and the result is
// cached in Supabase, so visitors read the cache and trigger zero GitHub calls.
import type { Cluster } from '$lib/data/projects';

export interface GhRepo {
	name: string;
	html_url: string;
	description: string | null;
	language: string | null;
	pushed_at: string;
	fork: boolean;
	archived: boolean;
}

export interface RepoDraft {
	id: string;
	title: string;
	summary: string;
	cluster: Cluster;
	status: 'hidden';
	year: string;
	stack: string[];
	github_url: string;
	source: 'github';
	synced_at: string;
}

export async function fetchRepos(user: string, token?: string): Promise<GhRepo[]> {
	const headers: Record<string, string> = {
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28',
		'User-Agent': 'adyu-portfolio'
	};
	if (token) headers.Authorization = `Bearer ${token}`;
	const res = await fetch(
		`https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed`,
		{ headers }
	);
	if (!res.ok) throw new Error(`github responded ${res.status}`);
	return (await res.json()) as GhRepo[];
}

const CLUSTER_HINTS: [Cluster, RegExp][] = [
	['embedded', /esp32|esp8266|arduino|firmware|sensor|iot|raspberry|hydroponic|moisture|embedded/i],
	['ai', /chatbot|closer|llm|rag|agent|\bml\b|\bai\b|mcp|grimoire|neural/i],
	['automation', /n8n|automation|zapier|webhook|invoice|scraper|bot/i]
];

export function guessCluster(r: GhRepo): Cluster {
	const hay = `${r.name} ${r.description ?? ''} ${r.language ?? ''}`;
	for (const [cluster, re] of CLUSTER_HINTS) if (re.test(hay)) return cluster;
	return 'fullstack';
}

export function normalizeRepo(r: GhRepo, now: string): RepoDraft {
	return {
		id: r.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
		title: r.name.toLowerCase().replace(/[-_]+/g, ' '),
		summary: r.description ?? '',
		cluster: guessCluster(r),
		status: 'hidden',
		year: r.pushed_at.slice(0, 4),
		stack: r.language ? [r.language.toLowerCase()] : [],
		github_url: r.html_url,
		source: 'github',
		synced_at: now
	};
}
