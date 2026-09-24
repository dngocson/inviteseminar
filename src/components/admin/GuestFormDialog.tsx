import { useForm } from "@tanstack/react-form";
import { LoaderCircle, Save, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
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
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import {
	useCreateGuestMutation,
	useUpdateGuestMutation,
} from "#/hooks/use-admin-guests";
import { ApiRequestError } from "#/lib/api-client";
import type { GuestWithRsvpDto, Locale } from "#/lib/schemas";
import { m } from "#/paraglide/messages";

interface GuestFormDialogProps {
	trigger: ReactNode;
	guest?: GuestWithRsvpDto;
}

export function GuestFormDialog({ trigger, guest }: GuestFormDialogProps) {
	const [open, setOpen] = useState(false);
	const createMutation = useCreateGuestMutation();
	const updateMutation = useUpdateGuestMutation();
	const mutation = guest ? updateMutation : createMutation;

	const form = useForm({
		defaultValues: {
			fullName: guest?.fullName ?? "",
			maxAttendees: guest?.maxAttendees ?? 5,
			locale: guest?.locale ?? ("vi" as Locale),
			note: guest?.note ?? "",
		},
		onSubmit: async ({ value }) => {
			if (guest) {
				await updateMutation.mutateAsync({ id: guest.id, ...value });
			} else {
				await createMutation.mutateAsync(value);
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

						<form.Field name="maxAttendees">
							{(field) => (
								<Field>
									<FieldContent>
										<FieldLabel htmlFor={field.name}>
											{m.admin_guest_max_attendees_label()}
										</FieldLabel>
										<Select
											value={String(field.state.value)}
											onValueChange={(value) =>
												field.handleChange(Number(value))
											}
										>
											<SelectTrigger id={field.name} className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{Array.from({ length: 10 }, (_, i) => i + 1).map(
														(count) => (
															<SelectItem key={count} value={String(count)}>
																{count}
															</SelectItem>
														),
													)}
												</SelectGroup>
											</SelectContent>
										</Select>
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
										<div className="choice-option flex min-h-12 items-center gap-2 rounded-md border px-3 py-2">
											<RadioGroupItem value="vi" id="guest-locale-vi" />
											<label
												htmlFor="guest-locale-vi"
												className="text-sm font-medium"
											>
												{m.admin_guest_locale_vi()}
											</label>
										</div>
										<div className="choice-option flex min-h-12 items-center gap-2 rounded-md border px-3 py-2">
											<RadioGroupItem value="en" id="guest-locale-en" />
											<label
												htmlFor="guest-locale-en"
												className="text-sm font-medium"
											>
												{m.admin_guest_locale_en()}
											</label>
										</div>
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
