import { Atom } from "lucide-react";
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
				<header className="invitation-header mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 py-5 sm:px-10">
					<a
						href="#event"
						className="flex min-w-0 max-w-72 items-center gap-3 text-(--mineral-deep)"
					>
						<Atom
							className="size-9 shrink-0"
							strokeWidth={1.25}
							aria-hidden="true"
						/>
						<span className="text-xs leading-relaxed font-semibold">
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
