import { createFileRoute } from "@tanstack/react-router";

import { apiJsonResponse, withApiErrorHandling } from "#/lib/api-response";
import { requireAdminUser } from "#/lib/auth";

export const Route = createFileRoute("/api/admin/session")({
	server: {
		handlers: {
			GET: withApiErrorHandling(async (request) => {
				const { user, applyCookies } = await requireAdminUser(request);
				return applyCookies(apiJsonResponse({ email: user.email }));
			}),
		},
	},
});
