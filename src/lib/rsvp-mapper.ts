import type { RsvpDto } from "#/lib/schemas";

/** `rsvps` columns every RSVP read selects; keep in sync with `RsvpRow`. */
export const RSVP_COLUMNS =
	"responder_name, company, job_title, phone, email, allergies, message, attending, attendee_count, updated_at";

export interface RsvpRow {
	responder_name: string;
	company: string | null;
	job_title: string | null;
	phone: string | null;
	email: string | null;
	allergies: string | null;
	message: string | null;
	attending: boolean;
	attendee_count: number;
	updated_at: string;
}

export function mapRsvpRow(row: RsvpRow): RsvpDto {
	return {
		responderName: row.responder_name,
		company: row.company,
		jobTitle: row.job_title,
		phone: row.phone,
		email: row.email,
		allergies: row.allergies,
		message: row.message,
		attending: row.attending,
		attendeeCount: row.attendee_count,
		updatedAt: row.updated_at,
	};
}
