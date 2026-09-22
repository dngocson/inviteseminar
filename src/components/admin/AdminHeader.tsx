import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { useLogoutMutation } from "#/hooks/use-admin-auth";
import { m } from "#/paraglide/messages";
import { locales, setLocale } from "#/paraglide/runtime";

export function AdminHeader({ email }: { email: string | null }) {
	const navigate = useNavigate();
	const logoutMutation = useLogoutMutation();
	const [, forceRender] = useState(0);

	return (
		<header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
			<div>
				<h1 className="text-xl font-semibold">{m.admin_dashboard_title()}</h1>
				{email && <p className="text-xs text-muted-foreground">{email}</p>}
			</div>
			<div className="flex items-center gap-2">
				<div className="flex overflow-hidden rounded-md border">
					{locales.map((locale) => (
						<button
							key={locale}
							type="button"
							className="px-2 py-1 text-xs font-medium uppercase hover:bg-accent"
							onClick={() => {
								setLocale(locale, { reload: false });
								forceRender((n) => n + 1);
							}}
						>
							{locale}
						</button>
					))}
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={async () => {
						await logoutMutation.mutateAsync();
						await navigate({ to: "/admin/login" });
					}}
				>
					{m.admin_logout()}
				</Button>
			</div>
		</header>
	);
}
