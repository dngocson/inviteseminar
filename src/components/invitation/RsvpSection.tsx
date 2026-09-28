import { motion } from "motion/react";

import { RsvpForm } from "#/components/invitation/RsvpForm";
import { useMessages } from "#/lib/locale";
import type { InvitationDto } from "#/lib/schemas";

export function RsvpSection({
	code,
	invitation,
}: {
	code: string;
	invitation: InvitationDto;
}) {
	const m = useMessages();
	return (
		<motion.section
			id="rsvp"
			className="invitation-rsvp mx-auto max-w-2xl px-6 py-14 sm:px-10 sm:py-20"
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-80px" }}
			transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
		>
			<p className="lab-kicker">{m.rsvp_kicker()}</p>
			<h2 className="display-title mt-2 mb-5 text-2xl font-semibold text-(--carbon)">
				{m.rsvp_title()}
			</h2>
			<RsvpForm code={code} invitation={invitation} />
		</motion.section>
	);
}
