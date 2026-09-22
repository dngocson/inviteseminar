import { createFileRoute } from "@tanstack/react-router";

import {
	ApiError,
	apiErrorResponse,
	apiJsonResponse,
	withApiErrorHandling,
} from "#/lib/api-response";
import { loginSchema } from "#/lib/schemas";
import { getSupabaseAdminClient } from "#/lib/supabase/admin";
import { createSupabaseServerClient } from "#/lib/supabase/server";

export const Route = createFileRoute("/api/admin/login")({
	server: {
		handlers: {
			POST: withApiErrorHandling(async (request) => {
				const json = await request.json().catch(() => null);
				const parsed = loginSchema.safeParse(json);
				if (!parsed.success) {
					throw new ApiError(
						"VALIDATION_ERROR",
						"Email hoặc mật khẩu không hợp lệ",
					);
				}

				const { supabase, applyCookies } = createSupabaseServerClient(request);
				const { data, error } = await supabase.auth.signInWithPassword(
					parsed.data,
				);

				if (error || !data.user) {
					// Logged server-side only (never sent to the client) so local
					// debugging can distinguish "wrong password" from "email not
					// confirmed", "invalid API key", etc.
					console.error("[admin/login] signInWithPassword failed:", error);
					throw new ApiError(
						"UNAUTHENTICATED",
						"Email hoặc mật khẩu không đúng",
					);
				}

				const admin = getSupabaseAdminClient();
				const { data: adminRow, error: adminLookupError } = await admin
					.from("admin_users")
					.select("user_id")
					.eq("user_id", data.user.id)
					.maybeSingle();

				if (adminLookupError) {
					return applyCookies(
						apiErrorResponse(
							"INTERNAL_ERROR",
							"Không thể xác thực quyền quản trị",
						),
					);
				}
				if (!adminRow) {
					await supabase.auth.signOut();
					return applyCookies(
						apiErrorResponse("FORBIDDEN", "Tài khoản không có quyền quản trị"),
					);
				}

				return applyCookies(apiJsonResponse({ email: data.user.email }));
			}),
		},
	},
});
