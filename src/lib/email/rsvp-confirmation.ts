import { sendInviteEmail } from "#/lib/email/send-invite";
import type { Locale } from "#/lib/schemas";
import type { getSupabaseAdminClient } from "#/lib/supabase/admin";

type AdminClient = ReturnType<typeof getSupabaseAdminClient>;

export interface RsvpConfirmationInput {
	guestId: string;
	inviteCode: string;
	guestName: string;
	/** Email the guest typed into the RSVP form (required when attending). */
	rsvpEmail: string;
	locale: Locale;
	origin: string;
}

/**
 * After an "attending" RSVP, emails a confirmation (details + check-in QR) to
 * the address the guest just entered — independent of whether or where the
 * admin sent the invitation. Sent once per guest (`confirmation_sent_at`).
 * Never throws: the RSVP is already saved, so a failed email is only recorded
 * on the guest row and the next attending RSVP tries again.
 */
export async function sendRsvpConfirmationOnce(
	admin: AdminClient,
	input: RsvpConfirmationInput,
): Promise<void> {
	const to = input.rsvpEmail.trim();
	if (!to) return;

	// Claim the send atomically so a double submit can't send twice: only the
	// request that flips `confirmation_sent_at` from null gets a row back.
	const { data: claimed, error: claimError } = await admin
		.from("guests")
		.update({
			confirmation_sent_at: new Date().toISOString(),
			confirmation_sent_to: to,
			confirmation_send_error: null,
		})
		.eq("id", input.guestId)
		.is("confirmation_sent_at", null)
		.select("id")
		.maybeSingle();

	if (claimError) {
		console.error("RSVP confirmation claim failed:", claimError.message);
		return;
	}
	if (!claimed) return;

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
		// Release the claim so the next attending RSVP can try again.
		await admin
			.from("guests")
			.update({
				confirmation_sent_at: null,
				confirmation_send_error: message.slice(0, 500),
			})
			.eq("id", input.guestId);
	}
}
