import { describe, expect, it } from "vitest";

import { buildGuestCsv } from "./guest-csv";

describe("buildGuestCsv", () => {
	it("delimits with ';' so Excel splits columns under a comma-decimal locale", () => {
		const csv = buildGuestCsv([
			{
				inviteCode: "Ab3x9Q2m",
				fullName: "Nguyễn Văn A",
				maxAttendees: 5,
				locale: "vi",
				rsvp: {
					attending: true,
					attendeeCount: 3,
					message: null,
					updatedAt: "2026-11-01T02:00:00.000Z",
				},
			},
		]);

		const [header, row] = csv.split("\r\n");
		expect(header?.split(";")).toEqual([
			"Mã mời",
			"Họ tên",
			"Số người tối đa",
			"Ngôn ngữ",
			"Trạng thái",
			"Số người tham dự",
			"Lời nhắn",
			"Cập nhật lúc",
		]);
		// 8 columns => 7 delimiters, whether or not any field needed quoting.
		expect(row?.split(";").length).toBeGreaterThanOrEqual(7);
	});

	it("quotes a field that itself contains the ';' delimiter", () => {
		const csv = buildGuestCsv([
			{
				inviteCode: "Zx8Kp2Qn",
				fullName: "Trần Thị B",
				maxAttendees: 5,
				locale: "vi",
				rsvp: {
					attending: true,
					attendeeCount: 1,
					message: "Đi cùng; sẽ đến muộn",
					updatedAt: "2026-11-01T02:00:00.000Z",
				},
			},
		]);

		expect(csv).toContain('"Đi cùng; sẽ đến muộn"');
	});

	it('shows "Chưa phản hồi" with an empty count for a guest with no RSVP yet', () => {
		const csv = buildGuestCsv([
			{
				inviteCode: "Qw1Er2Ty",
				fullName: "Lê Văn C",
				maxAttendees: 5,
				locale: "en",
				rsvp: null,
			},
		]);

		const [, row] = csv.split("\r\n");
		expect(row).toContain("Chưa phản hồi");
	});
});
