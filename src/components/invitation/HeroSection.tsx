/** biome-ignore-all lint/security/noDangerouslySetInnerHtml: <explanation> */
import { ArrowDown, CalendarDays } from "lucide-react";
import { motion } from "motion/react";

import { eventConfig } from "#/content/event";
import { m } from "#/paraglide/messages";
import { getLocale } from "#/paraglide/runtime";

interface HeroSectionProps {
	/** Omitted on the public (no invite code) page: the event name becomes the heading. */
	fullName?: string;
	seminarName: string;
	organizer: string;
}

// Stagger container: các con lần lượt xuất hiện theo thứ tự khai báo
const container = {
	hidden: {},
	show: {
		transition: {
			staggerChildren: 0.12,
			delayChildren: 0.1,
		},
	},
};

// Từng dòng chữ fade + slide lên nhẹ
const item = {
	hidden: { opacity: 0, y: 18 },
	show: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.7,
			ease: [0.16, 1, 0.3, 1] as const,
		},
	},
};

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
			<img
				src="/8.png"
				alt=""
				aria-hidden="true"
				className="absolute inset-0 h-full w-full object-cover object-center"
			/>
			{/* Lớp phủ tối nhẹ để chữ luôn nổi trên ảnh nền */}
			<div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1a1530]/40 via-[#1a1530]/10 to-[#1a1530]/50" />
			<div className="relative z-10 mx-auto w-full max-w-7xl">
				<motion.div
					className="hero-copy mx-auto w-full text-center"
					variants={container}
					initial="hidden"
					animate="show"
				>
					<motion.p
						variants={item}
						className="mb-6 flex items-center justify-center gap-2 text-center text-xs font-semibold tracking-wide text-[#cdd3ea]"
					>
						<CalendarDays className="size-4" aria-hidden="true" />
						<time dateTime={eventConfig.startsAt}>{dateLabel}</time>
					</motion.p>

					<motion.p
						variants={item}
						className="bg-gradient-to-r from-[#fff8e7] via-[#d0daa7] to-[#f0b84b] bg-clip-text text-center text-lg text-transparent sm:text-xl sm:leading-relaxed"
					>
						{m.hero_kicker()}
					</motion.p>

					<motion.h1
						variants={item}
						className="display-title hero-title mt-3 bg-gradient-to-r from-[#fff9e8] via-[#ffe08a] to-[#f4b942] bg-clip-text text-center text-transparent"
						dangerouslySetInnerHTML={{
							__html: seminarName,
						}}
					></motion.h1>

					{fullName && (
						<motion.p
							variants={item}
							className="display-title mt-5 text-center text-xl text-[#dfe3f3]"
						>
							{m.hero_greeting({ fullName })}
						</motion.p>
					)}

					<motion.div
						variants={item}
						className="mx-auto mt-7 flex w-full max-w-xs items-center justify-center gap-3"
					>
						<span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#d9a75c]/70" />
						<span className="size-1.5 shrink-0 rounded-full bg-[#d9a75c]" />
						<span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#d9a75c]/70" />
					</motion.div>

					<motion.p
						variants={item}
						className="mx-auto mt-6 max-w-lg text-center text-sm leading-relaxed text-[#b7bcd6]"
					>
						{m.hero_subtitle()}
					</motion.p>

					<motion.div variants={item} className="flex justify-center">
						<a
							href={fullName ? "#rsvp" : "#information"}
							className="invitation-cta mt-7 inline-flex min-h-12 items-center justify-center gap-3 rounded-md bg-[#d9a75c] px-5 text-sm font-semibold text-[#1a1530] transition-colors hover:bg-[#e7c88f]"
						>
							{fullName ? m.rsvp_title() : m.schedule_title()}
							<ArrowDown className="size-4" aria-hidden="true" />
						</a>
					</motion.div>

					<p className="sr-only">{organizer}</p>
				</motion.div>
			</div>
		</section>
	);
}
