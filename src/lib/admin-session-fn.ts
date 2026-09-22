import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { requireAdminUser } from "#/lib/auth";

/**
 * Server function backing the `/admin` route guard. Runs directly on the
 * server during SSR/`beforeLoad` and as an RPC on client-side navigation —
 * either way the session cookie is re-verified server-side, never trusted
 * from client state alone.
 */
export const checkAdminSession = createServerFn({ method: "GET" }).handler(
	async () => {
		const request = getRequest();
		try {
			const { user } = await requireAdminUser(request);
			return { authenticated: true as const, email: user.email ?? null };
		} catch {
			return { authenticated: false as const, email: null };
		}
	},
);
