import { m } from "#/paraglide/messages";

interface InvitationStatusScreenProps {
	title: string;
	body: string;
}

export function InvitationStatusScreen({
	title,
	body,
}: InvitationStatusScreenProps) {
	return (
		<div className="lab-theme flex min-h-dvh items-center justify-center px-6 py-16">
			<div className="lab-card w-full max-w-sm rounded-3xl p-8 text-center">
				<p className="lab-kicker mb-3">{m.site_title()}</p>
				<h1 className="display-title text-2xl font-semibold text-(--carbon)">
					{title}
				</h1>
				<p className="mt-3 text-sm leading-relaxed text-(--carbon-soft)">
					{body}
				</p>
			</div>
		</div>
	);
}
