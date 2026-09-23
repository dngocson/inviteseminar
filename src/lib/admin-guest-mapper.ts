import { buildInviteUrl } from "#/lib/invite-link";
import type { GuestWithRsvpDto, Locale } from "#/lib/schemas";

export const GUEST_WITH_RSVP_SELECT =
	"id, invite_code, full_name, max_attendees, locale, note, created_at, updated_at, rsvp:rsvps(responder_name, message, attending, attendee_count, updated_at)";

interface GuestRow {
	id: string;
	invite_code: string;
	full_name: string;
	max_attendees: number;
	locale: Locale;
	note: string | null;
	created_at: string;
	updated_at: string;
	rsvp:
		| {
				responder_name: string;
				message: string | null;
				attending: boolean;
				attendee_count: number;
				updated_at: string;
		  }
		| Array<{
				responder_name: string;
				message: string | null;
				attending: boolean;
				attendee_count: number;
				updated_at: string;
		  }>
		| null;
}

export function mapGuestRow(row: GuestRow, origin: string): GuestWithRsvpDto {
	const rsvpRow = Array.isArray(row.rsvp) ? (row.rsvp[0] ?? null) : row.rsvp;

	return {
		id: row.id,
		inviteCode: row.invite_code,
		fullName: row.full_name,
		maxAttendees: row.max_attendees,
		locale: row.locale,
		note: row.note,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
		inviteUrl: buildInviteUrl(origin, row.invite_code, row.locale),
		rsvp: rsvpRow
			? {
					responderName: rsvpRow.responder_name,
					message: rsvpRow.message,
					attending: rsvpRow.attending,
					attendeeCount: rsvpRow.attendee_count,
					updatedAt: rsvpRow.updated_at,
				}
			: null,
	};
}
