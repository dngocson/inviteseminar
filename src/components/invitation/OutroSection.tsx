import { motion } from "motion/react";

import { m } from "#/paraglide/messages";

export function OutroSection({ organizer }: { organizer: string }) {
	return (
		<motion.section
			className="invitation-outro lab-safe-bottom px-6 py-16 text-center"
			initial={{ opacity: 0 }}
			whileInView={{ opacity: 1 }}
			viewport={{ once: true, margin: "-40px" }}
			transition={{ duration: 0.7 }}
		>
			<h2 className="display-title text-2xl font-medium text-(--carbon)">
				{m.outro_title()}
			</h2>
			<p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-(--carbon-soft)">
				{m.outro_body()}
			</p>
			<p className="mt-7 text-xs leading-loose font-medium text-(--carbon-soft)">
				{m.outro_signature()}
				<br />
				{organizer}
			</p>
		</motion.section>
	);
}
