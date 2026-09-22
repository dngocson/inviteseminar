import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { Button } from "#/components/ui/button";
import { eventConfig, localized } from "#/content/event";
import { useLogoutMutation } from "#/hooks/use-admin-auth";
import { m } from "#/paraglide/messages";
import { getLocale, locales, setLocale } from "#/paraglide/runtime";

interface AdminHeaderProps {
	email: string | null;
	/** Re-renders the whole dashboard so every `m.xxx()` call on the page picks up the new locale, not just this header. */
	onLocaleChange: () => void;
}

export function AdminHeader({ email, onLocaleChange }: AdminHeaderProps) {
	const navigate = useNavigate();
	const logoutMutation = useLogoutMutation();
	const locale = getLocale();

	return (
		<header className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
			<div>
				<p className="text-xs font-semibold tracking-wide text-primary">
					{localized(eventConfig.seminarName, locale)}
				</p>
				<h1
					className="mt-1 text-2xl font-semibold"
					style={{ fontFamily: "'Fraunces', Georgia, serif" }}
				>
					{m.admin_dashboard_title()}
				</h1>
				{email && <p className="mt-1 text-xs text-muted-foreground">{email}</p>}
			</div>
			<div className="flex items-center gap-2">
				<div className="flex overflow-hidden rounded-full border">
					{locales.map((l) => (
						<button
							key={l}
							type="button"
							aria-pressed={l === locale}
							className={
								l === locale
									? "bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground uppercase"
									: "px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase hover:bg-accent"
							}
							onClick={() => {
								setLocale(l, { reload: false });
								onLocaleChange();
							}}
						>
							{l}
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
					<LogOut /> {m.admin_logout()}
				</Button>
			</div>
		</header>
	);
}
