import { createFileRoute } from "@tanstack/react-router";

import { apiJsonResponse, withApiErrorHandling } from "#/lib/api-response";
import { createSupabaseServerClient } from "#/lib/supabase/server";

export const Route = createFileRoute("/api/admin/logout")({
	server: {
		handlers: {
			POST: withApiErrorHandling(async (request) => {
				const { supabase, applyCookies } = createSupabaseServerClient(request);
				await supabase.auth.signOut();
				return applyCookies(apiJsonResponse({ ok: true }));
			}),
		},
	},
});
