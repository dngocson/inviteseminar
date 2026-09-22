import { describe, expect, it } from "vitest";

import {
	guestCreateSchema,
	invitationSearchSchema,
	rsvpSubmitSchema,
} from "./schemas";

describe("invitationSearchSchema", () => {
	it("defaults locale to vi when `l` is missing", () => {
		const result = invitationSearchSchema.parse({ k: "Ab3x9Q2m" });
		expect(result.l).toBe("vi");
	});

	it("accepts a valid k/l pair", () => {
		const result = invitationSearchSchema.parse({ k: "Ab3x9Q2m", l: "en" });
		expect(result).toEqual({ k: "Ab3x9Q2m", l: "en" });
	});

	it("rejects a locale outside vi/en", () => {
		expect(() =>
			invitationSearchSchema.parse({ k: "Ab3x9Q2m", l: "de" }),
		).toThrow();
	});

	it("rejects an invite code of the wrong length", () => {
		expect(() => invitationSearchSchema.parse({ k: "short" })).toThrow();
	});

	it('allows a missing k (renders the "missing code" screen instead of erroring)', () => {
		const result = invitationSearchSchema.parse({});
		expect(result.k).toBeUndefined();
		expect(result.l).toBe("vi");
	});
});

describe("rsvpSubmitSchema attendance/count consistency", () => {
	const base = { code: "Ab3x9Q2m", responderName: "Nguyen Van A" };

	it("accepts attending=true with a count between 1 and 5", () => {
		expect(() =>
			rsvpSubmitSchema.parse({ ...base, attending: true, attendeeCount: 3 }),
		).not.toThrow();
	});

	it("rejects attending=true with count 0", () => {
		expect(() =>
			rsvpSubmitSchema.parse({ ...base, attending: true, attendeeCount: 0 }),
		).toThrow();
	});

	it("rejects attending=true with count above 5", () => {
		expect(() =>
			rsvpSubmitSchema.parse({ ...base, attending: true, attendeeCount: 6 }),
		).toThrow();
	});

	it("accepts attending=false with count 0", () => {
		expect(() =>
			rsvpSubmitSchema.parse({ ...base, attending: false, attendeeCount: 0 }),
		).not.toThrow();
	});

	it("rejects attending=false with a nonzero count", () => {
		expect(() =>
			rsvpSubmitSchema.parse({ ...base, attending: false, attendeeCount: 2 }),
		).toThrow();
	});

	it("defaults attendeeCount to 0 when omitted (decline path)", () => {
		const result = rsvpSubmitSchema.parse({ ...base, attending: false });
		expect(result.attendeeCount).toBe(0);
	});
});

describe("guestCreateSchema", () => {
	it("defaults maxAttendees to 5", () => {
		const result = guestCreateSchema.parse({ fullName: "Nguyễn Thị B" });
		expect(result.maxAttendees).toBe(5);
	});

	it("rejects an empty name", () => {
		expect(() => guestCreateSchema.parse({ fullName: "  " })).toThrow();
	});

	it("rejects maxAttendees outside 1..5", () => {
		expect(() =>
			guestCreateSchema.parse({ fullName: "Guest", maxAttendees: 0 }),
		).toThrow();
		expect(() =>
			guestCreateSchema.parse({ fullName: "Guest", maxAttendees: 6 }),
		).toThrow();
	});
});
