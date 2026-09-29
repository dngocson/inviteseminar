import { useForm } from "@tanstack/react-form";
import { CircleCheck, LoaderCircle, Pencil, Send } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
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
import { useSubmitRsvpMutation } from "#/hooks/use-invitation";
import { ApiRequestError } from "#/lib/api-client";
import { useMessages } from "#/lib/locale";
import { type InvitationDto, PHONE_PATTERN } from "#/lib/schemas";

// Same check `z.email()` applies server-side, loose enough for real addresses.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RsvpFormProps {
	code: string;
	invitation: InvitationDto;
}

interface FormValues {
	responderName: string;
	company: string;
	jobTitle: string;
	phone: string;
	email: string;
	allergies: string;
	message: string;
	attending: "yes" | "no";
}

export function RsvpForm({ code, invitation }: RsvpFormProps) {
	const m = useMessages();
	const [submittedAttending, setSubmittedAttending] = useState<boolean | null>(
		invitation.rsvp ? invitation.rsvp.attending : null,
	);
	const mutation = useSubmitRsvpMutation(code);

	const form = useForm({
		defaultValues: {
			responderName: invitation.rsvp?.responderName ?? invitation.fullName,
			company: invitation.rsvp?.company ?? "",
			jobTitle: invitation.rsvp?.jobTitle ?? "",
			phone: invitation.rsvp?.phone ?? "",
			email: invitation.rsvp?.email ?? "",
			allergies: invitation.rsvp?.allergies ?? "",
			message: invitation.rsvp?.message ?? "",
			attending: invitation.rsvp
				? invitation.rsvp.attending
					? "yes"
					: "no"
				: "yes",
		} satisfies FormValues,
		onSubmit: async ({ value }) => {
			const attending = value.attending === "yes";
			await mutation.mutateAsync({
				responderName: value.responderName.trim(),
				company: value.company.trim(),
				jobTitle: value.jobTitle.trim(),
				phone: value.phone.trim(),
				email: value.email.trim(),
				allergies: value.allergies.trim(),
				message: value.message.trim(),
				attending,
				// The form no longer asks about companions: an attending guest is one person.
				attendeeCount: attending ? 1 : 0,
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
				className="lab-card p-6 text-center"
			>
				<CircleCheck
					className="mx-auto mb-4 size-10 text-primary"
					strokeWidth={1.5}
					aria-hidden="true"
				/>
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
					className="mt-4 min-h-11"
					onClick={() => mutation.reset()}
				>
					<Pencil data-icon="inline-start" />
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
			className="flex flex-col gap-5"
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<FieldGroup>
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
									aria-invalid={field.state.meta.errors.length > 0}
									name={field.name}
									value={field.state.value}
									placeholder={m.rsvp_name_placeholder()}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
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

				<div className="grid gap-5 sm:grid-cols-2">
					{(
						[
							{
								name: "company",
								label: m.rsvp_company_label(),
								placeholder: m.rsvp_company_placeholder(),
								autoComplete: "organization",
							},
							{
								name: "jobTitle",
								label: m.rsvp_job_title_label(),
								placeholder: m.rsvp_job_title_placeholder(),
								autoComplete: "organization-title",
							},
							{
								name: "phone",
								label: m.rsvp_phone_label(),
								placeholder: m.rsvp_phone_placeholder(),
								autoComplete: "tel",
								type: "tel",
								validate: (value: string) =>
									value.trim() && !PHONE_PATTERN.test(value.trim())
										? m.rsvp_validation_phone_invalid()
										: undefined,
							},
							{
								name: "email",
								label: m.rsvp_email_label(),
								placeholder: m.rsvp_email_placeholder(),
								autoComplete: "email",
								type: "email",
								validate: (value: string) =>
									value.trim() && !EMAIL_PATTERN.test(value.trim())
										? m.rsvp_validation_email_invalid()
										: undefined,
							},
						] as const
					).map((config) => (
						<form.Field
							key={config.name}
							name={config.name}
							validators={{
								onBlur: ({ value }) =>
									"validate" in config ? config.validate(value) : undefined,
							}}
						>
							{(field) => (
								<Field data-invalid={field.state.meta.errors.length > 0}>
									<FieldContent>
										<FieldLabel htmlFor={field.name}>{config.label}</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type={"type" in config ? config.type : "text"}
											autoComplete={config.autoComplete}
											aria-invalid={field.state.meta.errors.length > 0}
											value={field.state.value}
											placeholder={config.placeholder}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
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
					))}
				</div>

				<form.Field name="attending">
					{(field) => (
						<FieldSet>
							<FieldLegend variant="label">
								{m.rsvp_attending_label()}
							</FieldLegend>
							<RadioGroup
								value={field.state.value}
								onValueChange={(value) =>
									field.handleChange(value as "yes" | "no")
								}
								className="gap-2"
							>
								<label
									htmlFor="attending-yes"
									className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-(--lab-line) px-4 py-2 text-sm font-medium text-(--carbon) transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent"
								>
									<RadioGroupItem value="yes" id="attending-yes" />
									<span>{m.rsvp_attending_yes()}</span>
								</label>
								<label
									htmlFor="attending-no"
									className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-(--lab-line) px-4 py-2 text-sm font-medium text-(--carbon) transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent"
								>
									<RadioGroupItem value="no" id="attending-no" />
									<span>{m.rsvp_attending_no()}</span>
								</label>
							</RadioGroup>
						</FieldSet>
					)}
				</form.Field>

				<form.Field name="allergies">
					{(field) => (
						<Field>
							<FieldContent>
								<FieldLabel htmlFor={field.name}>
									{m.rsvp_allergies_label()}
								</FieldLabel>
								<Textarea
									id={field.name}
									name={field.name}
									value={field.state.value}
									placeholder={m.rsvp_allergies_placeholder()}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									rows={2}
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

				{errorMessage && (
					<p role="alert" className="text-sm font-medium text-(--coral)">
						{errorMessage}
					</p>
				)}
			</FieldGroup>
			<form.Subscribe selector={(state) => ({ canSubmit: state.canSubmit })}>
				{({ canSubmit }) => (
					<Button
						type="submit"
						disabled={!canSubmit || mutation.isPending}
						className="min-h-12 w-full bg-[#d9a75c]  hover:bg-[#c58c37]"
					>
						{mutation.isPending ? (
							<LoaderCircle data-icon="inline-start" className="animate-spin" />
						) : (
							<Send data-icon="inline-start" />
						)}
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
