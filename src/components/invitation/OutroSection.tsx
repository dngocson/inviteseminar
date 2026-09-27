import { motion } from "motion/react";

import { m } from "#/paraglide/messages";

export function OutroSection({ organizer }: { organizer: string }) {
	return (
		<motion.section
			className="invitation-outro lab-safe-bottom relative isolate overflow-hidden px-4 py-8 text-center sm:px-8 sm:py-18"
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-40px" }}
			transition={{ duration: 0.8, ease: "easeOut" }}
		>
			<img
				src="/9.png"
				alt=""
				aria-hidden="true"
				className="absolute top-0 left-0 -z-20 h-full w-full object-fill xl:object-cover"
			/>

			<div className="absolute inset-0 -z-10 bg-black/20 backdrop-blur-[2px]" />

			<div className="relative mx-auto flex flex-col items-center">
				<div className="mb-5 h-px w-10 bg-(--carbon)/30 sm:mb-7 sm:w-12" />

				<h2
					className="
				display-title
				text-balance
				text-2xl
				leading-8
				font-medium
				tracking-tight
				bg-gradient-to-r
				from-[#fff8e7]
				via-[#d0daa7]
				to-[#f0b84b]
				bg-clip-text
				text-transparent
				sm:text-4xl
				sm:leading-12
			"
				>
					{m.outro_title()}
				</h2>

				<p
					className="
				mx-auto
				mt-4
				text-xs
				leading-6
				bg-gradient-to-r
				from-[#fff8e7]
				via-[#d0daa7]
				to-[#f0b84b]
				bg-clip-text
				text-transparent
				sm:mt-5
				sm:text-base
				sm:leading-8
			"
				>
					{m.outro_body()}
				</p>

				<div className="mt-6 h-px w-7 bg-(--carbon)/20 sm:mt-8 sm:w-8" />

				<p
					className="
				mt-5
				text-[11px]
				font-medium
				leading-6
				tracking-wide
				bg-gradient-to-r
				from-[#fff8e7]
				via-[#d0daa7]
				to-[#f0b84b]
				bg-clip-text
				text-transparent
				sm:mt-7
				sm:text-sm
				sm:leading-7
			"
				>
					{m.outro_signature()}
					<br />
					<span className="font-semibold">{organizer}</span>
				</p>
			</div>
		</motion.section>
	);
}
