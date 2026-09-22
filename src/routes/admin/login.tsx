import { useForm } from "@tanstack/react-form";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "#/components/ui/button";
import {
	Field,
	FieldContent,
	FieldError,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { useLoginMutation } from "#/hooks/use-admin-auth";
import { checkAdminSession } from "#/lib/admin-session-fn";
import { ApiRequestError } from "#/lib/api-client";
import { m } from "#/paraglide/messages";

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
		<div className="flex min-h-dvh items-center justify-center bg-muted/30 px-4">
			<div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-sm">
				<h1 className="text-xl font-semibold">{m.admin_login_title()}</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					{m.admin_login_subtitle()}
				</p>

				<form
					className="mt-6 space-y-4"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
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

					<Button
						type="submit"
						className="w-full"
						disabled={mutation.isPending}
					>
						{mutation.isPending
							? m.admin_login_submitting()
							: m.admin_login_submit()}
					</Button>
				</form>
			</div>
		</div>
	);
}
