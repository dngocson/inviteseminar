import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { LanguageToggle } from "#/components/invitation/LanguageToggle";
import { eventConfig, localized } from "#/content/event";
import type { Locale } from "#/lib/schemas";
import { m } from "#/paraglide/messages";
export function InvitationShell({
	locale,
	children,
	hasRsvp = false,
}: {
	locale: Locale;
	children: ReactNode;
	hasRsvp?: boolean;
}) {
	return (
		<MotionConfig reducedMotion="user">
			<div className="lab-theme invitation-shell relative min-h-dvh w-full">
				<header className="invitation-header mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-5 sm:px-10 sm:py-5">
					<a
						href="#event"
						className="flex min-w-0 max-w-96 items-center gap-2.5 text-(--mineral-deep) sm:gap-3"
					>
						<div className="flex shrink-0 flex-col border-r-2 border-(--mineral-deep) pr-2.5 sm:pr-3">
							<p className="text-[16px] font-extrabold leading-tight text-[#0E50A4] sm:text-[20px]">
								Dermatech
							</p>
							<span className="self-end text-[9px] leading-tight text-[#27AAD4] sm:text-[12px]">
								Vietnam
							</span>
						</div>
						<span className="line-clamp-2 text-[10px] font-semibold leading-snug sm:text-xs sm:leading-relaxed">
							{localized(eventConfig.organizer, locale)}
						</span>
					</a>
					<nav
						className="hidden items-center gap-7 text-xs font-medium text-(--carbon-soft) lg:flex"
						aria-label={m.site_title()}
					>
						<a href="#information">{m.schedule_title()}</a>
						<a href="#program">{m.timeline_title()}</a>
						{hasRsvp && <a href="#rsvp">{m.rsvp_title()}</a>}
					</nav>
					<LanguageToggle locale={locale} />
				</header>
				{children}
			</div>
		</MotionConfig>
	);
}
