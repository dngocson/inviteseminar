import { createFileRoute } from "@tanstack/react-router";

import { GUEST_WITH_RSVP_SELECT, mapGuestRow } from "#/lib/admin-guest-mapper";
import {
	ApiError,
	apiJsonResponse,
	withApiErrorHandling,
} from "#/lib/api-response";
import { requireAdminUser } from "#/lib/auth";
import {
	InviteEmailConfigError,
	sendInviteEmail,
} from "#/lib/email/send-invite";
import { localeSchema } from "#/lib/schemas";
import { getSupabaseAdminClient } from "#/lib/supabase/admin";

export const Route = createFileRoute("/api/admin/guests/$id/send-invite")({
	server: {
		handlers: {
			// Sends (or re-sends) the invitation email to the guest's email on file
			// and records the outcome on the guest row.
			POST: withApiErrorHandling(async (request) => {
				const { applyCookies } = await requireAdminUser(request);
				const origin = new URL(request.url).origin;
				const id = new URL(request.url).pathname.split("/").at(-2) ?? "";

				// Email language chosen in the admin dialog; defaults to the guest's.
				const body = await request.json().catch(() => null);
				const requestedLocale = localeSchema.safeParse(body?.locale);

				const admin = getSupabaseAdminClient();
				const { data: guest, error: guestError } = await admin
					.from("guests")
					.select("id, invite_code, full_name, locale, email")
					.eq("id", id)
					.maybeSingle();

				if (guestError)
					throw new ApiError("INTERNAL_ERROR", "Không thể tải khách mời");
				if (!guest) throw new ApiError("NOT_FOUND", "Không tìm thấy khách mời");
				if (!guest.email) {
					throw new ApiError(
						"VALIDATION_ERROR",
						"Khách mời chưa có email. Vui lòng cập nhật email trước khi gửi.",
					);
				}

				const locale = requestedLocale.success
					? requestedLocale.data
					: guest.locale;

				let sendError: string | null = null;
				try {
					await sendInviteEmail({
						to: guest.email,
						guestName: guest.full_name,
						inviteCode: guest.invite_code,
						locale,
						origin,
					});
				} catch (error) {
					if (error instanceof InviteEmailConfigError) {
						throw new ApiError("INTERNAL_ERROR", error.message);
					}
					sendError = error instanceof Error ? error.message : String(error);
				}

				const { data: updated, error: updateError } = await admin
					.from("guests")
					.update(
						sendError
							? { invite_send_error: sendError.slice(0, 500) }
							: {
									invite_sent_at: new Date().toISOString(),
									invite_send_error: null,
									invite_sent_to: guest.email,
									invite_sent_kind: "invite",
								},
					)
					.eq("id", id)
					.select(GUEST_WITH_RSVP_SELECT)
					.single();

				if (sendError) {
					throw new ApiError(
						"INTERNAL_ERROR",
						`Gửi email thất bại: ${sendError}`,
					);
				}
				if (updateError || !updated) {
					throw new ApiError(
						"INTERNAL_ERROR",
						"Đã gửi email nhưng không lưu được trạng thái",
					);
				}

				return applyCookies(apiJsonResponse(mapGuestRow(updated, origin)));
			}),
		},
	},
});
