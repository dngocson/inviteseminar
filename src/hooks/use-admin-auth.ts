import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "#/lib/api-client";
import { queryKeys } from "#/lib/query-keys";
import type { LoginInput } from "#/lib/schemas";

export function useAdminSessionQuery() {
	return useQuery({
		queryKey: queryKeys.adminSession(),
		queryFn: () => apiFetch<{ email: string | null }>("/api/admin/session"),
		retry: false,
	});
}

export function useLoginMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: LoginInput) =>
			apiFetch<{ email: string | null }>("/api/admin/login", {
				method: "POST",
				body: JSON.stringify(input),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.adminSession() });
		},
	});
}

export function useLogoutMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () =>
			apiFetch<{ ok: true }>("/api/admin/logout", { method: "POST" }),
		onSuccess: () => {
			queryClient.clear();
		},
	});
}
