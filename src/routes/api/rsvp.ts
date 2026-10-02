import { createFileRoute } from "@tanstack/react-router";

import {
	ApiError,
	apiJsonResponse,
	withApiErrorHandling,
} from "#/lib/api-response";
import { sendRsvpConfirmationOnce } from "#/lib/email/rsvp-confirmation";
import { checkRateLimit, getClientIp } from "#/lib/rate-limit";
import { mapRsvpRow, RSVP_COLUMNS } from "#/lib/rsvp-mapper";
import { rsvpSubmitSchema } from "#/lib/schemas";
import { getSupabaseAdminClient } from "#/lib/supabase/admin";

async function handleSubmit(request: Request): Promise<Response> {
	const rateLimitKey = `rsvp-submit:${getClientIp(request)}`;
	if (!checkRateLimit(rateLimitKey, { limit: 10, windowMs: 60_000 })) {
		throw new ApiError(
			"RATE_LIMITED",
			"Quá nhiều yêu cầu, vui lòng thử lại sau",
		);
	}

	const json = await request.json().catch(() => null);
	const parsed = rsvpSubmitSchema.safeParse(json);
	if (!parsed.success) {
		throw new ApiError(
			"VALIDATION_ERROR",
			parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
		);
	}
	const {
		code,
		locale,
		responderName,
		company,
		jobTitle,
		phone,
		email,
		allergies,
		message,
		attending,
		attendeeCount,
	} = parsed.data;

	const admin = getSupabaseAdminClient();
	// `guest_id` always comes from this server-side lookup by invite code —
	// the client never gets to supply it directly.
	const { data: guest, error: guestError } = await admin
		.from("guests")
		.select("id, invite_code, full_name, locale, max_attendees")
		.eq("invite_code", code)
		.maybeSingle();

	if (guestError) {
		throw new ApiError("INTERNAL_ERROR", "Không thể tra cứu lời mời");
	}
	if (!guest) {
		throw new ApiError("NOT_FOUND", "Không tìm thấy lời mời");
	}

	if (attending && attendeeCount > guest.max_attendees) {
		throw new ApiError(
			"VALIDATION_ERROR",
			`Số người tham dự vượt quá giới hạn (${guest.max_attendees})`,
		);
	}

	const { data: saved, error } = await admin
		.from("rsvps")
		.upsert(
			{
				guest_id: guest.id,
				responder_name: responderName,
				company: company || null,
				job_title: jobTitle || null,
				phone: phone || null,
				email: email || null,
				allergies: allergies || null,
				message: message || null,
				attending,
				attendee_count: attending ? attendeeCount : 0,
			},
			{ onConflict: "guest_id" },
		)
		.select(RSVP_COLUMNS)
		.single();

	if (error || !saved) {
		throw new ApiError("INTERNAL_ERROR", "Không thể lưu phản hồi");
	}

	if (attending) {
		// Awaited (not fire-and-forget) so serverless hosts don't freeze the
		// function mid-send; it never throws, so the RSVP response is unaffected.
		await sendRsvpConfirmationOnce(admin, {
			guestId: guest.id,
			inviteCode: guest.invite_code,
			guestName: guest.full_name,
			rsvpEmail: email,
			locale: locale ?? guest.locale,
			origin: new URL(request.url).origin,
		});
	}

	return apiJsonResponse(mapRsvpRow(saved));
}

export const Route = createFileRoute("/api/rsvp")({
	server: {
		handlers: {
			POST: withApiErrorHandling(handleSubmit),
			PUT: withApiErrorHandling(handleSubmit),
		},
	},
});
