import { buildInviteUrl } from "#/lib/invite-link";
import type { GuestWithRsvpDto } from "#/lib/schemas";

interface GuestRow {
	id: string;
	invite_code: string;
	full_name: string;
	max_attendees: number;
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
		createdAt: row.created_at,
		updatedAt: row.updated_at,
		inviteUrl: buildInviteUrl(origin, row.invite_code),
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
