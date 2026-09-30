import { createFileRoute } from "@tanstack/react-router";

import { GUEST_WITH_RSVP_SELECT, mapGuestRow } from "#/lib/admin-guest-mapper";
import {
	ApiError,
	apiJsonResponse,
	withApiErrorHandling,
} from "#/lib/api-response";
import { requireAdminUser } from "#/lib/auth";
import { guestUpdateSchema } from "#/lib/schemas";
import { getSupabaseAdminClient } from "#/lib/supabase/admin";

function idFromUrl(request: Request, suffix = ""): string {
	const segments = new URL(request.url).pathname.split("/");
	const id = suffix ? segments.at(-2) : segments.at(-1);
	return id ?? "";
}

export const Route = createFileRoute("/api/admin/guests/$id")({
	server: {
		handlers: {
			PATCH: withApiErrorHandling(async (request) => {
				const { applyCookies } = await requireAdminUser(request);
				const origin = new URL(request.url).origin;
				const id = idFromUrl(request);

				const json = await request.json().catch(() => null);
				const parsed = guestUpdateSchema.safeParse(json);
				if (!parsed.success) {
					throw new ApiError(
						"VALIDATION_ERROR",
						"Thông tin khách mời không hợp lệ",
					);
				}
				if (Object.keys(parsed.data).length === 0) {
					throw new ApiError("VALIDATION_ERROR", "Không có gì để cập nhật");
				}

				const admin = getSupabaseAdminClient();
				const { data, error } = await admin
					.from("guests")
					.update({
						...(parsed.data.fullName !== undefined && {
							full_name: parsed.data.fullName,
						}),
						...(parsed.data.maxAttendees !== undefined && {
							max_attendees: parsed.data.maxAttendees,
						}),
						...(parsed.data.locale !== undefined && {
							locale: parsed.data.locale,
						}),
						...(parsed.data.note !== undefined && {
							note: parsed.data.note || null,
						}),
						...(parsed.data.email !== undefined && {
							email: parsed.data.email || null,
						}),
					})
					.eq("id", id)
					.select(GUEST_WITH_RSVP_SELECT)
					.maybeSingle();

				if (error)
					throw new ApiError("INTERNAL_ERROR", "Không thể cập nhật khách mời");
				if (!data) throw new ApiError("NOT_FOUND", "Không tìm thấy khách mời");

				return applyCookies(apiJsonResponse(mapGuestRow(data, origin)));
			}),

			DELETE: withApiErrorHandling(async (request) => {
				const { applyCookies } = await requireAdminUser(request);
				const id = idFromUrl(request);

				const admin = getSupabaseAdminClient();
				const { error, count } = await admin
					.from("guests")
					.delete({ count: "exact" })
					.eq("id", id);

				if (error)
					throw new ApiError("INTERNAL_ERROR", "Không thể xóa khách mời");
				if (!count) throw new ApiError("NOT_FOUND", "Không tìm thấy khách mời");

				return applyCookies(apiJsonResponse({ ok: true }));
			}),
		},
	},
});
