import Papa from "papaparse";

export interface GuestCsvRow {
	inviteCode: string;
	fullName: string;
	maxAttendees: number;
	locale: string;
	rsvp: {
		attending: boolean;
		attendeeCount: number;
		message: string | null;
		updatedAt: string;
	} | null;
}

/**
 * Builds the CSV body (no BOM) for the guest export. `;` is used as the
 * delimiter instead of `,` — Excel's double-click CSV import splits columns
 * using the OS list separator, which is `;` (not `,`) under locales like
 * Vietnamese where `,` is the decimal separator. A comma-delimited file
 * opens there with every field of each row crammed into column A; `;`
 * opens correctly there and Excel still reads it fine elsewhere.
 */
export function buildGuestCsv(rows: GuestCsvRow[]): string {
	const table = rows.map((row) => ({
		"Mã mời": row.inviteCode,
		"Họ tên": row.fullName,
		"Số người tối đa": row.maxAttendees,
		"Ngôn ngữ": row.locale,
		"Trạng thái": row.rsvp
			? row.rsvp.attending
				? "Tham dự"
				: "Từ chối"
			: "Chưa phản hồi",
		"Số người tham dự": row.rsvp?.attendeeCount ?? "",
		"Lời nhắn": row.rsvp?.message ?? "",
		"Cập nhật lúc": row.rsvp?.updatedAt
			? new Date(row.rsvp.updatedAt).toLocaleString("vi-VN")
			: "",
	}));

	return Papa.unparse(table, { delimiter: ";" });
}
