import { useForm } from "@tanstack/react-form";
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
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	useCreateGuestMutation,
	useUpdateGuestMutation,
} from "#/hooks/use-admin-guests";
import { ApiRequestError } from "#/lib/api-client";
import type { GuestWithRsvpDto } from "#/lib/schemas";
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
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{guest ? m.admin_edit_guest() : m.admin_add_guest()}
					</DialogTitle>
				</DialogHeader>

				<form
					className="space-y-4"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
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
										onValueChange={(value) => field.handleChange(Number(value))}
									>
										<SelectTrigger id={field.name} className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{[1, 2, 3, 4, 5].map((count) => (
												<SelectItem key={count} value={String(count)}>
													{count}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
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

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							{m.admin_cancel()}
						</Button>
						<Button type="submit" disabled={mutation.isPending}>
							{m.admin_save()}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
