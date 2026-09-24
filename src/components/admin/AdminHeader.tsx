import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, Atom, LogOut } from "lucide-react";
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
		<header className="admin-header flex flex-col gap-8 pb-7">
			<div className="admin-masthead flex flex-wrap items-center justify-between gap-5 pb-5">
				<div className="flex items-center gap-3 text-primary">
					<Atom
						className="size-8 shrink-0"
						strokeWidth={1.25}
						aria-hidden="true"
					/>
					<span className="text-sm font-semibold">
						{m.admin_workspace_label()}
					</span>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					{email && (
						<p className="hidden max-w-60 truncate text-xs text-muted-foreground xl:block">
							{email}
						</p>
					)}
					<div className="flex overflow-hidden rounded-md border bg-card">
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
						<LogOut data-icon="inline-start" /> {m.admin_logout()}
					</Button>
				</div>
			</div>
			<div className="flex flex-wrap items-end justify-between gap-5">
				<div className="min-w-0 max-w-2xl">
					<h1 className="display-title text-3xl font-medium sm:text-4xl">
						{m.admin_dashboard_title()}
					</h1>
					<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
						{localized(eventConfig.seminarName, locale)}
					</p>
				</div>
				<Button variant="outline" asChild>
					<Link to="/" search={{ l: locale }} target="_blank" rel="noreferrer">
						{m.admin_open_event()}
						<ArrowUpRight data-icon="inline-end" />
					</Link>
				</Button>
			</div>
		</header>
	);
}
