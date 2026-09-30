import { describe, expect, it } from "vitest";

import { buildInviteEmail, escapeHtml } from "./invite-email";

const base = {
	guestName: "Nguyễn Văn A",
	origin: "https://example.com",
	inviteCode: "Ab3x9Q2m",
	locale: "vi" as const,
	qrCid: "invite-qr",
	logoCid: "gobiotics-logo",
};

describe("buildInviteEmail", () => {
	it("includes the guest name, invite link and inline QR image", () => {
		const email = buildInviteEmail(base);
		expect(email.html).toContain("Kính gửi Nguyễn Văn A,");
		expect(email.inviteUrl).toBe("https://example.com/?k=Ab3x9Q2m&l=vi");
		expect(email.html).toContain(escapeHtml(email.inviteUrl));
		expect(email.html).toContain('src="cid:invite-qr"');
		expect(email.html).toContain('src="cid:gobiotics-logo"');
		expect(email.text).toContain(email.inviteUrl);
	});

	it("flattens the HTML seminar title into a plain subject", () => {
		const email = buildInviteEmail(base);
		expect(email.subject).toBe(
			"Thư mời tham dự Hội thảo: Không chỉ là Prebiotics: Giải pháp đa chức năng cho mỹ phẩm hiện đại",
		);
		expect(email.subject).not.toContain("<");
	});

	it("renders English copy for the en locale", () => {
		const email = buildInviteEmail({ ...base, locale: "en" });
		expect(email.subject.startsWith("Invitation to the Seminar")).toBe(true);
		expect(email.html).toContain("Dear Nguyễn Văn A,");
		expect(email.html).toContain("View invitation &amp; RSVP");
	});

	it("links to the card in the same language as the email", () => {
		for (const locale of ["vi", "en"] as const) {
			const email = buildInviteEmail({ ...base, locale });
			expect(new URL(email.inviteUrl).searchParams.get("l")).toBe(locale);
			expect(email.html).toContain(`<html lang="${locale}"`);
			expect(email.html).toContain(`l=${locale}`);
		}
	});

	it("escapes guest-provided text", () => {
		const email = buildInviteEmail({ ...base, guestName: "<b>x</b>" });
		expect(email.html).toContain("&lt;b&gt;x&lt;/b&gt;");
		expect(email.html).not.toContain("<b>x</b>");
	});

	it("falls back to a text wordmark without a logo", () => {
		const email = buildInviteEmail({ ...base, logoCid: null });
		expect(email.html).not.toContain("cid:gobiotics-logo");
		expect(email.html).toContain(">Gobiotics</span>");
	});
});
