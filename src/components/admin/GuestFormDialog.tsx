import { useForm } from "@tanstack/react-form";
import { LoaderCircle, Save, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import {
	Field,
	FieldContent,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { RadioGroup, RadioGroupItem } from "#/components/ui/radio-group";
import { Textarea } from "#/components/ui/textarea";
import {
	useCreateGuestMutation,
	useSendInviteEmailMutation,
	useUpdateGuestMutation,
} from "#/hooks/use-admin-guests";
import { ApiRequestError } from "#/lib/api-client";
import { useMessages } from "#/lib/locale";
import type { GuestWithRsvpDto, Locale } from "#/lib/schemas";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface GuestFormDialogProps {
	trigger: ReactNode;
	guest?: GuestWithRsvpDto;
}

export function GuestFormDialog({ trigger, guest }: GuestFormDialogProps) {
	const m = useMessages();
	const [open, setOpen] = useState(false);
	const createMutation = useCreateGuestMutation();
	const updateMutation = useUpdateGuestMutation();
	const sendInviteMutation = useSendInviteEmailMutation();
	const mutation = guest ? updateMutation : createMutation;

	const form = useForm({
		defaultValues: {
			fullName: guest?.fullName ?? "",
			email: guest?.email ?? "",
			locale: guest?.locale ?? ("vi" as Locale),
			note: guest?.note ?? "",
			// Create only: email the invitation right after the guest is saved.
			sendInvite: false,
		},
		onSubmit: async ({ value }) => {
			const { sendInvite, ...input } = value;
			if (guest) {
				await updateMutation.mutateAsync({ id: guest.id, ...input });
			} else {
				const created = await createMutation.mutateAsync(input);
				if (sendInvite && created.email) {
					// The guest is saved either way; a failed send shows on its row
					// and can be retried from the row menu.
					sendInviteMutation.mutate(
						{ id: created.id, locale: created.locale },
						{
							onSuccess: () => toast.success(m.admin_send_invite_success()),
							onError: (error) =>
								toast.error(error.message || m.admin_error_generic()),
						},
					);
				}
			}
			setOpen(false);
			form.reset();
		},
	});

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (!next) mutation.reset();
			}}
		>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent aria-describedby={undefined}>
				<DialogHeader>
					<UserRound
						className="mb-2 size-7 text-primary"
						strokeWidth={1.5}
						aria-hidden="true"
					/>
					<DialogTitle>
						{guest ? m.admin_edit_guest() : m.admin_add_guest()}
					</DialogTitle>
				</DialogHeader>

				<form
					className="flex flex-col gap-6"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<FieldGroup>
						<form.Field
							name="fullName"
							validators={{
								onChange: ({ value }) =>
									value.trim().length === 0 ? "Required" : undefined,
							}}
						>
							{(field) => (
								<Field data-invalid={field.state.meta.errors.length > 0}>
									<FieldContent>
										<FieldLabel htmlFor={field.name}>
											{m.admin_guest_name_label()}
										</FieldLabel>
										<Input
											id={field.name}
											aria-invalid={field.state.meta.errors.length > 0}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
										/>
										<FieldError
											errors={field.state.meta.errors.map((message) => ({
												message,
											}))}
										/>
									</FieldContent>
								</Field>
							)}
						</form.Field>

						<form.Field
							name="email"
							validators={{
								onBlur: ({ value }) =>
									value.trim() && !EMAIL_PATTERN.test(value.trim())
										? m.admin_guest_email_invalid()
										: undefined,
							}}
						>
							{(field) => (
								<Field data-invalid={field.state.meta.errors.length > 0}>
									<FieldContent>
										<FieldLabel htmlFor={field.name}>
											{m.admin_guest_email_label()}
										</FieldLabel>
										<Input
											id={field.name}
											type="email"
											autoComplete="off"
											placeholder="name@company.com"
											aria-invalid={field.state.meta.errors.length > 0}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
										/>
										<FieldError
											errors={field.state.meta.errors.map((message) => ({
												message,
											}))}
										/>
									</FieldContent>
								</Field>
							)}
						</form.Field>

						<form.Field name="locale">
							{(field) => (
								<FieldSet>
									<FieldLegend variant="label">
										{m.admin_guest_locale_label()}
									</FieldLegend>
									<RadioGroup
										value={field.state.value}
										onValueChange={(value) =>
											field.handleChange(value as Locale)
										}
										className="grid grid-cols-2 gap-3"
									>
										<label
											htmlFor="guest-locale-vi"
											className="choice-option flex min-h-12 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
										>
											<RadioGroupItem value="vi" id="guest-locale-vi" />
											<span>{m.admin_guest_locale_vi()}</span>
										</label>
										<label
											htmlFor="guest-locale-en"
											className="choice-option flex min-h-12 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
										>
											<RadioGroupItem value="en" id="guest-locale-en" />
											<span>{m.admin_guest_locale_en()}</span>
										</label>
									</RadioGroup>
								</FieldSet>
							)}
						</form.Field>

						<form.Field name="note">
							{(field) => (
								<Field>
									<FieldContent>
										<FieldLabel htmlFor={field.name}>
											{m.admin_guest_note_label()}
										</FieldLabel>
										<Textarea
											id={field.name}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											rows={3}
										/>
									</FieldContent>
								</Field>
							)}
						</form.Field>

						{!guest && (
							<form.Subscribe selector={(state) => state.values.email.trim()}>
								{(email) => (
									<form.Field name="sendInvite">
										{(field) => (
											<label
												htmlFor="guest-send-invite"
												className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 text-sm has-disabled:cursor-not-allowed has-disabled:opacity-60"
											>
												<input
													id="guest-send-invite"
													type="checkbox"
													className="mt-0.5 size-4 shrink-0 accent-primary"
													disabled={!email}
													checked={Boolean(email) && field.state.value}
													onChange={(e) => field.handleChange(e.target.checked)}
												/>
												<span className="flex flex-col gap-0.5">
													<span className="font-medium">
														{m.admin_guest_send_invite_now()}
													</span>
													<span className="text-xs text-muted-foreground">
														{email
															? m.admin_guest_send_invite_now_hint()
															: m.admin_guest_send_invite_now_needs_email()}
													</span>
												</span>
											</label>
										)}
									</form.Field>
								)}
							</form.Subscribe>
						)}

						{mutation.error && (
							<p role="alert" className="text-sm text-destructive">
								{mutation.error instanceof ApiRequestError
									? mutation.error.message
									: m.admin_error_generic()}
							</p>
						)}
					</FieldGroup>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							{m.admin_cancel()}
						</Button>
						<Button type="submit" disabled={mutation.isPending}>
							{mutation.isPending ? (
								<LoaderCircle
									data-icon="inline-start"
									className="animate-spin"
								/>
							) : (
								<Save data-icon="inline-start" />
							)}
							{m.admin_save()}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
