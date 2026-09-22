import type { Locale } from "#/lib/schemas";

/**
 * Builds the canonical invitation link `<origin>/?k=<code>&l=<locale>` from
 * whatever origin is current — localhost, a Vercel preview, or production.
 * Never hardcode a base URL; always pass the live request/window origin.
 */
export function buildInviteUrl(
	origin: string,
	inviteCode: string,
	locale: Locale = "vi",
): string {
	const url = new URL("/", origin);
	url.searchParams.set("k", inviteCode);
	url.searchParams.set("l", locale);
	return url.toString();
}
