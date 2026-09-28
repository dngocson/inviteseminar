import { cn } from "cn";
import {
	CircleCheck,
	CircleX,
	Clock3,
	MailCheck,
	Users,
	UsersRound,
} from "lucide-react";
import type { ComponentType } from "react";
import { Skeleton } from "#/components/ui/skeleton";
import { useMessages } from "#/lib/locale";
import type { RsvpStatsDto } from "#/lib/schemas";

interface StatItem {
	label: string;
	value: number | undefined;
	icon: ComponentType<{ className?: string }>;
	tone?: "primary" | "destructive";
}

export function StatsGrid({ stats }: { stats: RsvpStatsDto | undefined }) {
	const m = useMessages();
	const items: StatItem[] = [
		{ label: m.admin_stats_total(), value: stats?.totalGuests, icon: Users },
		{
			label: m.admin_stats_responded(),
			value: stats?.responded,
			icon: MailCheck,
		},
		{
			label: m.admin_stats_attending(),
			value: stats?.attending,
			icon: CircleCheck,
			tone: "primary",
		},
		{
			label: m.admin_stats_declined(),
			value: stats?.declined,
			icon: CircleX,
			tone: "destructive",
		},
		{ label: m.admin_stats_pending(), value: stats?.pending, icon: Clock3 },
		{
			label: m.admin_stats_total_attendees(),
			value: stats?.totalAttendees,
			icon: UsersRound,
		},
	];

	return (
		<div className="admin-stats grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
			{items.map((item) => (
				<div
					key={item.label}
					className={cn(
						"admin-stat min-w-0 px-5 py-6",
						item.tone === "primary" && "bg-accent",
					)}
				>
					<item.icon
						className={cn(
							"size-4 text-muted-foreground",
							item.tone === "primary" && "text-primary",
							item.tone === "destructive" && "text-destructive",
						)}
					/>
					<p className="mt-4 min-h-8 text-xs leading-relaxed text-muted-foreground">
						{item.label}
					</p>
					{item.value === undefined ? (
						<Skeleton className="mt-1 h-7 w-10" />
					) : (
						<p className="display-title mt-1 text-4xl font-medium tabular-nums">
							{item.value}
						</p>
					)}
				</div>
			))}
		</div>
	);
}
