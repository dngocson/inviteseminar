import { createFileRoute } from "@tanstack/react-router";

import {
	ApiError,
	apiJsonResponse,
	withApiErrorHandling,
} from "#/lib/api-response";
import { requireAdminUser } from "#/lib/auth";
import type { RsvpStatsDto } from "#/lib/schemas";
import { getSupabaseAdminClient } from "#/lib/supabase/admin";

export const Route = createFileRoute("/api/admin/stats")({
	server: {
		handlers: {
			GET: withApiErrorHandling(async (request) => {
				const { applyCookies } = await requireAdminUser(request);

				const admin = getSupabaseAdminClient();
				const [
					{ count: totalGuests, error: guestsError },
					{ data: rsvps, error: rsvpsError },
				] = await Promise.all([
					admin.from("guests").select("id", { count: "exact", head: true }),
					admin.from("rsvps").select("attending, attendee_count"),
				]);

				if (guestsError || rsvpsError) {
					throw new ApiError("INTERNAL_ERROR", "Không thể tải thống kê");
				}

				const responded = rsvps?.length ?? 0;
				const attending = rsvps?.filter((r) => r.attending).length ?? 0;
				const declined = responded - attending;
				const totalAttendees =
					rsvps?.reduce(
						(sum, r) => sum + (r.attending ? r.attendee_count : 0),
						0,
					) ?? 0;

				const stats: RsvpStatsDto = {
					totalGuests: totalGuests ?? 0,
					responded,
					attending,
					declined,
					pending: (totalGuests ?? 0) - responded,
					totalAttendees,
				};

				return applyCookies(apiJsonResponse(stats));
			}),
		},
	},
});
