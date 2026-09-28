import { CircleAlert, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useMessages } from "#/lib/locale";

interface InvitationStatusScreenProps {
	title: string;
	body: string;
	action?: ReactNode;
}

export function InvitationStatusScreen({
	title,
	body,
	action,
}: InvitationStatusScreenProps) {
	const m = useMessages();
	return (
		<div className="lab-theme invitation-status flex min-h-dvh items-center justify-center px-6 py-16">
			<div className="w-full max-w-sm text-center">
				{body ? (
					<CircleAlert
						className="mx-auto mb-7 size-12 text-(--mineral-deep)"
						strokeWidth={1.25}
						aria-hidden="true"
					/>
				) : (
					<LoaderCircle
						className="mx-auto mb-7 size-10 animate-spin text-(--mineral-deep)"
						strokeWidth={1.25}
						aria-hidden="true"
					/>
				)}
				<p className="lab-kicker mb-3">{m.site_title()}</p>
				<h1 className="display-title text-2xl font-semibold text-(--carbon)">
					{title}
				</h1>
				<p className="mt-3 text-sm leading-relaxed text-(--carbon-soft)">
					{body}
				</p>
				{action}
			</div>
		</div>
	);
}
