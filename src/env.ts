import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		SERVER_URL: z.string().url().optional(),
		SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
		// Invitation emails (Resend). Optional so the app still runs without
		// them; the "send invite" action reports a clear error instead.
		RESEND_API_KEY: z.string().min(1).optional(),
		// e.g. `Dermatech Vietnam <invite@your-domain.com>` — a verified domain.
		INVITE_FROM_EMAIL: z.string().min(1).optional(),
		INVITE_REPLY_TO: z.email().optional(),
	},

	/**
	 * The prefix that client-side variables must have. This is enforced both at
	 * a type-level and at runtime.
	 */
	clientPrefix: "VITE_",

	client: {
		VITE_APP_TITLE: z.string().min(1).optional(),
		VITE_SUPABASE_URL: z.string().url(),
		VITE_SUPABASE_ANON_KEY: z.string().min(1),
	},

	/**
	 * This module is only ever imported from server-only code (API route
	 * handlers, server functions, the service-role client) — nothing in the
	 * client bundle references it. `import.meta.env` only reflects `VITE_`-
	 * prefixed vars in Vite's dev module runner even for server code, so the
	 * non-prefixed server secrets are read from the real Node `process.env`.
	 */
	runtimeEnv: {
		SERVER_URL: process.env.SERVER_URL,
		SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
		RESEND_API_KEY: process.env.RESEND_API_KEY,
		INVITE_FROM_EMAIL: process.env.INVITE_FROM_EMAIL,
		INVITE_REPLY_TO: process.env.INVITE_REPLY_TO,
		VITE_APP_TITLE: import.meta.env.VITE_APP_TITLE,
		VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
		VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
	},

	/**
	 * By default, this library will feed the environment variables directly to
	 * the Zod validator.
	 *
	 * This means that if you have an empty string for a value that is supposed
	 * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
	 * it as a type mismatch violation. Additionally, if you have an empty string
	 * for a value that is supposed to be a string with a default value (e.g.
	 * `DOMAIN=` in an ".env" file), the default value will never be applied.
	 *
	 * In order to solve these issues, we recommend that all new projects
	 * explicitly specify this option as true.
	 */
	emptyStringAsUndefined: true,
});
