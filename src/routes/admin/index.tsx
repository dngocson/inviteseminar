import { createFileRoute, redirect } from "@tanstack/react-router";
import { Download, Plus } from "lucide-react";

import { AdminHeader } from "#/components/admin/AdminHeader";
import { GuestDataView } from "#/components/admin/GuestDataView";
import { GuestFormDialog } from "#/components/admin/GuestFormDialog";
import { StatsGrid } from "#/components/admin/StatsGrid";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import {
	useAdminGuestsQuery,
	useAdminStatsQuery,
} from "#/hooks/use-admin-guests";
import { checkAdminSession } from "#/lib/admin-session-fn";
import { useAdminTheme } from "#/lib/admin-theme";
import { useMessages } from "#/lib/locale";

export const Route = createFileRoute("/admin/")({
	beforeLoad: async () => {
		const session = await checkAdminSession();
		if (!session.authenticated) {
			throw redirect({ to: "/admin/login" });
		}
		return { adminEmail: session.email };
	},
	component: AdminDashboard,
});

function AdminDashboard() {
	const m = useMessages();
	const { adminEmail } = Route.useRouteContext();
	useAdminTheme();
	const guestsQuery = useAdminGuestsQuery(true);
	const statsQuery = useAdminStatsQuery(true);
	return (
		<div className="admin-workspace mx-auto flex w-full flex-col gap-8 px-4 py-6 sm:px-8 sm:py-10">
			<AdminHeader email={adminEmail} />

			<StatsGrid stats={statsQuery.data} />

			<section
				className="flex min-w-0 flex-col gap-5"
				aria-labelledby="guest-list-heading"
			>
				<div className="flex flex-wrap items-center justify-between gap-4">
					<h2 id="guest-list-heading" className="text-lg font-semibold">
						{m.admin_guest_list_title()}
					</h2>
					<div className="flex flex-wrap items-center gap-2">
						<GuestFormDialog
							trigger={
								<Button>
									<Plus data-icon="inline-start" />
									{m.admin_add_guest()}
								</Button>
							}
						/>
						<Button variant="outline" asChild>
							<a href="/api/admin/export">
								<Download data-icon="inline-start" /> {m.admin_export_csv()}
							</a>
						</Button>
					</div>
				</div>

				{guestsQuery.isPending ? (
					<section
						className="flex flex-col gap-4"
						aria-busy="true"
						aria-label={m.admin_loading()}
					>
						<Skeleton className="h-10 w-full max-w-sm" />
						{["first", "second", "third"].map((row) => (
							<Skeleton key={row} className="h-16 w-full" />
						))}
					</section>
				) : guestsQuery.isError ? (
					<p className="text-sm text-destructive">{m.admin_error_generic()}</p>
				) : (
					<GuestDataView guests={guestsQuery.data} />
				)}
			</section>
			<div className="h-screen w-full" />
		</div>
	);
}
