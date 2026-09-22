import { createFileRoute } from "@tanstack/react-router";

import {
	ApiError,
	apiJsonResponse,
	withApiErrorHandling,
} from "#/lib/api-response";
import { checkRateLimit, getClientIp } from "#/lib/rate-limit";
import type { RsvpDto } from "#/lib/schemas";
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
	const { code, responderName, message, attending, attendeeCount } =
		parsed.data;

	const admin = getSupabaseAdminClient();
	// `guest_id` always comes from this server-side lookup by invite code —
	// the client never gets to supply it directly.
	const { data: guest, error: guestError } = await admin
		.from("guests")
		.select("id, max_attendees")
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
				message: message || null,
				attending,
				attendee_count: attending ? attendeeCount : 0,
			},
			{ onConflict: "guest_id" },
		)
		.select("responder_name, message, attending, attendee_count, updated_at")
		.single();

	if (error || !saved) {
		throw new ApiError("INTERNAL_ERROR", "Không thể lưu phản hồi");
	}

	const body: RsvpDto = {
		responderName: saved.responder_name,
		message: saved.message,
		attending: saved.attending,
		attendeeCount: saved.attendee_count,
		updatedAt: saved.updated_at,
	};

	return apiJsonResponse(body);
}

export const Route = createFileRoute("/api/rsvp")({
	server: {
		handlers: {
			POST: withApiErrorHandling(handleSubmit),
			PUT: withApiErrorHandling(handleSubmit),
		},
	},
});
