import { motion } from "motion/react";

import { MoleculeScene } from "#/components/invitation/MoleculeScene";
import { m } from "#/paraglide/messages";

interface HeroSectionProps {
	fullName: string;
	seminarName: string;
	organizer: string;
}

export function HeroSection({
	fullName,
	seminarName,
	organizer,
}: HeroSectionProps) {
	return (
		<section className="lab-safe-top relative flex min-h-[92dvh] flex-col justify-end overflow-hidden px-6 pb-10">
			<MoleculeScene />
			<div
				aria-hidden="true"
				className="absolute inset-0"
				style={{
					background:
						"linear-gradient(180deg, rgba(251,250,246,0) 0%, rgba(251,250,246,0.55) 62%, rgba(251,250,246,0.96) 100%)",
				}}
			/>
			<motion.div
				className="relative z-10"
				initial={{ opacity: 0, y: 24 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
			>
				<p className="lab-kicker">{m.hero_kicker()}</p>
				<h1 className="display-title mt-3 text-3xl leading-tight font-semibold text-(--carbon)">
					{m.hero_greeting({ fullName })}
				</h1>
				<p className="display-title mt-2 text-lg text-(--mineral-deep)">
					{seminarName}
				</p>
				<p className="mt-3 max-w-xs text-sm leading-relaxed text-(--carbon-soft)">
					{m.hero_subtitle()}
				</p>
				<p className="mt-4 text-xs font-medium tracking-wide text-(--carbon-soft)">
					{organizer}
				</p>
			</motion.div>
		</section>
	);
}
