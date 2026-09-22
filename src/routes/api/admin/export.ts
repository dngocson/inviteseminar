import { createFileRoute } from "@tanstack/react-router";
import Papa from "papaparse";

import { ApiError, withApiErrorHandling } from "#/lib/api-response";
import { requireAdminUser } from "#/lib/auth";
import { getSupabaseAdminClient } from "#/lib/supabase/admin";

const GUEST_WITH_RSVP_SELECT =
	"invite_code, full_name, max_attendees, rsvp:rsvps(responder_name, message, attending, attendee_count, updated_at)";

export const Route = createFileRoute("/api/admin/export")({
	server: {
		handlers: {
			GET: withApiErrorHandling(async (request) => {
				const { applyCookies } = await requireAdminUser(request);

				const admin = getSupabaseAdminClient();
				const { data, error } = await admin
					.from("guests")
					.select(GUEST_WITH_RSVP_SELECT)
					.order("created_at", { ascending: true });

				if (error)
					throw new ApiError("INTERNAL_ERROR", "Không thể xuất dữ liệu");

				const rows = data.map((row) => {
					const rsvp = Array.isArray(row.rsvp)
						? (row.rsvp[0] ?? null)
						: row.rsvp;
					return {
						"Mã mời": row.invite_code,
						"Họ tên": row.full_name,
						"Số người tối đa": row.max_attendees,
						"Trạng thái": rsvp
							? rsvp.attending
								? "Tham dự"
								: "Từ chối"
							: "Chưa phản hồi",
						"Số người tham dự": rsvp?.attendee_count ?? "",
						"Lời nhắn": rsvp?.message ?? "",
						"Cập nhật lúc": rsvp?.updated_at ?? "",
					};
				});

				const csv = Papa.unparse(rows);
				// UTF-8 BOM so Excel opens Vietnamese diacritics correctly.
				const body = `﻿${csv}`;

				const response = new Response(body, {
					headers: {
						"Content-Type": "text/csv; charset=utf-8",
						"Content-Disposition": `attachment; filename="khach-moi-seminar-${new Date().toISOString().slice(0, 10)}.csv"`,
					},
				});

				return applyCookies(response);
			}),
		},
	},
});
