import { sendInviteEmail } from "#/lib/email/send-invite";
import type { Locale } from "#/lib/schemas";
import type { getSupabaseAdminClient } from "#/lib/supabase/admin";

type AdminClient = ReturnType<typeof getSupabaseAdminClient>;

export interface RsvpConfirmationInput {
	guestId: string;
	inviteCode: string;
	guestName: string;
	/** Email the admin entered for the guest, if any. */
	guestEmail: string | null;
	/** Email the guest typed into the RSVP form, if any. */
	rsvpEmail: string;
	locale: Locale;
	origin: string;
}

/**
 * After an "attending" RSVP, emails the guest their details + check-in QR —
 * but only if they never received the invitation email (`invite_sent_at` is
 * null). Never throws: the RSVP is already saved, so a failed email is only
 * recorded on the guest row for the admin to see and retry.
 */
export async function sendRsvpConfirmationIfNeeded(
	admin: AdminClient,
	input: RsvpConfirmationInput,
): Promise<void> {
	const to = input.guestEmail || input.rsvpEmail;
	if (!to) return;

	// Claim the send atomically so a double submit can't send twice: only the
	// request that flips `invite_sent_at` from null gets a row back.
	const { data: claimed, error: claimError } = await admin
		.from("guests")
		.update({
			invite_sent_at: new Date().toISOString(),
			invite_send_error: null,
		})
		.eq("id", input.guestId)
		.is("invite_sent_at", null)
		.select("id")
		.maybeSingle();

	if (claimError || !claimed) return;

	try {
		await sendInviteEmail({
			kind: "confirmation",
			to,
			guestName: input.guestName,
			inviteCode: input.inviteCode,
			locale: input.locale,
			origin: input.origin,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error("RSVP confirmation email failed:", message);
		// Release the claim so the admin (or a later RSVP) can send it again.
		await admin
			.from("guests")
			.update({
				invite_sent_at: null,
				invite_send_error: message.slice(0, 500),
			})
			.eq("id", input.guestId);
	}
}
