import { motion } from "motion/react";
import type { TimelineItem } from "#/content/event";
import { localized } from "#/content/event";
import type { Locale } from "#/lib/schemas";
import { m } from "#/paraglide/messages";

export function TimelineSection({
	items,
	locale,
}: {
	items: TimelineItem[];
	locale: Locale;
}) {
	return (
		<section className="px-6 py-14">
			<p className="lab-kicker">{m.timeline_kicker()}</p>
			<h2 className="display-title mt-2 text-2xl font-semibold text-(--carbon)">
				{m.timeline_title()}
			</h2>

			<ol className="mt-6 space-y-5 border-l border-(--lab-line) pl-5">
				{items.map((item, index) => (
					<motion.li
						key={item.time}
						className="relative"
						initial={{ opacity: 0, x: -12 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{
							duration: 0.5,
							delay: index * 0.05,
							ease: [0.16, 1, 0.3, 1],
						}}
					>
						<span className="absolute top-1 -left-[27px] h-3 w-3 rounded-full bg-(--mineral)" />
						<p className="text-xs font-semibold tracking-wide text-(--mineral-deep)">
							{item.time}
						</p>
						<p className="mt-0.5 text-sm font-semibold text-(--carbon)">
							{localized(item.title, locale)}
						</p>
						<p className="mt-0.5 text-xs leading-relaxed text-(--carbon-soft)">
							{localized(item.description, locale)}
						</p>
					</motion.li>
				))}
			</ol>
		</section>
	);
}
