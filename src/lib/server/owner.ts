import type { RequestEventBase } from '@qwik.dev/router';
import type { User } from '@supabase/supabase-js';
import { getVerifiedUser } from './supabase';

const OWNER_EMAIL_KEY = 'OWNER_EMAIL';

function normalizedEmail(value: string | null | undefined): string {
	return (value ?? '').trim().toLowerCase();
}

/** The server-only owner identity. The Worker receives this as a secret. */
export function getOwnerEmail(event: Pick<RequestEventBase, 'env'>): string {
	return normalizedEmail(event.env.get(OWNER_EMAIL_KEY));
}

export function isOwnerEmail(event: Pick<RequestEventBase, 'env'>, email: string | null | undefined): boolean {
	const ownerEmail = getOwnerEmail(event);
	return ownerEmail.length > 0 && normalizedEmail(email) === ownerEmail;
}

/** Supabase validates the JWT first. The explicit owner check then rejects
 * every other valid Supabase account. */
export async function getVerifiedOwner(
	event: Parameters<typeof getVerifiedUser>[0]
): Promise<User | null> {
	const user = await getVerifiedUser(event);
	return user && isOwnerEmail(event, user.email) ? user : null;
}
