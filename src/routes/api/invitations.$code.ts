import { createFileRoute } from "@tanstack/react-router";

import {
	ApiError,
	apiJsonResponse,
	withApiErrorHandling,
} from "#/lib/api-response";
import { isValidInviteCodeFormat } from "#/lib/invite-code";
import { checkRateLimit, getClientIp } from "#/lib/rate-limit";
import { mapRsvpRow, RSVP_COLUMNS } from "#/lib/rsvp-mapper";
import type { InvitationDto } from "#/lib/schemas";
import { getSupabaseAdminClient } from "#/lib/supabase/admin";

export const Route = createFileRoute("/api/invitations/$code")({
	server: {
		handlers: {
			GET: withApiErrorHandling(async (request) => {
				const code = new URL(request.url).pathname.split("/").pop() ?? "";

				if (!isValidInviteCodeFormat(code)) {
					throw new ApiError("NOT_FOUND", "Mã mời không hợp lệ");
				}

				const rateLimitKey = `lookup:${getClientIp(request)}`;
				if (!checkRateLimit(rateLimitKey, { limit: 30, windowMs: 60_000 })) {
					throw new ApiError(
						"RATE_LIMITED",
						"Quá nhiều yêu cầu, vui lòng thử lại sau",
					);
				}

				const admin = getSupabaseAdminClient();
				const { data: guest, error: guestError } = await admin
					.from("guests")
					.select("id, full_name, max_attendees")
					.eq("invite_code", code)
					.maybeSingle();

				if (guestError) {
					throw new ApiError(
						"INTERNAL_ERROR",
						"Không thể tải thông tin lời mời",
					);
				}
				if (!guest) {
					throw new ApiError("NOT_FOUND", "Không tìm thấy lời mời");
				}

				const { data: rsvp, error: rsvpError } = await admin
					.from("rsvps")
					.select(RSVP_COLUMNS)
					.eq("guest_id", guest.id)
					.maybeSingle();

				if (rsvpError) {
					throw new ApiError("INTERNAL_ERROR", "Không thể tải phản hồi RSVP");
				}

				const body: InvitationDto = {
					fullName: guest.full_name,
					maxAttendees: guest.max_attendees,
					rsvp: rsvp ? mapRsvpRow(rsvp) : null,
				};

				return apiJsonResponse(body);
			}),
		},
	},
});
