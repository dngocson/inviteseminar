import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";

import { Countdown } from "#/components/invitation/Countdown";
import type { Locale } from "#/lib/schemas";
import { m } from "#/paraglide/messages";

interface ScheduleSectionProps {
	startsAt: string;
	venueName: string;
	venueAddress: string;
	mapUrl: string;
	locale: Locale;
}

export function ScheduleSection({
	startsAt,
	venueName,
	venueAddress,
	mapUrl,
	locale,
}: ScheduleSectionProps) {
	const date = new Date(startsAt);
	const dateFormatter = new Intl.DateTimeFormat(
		locale === "vi" ? "vi-VN" : "en-US",
		{
			weekday: "long",
			day: "2-digit",
			month: "long",
			year: "numeric",
			timeZone: "Asia/Ho_Chi_Minh",
		},
	);
	const timeFormatter = new Intl.DateTimeFormat(
		locale === "vi" ? "vi-VN" : "en-US",
		{
			hour: "2-digit",
			minute: "2-digit",
			timeZone: "Asia/Ho_Chi_Minh",
		},
	);

	return (
		<motion.section
			id="information"
			className="invitation-section min-w-0 px-6 py-12 sm:px-10 sm:py-16"
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-80px" }}
			transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
		>
			<p className="lab-kicker">{m.schedule_kicker()}</p>
			<h2 className="display-title mt-2 text-2xl font-semibold text-(--carbon)">
				{m.schedule_title()}
			</h2>

			<div className="mt-7">
				<dl className="schedule-facts grid grid-cols-1 gap-5 text-sm">
					<div className="flex justify-between gap-4">
						<dt className="font-medium text-(--carbon-soft)">
							{m.schedule_date_label()}
						</dt>
						<dd className="text-right font-semibold text-(--carbon)">
							{dateFormatter.format(date)}
						</dd>
					</div>
					<div className="flex justify-between gap-4">
						<dt className="font-medium text-(--carbon-soft)">
							{m.schedule_time_label()}
						</dt>
						<dd className="text-right font-semibold text-(--carbon)">
							{timeFormatter.format(date)}
						</dd>
					</div>
					<div className="flex justify-between gap-4">
						<dt className="font-medium text-(--carbon-soft)">
							{m.schedule_venue_label()}
						</dt>
						<dd className="text-right font-semibold text-(--carbon)">
							{venueName}
							<div className="mt-0.5 text-xs font-normal text-(--carbon-soft)">
								{venueAddress}
							</div>
						</dd>
					</div>
				</dl>

				<a
					href={mapUrl}
					target="_blank"
					rel="noreferrer"
					className="invitation-cta mt-7 inline-flex min-h-12 items-center justify-center gap-3 rounded-md bg-(--mineral-deep) px-6 text-sm font-semibold text-white transition-colors hover:bg-(--carbon)"
				>
					{m.schedule_map_cta()}
					<ArrowUpRight className="size-4" aria-hidden="true" />
				</a>
			</div>

			<div className="mt-10">
				<p className="mb-4 text-xs font-medium text-(--carbon-soft)">
					{m.countdown_title()}
				</p>
				<Countdown startsAt={startsAt} />
			</div>
		</motion.section>
	);
}
