import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { InvitationStatusScreen } from "#/components/invitation/InvitationStatusScreen";
import { Button } from "#/components/ui/button";
import { useMessages } from "#/lib/locale";

export function NotFoundPage() {
	const m = useMessages();

	return (
		<InvitationStatusScreen
			title={m.not_found_title()}
			body={m.not_found_body()}
			action={
				<Button variant="outline" asChild className="mt-6">
					<Link to="/">
						<ArrowLeft data-icon="inline-start" />
						{m.site_title()}
					</Link>
				</Button>
			}
		/>
	);
}
