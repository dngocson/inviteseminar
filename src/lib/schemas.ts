import { z } from "zod";

import { INVITE_CODE_LENGTH } from "#/lib/invite-code";

// ---------------------------------------------------------------------------
// Locale + invitation URL search params: canonical `/?k=<8-char>&l=<vi|en>`.
// Missing `l` defaults to `vi`; the legacy double-`?` syntax is not supported.
// ---------------------------------------------------------------------------
export const localeSchema = z.enum(["vi", "en"]);
export type Locale = z.infer<typeof localeSchema>;

export const inviteCodeSchema = z
	.string()
	.length(INVITE_CODE_LENGTH)
	.regex(/^[0-9A-Za-z]+$/);

export const invitationSearchSchema = z.object({
	k: inviteCodeSchema.optional(),
	l: localeSchema.optional().default("vi"),
});
export type InvitationSearch = z.infer<typeof invitationSearchSchema>;

// ---------------------------------------------------------------------------
// Guest CRUD (admin)
// ---------------------------------------------------------------------------
export const maxAttendeesSchema = z.number().int().min(1).max(10);

// Internal admin note about a guest — never surfaced on the invitation card.
export const guestNoteSchema = z.string().trim().max(1000);

// Where the invitation email is sent. Empty string = no email on file.
export const guestEmailSchema = z.union([
	z.literal(""),
	z.string().trim().pipe(z.email()),
]);

export const guestCreateSchema = z.object({
	fullName: z.string().trim().min(1).max(200),
	maxAttendees: maxAttendeesSchema.default(5),
	// The invitation card's display language. Purely a default for the link
	// the admin generates (`&l=vi|en`) — the guest can still switch language
	// on the card itself; this just picks which one they land on.
	locale: localeSchema.default("vi"),
	note: guestNoteSchema.optional().default(""),
	email: guestEmailSchema.optional().default(""),
});
// Request body shape: fields with a schema default (e.g. maxAttendees) may be omitted.
export type GuestCreateInput = z.input<typeof guestCreateSchema>;

export const guestUpdateSchema = z.object({
	fullName: z.string().trim().min(1).max(200).optional(),
	maxAttendees: maxAttendeesSchema.optional(),
	locale: localeSchema.optional(),
	note: guestNoteSchema.optional(),
	email: guestEmailSchema.optional(),
});
export type GuestUpdateInput = z.infer<typeof guestUpdateSchema>;

export const guestDto = z.object({
	id: z.uuid(),
	inviteCode: inviteCodeSchema,
	fullName: z.string(),
	maxAttendees: maxAttendeesSchema,
	locale: localeSchema,
	note: z.string().nullable(),
	// Invitation email: set by the admin, sent from the dashboard.
	email: z.string().nullable(),
	inviteSentAt: z.iso.datetime().nullable(),
	inviteSendError: z.string().nullable(),
	inviteSentTo: z.string().nullable(),
	// RSVP confirmation email: sent once, automatically, to the RSVP email.
	confirmationSentAt: z.iso.datetime().nullable(),
	confirmationSentTo: z.string().nullable(),
	confirmationSendError: z.string().nullable(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
export type GuestDto = z.infer<typeof guestDto>;

// ---------------------------------------------------------------------------
// Public invitation lookup response — name + limit + existing RSVP only.
// ---------------------------------------------------------------------------
export const rsvpDto = z.object({
	responderName: z.string(),
	company: z.string().nullable(),
	jobTitle: z.string().nullable(),
	phone: z.string().nullable(),
	email: z.string().nullable(),
	allergies: z.string().nullable(),
	message: z.string().nullable(),
	attending: z.boolean(),
	attendeeCount: z.number().int().min(0).max(10),
	updatedAt: z.iso.datetime(),
});
export type RsvpDto = z.infer<typeof rsvpDto>;

export const invitationDto = z.object({
	fullName: z.string(),
	maxAttendees: maxAttendeesSchema,
	rsvp: rsvpDto.nullable(),
});
export type InvitationDto = z.infer<typeof invitationDto>;

// ---------------------------------------------------------------------------
// RSVP submission (public). `attending: false` forces attendeeCount to 0.
// Contact fields are optional; an empty string means "not provided".
// ---------------------------------------------------------------------------
// Digits with the usual separators, optionally a leading `+`.
export const PHONE_PATTERN = /^\+?[0-9(][0-9 ().-]{5,19}$/;

const optionalText = (max: number) =>
	z.string().trim().max(max).optional().default("");

export const rsvpSubmitSchema = z
	.object({
		code: inviteCodeSchema,
		// Language the guest is viewing the card in; picks the confirmation
		// email's language. Falls back to the guest's saved locale.
		locale: localeSchema.optional(),
		responderName: z.string().trim().min(1).max(200),
		company: optionalText(200),
		jobTitle: optionalText(200),
		phone: z
			.string()
			.trim()
			.refine((value) => value === "" || PHONE_PATTERN.test(value), {
				message: "Số điện thoại không hợp lệ",
			})
			.optional()
			.default(""),
		email: z
			.union([z.literal(""), z.email({ message: "Email không hợp lệ" })])
			.optional()
			.default(""),
		allergies: optionalText(1000),
		message: z.string().trim().max(1000).optional().default(""),
		attending: z.boolean(),
		attendeeCount: z.number().int().min(0).max(10).default(0),
	})
	.refine(
		(data) =>
			data.attending
				? data.attendeeCount >= 1 && data.attendeeCount <= 10
				: data.attendeeCount === 0,
		{
			message: "attendeeCount must be 0 when declining, 1-10 when attending",
			path: ["attendeeCount"],
		},
	)
	// Attending guests must leave their contact details (the form enforces
	// this too; this is the server-side guarantee).
	.superRefine((data, ctx) => {
		if (!data.attending) return;
		const required = [
			["company", "Vui lòng nhập tên công ty"],
			["jobTitle", "Vui lòng nhập vị trí hiện tại"],
			["phone", "Vui lòng nhập số điện thoại"],
			["email", "Vui lòng nhập email"],
		] as const;
		for (const [key, message] of required) {
			if (!data[key]) ctx.addIssue({ code: "custom", message, path: [key] });
		}
	});
export type RsvpSubmitInput = z.infer<typeof rsvpSubmitSchema>;

// ---------------------------------------------------------------------------
// Admin auth
// ---------------------------------------------------------------------------
export const loginSchema = z.object({
	email: z.email(),
	password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Admin RSVP list row + stats
// ---------------------------------------------------------------------------
export const guestWithRsvpDto = guestDto.extend({
	rsvp: rsvpDto.nullable(),
	inviteUrl: z.string(),
});
export type GuestWithRsvpDto = z.infer<typeof guestWithRsvpDto>;

export const rsvpStatsDto = z.object({
	totalGuests: z.number().int().min(0),
	responded: z.number().int().min(0),
	attending: z.number().int().min(0),
	declined: z.number().int().min(0),
	pending: z.number().int().min(0),
	totalAttendees: z.number().int().min(0),
});
export type RsvpStatsDto = z.infer<typeof rsvpStatsDto>;

// ---------------------------------------------------------------------------
// Stable API error shape
// ---------------------------------------------------------------------------
export const apiErrorCodes = [
	"NOT_FOUND",
	"VALIDATION_ERROR",
	"RATE_LIMITED",
	"UNAUTHENTICATED",
	"FORBIDDEN",
	"CONFLICT",
	"INTERNAL_ERROR",
] as const;
export type ApiErrorCode = (typeof apiErrorCodes)[number];

export interface ApiErrorBody {
	error: {
		code: ApiErrorCode;
		message: string;
	};
}
