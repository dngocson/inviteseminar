import { useEffect, useState } from "react";

import { m } from "#/paraglide/messages";

export interface Remaining {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
}

export function computeRemaining(targetMs: number): Remaining | null {
	const diff = targetMs - Date.now();
	if (diff <= 0) return null;

	return {
		days: Math.floor(diff / (1000 * 60 * 60 * 24)),
		hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
		minutes: Math.floor((diff / (1000 * 60)) % 60),
		seconds: Math.floor((diff / 1000) % 60),
	};
}

function pad(value: number): string {
	return value.toString().padStart(2, "0");
}

export function Countdown({ startsAt }: { startsAt: string }) {
	const targetMs = new Date(startsAt).getTime();
	// `null` until the first client effect runs, so SSR and the first client
	// render both show the same "loading" shape — no hydration mismatch from
	// a value that depends on the visitor's clock.
	const [remaining, setRemaining] = useState<Remaining | null | "started">(
		null,
	);

	useEffect(() => {
		const tick = () => {
			const next = computeRemaining(targetMs);
			setRemaining(next ?? "started");
		};
		tick();
		const interval = setInterval(tick, 1000);
		return () => clearInterval(interval);
	}, [targetMs]);

	if (remaining === "started") {
		return (
			<p className="text-center text-sm font-semibold text-(--mineral-deep)">
				{m.countdown_started()}
			</p>
		);
	}

	const units: Array<{ label: string; value: number }> = [
		{ label: m.countdown_days(), value: remaining?.days ?? 0 },
		{ label: m.countdown_hours(), value: remaining?.hours ?? 0 },
		{ label: m.countdown_minutes(), value: remaining?.minutes ?? 0 },
		{ label: m.countdown_seconds(), value: remaining?.seconds ?? 0 },
	];

	return (
		<div
			className="grid grid-cols-4 divide-x divide-(--lab-line)"
			aria-live="polite"
			aria-atomic="true"
		>
			{units.map((unit) => (
				<div key={unit.label} className="min-w-0 px-1 py-2 text-center">
					<div className="display-title text-3xl font-medium tabular-nums text-(--carbon)">
						{remaining ? pad(unit.value) : "--"}
					</div>
					<div className="mt-2 text-xs font-medium text-(--carbon-soft)">
						{unit.label}
					</div>
				</div>
			))}
		</div>
	);
}
