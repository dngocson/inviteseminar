import { createFileRoute } from "@tanstack/react-router";

import { ApiError, withApiErrorHandling } from "#/lib/api-response";
import { requireAdminUser } from "#/lib/auth";
import { buildGuestXlsx } from "#/lib/guest-xlsx";
import { mapRsvpRow, RSVP_COLUMNS, type RsvpRow } from "#/lib/rsvp-mapper";
import { getSupabaseAdminClient } from "#/lib/supabase/admin";

const GUEST_EXPORT_SELECT = `invite_code, full_name, locale, note, rsvp:rsvps(${RSVP_COLUMNS})`;

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
					const rsvpRow = (
						Array.isArray(row.rsvp) ? (row.rsvp[0] ?? null) : row.rsvp
					) as RsvpRow | null;
					return {
						inviteCode: row.invite_code,
						fullName: row.full_name,
						locale: row.locale,
						note: row.note,
						rsvp: rsvpRow && mapRsvpRow(rsvpRow),
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
