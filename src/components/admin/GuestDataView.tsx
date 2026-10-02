import {
	Copy,
	Mail,
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
import { FieldLegend, FieldSet } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { RadioGroup, RadioGroupItem } from "#/components/ui/radio-group";
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
	useSendInviteEmailMutation,
} from "#/hooks/use-admin-guests";
import { inviteEmailSubject } from "#/lib/email/invite-email";
import { useMessages } from "#/lib/locale";
import type { GuestWithRsvpDto, Locale } from "#/lib/schemas";
import { m } from "#/paraglide/messages";

type StatusFilter = "all" | "attending" | "declined" | "pending";

function guestStatus(guest: GuestWithRsvpDto): StatusFilter {
	if (!guest.rsvp) return "pending";
	return guest.rsvp.attending ? "attending" : "declined";
}

function StatusBadge({ status }: { status: StatusFilter }) {
	const m = useMessages();
	if (status === "attending")
		return <Badge>{m.admin_filter_attending()}</Badge>;
	if (status === "declined")
		return <Badge variant="destructive">{m.admin_filter_declined()}</Badge>;
	return <Badge variant="secondary">{m.admin_filter_pending()}</Badge>;
}

/**
 * What the guest entered on the RSVP form (company · position, phone, email)
 * plus the status of the automatic confirmation email sent to that email.
 */
function ContactDetails({ guest }: { guest: GuestWithRsvpDto }) {
	const { rsvp } = guest;
	const role = [rsvp?.jobTitle, rsvp?.company].filter(Boolean).join(" · ");
	const lines = [role, rsvp?.phone, rsvp?.email].filter(Boolean);
	const hasStatus = guest.confirmationSentAt || guest.confirmationSendError;
	if (lines.length === 0 && !hasStatus) return "—";
	return (
		<div className="flex flex-col gap-0.5">
			{lines.map((line) => (
				<span key={line} className="break-words">
					{line}
				</span>
			))}
			<ConfirmationEmailStatus guest={guest} />
		</div>
	);
}

async function copyLink(url: string) {
	try {
		await navigator.clipboard.writeText(url);
		toast.success(m.admin_copy_link_success());
	} catch {
		toast.error(m.admin_error_generic());
	}
}

/** Free-text column: wraps up to 3 lines, full text on hover. */
function ClampedCell({ text }: { text: string | null | undefined }) {
	return (
		<TableCell
			className="min-w-32 max-w-56 text-muted-foreground"
			title={text || undefined}
		>
			<span className="line-clamp-3 break-words">{text || "—"}</span>
		</TableCell>
	);
}

function formatSentAt(iso: string) {
	return new Date(iso).toLocaleString();
}

/** Invitation email (admin-entered) + whether the invitation went out. */
function InviteEmail({ guest }: { guest: GuestWithRsvpDto }) {
	const m = useMessages();
	if (!guest.email && !guest.inviteSentAt && !guest.inviteSendError) {
		return "—";
	}
	// The invite may have gone to an older address before the email was edited.
	const sentTo =
		guest.inviteSentTo && guest.inviteSentTo !== guest.email
			? guest.inviteSentTo
			: null;
	return (
		<div className="flex flex-col gap-0.5">
			{guest.email && <span className="break-all">{guest.email}</span>}
			{guest.inviteSendError ? (
				<span className="text-destructive" title={guest.inviteSendError}>
					{m.admin_invite_email_failed()}
				</span>
			) : guest.inviteSentAt ? (
				<span className="text-emerald-700 dark:text-emerald-400">
					{m.admin_invite_email_sent({
						time: formatSentAt(guest.inviteSentAt),
					})}
					{sentTo && (
						<span className="block break-all text-muted-foreground">
							{m.admin_email_sent_to({ email: sentTo })}
						</span>
					)}
				</span>
			) : (
				<span className="text-muted-foreground">
					{m.admin_invite_email_not_sent()}
				</span>
			)}
		</div>
	);
}

/** The one-off confirmation email sent after an "attending" RSVP. */
function ConfirmationEmailStatus({ guest }: { guest: GuestWithRsvpDto }) {
	const m = useMessages();
	if (guest.confirmationSendError && !guest.confirmationSentAt) {
		return (
			<span className="text-destructive" title={guest.confirmationSendError}>
				{m.admin_confirmation_email_failed()}
			</span>
		);
	}
	if (!guest.confirmationSentAt) return null;
	// The guest may have changed their RSVP email after the confirmation.
	const sentTo =
		guest.confirmationSentTo && guest.confirmationSentTo !== guest.rsvp?.email
			? guest.confirmationSentTo
			: null;
	return (
		<span className="text-emerald-700 dark:text-emerald-400">
			{m.admin_confirmation_email_sent({
				time: formatSentAt(guest.confirmationSentAt),
			})}
			{sentTo && (
				<span className="block break-all text-muted-foreground">
					{m.admin_email_sent_to({ email: sentTo })}
				</span>
			)}
		</span>
	);
}

function RowActions({ guest }: { guest: GuestWithRsvpDto }) {
	const m = useMessages();
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [confirmRegenerate, setConfirmRegenerate] = useState(false);
	const [confirmSend, setConfirmSend] = useState(false);
	const [sendLocale, setSendLocale] = useState<Locale>(guest.locale);
	const deleteMutation = useDeleteGuestMutation();
	const regenerateMutation = useRegenerateInviteCodeMutation();
	const sendMutation = useSendInviteEmailMutation();

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
						<DropdownMenuItem
							disabled={!guest.email}
							onSelect={() => {
								setSendLocale(guest.locale);
								setConfirmSend(true);
							}}
						>
							<Mail />{" "}
							{guest.inviteSentAt
								? m.admin_resend_invite_email()
								: m.admin_send_invite_email()}
						</DropdownMenuItem>
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
				open={confirmSend}
				onOpenChange={setConfirmSend}
				title={
					guest.inviteSentAt
						? m.admin_resend_invite_email()
						: m.admin_send_invite_email()
				}
				description={m.admin_send_invite_confirm_body({
					name: guest.fullName,
					email: guest.email ?? "",
				})}
				icon={<Mail aria-hidden="true" />}
				isPending={sendMutation.isPending}
				onConfirm={() =>
					sendMutation.mutate(
						{ id: guest.id, locale: sendLocale },
						{
							onSuccess: () => {
								setConfirmSend(false);
								toast.success(m.admin_send_invite_success());
							},
							onError: (error) => {
								setConfirmSend(false);
								toast.error(error.message || m.admin_error_generic());
							},
						},
					)
				}
			>
				<FieldSet>
					<FieldLegend variant="label">
						{m.admin_send_invite_language_label()}
					</FieldLegend>
					<RadioGroup
						value={sendLocale}
						onValueChange={(value) => setSendLocale(value as Locale)}
						className="grid grid-cols-2 gap-3"
					>
						{(["vi", "en"] as const).map((option) => (
							<label
								key={option}
								htmlFor={`send-locale-${guest.id}-${option}`}
								className="choice-option flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
							>
								<RadioGroupItem
									value={option}
									id={`send-locale-${guest.id}-${option}`}
								/>
								<span>
									{option === "vi"
										? m.admin_guest_locale_vi()
										: m.admin_guest_locale_en()}
								</span>
							</label>
						))}
					</RadioGroup>
					<p className="text-xs text-muted-foreground">
						{m.admin_send_invite_subject_preview()}{" "}
						<span className="font-medium text-foreground">
							{inviteEmailSubject(sendLocale)}
						</span>
					</p>
				</FieldSet>
			</ConfirmDialog>
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
	const m = useMessages();
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
					<div className="admin-guest-table hidden overflow-hidden border-y bg-card lg:block">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead>{m.admin_table_name()}</TableHead>
									<TableHead>{m.admin_table_invite_email()}</TableHead>
									<TableHead>{m.admin_table_responder()}</TableHead>
									<TableHead>{m.admin_table_contact()}</TableHead>
									<TableHead>{m.admin_table_code()}</TableHead>
									<TableHead>{m.admin_table_status()}</TableHead>
									<TableHead>{m.admin_table_count()}</TableHead>
									<TableHead>{m.admin_table_allergies()}</TableHead>
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
										<TableCell className="min-w-40 max-w-60 font-medium">
											{guest.fullName}
										</TableCell>
										<TableCell className="min-w-44 max-w-60 text-xs">
											<InviteEmail guest={guest} />
										</TableCell>
										<TableCell className="min-w-28 max-w-44 text-muted-foreground">
											{guest.rsvp?.responderName || "—"}
										</TableCell>
										<TableCell className="min-w-44 max-w-60 text-xs text-muted-foreground">
											<ContactDetails guest={guest} />
										</TableCell>
										<TableCell className="cell-nowrap font-mono text-xs text-muted-foreground">
											{guest.inviteCode}
											<span className="ml-1 font-sans uppercase">
												({guest.locale})
											</span>
										</TableCell>
										<TableCell className="cell-nowrap">
											<StatusBadge status={guestStatus(guest)} />
										</TableCell>
										<TableCell className="tabular-nums">
											{guest.rsvp?.attendeeCount ?? "—"}
										</TableCell>
										<ClampedCell text={guest.rsvp?.allergies} />
										<ClampedCell text={guest.rsvp?.message} />
										<ClampedCell text={guest.note} />
										<TableCell className="w-28 text-xs text-muted-foreground">
											{new Date(
												guest.rsvp?.updatedAt ?? guest.updatedAt,
											).toLocaleString()}
										</TableCell>
										<TableCell className="cell-nowrap">
											<RowActions guest={guest} />
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{/* Mobile list */}
					<div className="flex flex-col gap-3 lg:hidden">
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
								<div className="mt-2 text-xs">
									<p className="font-medium text-muted-foreground">
										{m.admin_table_invite_email()}
									</p>
									<InviteEmail guest={guest} />
								</div>
								{(guest.rsvp || guest.confirmationSentAt) && (
									<div className="mt-2 text-xs text-muted-foreground">
										<p className="font-medium">{m.admin_table_contact()}</p>
										<ContactDetails guest={guest} />
									</div>
								)}
								{guest.rsvp?.allergies && (
									<p className="mt-2 text-sm text-muted-foreground">
										{m.admin_table_allergies()}: {guest.rsvp.allergies}
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
