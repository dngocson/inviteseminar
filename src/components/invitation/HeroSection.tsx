import { ArrowDown, CalendarDays } from "lucide-react";
import { motion } from "motion/react";

import { MoleculeScene } from "#/components/invitation/MoleculeScene";
import { eventConfig } from "#/content/event";
import { m } from "#/paraglide/messages";
import { getLocale } from "#/paraglide/runtime";

interface HeroSectionProps {
	/** Omitted on the public (no invite code) page: the event name becomes the heading. */
	fullName?: string;
	seminarName: string;
	organizer: string;
}

export function HeroSection({
	fullName,
	seminarName,
	organizer,
}: HeroSectionProps) {
	const dateLabel = new Intl.DateTimeFormat(
		getLocale() === "vi" ? "vi-VN" : "en-US",
		{
			day: "2-digit",
			month: "long",
			year: "numeric",
			timeZone: eventConfig.timezone,
		},
	).format(new Date(eventConfig.startsAt));

	return (
		<section
			id="event"
			className="invitation-hero relative isolate flex flex-col justify-center overflow-hidden px-6 pb-10 sm:px-10 sm:pb-14"
		>
			<div
				className="hero-molecule absolute inset-x-0 top-0"
				aria-hidden="true"
			>
				<MoleculeScene />
			</div>
			<div className="mx-auto w-full max-w-7xl">
				<motion.div
					className="hero-copy relative z-10"
					initial={{ opacity: 0, y: 24 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
				>
					<p className="mb-6 flex items-center gap-2 text-xs font-semibold text-(--mineral-deep)">
						<CalendarDays className="size-4" aria-hidden="true" />
						<time dateTime={eventConfig.startsAt}>{dateLabel}</time>
					</p>
					<p className="lab-kicker">{m.hero_kicker()}</p>
					<h1 className="display-title hero-title mt-4 text-(--carbon)">
						{seminarName}
					</h1>
					{fullName && (
						<p className="display-title mt-5 text-xl text-(--mineral-deep)">
							{m.hero_greeting({ fullName })}
						</p>
					)}
					<p className="mt-5 max-w-lg text-sm leading-relaxed text-(--carbon-soft)">
						{m.hero_subtitle()}
					</p>
					<a
						href={fullName ? "#rsvp" : "#information"}
						className="invitation-cta mt-7 inline-flex min-h-12 items-center justify-center gap-3 rounded-md bg-(--mineral-deep) px-5 text-sm font-semibold text-white hover:bg-(--carbon)"
					>
						{fullName ? m.rsvp_title() : m.schedule_title()}
						<ArrowDown className="size-4" aria-hidden="true" />
					</a>
					<p className="sr-only">{organizer}</p>
				</motion.div>
			</div>
		</section>
	);
}
