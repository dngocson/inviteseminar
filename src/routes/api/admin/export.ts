import { createFileRoute } from "@tanstack/react-router";

import { ApiError, withApiErrorHandling } from "#/lib/api-response";
import { requireAdminUser } from "#/lib/auth";
import { buildGuestXlsx } from "#/lib/guest-xlsx";
import { getSupabaseAdminClient } from "#/lib/supabase/admin";

const GUEST_EXPORT_SELECT =
	"invite_code, full_name, max_attendees, locale, rsvp:rsvps(responder_name, message, attending, attendee_count, updated_at)";

export const Route = createFileRoute("/api/admin/export")({
	server: {
		handlers: {
			GET: withApiErrorHandling(async (request) => {
				const { applyCookies } = await requireAdminUser(request);

				const admin = getSupabaseAdminClient();
				const { data, error } = await admin
					.from("guests")
					.select(GUEST_EXPORT_SELECT)
					.order("created_at", { ascending: true });

				if (error)
					throw new ApiError("INTERNAL_ERROR", "Không thể xuất dữ liệu");

				const rows = data.map((row) => {
					const rsvp = Array.isArray(row.rsvp)
						? (row.rsvp[0] ?? null)
						: row.rsvp;
					return {
						inviteCode: row.invite_code,
						fullName: row.full_name,
						maxAttendees: row.max_attendees,
						locale: row.locale,
						rsvp: rsvp && {
							attending: rsvp.attending,
							attendeeCount: rsvp.attendee_count,
							message: rsvp.message,
							updatedAt: rsvp.updated_at,
						},
					};
				});

				const buffer = await buildGuestXlsx(rows);

				const response = new Response(buffer, {
					headers: {
						"Content-Type":
							"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
						"Content-Disposition": `attachment; filename="khach-moi-seminar-${new Date().toISOString().slice(0, 10)}.xlsx"`,
					},
				});

				return applyCookies(response);
			}),
		},
	},
});
