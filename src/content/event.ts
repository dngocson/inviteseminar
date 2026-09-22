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
		vi: "Hội thảo Nguyên liệu & Công nghệ Mỹ phẩm 2026",
		en: "Cosmetic Ingredients & Formulation Technology Seminar 2026",
	} satisfies Bilingual,

	organizer: {
		vi: "Công ty TNHH Hóa chất Nguyên liệu Việt",
		en: "Viet Ingredient Chemicals Co., Ltd.",
	} satisfies Bilingual,

	// ISO 8601 with the Asia/Ho_Chi_Minh offset baked in, so the countdown and
	// schedule are correct regardless of the visitor's local timezone.
	startsAt: "2026-11-14T08:30:00+07:00",
	endsAt: "2026-11-14T17:00:00+07:00",
	timezone: "Asia/Ho_Chi_Minh",

	venue: {
		name: {
			vi: "Trung tâm Hội nghị White Palace",
			en: "White Palace Convention Center",
		} satisfies Bilingual,
		address: {
			vi: "194 Hoàng Văn Thụ, Phường Hai Bà Trưng, TP. Hồ Chí Minh",
			en: "194 Hoang Van Thu, Hai Ba Trung Ward, Ho Chi Minh City",
		} satisfies Bilingual,
		mapUrl: "https://maps.google.com/?q=White+Palace+194+Hoang+Van+Thu",
	},

	timeline: [
		{
			time: "08:30",
			title: {
				vi: "Đón khách & Trưng bày nguyên liệu",
				en: "Guest check-in & ingredient showcase",
			},
			description: {
				vi: "Tham quan gian trưng bày mẫu nguyên liệu hoạt chất và bán thành phẩm mới nhất.",
				en: "Browse the showcase of the latest active ingredient samples and semi-finished formulas.",
			},
		},
		{
			time: "09:00",
			title: { vi: "Khai mạc & Giới thiệu", en: "Opening & Introduction" },
			description: {
				vi: "Phát biểu khai mạc và giới thiệu định hướng nghiên cứu nguyên liệu mỹ phẩm 2026.",
				en: "Opening remarks and an overview of 2026 cosmetic ingredient research directions.",
			},
		},
		{
			time: "09:45",
			title: {
				vi: "Xu hướng nguyên liệu hoạt chất",
				en: "Active ingredient trends",
			},
			description: {
				vi: "Cập nhật các hoạt chất chống lão hóa, phục hồi da và công nghệ vi bọc (microencapsulation).",
				en: "Updates on anti-aging actives, skin-barrier repair compounds, and microencapsulation technology.",
			},
		},
		{
			time: "10:45",
			title: { vi: "Giải lao & Kết nối", en: "Coffee break & networking" },
			description: {
				vi: "Giao lưu cùng đội ngũ chuyên gia R&D và đối tác cung ứng.",
				en: "Connect with our R&D specialists and supply partners.",
			},
		},
		{
			time: "11:15",
			title: { vi: "Thực hành công thức mẫu", en: "Live formulation demo" },
			description: {
				vi: "Trình diễn phối trộn công thức serum và kem dưỡng với nguyên liệu mới.",
				en: "Live demonstration of serum and cream formulation using the new ingredient line.",
			},
		},
		{
			time: "12:00",
			title: {
				vi: "Tổng kết & Tiệc trưa thân mật",
				en: "Closing remarks & lunch",
			},
			description: {
				vi: "Tổng kết chương trình và dùng bữa trưa thân mật cùng khách mời.",
				en: "Program wrap-up followed by a casual lunch with guests.",
			},
		},
	] as TimelineItem[],

	defaultMaxAttendees: 5,
} as const;

export function localized(value: Bilingual, locale: Locale): string {
	return value[locale];
}
