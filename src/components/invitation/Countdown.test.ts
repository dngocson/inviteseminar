import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { computeRemaining } from "./Countdown";

describe("computeRemaining", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns null once the target time has passed", () => {
		vi.setSystemTime(new Date("2026-11-14T09:00:00+07:00"));
		const target = new Date("2026-11-14T08:30:00+07:00").getTime();
		expect(computeRemaining(target)).toBeNull();
	});

	it("returns null exactly at the target time (event just started)", () => {
		const target = new Date("2026-11-14T08:30:00+07:00").getTime();
		vi.setSystemTime(new Date(target));
		expect(computeRemaining(target)).toBeNull();
	});

	it("breaks the remaining time into days/hours/minutes/seconds before the event", () => {
		const target = new Date("2026-11-14T08:30:00+07:00").getTime();
		// 2 days, 3 hours, 4 minutes, 5 seconds before the event.
		const now = target - ((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000;
		vi.setSystemTime(new Date(now));

		expect(computeRemaining(target)).toEqual({
			days: 2,
			hours: 3,
			minutes: 4,
			seconds: 5,
		});
	});
});
