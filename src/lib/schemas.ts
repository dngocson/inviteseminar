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
export const maxAttendeesSchema = z.number().int().min(1).max(5);

export const guestCreateSchema = z.object({
	fullName: z.string().trim().min(1).max(200),
	maxAttendees: maxAttendeesSchema.default(5),
});
export type GuestCreateInput = z.infer<typeof guestCreateSchema>;

export const guestUpdateSchema = z.object({
	fullName: z.string().trim().min(1).max(200).optional(),
	maxAttendees: maxAttendeesSchema.optional(),
});
export type GuestUpdateInput = z.infer<typeof guestUpdateSchema>;

export const guestDto = z.object({
	id: z.uuid(),
	inviteCode: inviteCodeSchema,
	fullName: z.string(),
	maxAttendees: maxAttendeesSchema,
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
export type GuestDto = z.infer<typeof guestDto>;

// ---------------------------------------------------------------------------
// Public invitation lookup response — name + limit + existing RSVP only.
// ---------------------------------------------------------------------------
export const rsvpDto = z.object({
	responderName: z.string(),
	message: z.string().nullable(),
	attending: z.boolean(),
	attendeeCount: z.number().int().min(0).max(5),
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
// ---------------------------------------------------------------------------
export const rsvpSubmitSchema = z
	.object({
		code: inviteCodeSchema,
		responderName: z.string().trim().min(1).max(200),
		message: z.string().trim().max(1000).optional().default(""),
		attending: z.boolean(),
		attendeeCount: z.number().int().min(0).max(5).default(0),
	})
	.refine(
		(data) =>
			data.attending
				? data.attendeeCount >= 1 && data.attendeeCount <= 5
				: data.attendeeCount === 0,
		{
			message: "attendeeCount must be 0 when declining, 1-5 when attending",
			path: ["attendeeCount"],
		},
	);
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
