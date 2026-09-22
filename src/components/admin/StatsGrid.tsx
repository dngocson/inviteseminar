import { Skeleton } from "#/components/ui/skeleton";
import type { RsvpStatsDto } from "#/lib/schemas";
import { m } from "#/paraglide/messages";

export function StatsGrid({ stats }: { stats: RsvpStatsDto | undefined }) {
	const items = [
		{ label: m.admin_stats_total(), value: stats?.totalGuests },
		{ label: m.admin_stats_responded(), value: stats?.responded },
		{ label: m.admin_stats_attending(), value: stats?.attending },
		{ label: m.admin_stats_declined(), value: stats?.declined },
		{ label: m.admin_stats_pending(), value: stats?.pending },
		{ label: m.admin_stats_total_attendees(), value: stats?.totalAttendees },
	];

	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
			{items.map((item) => (
				<div key={item.label} className="rounded-xl border bg-card p-4">
					<p className="text-xs text-muted-foreground">{item.label}</p>
					{item.value === undefined ? (
						<Skeleton className="mt-1 h-7 w-10" />
					) : (
						<p className="mt-1 text-2xl font-semibold">{item.value}</p>
					)}
				</div>
			))}
		</div>
	);
}
