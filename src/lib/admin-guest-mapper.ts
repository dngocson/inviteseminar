import { buildInviteUrl } from "#/lib/invite-link";
import { mapRsvpRow, RSVP_COLUMNS, type RsvpRow } from "#/lib/rsvp-mapper";
import type { GuestWithRsvpDto, Locale } from "#/lib/schemas";

export const GUEST_WITH_RSVP_SELECT = `id, invite_code, full_name, max_attendees, locale, note, created_at, updated_at, rsvp:rsvps(${RSVP_COLUMNS})`;

interface GuestRow {
	id: string;
	invite_code: string;
	full_name: string;
	max_attendees: number;
	locale: Locale;
	note: string | null;
	created_at: string;
	updated_at: string;
	rsvp: RsvpRow | RsvpRow[] | null;
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
		rsvp: rsvpRow ? mapRsvpRow(rsvpRow) : null,
	};
}
