import { motion } from "motion/react";

import { m } from "#/paraglide/messages";

export function OutroSection({ organizer }: { organizer: string }) {
	return (
		<motion.section
			className="lab-safe-bottom px-6 py-16 text-center"
			initial={{ opacity: 0 }}
			whileInView={{ opacity: 1 }}
			viewport={{ once: true, margin: "-40px" }}
			transition={{ duration: 0.7 }}
		>
			<h2 className="display-title text-xl font-semibold text-(--carbon)">
				{m.outro_title()}
			</h2>
			<p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-(--carbon-soft)">
				{m.outro_body()}
			</p>
			<p className="mt-6 text-xs font-medium tracking-wide text-(--carbon-soft)">
				{m.outro_signature()}
				<br />
				{organizer}
			</p>
		</motion.section>
	);
}
