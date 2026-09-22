import { Link } from "@tanstack/react-router";

import { InvitationStatusScreen } from "#/components/invitation/InvitationStatusScreen";
import { useLocaleRerender } from "#/lib/locale";
import { m } from "#/paraglide/messages";

export function NotFoundPage() {
	useLocaleRerender();

	return (
		<InvitationStatusScreen
			title={m.not_found_title()}
			body={m.not_found_body()}
			action={
				<Link
					to="/"
					className="mt-2 inline-block text-sm font-semibold text-(--mineral-deep) underline underline-offset-4"
				>
					{m.site_title()}
				</Link>
			}
		/>
	);
}
