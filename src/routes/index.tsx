import { createFileRoute } from "@tanstack/react-router";

import { HeroSection } from "#/components/invitation/HeroSection";
import { InvitationShell } from "#/components/invitation/InvitationShell";
import { InvitationStatusScreen } from "#/components/invitation/InvitationStatusScreen";
import { OutroSection } from "#/components/invitation/OutroSection";
import { RsvpSection } from "#/components/invitation/RsvpSection";
import { ScheduleSection } from "#/components/invitation/ScheduleSection";
import { TimelineSection } from "#/components/invitation/TimelineSection";
import { eventConfig, localized } from "#/content/event";
import { useInvitationQuery } from "#/hooks/use-invitation";
import { ApiRequestError } from "#/lib/api-client";
import { useLocaleSync } from "#/lib/locale";
import { invitationSearchSchema } from "#/lib/schemas";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/")({
	validateSearch: invitationSearchSchema,
	head: () => ({
		meta: [
			{ title: m.site_title() },
			{ name: "description", content: m.site_description() },
		],
	}),
	component: Home,
});

function Home() {
	const { k: code, l: locale } = Route.useSearch();
	useLocaleSync(locale);

	if (!code) {
		return <EventContent locale={locale} />;
	}

	return <InvitationContent code={code} locale={locale} />;
}

/** Public view for links without an invite code: the event itself, minus the RSVP. */
function EventContent({ locale }: { locale: "vi" | "en" }) {
	const organizer = localized(eventConfig.organizer, locale);

	return (
		<InvitationShell locale={locale}>
			<HeroSection
				seminarName={localized(eventConfig.seminarName, locale)}
				organizer={organizer}
			/>
			<EventDetails locale={locale} />
			<OutroSection organizer={organizer} />
		</InvitationShell>
	);
}

function EventDetails({ locale }: { locale: "vi" | "en" }) {
	return (
		<div className="invitation-details mx-auto grid max-w-6xl lg:grid-cols-2">
			<ScheduleSection
				startsAt={eventConfig.startsAt}
				venueName={localized(eventConfig.venue.name, locale)}
				venueAddress={localized(eventConfig.venue.address, locale)}
				mapUrl={eventConfig.venue.mapUrl}
				locale={locale}
			/>
			<TimelineSection items={[...eventConfig.timeline]} locale={locale} />
		</div>
	);
}

function InvitationContent({
	code,
	locale,
}: {
	code: string;
	locale: "vi" | "en";
}) {
	const { data: invitation, isPending, error } = useInvitationQuery(code);

	if (isPending) {
		return <InvitationStatusScreen title={m.invite_loading()} body="" />;
	}

	if (error) {
		const isNotFound =
			error instanceof ApiRequestError && error.code === "NOT_FOUND";
		return (
			<InvitationStatusScreen
				title={isNotFound ? m.invite_invalid_title() : m.invite_error_title()}
				body={isNotFound ? m.invite_invalid_body() : m.invite_error_body()}
			/>
		);
	}

	const seminarName = localized(eventConfig.seminarName, locale);
	const organizer = localized(eventConfig.organizer, locale);

	return (
		<InvitationShell locale={locale} hasRsvp>
			<HeroSection
				fullName={invitation.fullName}
				seminarName={seminarName}
				organizer={organizer}
			/>
			<EventDetails locale={locale} />
			<RsvpSection code={code} invitation={invitation} />
			<OutroSection organizer={organizer} />
		</InvitationShell>
	);
}
