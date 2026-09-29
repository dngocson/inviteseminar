import type { Locale } from "#/lib/schemas";

type Bilingual = Record<Locale, string>;

export interface TimelineItem {
	time: string;
	title: Bilingual;
	description: Bilingual;
}

/**
 * Central, structured seminar content. Swap these values (name, venue,
 * timeline, images, logo) for the real event later without touching any
 * component — every section reads from this config.
 */
export const eventConfig = {
	seminarName: {
		en: `
    <span class="block text-[1rem] sm:text-[2rem]">Beyond Prebiotics:</span>
    <span class="block whitespace-nowrap">Multifunctional Solutions</span>
    <span class="block text-[1rem] sm:text-[2rem]">for Modern Cosmetics</span>
  `,
		vi: `
    <span class="block text-[1rem] sm:text-[2rem]">Không chỉ là Prebiotics:</span>
    <span class="block whitespace-nowrap">Giải pháp đa chức năng</span>
    <span class="block text-[1rem] sm:text-[2rem]">cho mỹ phẩm hiện đại</span>
  `,
	} satisfies Bilingual,

	organizer: {
		vi: "Công ty TNHH Dermatech Việt Nam",
		en: "DERMATECH VIET NAM COMPANY LIMITED",
	} satisfies Bilingual,

	// ISO 8601 with the Asia/Ho_Chi_Minh offset baked in, so the countdown and
	// schedule are correct regardless of the visitor's local timezone.
	startsAt: "2026-10-28T08:00:00+07:00",
	endsAt: "2026-10-28T17:00:00+07:00",
	timezone: "Asia/Ho_Chi_Minh",

	venue: {
		name: {
			vi: "Le Méridien Saigon",
			en: "Le Méridien Saigon",
		} satisfies Bilingual,
		address: {
			vi: "3C Tôn Đức Thắng, Quận 1, TP. Hồ Chí Minh",
			en: "3C Ton Duc Thang Street, District 1, Ho Chi Minh City",
		} satisfies Bilingual,
		mapUrl: "https://maps.app.goo.gl/XumDRVtgCZ95m8ox5",
	},

	timeline: [
		{
			time: "08:00 - 08:30",
			title: {
				vi: "Đón khách & Check-in",
				en: "Guest Reception & Check-in",
			},
			description: {
				vi: "Đón khách, check-in và ổn định chỗ ngồi trước khi chương trình bắt đầu.",
				en: "Guest check-in and seating before the program begins.",
			},
		},
		{
			time: "08:30 - 08:45",
			title: {
				vi: "Ổn định & Khai mạc",
				en: "Seating & Opening",
			},
			description: {
				vi: "Ổn định chỗ ngồi, giới thiệu và phần mở đầu",
				en: "Seating, Introductions & Opening Remarks",
			},
		},
		{
			time: "08:45",
			title: {
				vi: "Prebiotic: Ngôn ngữ của hệ vi sinh trên da",
				en: "Prebiotic: The Language of the Skin Microbiome",
			},
			description: {
				vi: "Chuyên đề về vai trò của prebiotic và mối liên hệ với hệ vi sinh trên da.\n Diễn giả: Tiến sĩ Sébastien Kerverdo – Giám đốc Kinh doanh Sweetch Holding.",
				en: "A session exploring the role of prebiotics and their relationship with the skin microbiome.\n Speaker: Dr. Sébastien Kerverdo – Sales Director, Sweetch Holding.",
			},
		},
		{
			time: "10:30",
			title: {
				vi: "Giải lao",
				en: "Break Time",
			},
			description: {
				vi: "",
				en: "",
			},
		},
		{
			time: "10:45",
			title: {
				vi: "Không chỉ prebiotics - Cùng khám phá những giải pháp tân tiến mới",
				en: "Beyond Prebiotics – Multifunctional Solutions for Today's Cosmetics",
			},
			description: {
				vi: "Khám phá những giải pháp đa chức năng, vượt xa vai trò truyền thống của prebiotics trong các ứng dụng mỹ phẩm hiện đại.\nDiễn giả: Tiến sĩ Sébastien Kerverdo – Giám đốc Kinh doanh Sweetch Holding.",
				en: "Explore multifunctional solutions that go beyond the traditional role of prebiotics in modern cosmetic applications.\nSpeaker: Dr. Sébastien Kerverdo – Sales Director, Sweetch Holding.",
			},
		},
		{
			time: "11:50",
			title: {
				vi: "Giao lưu & Bế mạc",
				en: "Networking & Closing",
			},
			description: {
				vi: "Giao lưu, trao đổi cùng diễn giả và khách mời, sau đó bế mạc chương trình.",
				en: "Networking and discussion with the speaker and guests, followed by the closing of the program.",
			},
		},
		{
			time: "12:15",
			title: {
				vi: "Tiệc trưa thân mật",
				en: "Casual Lunch",
			},
			description: {
				vi: "Dùng bữa trưa thân mật và tiếp tục giao lưu cùng khách mời.",
				en: "Enjoy a casual lunch and continue networking with guests.",
			},
		},
	] as TimelineItem[],
	defaultMaxAttendees: 5,
} as const;

export function localized(value: Bilingual, locale: Locale): string {
	return value[locale];
}
