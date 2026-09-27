import {
	Copy,
	MoreHorizontal,
	Pencil,
	QrCode,
	RefreshCw,
	Search,
	Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "#/components/admin/ConfirmDialog";
import { GuestFormDialog } from "#/components/admin/GuestFormDialog";
import { QrCodeDialog } from "#/components/admin/QrCodeDialog";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
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
		<div className="flex items-center justify-end gap-1">
			<Button
				size="icon-sm"
				variant="ghost"
				title={m.admin_copy_link()}
				onClick={() => copyLink(guest.inviteUrl)}
			>
				<Copy />
			</Button>
			<QrCodeDialog
				guestName={guest.fullName}
				inviteUrl={guest.inviteUrl}
				trigger={
					<Button size="icon-sm" variant="ghost" title={m.admin_show_qr()}>
						<QrCode />
					</Button>
				}
			/>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						size="icon-sm"
						variant="ghost"
						title={m.admin_table_actions()}
					>
						<MoreHorizontal />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuGroup>
						<GuestFormDialog
							guest={guest}
							trigger={
								<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
									<Pencil /> {m.admin_edit_guest()}
								</DropdownMenuItem>
							}
						/>
						<DropdownMenuItem onSelect={() => setConfirmRegenerate(true)}>
							<RefreshCw /> {m.admin_regenerate_code()}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							variant="destructive"
							onSelect={() => setConfirmDelete(true)}
						>
							<Trash2 /> {m.admin_delete_guest()}
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>

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
		<div className="flex min-w-0 flex-col gap-5">
			<p className="text-xs text-muted-foreground" aria-live="polite">
				{m.admin_results_count({
					count: filtered.length,
					total: guests.length,
				})}
			</p>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative w-full sm:max-w-sm">
					<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						aria-label={m.admin_search_placeholder()}
						placeholder={m.admin_search_placeholder()}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Select
					value={statusFilter}
					onValueChange={(value) => setStatusFilter(value as StatusFilter)}
				>
					<SelectTrigger
						className="w-full sm:w-44"
						aria-label={m.admin_table_status()}
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectItem value="all">{m.admin_filter_all()}</SelectItem>
							<SelectItem value="attending">
								{m.admin_filter_attending()}
							</SelectItem>
							<SelectItem value="declined">
								{m.admin_filter_declined()}
							</SelectItem>
							<SelectItem value="pending">
								{m.admin_filter_pending()}
							</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
			</div>

			{filtered.length === 0 ? (
				<p className="border-y border-dashed py-16 text-center text-sm text-muted-foreground">
					{guests.length === 0 ? m.admin_empty_state() : m.admin_no_results()}
				</p>
			) : (
				<>
					{/* Desktop table */}
					<div className="admin-guest-table hidden overflow-hidden border-y bg-card md:block">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead>{m.admin_table_name()}</TableHead>
									<TableHead>{m.admin_table_responder()}</TableHead>
									<TableHead>{m.admin_table_code()}</TableHead>
									<TableHead>{m.admin_table_status()}</TableHead>
									<TableHead>{m.admin_table_count()}</TableHead>
									<TableHead>{m.admin_table_message()}</TableHead>
									<TableHead>{m.admin_table_note()}</TableHead>
									<TableHead>{m.admin_table_updated()}</TableHead>
									<TableHead className="text-right">
										{m.admin_table_actions()}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filtered.map((guest) => (
									<TableRow key={guest.id}>
										<TableCell className="font-medium">
											{guest.fullName}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{guest.rsvp?.responderName || "—"}
										</TableCell>
										<TableCell className="font-mono text-xs text-muted-foreground">
											{guest.inviteCode}
											<span className="ml-1 font-sans uppercase">
												({guest.locale})
											</span>
										</TableCell>
										<TableCell>
											<StatusBadge status={guestStatus(guest)} />
										</TableCell>
										<TableCell className="tabular-nums">
											{guest.rsvp?.attendeeCount ?? "—"}
										</TableCell>
										<TableCell className="max-w-48 truncate text-muted-foreground">
											{guest.rsvp?.message || "—"}
										</TableCell>
										<TableCell className="max-w-48 truncate text-muted-foreground">
											{guest.note || "—"}
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
					<div className="flex flex-col gap-3 md:hidden">
						{filtered.map((guest) => (
							<div key={guest.id} className="rounded-lg border bg-card p-5">
								<div className="flex items-start justify-between gap-2">
									<div className="min-w-0">
										<p className="break-words font-medium">{guest.fullName}</p>
										<p className="font-mono text-xs text-muted-foreground">
											{guest.inviteCode} ({guest.locale.toUpperCase()})
										</p>
									</div>
									<StatusBadge status={guestStatus(guest)} />
								</div>
								{guest.rsvp?.responderName && (
									<p className="mt-1 text-xs text-muted-foreground">
										{m.admin_table_responder()}: {guest.rsvp.responderName}
									</p>
								)}
								{guest.rsvp?.message && (
									<p className="mt-2 text-sm text-muted-foreground">
										{guest.rsvp.message}
									</p>
								)}
								{guest.note && (
									<p className="mt-2 text-sm text-muted-foreground italic">
										{guest.note}
									</p>
								)}
								<p className="mt-1 text-xs text-muted-foreground">
									{m.admin_table_count()}: {guest.rsvp?.attendeeCount ?? "—"}
								</p>
								<div className="mt-3 flex justify-end border-t pt-3">
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
