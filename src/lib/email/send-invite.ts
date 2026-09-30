import QRCode from "qrcode";
import { Resend } from "resend";

import { env } from "#/env";
import { buildInviteEmail } from "#/lib/email/invite-email";
import type { Locale } from "#/lib/schemas";

const QR_CID = "invite-qr";
const LOGO_CID = "gobiotics-logo";

export class InviteEmailConfigError extends Error {}

export interface SendInviteInput {
	to: string;
	guestName: string;
	inviteCode: string;
	/** Language of the email copy, the card link and its QR code alike. */
	locale: Locale;
	/** Site origin: base of the invite link, and where the logo is fetched. */
	origin: string;
}

/**
 * Fetches the logo from our own static assets so it can be embedded inline.
 * Best effort: a missing logo falls back to a text wordmark in the email.
 */
async function fetchLogo(origin: string): Promise<Buffer | null> {
	try {
		const response = await fetch(new URL("/gobiotics.png", origin));
		if (!response.ok) return null;
		return Buffer.from(await response.arrayBuffer());
	} catch {
		return null;
	}
}

/** Sends the invitation email. Throws on configuration or delivery errors. */
export async function sendInviteEmail(input: SendInviteInput): Promise<string> {
	if (!env.RESEND_API_KEY || !env.INVITE_FROM_EMAIL) {
		throw new InviteEmailConfigError(
			"Chưa cấu hình RESEND_API_KEY / INVITE_FROM_EMAIL",
		);
	}

	const logoPng = await fetchLogo(input.origin);

	const email = buildInviteEmail({
		guestName: input.guestName,
		origin: input.origin,
		inviteCode: input.inviteCode,
		locale: input.locale,
		qrCid: QR_CID,
		logoCid: logoPng ? LOGO_CID : null,
	});

	// Encode the exact link the email uses, so the QR opens the same language.
	// 2× the rendered size so it stays crisp on retina screens.
	const qrPng = await QRCode.toBuffer(email.inviteUrl, {
		type: "png",
		width: 360,
		margin: 1,
		errorCorrectionLevel: "M",
		color: { dark: "#241f3d", light: "#ffffff" },
	});

	const resend = new Resend(env.RESEND_API_KEY);
	const { data, error } = await resend.emails.send({
		from: env.INVITE_FROM_EMAIL,
		to: input.to,
		replyTo: env.INVITE_REPLY_TO,
		subject: email.subject,
		html: email.html,
		text: email.text,
		attachments: [
			{ filename: "qr-code.png", content: qrPng, contentId: QR_CID },
			...(logoPng
				? [{ filename: "gobiotics.png", content: logoPng, contentId: LOGO_CID }]
				: []),
		],
	});

	if (error || !data) {
		throw new Error(error?.message ?? "Resend không phản hồi");
	}
	return data.id;
}
