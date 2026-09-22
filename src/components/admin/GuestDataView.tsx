import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "#/components/admin/ConfirmDialog";
import { GuestFormDialog } from "#/components/admin/GuestFormDialog";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import {
	useDeleteGuestMutation,
	useRegenerateInviteCodeMutation,
} from "#/hooks/use-admin-guests";
import type { GuestWithRsvpDto } from "#/lib/schemas";
import { m } from "#/paraglide/messages";

type StatusFilter = "all" | "attending" | "declined" | "pending";

function guestStatus(guest: GuestWithRsvpDto): StatusFilter {
	if (!guest.rsvp) return "pending";
	return guest.rsvp.attending ? "attending" : "declined";
}

function StatusBadge({ status }: { status: StatusFilter }) {
	if (status === "attending")
		return <Badge>{m.admin_filter_attending()}</Badge>;
	if (status === "declined")
		return <Badge variant="destructive">{m.admin_filter_declined()}</Badge>;
	return <Badge variant="secondary">{m.admin_filter_pending()}</Badge>;
}

async function copyLink(url: string) {
	try {
		await navigator.clipboard.writeText(url);
		toast.success(m.admin_copy_link_success());
	} catch {
		toast.error(m.admin_error_generic());
	}
}

function RowActions({ guest }: { guest: GuestWithRsvpDto }) {
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [confirmRegenerate, setConfirmRegenerate] = useState(false);
	const deleteMutation = useDeleteGuestMutation();
	const regenerateMutation = useRegenerateInviteCodeMutation();

	return (
		<div className="flex flex-wrap gap-2">
			<Button
				size="sm"
				variant="outline"
				onClick={() => copyLink(guest.inviteUrl)}
			>
				{m.admin_copy_link()}
			</Button>
			<GuestFormDialog
				guest={guest}
				trigger={
					<Button size="sm" variant="outline">
						{m.admin_edit_guest()}
					</Button>
				}
			/>
			<Button
				size="sm"
				variant="outline"
				onClick={() => setConfirmRegenerate(true)}
			>
				{m.admin_regenerate_code()}
			</Button>
			<Button
				size="sm"
				variant="destructive"
				onClick={() => setConfirmDelete(true)}
			>
				{m.admin_delete_guest()}
			</Button>

			<ConfirmDialog
				open={confirmRegenerate}
				onOpenChange={setConfirmRegenerate}
				title={m.admin_regenerate_confirm_title()}
				description={m.admin_regenerate_confirm_body()}
				isPending={regenerateMutation.isPending}
				onConfirm={() =>
					regenerateMutation.mutate(guest.id, {
						onSuccess: () => setConfirmRegenerate(false),
					})
				}
			/>
			<ConfirmDialog
				open={confirmDelete}
				onOpenChange={setConfirmDelete}
				title={m.admin_delete_confirm_title()}
				description={m.admin_delete_confirm_body()}
				destructive
				isPending={deleteMutation.isPending}
				onConfirm={() =>
					deleteMutation.mutate(guest.id, {
						onSuccess: () => setConfirmDelete(false),
					})
				}
			/>
		</div>
	);
}

export function GuestDataView({ guests }: { guests: GuestWithRsvpDto[] }) {
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

	const filtered = useMemo(() => {
		const query = search.trim().toLowerCase();
		return guests.filter((guest) => {
			const matchesQuery =
				query.length === 0 ||
				guest.fullName.toLowerCase().includes(query) ||
				guest.inviteCode.toLowerCase().includes(query);
			const matchesStatus =
				statusFilter === "all" || guestStatus(guest) === statusFilter;
			return matchesQuery && matchesStatus;
		});
	}, [guests, search, statusFilter]);

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<Input
					placeholder={m.admin_search_placeholder()}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="sm:max-w-xs"
				/>
				<Select
					value={statusFilter}
					onValueChange={(value) => setStatusFilter(value as StatusFilter)}
				>
					<SelectTrigger className="sm:w-44">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{m.admin_filter_all()}</SelectItem>
						<SelectItem value="attending">
							{m.admin_filter_attending()}
						</SelectItem>
						<SelectItem value="declined">
							{m.admin_filter_declined()}
						</SelectItem>
						<SelectItem value="pending">{m.admin_filter_pending()}</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{filtered.length === 0 ? (
				<p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
					{m.admin_empty_state()}
				</p>
			) : (
				<>
					{/* Desktop table */}
					<div className="hidden overflow-hidden rounded-xl border md:block">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{m.admin_table_name()}</TableHead>
									<TableHead>{m.admin_table_code()}</TableHead>
									<TableHead>{m.admin_table_status()}</TableHead>
									<TableHead>{m.admin_table_count()}</TableHead>
									<TableHead>{m.admin_table_message()}</TableHead>
									<TableHead>{m.admin_table_updated()}</TableHead>
									<TableHead>{m.admin_table_actions()}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filtered.map((guest) => (
									<TableRow key={guest.id}>
										<TableCell className="font-medium">
											{guest.fullName}
										</TableCell>
										<TableCell className="font-mono text-xs">
											{guest.inviteCode}
										</TableCell>
										<TableCell>
											<StatusBadge status={guestStatus(guest)} />
										</TableCell>
										<TableCell>{guest.rsvp?.attendeeCount ?? "—"}</TableCell>
										<TableCell className="max-w-48 truncate">
											{guest.rsvp?.message || "—"}
										</TableCell>
										<TableCell className="text-xs text-muted-foreground">
											{new Date(
												guest.rsvp?.updatedAt ?? guest.updatedAt,
											).toLocaleString()}
										</TableCell>
										<TableCell>
											<RowActions guest={guest} />
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{/* Mobile list */}
					<div className="space-y-3 md:hidden">
						{filtered.map((guest) => (
							<div key={guest.id} className="rounded-xl border bg-card p-4">
								<div className="flex items-start justify-between gap-2">
									<div>
										<p className="font-medium">{guest.fullName}</p>
										<p className="font-mono text-xs text-muted-foreground">
											{guest.inviteCode}
										</p>
									</div>
									<StatusBadge status={guestStatus(guest)} />
								</div>
								{guest.rsvp?.message && (
									<p className="mt-2 text-sm text-muted-foreground">
										{guest.rsvp.message}
									</p>
								)}
								<p className="mt-1 text-xs text-muted-foreground">
									{m.admin_table_count()}: {guest.rsvp?.attendeeCount ?? "—"}
								</p>
								<div className="mt-3">
									<RowActions guest={guest} />
								</div>
							</div>
						))}
					</div>
				</>
			)}
		</div>
	);
}
