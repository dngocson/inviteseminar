import { createFileRoute, redirect } from "@tanstack/react-router";

import { AdminHeader } from "#/components/admin/AdminHeader";
import { GuestDataView } from "#/components/admin/GuestDataView";
import { GuestFormDialog } from "#/components/admin/GuestFormDialog";
import { StatsGrid } from "#/components/admin/StatsGrid";
import { Button } from "#/components/ui/button";
import {
	useAdminGuestsQuery,
	useAdminStatsQuery,
} from "#/hooks/use-admin-guests";
import { checkAdminSession } from "#/lib/admin-session-fn";
import { m } from "#/paraglide/messages";

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
	const { adminEmail } = Route.useRouteContext();
	const guestsQuery = useAdminGuestsQuery(true);
	const statsQuery = useAdminStatsQuery(true);

	return (
		<div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
			<AdminHeader email={adminEmail} />

			<StatsGrid stats={statsQuery.data} />

			<div className="flex items-center justify-between gap-3">
				<GuestFormDialog trigger={<Button>{m.admin_add_guest()}</Button>} />
				<a
					href="/api/admin/export"
					className="text-sm font-medium text-primary underline-offset-4 hover:underline"
				>
					{m.admin_export_csv()}
				</a>
			</div>

			{guestsQuery.isPending ? (
				<p className="text-sm text-muted-foreground">{m.admin_loading()}</p>
			) : guestsQuery.isError ? (
				<p className="text-sm text-destructive">{m.admin_error_generic()}</p>
			) : (
				<GuestDataView guests={guestsQuery.data} />
			)}
		</div>
	);
}
