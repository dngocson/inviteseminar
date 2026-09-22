import { customAlphabet } from "nanoid";

// Base62: digits + upper + lower. No ambiguous-character filtering — codes
// aren't meant to be typed by hand, they travel inside a URL.
const BASE62_ALPHABET =
	"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export const INVITE_CODE_LENGTH = 8;

const generateBase62 = customAlphabet(BASE62_ALPHABET, INVITE_CODE_LENGTH);

/** 8-char Base62 code, ~47 bits of entropy. Never derived from the guest name. */
export function generateInviteCode(): string {
	return generateBase62();
}

export function isValidInviteCodeFormat(code: string): boolean {
	return new RegExp(`^[0-9A-Za-z]{${INVITE_CODE_LENGTH}}$`).test(code);
}

/**
 * Runs `attempt` and retries on a unique-constraint collision (Postgres code
 * 23505). Collisions are expected to be exceedingly rare at 8 chars, so a
 * small bounded retry is enough — anything past that indicates a real error.
 */
export async function withInviteCodeRetry<T>(
	attempt: (code: string) => Promise<T>,
	{ maxAttempts = 5 }: { maxAttempts?: number } = {},
): Promise<T> {
	let lastError: unknown;
	for (let i = 0; i < maxAttempts; i++) {
		try {
			return await attempt(generateInviteCode());
		} catch (error) {
			lastError = error;
			const code = (error as { code?: string } | null)?.code;
			if (code !== "23505") throw error;
		}
	}
	throw lastError;
}
