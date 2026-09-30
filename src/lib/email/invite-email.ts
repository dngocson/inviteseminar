import { eventConfig, localized } from "#/content/event";
import { buildInviteUrl } from "#/lib/invite-link";
import type { Locale } from "#/lib/schemas";

/**
 * Invitation email template (HTML + plain text), bilingual via `locale`.
 *
 * Email clients are not browsers: layout is table-based with inline styles
 * (no flexbox or external CSS), widths are fixed at 600px with a fluid
 * fallback, and images are referenced by `cid:` so they show up without the
 * client fetching anything from our server. The one <style> block only
 * tightens spacing on phones; clients that strip it still get a usable layout.
 */

export interface InviteEmailInput {
	guestName: string;
	/** Site origin + invite code; the link is built here with `locale` so the
	 *  email copy and the invitation card it opens always share a language. */
	origin: string;
	inviteCode: string;
	locale: Locale;
	/** `contentId` of the inline QR code PNG attachment. */
	qrCid: string;
	/** `contentId` of the inline Gobiotics logo, or null to render text only. */
	logoCid: string | null;
}

export interface InviteEmail {
	subject: string;
	html: string;
	text: string;
	/** The card link used in the email (and to be encoded in its QR code). */
	inviteUrl: string;
}

const COLORS = {
	page: "#f1eff7",
	header: "#2a2350",
	headerSoft: "#3b3270",
	card: "#ffffff",
	ink: "#241f3d",
	muted: "#6b6784",
	line: "#e6e3f0",
	gold: "#d9a75c",
	goldDeep: "#b98636",
	panel: "#f7f5fc",
};

const FONT =
	"'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif";

const COPY = {
	vi: {
		subjectPrefix: "Thư mời tham dự Hội thảo",
		preheader:
			"Trân trọng kính mời Anh/Chị tham dự hội thảo. Vui lòng xác nhận tham dự qua đường dẫn trong thư.",
		kicker: "THƯ MỜI",
		greeting: (name: string) => `Kính gửi ${name},`,
		intro:
			"Công ty TNHH Dermatech Việt Nam trân trọng kính mời Anh/Chị đến tham dự hội thảo chuyên đề cùng các chuyên gia đến từ Sweetch Holding.",
		dateLabel: "Thời gian",
		venueLabel: "Địa điểm",
		mapCta: "Xem bản đồ",
		cta: "Xem thiệp mời & xác nhận tham dự",
		qrTitle: "Mã QR của Anh/Chị",
		qrBody:
			"Quét mã để mở thiệp mời trên điện thoại. Vui lòng mang theo mã này khi đến check-in tại sự kiện.",
		agendaTitle: "Chương trình",
		fallback: "Nếu nút không hoạt động, vui lòng mở đường dẫn sau:",
		closing: "Rất mong được đón tiếp Anh/Chị.",
		signature: "Trân trọng,",
		footer:
			"Thư mời này dành riêng cho Anh/Chị. Vui lòng không chuyển tiếp đường dẫn cho người khác.",
	},
	en: {
		subjectPrefix: "Invitation to the Seminar",
		preheader:
			"You are cordially invited to our seminar. Please confirm your attendance using the link inside.",
		kicker: "INVITATION",
		greeting: (name: string) => `Dear ${name},`,
		intro:
			"Dermatech Viet Nam Company Limited is delighted to invite you to an exclusive seminar featuring experts from Sweetch Holding.",
		dateLabel: "Date & time",
		venueLabel: "Venue",
		mapCta: "View map",
		cta: "View invitation & RSVP",
		qrTitle: "Your personal QR code",
		qrBody:
			"Scan to open your invitation on your phone. Please bring this code for check-in at the event.",
		agendaTitle: "Programme",
		fallback: "If the button doesn't work, open this link:",
		closing: "We look forward to welcoming you.",
		signature: "Kind regards,",
		footer:
			"This invitation is personal to you. Please do not forward the link to others.",
	},
} satisfies Record<Locale, unknown>;

export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

/** `seminarName` in the event config is markup for the web hero; flatten it. */
function seminarTitle(locale: Locale): string {
	return localized(eventConfig.seminarName, locale)
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

/** Subject line; also shown in the admin "send invite" dialog as a preview. */
export function inviteEmailSubject(locale: Locale): string {
	return `${COPY[locale].subjectPrefix}: ${seminarTitle(locale)}`;
}

export function formatEventSchedule(locale: Locale): {
	date: string;
	time: string;
} {
	const intlLocale = locale === "vi" ? "vi-VN" : "en-US";
	const timeZone = eventConfig.timezone;
	const date = new Intl.DateTimeFormat(intlLocale, {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone,
	}).format(new Date(eventConfig.startsAt));
	const time = (iso: string) =>
		new Intl.DateTimeFormat("en-GB", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
			timeZone,
		}).format(new Date(iso));
	return {
		date: date.charAt(0).toUpperCase() + date.slice(1),
		time: `${time(eventConfig.startsAt)} – ${time(eventConfig.endsAt)} (GMT+7)`,
	};
}

export function buildInviteEmail(input: InviteEmailInput): InviteEmail {
	const { guestName, origin, inviteCode, locale, qrCid, logoCid } = input;
	const inviteUrl = buildInviteUrl(origin, inviteCode, locale);
	const t = COPY[locale];
	const title = seminarTitle(locale);
	const organizer = localized(eventConfig.organizer, locale);
	const venueName = localized(eventConfig.venue.name, locale);
	const venueAddress = localized(eventConfig.venue.address, locale);
	const schedule = formatEventSchedule(locale);
	const agenda = eventConfig.timeline.map((item) => ({
		time: item.time,
		title: localized(item.title, locale),
	}));

	const subject = inviteEmailSubject(locale);

	const e = escapeHtml;
	const url = e(inviteUrl);

	const logo = logoCid
		? `<img src="cid:${logoCid}" width="96" alt="Gobiotics" style="display:block;width:96px;height:auto;border:0;outline:none;text-decoration:none;">`
		: `<span style="font-family:${FONT};font-size:18px;font-weight:700;color:#ffffff;">Gobiotics</span>`;

	const detailRow = (label: string, value: string, extra = "") => `
		<tr>
			<td class="label" valign="top" style="padding:10px 0;border-bottom:1px solid ${COLORS.line};width:112px;font-family:${FONT};font-size:12px;line-height:18px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase;color:${COLORS.muted};">${e(label)}</td>
			<td valign="top" style="padding:10px 0;border-bottom:1px solid ${COLORS.line};font-family:${FONT};font-size:15px;line-height:22px;color:${COLORS.ink};">${value}${extra}</td>
		</tr>`;

	const agendaRows = agenda
		.map(
			(item) => `
		<tr>
			<td class="agenda-time" valign="top" style="padding:6px 12px 6px 0;width:104px;font-family:${FONT};font-size:13px;line-height:20px;font-weight:600;color:${COLORS.goldDeep};white-space:nowrap;">${e(item.time)}</td>
			<td valign="top" style="padding:6px 0;font-family:${FONT};font-size:14px;line-height:20px;color:${COLORS.ink};">${e(item.title)}</td>
		</tr>`,
		)
		.join("");

	const html = `<!DOCTYPE html>
<html lang="${locale}" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${e(subject)}</title>
<style>
@media only screen and (max-width: 620px) {
	.px { padding-left: 20px !important; padding-right: 20px !important; }
	.title { font-size: 22px !important; line-height: 30px !important; }
	.label { width: 84px !important; }
	.agenda-time { width: 88px !important; }
	.cta a { padding: 14px 22px !important; }
}
</style>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.page};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${e(t.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.page};">
<tr>
<td align="center" style="padding:24px 8px;">
	<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:${COLORS.card};border-radius:16px;overflow:hidden;">

		<!-- Header -->
		<tr>
			<td class="px" align="center" bgcolor="${COLORS.header}" style="background-color:${COLORS.header};background-image:linear-gradient(160deg, ${COLORS.header} 0%, ${COLORS.headerSoft} 100%);padding:28px 32px 36px;">
				<table role="presentation" cellpadding="0" cellspacing="0" border="0">
					<tr>
						<td align="right" valign="middle" style="padding-right:14px;font-family:${FONT};color:#ffffff;">
							<div style="font-size:17px;line-height:20px;font-weight:800;">Dermatech</div>
							<div style="font-size:10px;line-height:12px;text-align:right;">Vietnam</div>
						</td>
						<td valign="middle" style="width:1px;background-color:#ffffff;font-size:0;line-height:0;">&nbsp;</td>
						<td align="left" valign="middle" style="padding-left:14px;">${logo}</td>
					</tr>
				</table>
				<div style="height:28px;line-height:28px;font-size:0;">&nbsp;</div>
				<div style="font-family:${FONT};font-size:12px;line-height:16px;font-weight:700;letter-spacing:3px;color:${COLORS.gold};">${e(t.kicker)}</div>
				<div style="height:10px;line-height:10px;font-size:0;">&nbsp;</div>
				<h1 class="title" style="margin:0;font-family:Georgia, 'Times New Roman', serif;font-size:28px;line-height:36px;font-weight:600;color:#ffffff;">${e(title)}</h1>
			</td>
		</tr>
		<tr><td style="height:4px;line-height:4px;font-size:0;background-color:${COLORS.gold};">&nbsp;</td></tr>

		<!-- Greeting -->
		<tr>
			<td class="px" style="padding:36px 40px 8px;font-family:${FONT};color:${COLORS.ink};">
				<p style="margin:0 0 14px;font-size:18px;line-height:26px;font-weight:600;">${e(t.greeting(guestName))}</p>
				<p style="margin:0;font-size:15px;line-height:24px;color:${COLORS.ink};">${e(t.intro)}</p>
			</td>
		</tr>

		<!-- Details -->
		<tr>
			<td class="px" style="padding:20px 40px 4px;">
				<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${COLORS.line};">
					${detailRow(t.dateLabel, `<strong>${e(schedule.date)}</strong><br>${e(schedule.time)}`)}
					${detailRow(
						t.venueLabel,
						`<strong>${e(venueName)}</strong><br>${e(venueAddress)}`,
						`<br><a href="${e(eventConfig.venue.mapUrl)}" style="color:${COLORS.goldDeep};font-size:13px;font-weight:600;text-decoration:none;">${e(t.mapCta)} &rarr;</a>`,
					)}
				</table>
			</td>
		</tr>

		<!-- CTA -->
		<tr>
			<td class="px" align="center" style="padding:28px 40px 8px;">
				<table role="presentation" cellpadding="0" cellspacing="0" border="0">
					<tr>
						<td class="cta" align="center" bgcolor="${COLORS.gold}" style="border-radius:999px;background-color:${COLORS.gold};">
							<a href="${url}" target="_blank" style="display:inline-block;padding:15px 34px;font-family:${FONT};font-size:15px;line-height:20px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${e(t.cta)}</a>
						</td>
					</tr>
				</table>
			</td>
		</tr>

		<!-- QR -->
		<tr>
			<td class="px" style="padding:24px 40px 8px;">
				<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.panel};border:1px solid ${COLORS.line};border-radius:14px;">
					<tr>
						<td align="center" style="padding:24px 24px 22px;">
							<div style="font-family:${FONT};font-size:15px;line-height:22px;font-weight:700;color:${COLORS.ink};">${e(t.qrTitle)}</div>
							<div style="height:14px;line-height:14px;font-size:0;">&nbsp;</div>
							<table role="presentation" cellpadding="0" cellspacing="0" border="0">
								<tr>
									<td style="padding:10px;background-color:#ffffff;border:1px solid ${COLORS.line};border-radius:12px;">
										<a href="${url}" target="_blank"><img src="cid:${qrCid}" width="180" height="180" alt="QR code" style="display:block;width:180px;height:180px;border:0;"></a>
									</td>
								</tr>
							</table>
							<div style="height:14px;line-height:14px;font-size:0;">&nbsp;</div>
							<div style="max-width:380px;font-family:${FONT};font-size:13px;line-height:20px;color:${COLORS.muted};">${e(t.qrBody)}</div>
						</td>
					</tr>
				</table>
			</td>
		</tr>

		<!-- Agenda -->
		<tr>
			<td class="px" style="padding:28px 40px 4px;">
				<div style="font-family:${FONT};font-size:12px;line-height:16px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.muted};padding-bottom:8px;border-bottom:1px solid ${COLORS.line};">${e(t.agendaTitle)}</div>
				<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:6px;">
					${agendaRows}
				</table>
			</td>
		</tr>

		<!-- Closing -->
		<tr>
			<td class="px" style="padding:28px 40px 32px;font-family:${FONT};color:${COLORS.ink};">
				<p style="margin:0 0 18px;font-size:12px;line-height:18px;color:${COLORS.muted};">${e(t.fallback)}<br><a href="${url}" style="color:${COLORS.goldDeep};word-break:break-all;">${url}</a></p>
				<p style="margin:0 0 4px;font-size:15px;line-height:24px;">${e(t.closing)}</p>
				<p style="margin:0;font-size:15px;line-height:24px;">${e(t.signature)}<br><strong>${e(organizer)}</strong></p>
			</td>
		</tr>

		<!-- Footer -->
		<tr>
			<td align="center" bgcolor="${COLORS.header}" style="background-color:${COLORS.header};padding:20px 32px;font-family:${FONT};font-size:12px;line-height:18px;color:#c9c4e0;">
				${e(organizer)}<br>
				<span style="color:#9a94b8;">${e(t.footer)}</span>
			</td>
		</tr>
	</table>
</td>
</tr>
</table>
</body>
</html>`;

	const text = [
		t.greeting(guestName),
		"",
		t.intro,
		"",
		title,
		`${t.dateLabel}: ${schedule.date}, ${schedule.time}`,
		`${t.venueLabel}: ${venueName} – ${venueAddress}`,
		eventConfig.venue.mapUrl,
		"",
		`${t.cta}:`,
		inviteUrl,
		"",
		`${t.agendaTitle}:`,
		...agenda.map((item) => `  ${item.time}  ${item.title}`),
		"",
		t.closing,
		t.signature,
		organizer,
		"",
		t.footer,
	].join("\n");

	return { subject, html, text, inviteUrl };
}
