import { createServerClient } from "@supabase/ssr";
import { parse, serialize } from "cookie";

import { env } from "#/env";

/**
 * Creates a Supabase client bound to one request's cookies. Must be created
 * fresh per request — never shared or cached across requests.
 *
 * Call `applyCookies(response)` on whatever `Response` the route returns so
 * that any session refresh performed during the request (login, token
 * refresh) is written back to the client.
 */
export function createSupabaseServerClient(request: Request) {
	const cookieHeader = request.headers.get("cookie") ?? "";
	const requestCookies = parse(cookieHeader);
	const pendingCookies: Array<{
		name: string;
		value: string;
		options: Record<string, unknown>;
	}> = [];
	const pendingHeaders: Record<string, string> = {};

	const isHttps = new URL(request.url).protocol === "https:";

	const supabase = createServerClient(
		env.VITE_SUPABASE_URL,
		env.VITE_SUPABASE_ANON_KEY,
		{
			cookieOptions: {
				httpOnly: true,
				secure: isHttps,
				sameSite: "lax",
				path: "/",
			},
			cookies: {
				getAll() {
					return Object.entries(requestCookies).map(([name, value]) => ({
						name,
						value: value ?? "",
					}));
				},
				setAll(cookiesToSet, headers) {
					pendingCookies.push(...cookiesToSet);
					Object.assign(pendingHeaders, headers);
				},
			},
		},
	);

	function applyCookies(response: Response): Response {
		for (const { name, value, options } of pendingCookies) {
			response.headers.append(
				"Set-Cookie",
				serialize(name, value, options as Parameters<typeof serialize>[2]),
			);
		}
		for (const [key, value] of Object.entries(pendingHeaders)) {
			response.headers.set(key, value);
		}
		return response;
	}

	return { supabase, applyCookies };
}
