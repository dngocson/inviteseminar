import { useForm } from "@tanstack/react-form";
import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Field,
	FieldContent,
	FieldError,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { RadioGroup, RadioGroupItem } from "#/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import { useSubmitRsvpMutation } from "#/hooks/use-invitation";
import { ApiRequestError } from "#/lib/api-client";
import type { InvitationDto } from "#/lib/schemas";
import { m } from "#/paraglide/messages";

interface RsvpFormProps {
	code: string;
	invitation: InvitationDto;
}

interface FormValues {
	responderName: string;
	message: string;
	attending: "yes" | "no";
	attendeeCount: number;
}

export function RsvpForm({ code, invitation }: RsvpFormProps) {
	const [submittedAttending, setSubmittedAttending] = useState<boolean | null>(
		invitation.rsvp ? invitation.rsvp.attending : null,
	);
	const mutation = useSubmitRsvpMutation(code);

	const form = useForm({
		defaultValues: {
			responderName: invitation.rsvp?.responderName ?? invitation.fullName,
			message: invitation.rsvp?.message ?? "",
			attending: invitation.rsvp
				? invitation.rsvp.attending
					? "yes"
					: "no"
				: "yes",
			attendeeCount: invitation.rsvp?.attendeeCount || 1,
		} satisfies FormValues,
		onSubmit: async ({ value }) => {
			const attending = value.attending === "yes";
			await mutation.mutateAsync({
				responderName: value.responderName.trim(),
				message: value.message.trim(),
				attending,
				attendeeCount: attending ? value.attendeeCount : 0,
			});
			setSubmittedAttending(attending);
		},
	});

	if (mutation.isSuccess && submittedAttending !== null) {
		return (
			<motion.div
				initial={{ opacity: 0, scale: 0.97 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
				className="lab-card rounded-3xl p-6 text-center"
			>
				<h3 className="display-title text-xl font-semibold text-(--carbon)">
					{m.rsvp_success_title()}
				</h3>
				<p className="mt-2 text-sm text-(--carbon-soft)">
					{submittedAttending
						? m.rsvp_success_body_attending()
						: m.rsvp_success_body_declined()}
				</p>
				<Button
					variant="outline"
					className="mt-4 min-h-11 rounded-full"
					onClick={() => mutation.reset()}
				>
					{m.rsvp_update()}
				</Button>
			</motion.div>
		);
	}

	const isEditing = Boolean(invitation.rsvp);
	const errorMessage =
		mutation.error instanceof ApiRequestError
			? mutation.error.message
			: mutation.error
				? m.rsvp_error_network()
				: null;

	return (
		<form
			className="lab-card space-y-5 rounded-3xl p-6"
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			{isEditing && (
				<p className="text-xs text-(--carbon-soft)">{m.rsvp_edit_hint()}</p>
			)}

			<form.Field
				name="responderName"
				validators={{
					onChange: ({ value }) =>
						value.trim().length === 0
							? m.rsvp_validation_name_required()
							: undefined,
				}}
			>
				{(field) => (
					<Field data-invalid={field.state.meta.errors.length > 0}>
						<FieldContent>
							<FieldLabel htmlFor={field.name}>
								{m.rsvp_name_label()}
							</FieldLabel>
							<Input
								id={field.name}
								name={field.name}
								value={field.state.value}
								placeholder={m.rsvp_name_placeholder()}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
							<FieldError
								errors={field.state.meta.errors.map((message) => ({ message }))}
							/>
						</FieldContent>
					</Field>
				)}
			</form.Field>

			<form.Field name="message">
				{(field) => (
					<Field>
						<FieldContent>
							<FieldLabel htmlFor={field.name}>
								{m.rsvp_message_label()}
							</FieldLabel>
							<Textarea
								id={field.name}
								name={field.name}
								value={field.state.value}
								placeholder={m.rsvp_message_placeholder()}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								rows={3}
							/>
						</FieldContent>
					</Field>
				)}
			</form.Field>

			<form.Field name="attending">
				{(field) => (
					<Field>
						<FieldContent>
							<FieldLabel>{m.rsvp_attending_label()}</FieldLabel>
							<RadioGroup
								value={field.state.value}
								onValueChange={(value) =>
									field.handleChange(value as "yes" | "no")
								}
								className="gap-2"
							>
								<div className="flex min-h-11 items-center gap-3 rounded-2xl border border-(--lab-line) px-4 text-sm font-medium text-(--carbon)">
									<RadioGroupItem value="yes" id="attending-yes" />
									<label htmlFor="attending-yes">
										{m.rsvp_attending_yes()}
									</label>
								</div>
								<div className="flex min-h-11 items-center gap-3 rounded-2xl border border-(--lab-line) px-4 text-sm font-medium text-(--carbon)">
									<RadioGroupItem value="no" id="attending-no" />
									<label htmlFor="attending-no">{m.rsvp_attending_no()}</label>
								</div>
							</RadioGroup>
						</FieldContent>
					</Field>
				)}
			</form.Field>

			<form.Subscribe selector={(state) => state.values.attending}>
				{(attending) =>
					attending === "yes" && (
						<form.Field name="attendeeCount">
							{(field) => (
								<Field>
									<FieldContent>
										<FieldLabel htmlFor={field.name}>
											{m.rsvp_count_label()}
										</FieldLabel>
										<Select
											value={String(field.state.value)}
											onValueChange={(value) =>
												field.handleChange(Number(value))
											}
										>
											<SelectTrigger
												id={field.name}
												className="w-full min-h-11"
											>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{Array.from(
													{ length: invitation.maxAttendees },
													(_, i) => i + 1,
												).map((total) => (
													<SelectItem key={total} value={String(total)}>
														{total === 1
															? m.rsvp_count_option_self()
															: m.rsvp_count_option({ count: total - 1 })}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FieldContent>
								</Field>
							)}
						</form.Field>
					)
				}
			</form.Subscribe>

			{errorMessage && (
				<p role="alert" className="text-sm font-medium text-(--coral)">
					{errorMessage}
				</p>
			)}

			<form.Subscribe selector={(state) => ({ canSubmit: state.canSubmit })}>
				{({ canSubmit }) => (
					<Button
						type="submit"
						disabled={!canSubmit || mutation.isPending}
						className="min-h-11 w-full rounded-full bg-(--mineral) text-white hover:bg-(--mineral-deep)"
					>
						{mutation.isPending
							? m.rsvp_submitting()
							: isEditing
								? m.rsvp_update()
								: m.rsvp_submit()}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}
