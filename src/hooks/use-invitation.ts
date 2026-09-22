import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "#/lib/api-client";
import { queryKeys } from "#/lib/query-keys";
import type { InvitationDto, RsvpDto, RsvpSubmitInput } from "#/lib/schemas";

export function useInvitationQuery(code: string | undefined) {
	return useQuery({
		queryKey: queryKeys.invitation(code ?? ""),
		queryFn: () => apiFetch<InvitationDto>(`/api/invitations/${code}`),
		enabled: Boolean(code),
		retry: false,
	});
}

export function useSubmitRsvpMutation(code: string | undefined) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: Omit<RsvpSubmitInput, "code">) =>
			apiFetch<RsvpDto>("/api/rsvp", {
				method: "POST",
				body: JSON.stringify({ ...input, code }),
			}),
		onSuccess: (rsvp) => {
			if (!code) return;
			queryClient.setQueryData<InvitationDto | undefined>(
				queryKeys.invitation(code),
				(current) => (current ? { ...current, rsvp } : current),
			);
		},
	});
}
