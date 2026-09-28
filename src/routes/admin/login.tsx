import { useForm } from "@tanstack/react-form";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { ArrowLeft, Atom, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/ui/button";
import {
	Field,
	FieldContent,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { eventConfig, localized } from "#/content/event";
import { useLoginMutation } from "#/hooks/use-admin-auth";
import { checkAdminSession } from "#/lib/admin-session-fn";
import { useAdminTheme } from "#/lib/admin-theme";
import { ApiRequestError } from "#/lib/api-client";
import { useLocale, useMessages } from "#/lib/locale";

export const Route = createFileRoute("/admin/login")({
	beforeLoad: async () => {
		const session = await checkAdminSession();
		if (session.authenticated) {
			throw redirect({ to: "/admin" });
		}
	},
	component: AdminLoginPage,
});

function AdminLoginPage() {
	const m = useMessages();
	useAdminTheme();
	const locale = useLocale();
	const navigate = useNavigate();
	const mutation = useLoginMutation();
	const [formError, setFormError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: { email: "", password: "" },
		onSubmit: async ({ value }) => {
			setFormError(null);
			try {
				await mutation.mutateAsync(value);
				await navigate({ to: "/admin" });
			} catch (error) {
				setFormError(
					error instanceof ApiRequestError
						? error.message
						: m.admin_login_error(),
				);
			}
		},
	});

	return (
		<div className="admin-login relative flex min-h-dvh items-center justify-center px-6 py-24">
			<Button
				variant="ghost"
				asChild
				className="absolute top-6 left-4 sm:left-8"
			>
				<Link to="/" search={{ l: locale }}>
					<ArrowLeft data-icon="inline-start" />
					{m.admin_open_event()}
				</Link>
			</Button>
			<div className="w-full max-w-sm">
				<Atom
					className="mb-8 size-12 text-primary"
					strokeWidth={1}
					aria-hidden="true"
				/>

				<h1 className="display-title mt-6 text-4xl font-medium">
					{m.admin_login_title()}
				</h1>
				<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
					{m.admin_login_subtitle()}
				</p>

				<form
					className="mt-9 flex flex-col gap-5"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<FieldGroup>
						<form.Field name="email">
							{(field) => (
								<Field>
									<FieldContent>
										<FieldLabel htmlFor={field.name}>
											{m.admin_login_email_label()}
										</FieldLabel>
										<Input
											id={field.name}
											type="email"
											autoComplete="username"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											required
										/>
									</FieldContent>
								</Field>
							)}
						</form.Field>

						<form.Field name="password">
							{(field) => (
								<Field>
									<FieldContent>
										<FieldLabel htmlFor={field.name}>
											{m.admin_login_password_label()}
										</FieldLabel>
										<Input
											id={field.name}
											type="password"
											autoComplete="current-password"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											required
										/>
									</FieldContent>
								</Field>
							)}
						</form.Field>

						{formError && <FieldError>{formError}</FieldError>}
					</FieldGroup>

					<Button
						type="submit"
						className="w-full"
						disabled={mutation.isPending}
					>
						{mutation.isPending && (
							<LoaderCircle data-icon="inline-start" className="animate-spin" />
						)}
						{mutation.isPending
							? m.admin_login_submitting()
							: m.admin_login_submit()}
					</Button>
				</form>
				<p className="mt-10 border-t pt-5 text-xs leading-relaxed text-muted-foreground">
					{localized(eventConfig.organizer, locale)}
				</p>
			</div>
		</div>
	);
}
