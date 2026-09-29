import ExcelJS from "exceljs";

export interface GuestExportRow {
	inviteCode: string;
	fullName: string;
	locale: string;
	rsvp: {
		responderName: string;
		company: string | null;
		jobTitle: string | null;
		phone: string | null;
		email: string | null;
		allergies: string | null;
		attending: boolean;
		attendeeCount: number;
		message: string | null;
		updatedAt: string;
	} | null;
}

export async function buildGuestXlsx(
	rows: GuestExportRow[],
): Promise<ExcelJS.Buffer> {
	const workbook = new ExcelJS.Workbook();
	const sheet = workbook.addWorksheet("Khách mời");

	sheet.columns = [
		{ header: "Mã mời", key: "inviteCode", width: 14 },
		{ header: "Họ tên", key: "fullName", width: 24 },
		{ header: "Ngôn ngữ", key: "locale", width: 10 },
		{ header: "Người phản hồi", key: "responderName", width: 24 },
		{ header: "Công ty", key: "company", width: 24 },
		{ header: "Vị trí hiện tại", key: "jobTitle", width: 20 },
		{ header: "Số điện thoại", key: "phone", width: 16 },
		{ header: "Email", key: "email", width: 26 },
		{ header: "Trạng thái", key: "status", width: 14 },
		{ header: "Số người tham dự", key: "attendeeCount", width: 16 },
		{ header: "Dị ứng / nhạy cảm", key: "allergies", width: 32 },
		{ header: "Lời nhắn", key: "message", width: 32 },
		{ header: "Cập nhật lúc", key: "updatedAt", width: 20 },
	];

	// Header đậm, freeze hàng đầu
	sheet.getRow(1).font = { bold: true };
	sheet.views = [{ state: "frozen", ySplit: 1 }];

	for (const row of rows) {
		sheet.addRow({
			inviteCode: row.inviteCode,
			fullName: row.fullName,
			locale: row.locale,
			responderName: row.rsvp?.responderName ?? "",
			company: row.rsvp?.company ?? "",
			jobTitle: row.rsvp?.jobTitle ?? "",
			// Text, so Excel keeps leading zeros / `+84`.
			phone: row.rsvp?.phone ?? "",
			email: row.rsvp?.email ?? "",
			status: row.rsvp
				? row.rsvp.attending
					? "Tham dự"
					: "Từ chối"
				: "Chưa phản hồi",
			attendeeCount: row.rsvp?.attendeeCount ?? "",
			allergies: row.rsvp?.allergies ?? "",
			message: row.rsvp?.message ?? "",
			// Ghi Date thật thay vì string đã format, để Excel nhận đúng kiểu dữ liệu ngày giờ
			updatedAt: row.rsvp?.updatedAt ? new Date(row.rsvp.updatedAt) : "",
		});
	}

	// Format cột ngày giờ theo kiểu VN
	sheet.getColumn("updatedAt").numFmt = "dd/mm/yyyy hh:mm";

	return workbook.xlsx.writeBuffer();
}
