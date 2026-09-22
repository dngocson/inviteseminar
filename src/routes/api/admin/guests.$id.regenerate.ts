import { createFileRoute } from "@tanstack/react-router";

import { mapGuestRow } from "#/lib/admin-guest-mapper";
import {
	ApiError,
	apiJsonResponse,
	withApiErrorHandling,
} from "#/lib/api-response";
import { requireAdminUser } from "#/lib/auth";
import { withInviteCodeRetry } from "#/lib/invite-code";
import { getSupabaseAdminClient } from "#/lib/supabase/admin";

const GUEST_WITH_RSVP_SELECT =
	"id, invite_code, full_name, max_attendees, created_at, updated_at, rsvp:rsvps(responder_name, message, attending, attendee_count, updated_at)";

export const Route = createFileRoute("/api/admin/guests/$id/regenerate")({
	server: {
		handlers: {
			// Invalidates the old link. Intentionally a dedicated action (not part
			// of the plain guest update) since it is destructive to any link
			// already shared with the guest — the admin UI confirms before calling it.
			POST: withApiErrorHandling(async (request) => {
				const { applyCookies } = await requireAdminUser(request);
				const origin = new URL(request.url).origin;
				const id = new URL(request.url).pathname.split("/").at(-2) ?? "";

				const admin = getSupabaseAdminClient();
				const updated = await withInviteCodeRetry(async (inviteCode) => {
					const { data, error } = await admin
						.from("guests")
						.update({ invite_code: inviteCode })
						.eq("id", id)
						.select(GUEST_WITH_RSVP_SELECT)
						.maybeSingle();

					if (error) throw error;
					return data;
				});

				if (!updated)
					throw new ApiError("NOT_FOUND", "Không tìm thấy khách mời");

				return applyCookies(apiJsonResponse(mapGuestRow(updated, origin)));
			}),
		},
	},
});
