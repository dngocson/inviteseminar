import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { z } from "zod";

import { HeroSection } from "#/components/invitation/HeroSection";
import { InvitationShell } from "#/components/invitation/InvitationShell";
import { InvitationStatusScreen } from "#/components/invitation/InvitationStatusScreen";
import { OutroSection } from "#/components/invitation/OutroSection";
import { RsvpSection } from "#/components/invitation/RsvpSection";
import { ScheduleSection } from "#/components/invitation/ScheduleSection";
import { TimelineSection } from "#/components/invitation/TimelineSection";
import { Button } from "#/components/ui/button";
import { eventConfig, localized } from "#/content/event";
import { useInvitationQuery } from "#/hooks/use-invitation";
import { ApiRequestError } from "#/lib/api-client";
import { LocaleProvider, useLocaleSync, useMessages } from "#/lib/locale";
import { invitationSearchSchema, inviteCodeSchema } from "#/lib/schemas";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/")({
	// Accept any `k` here so a malformed code shows the "invalid invite"
	// screen instead of a router error; the format is checked in Home.
	validateSearch: invitationSearchSchema.extend({
		k: z.string().optional(),
	}),

	head: ({ match }) => {
		const options = { locale: match.search.l };
		return {
			meta: [
				{ title: m.site_title({}, options) },
				{
					name: "description",
					content: m.site_description({}, options),
				},
			],
		};
	},

	component: Home,
});

function Home() {
	const { k: code, l: locale } = Route.useSearch();
	useLocaleSync(locale);

	return (
		<LocaleProvider locale={locale}>
			{!code ? (
				<EventContent locale={locale} />
			) : !inviteCodeSchema.safeParse(code).success ? (
				<InvalidInviteScreen locale={locale} />
			) : (
				<InvitationContent code={code} locale={locale} />
			)}
		</LocaleProvider>
	);
}

/**
 * Public view for links without an invite code:
 * the event itself, minus the RSVP.
 */
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

/** Wrong or unknown invite code: offer the public event page instead. */
function InvalidInviteScreen({ locale }: { locale: "vi" | "en" }) {
	const m = useMessages();
	return (
		<InvitationStatusScreen
			title={m.invite_invalid_title()}
			body={m.invite_invalid_body()}
			action={
				<Button variant="outline" asChild className="mt-6">
					<Link to="/" search={{ l: locale }}>
						<CalendarDays data-icon="inline-start" />
						{m.invite_view_event()}
					</Link>
				</Button>
			}
		/>
	);
}

function InvitationContent({
	code,
	locale,
}: {
	code: string;
	locale: "vi" | "en";
}) {
	const m = useMessages();
	const { data: invitation, isPending, error } = useInvitationQuery(code);

	if (isPending) {
		return <InvitationStatusScreen title={m.invite_loading()} body="" />;
	}

	if (error) {
		if (error instanceof ApiRequestError && error.code === "NOT_FOUND") {
			return <InvalidInviteScreen locale={locale} />;
		}

		return (
			<InvitationStatusScreen
				title={m.invite_error_title()}
				body={m.invite_error_body()}
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
