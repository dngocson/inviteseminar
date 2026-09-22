import { describe, expect, it } from "vitest";

import {
	generateInviteCode,
	INVITE_CODE_LENGTH,
	isValidInviteCodeFormat,
	withInviteCodeRetry,
} from "./invite-code";

describe("generateInviteCode", () => {
	it("produces an 8-char Base62 code", () => {
		const code = generateInviteCode();
		expect(code).toHaveLength(INVITE_CODE_LENGTH);
		expect(isValidInviteCodeFormat(code)).toBe(true);
	});

	it("does not repeat within a large sample (collision-resistant)", () => {
		const codes = new Set(
			Array.from({ length: 2000 }, () => generateInviteCode()),
		);
		expect(codes.size).toBe(2000);
	});
});

describe("isValidInviteCodeFormat", () => {
	it("rejects wrong length and non-Base62 characters", () => {
		expect(isValidInviteCodeFormat("short")).toBe(false);
		expect(isValidInviteCodeFormat("toolongcode123")).toBe(false);
		expect(isValidInviteCodeFormat("ab3x-9q2")).toBe(false);
		expect(isValidInviteCodeFormat("Ab3x9Q2m")).toBe(true);
	});
});

describe("withInviteCodeRetry", () => {
	it("returns the result on first success without retrying", async () => {
		let attempts = 0;
		const result = await withInviteCodeRetry(async (code) => {
			attempts += 1;
			return code;
		});
		expect(attempts).toBe(1);
		expect(isValidInviteCodeFormat(result)).toBe(true);
	});

	it("retries on a unique-constraint collision (Postgres 23505)", async () => {
		let attempts = 0;
		const result = await withInviteCodeRetry(async () => {
			attempts += 1;
			if (attempts < 3) {
				throw Object.assign(new Error("duplicate key"), { code: "23505" });
			}
			return "ok";
		});
		expect(attempts).toBe(3);
		expect(result).toBe("ok");
	});

	it("gives up after maxAttempts and rethrows the last collision error", async () => {
		await expect(
			withInviteCodeRetry(
				async () => {
					throw Object.assign(new Error("duplicate key"), { code: "23505" });
				},
				{ maxAttempts: 2 },
			),
		).rejects.toMatchObject({ code: "23505" });
	});

	it("does not retry on a non-collision error", async () => {
		let attempts = 0;
		await expect(
			withInviteCodeRetry(async () => {
				attempts += 1;
				throw new Error("network down");
			}),
		).rejects.toThrow("network down");
		expect(attempts).toBe(1);
	});
});
