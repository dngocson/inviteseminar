import { describe, expect, it } from "vitest";

import { buildInviteUrl } from "./invite-link";

describe("buildInviteUrl", () => {
	it("builds the canonical /?k=&l= link from any origin", () => {
		expect(buildInviteUrl("http://localhost:3000", "Ab3x9Q2m", "vi")).toBe(
			"http://localhost:3000/?k=Ab3x9Q2m&l=vi",
		);
		expect(
			buildInviteUrl("https://my-app-preview.vercel.app", "Ab3x9Q2m", "en"),
		).toBe("https://my-app-preview.vercel.app/?k=Ab3x9Q2m&l=en");
		expect(buildInviteUrl("https://tuongngocyep.vercel.app", "Ab3x9Q2m")).toBe(
			"https://tuongngocyep.vercel.app/?k=Ab3x9Q2m&l=vi",
		);
	});

	it("never embeds the guest name — only the origin and invite code", () => {
		const url = buildInviteUrl("https://example.com", "Zx8Kp2Qn", "en");
		expect(url).not.toMatch(/name/i);
		expect(new URL(url).searchParams.get("k")).toBe("Zx8Kp2Qn");
	});
});
