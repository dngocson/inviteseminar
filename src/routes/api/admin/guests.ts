import { createFileRoute } from "@tanstack/react-router";
import { GUEST_WITH_RSVP_SELECT, mapGuestRow } from "#/lib/admin-guest-mapper";
import {
	ApiError,
	apiJsonResponse,
	withApiErrorHandling,
} from "#/lib/api-response";
import { requireAdminUser } from "#/lib/auth";
import { withInviteCodeRetry } from "#/lib/invite-code";
import { guestCreateSchema } from "#/lib/schemas";
import { getSupabaseAdminClient } from "#/lib/supabase/admin";

export const Route = createFileRoute("/api/admin/guests")({
	server: {
		handlers: {
			GET: withApiErrorHandling(async (request) => {
				const { applyCookies } = await requireAdminUser(request);
				const origin = new URL(request.url).origin;

				const admin = getSupabaseAdminClient();
				const { data, error } = await admin
					.from("guests")
					.select(GUEST_WITH_RSVP_SELECT)
					.order("created_at", { ascending: false });

				if (error)
					throw new ApiError(
						"INTERNAL_ERROR",
						"Không thể tải danh sách khách mời",
					);

				return applyCookies(
					apiJsonResponse(data.map((row) => mapGuestRow(row, origin))),
				);
			}),

			POST: withApiErrorHandling(async (request) => {
				const { applyCookies, user } = await requireAdminUser(request);
				const origin = new URL(request.url).origin;

				const json = await request.json().catch(() => null);
				const parsed = guestCreateSchema.safeParse(json);
				if (!parsed.success) {
					throw new ApiError(
						"VALIDATION_ERROR",
						"Thông tin khách mời không hợp lệ",
					);
				}

				const admin = getSupabaseAdminClient();
				const created = await withInviteCodeRetry(async (inviteCode) => {
					const { data, error } = await admin
						.from("guests")
						.insert({
							invite_code: inviteCode,
							full_name: parsed.data.fullName,
							max_attendees: parsed.data.maxAttendees,
							locale: parsed.data.locale,
							created_by: user.id,
						})
						.select(GUEST_WITH_RSVP_SELECT)
						.single();

					if (error) throw error;
					return data;
				});

				return applyCookies(
					apiJsonResponse(mapGuestRow(created, origin), { status: 201 }),
				);
			}),
		},
	},
});
