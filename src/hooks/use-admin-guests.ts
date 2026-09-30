import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "#/lib/api-client";
import { queryKeys } from "#/lib/query-keys";
import type {
	GuestCreateInput,
	GuestUpdateInput,
	GuestWithRsvpDto,
	Locale,
	RsvpStatsDto,
} from "#/lib/schemas";

export function useAdminGuestsQuery(enabled: boolean) {
	return useQuery({
		queryKey: queryKeys.adminGuests(),
		queryFn: () => apiFetch<GuestWithRsvpDto[]>("/api/admin/guests"),
		enabled,
	});
}

export function useAdminStatsQuery(enabled: boolean) {
	return useQuery({
		queryKey: queryKeys.adminStats(),
		queryFn: () => apiFetch<RsvpStatsDto>("/api/admin/stats"),
		enabled,
	});
}

function useInvalidateGuestData() {
	const queryClient = useQueryClient();
	return () => {
		queryClient.invalidateQueries({ queryKey: queryKeys.adminGuests() });
		queryClient.invalidateQueries({ queryKey: queryKeys.adminStats() });
	};
}

export function useCreateGuestMutation() {
	const invalidate = useInvalidateGuestData();
	return useMutation({
		mutationFn: (input: GuestCreateInput) =>
			apiFetch<GuestWithRsvpDto>("/api/admin/guests", {
				method: "POST",
				body: JSON.stringify(input),
			}),
		onSuccess: invalidate,
	});
}

export function useUpdateGuestMutation() {
	const invalidate = useInvalidateGuestData();
	return useMutation({
		mutationFn: ({ id, ...input }: GuestUpdateInput & { id: string }) =>
			apiFetch<GuestWithRsvpDto>(`/api/admin/guests/${id}`, {
				method: "PATCH",
				body: JSON.stringify(input),
			}),
		onSuccess: invalidate,
	});
}

export function useDeleteGuestMutation() {
	const invalidate = useInvalidateGuestData();
	return useMutation({
		mutationFn: (id: string) =>
			apiFetch<{ ok: true }>(`/api/admin/guests/${id}`, { method: "DELETE" }),
		onSuccess: invalidate,
	});
}

export function useRegenerateInviteCodeMutation() {
	const invalidate = useInvalidateGuestData();
	return useMutation({
		mutationFn: (id: string) =>
			apiFetch<GuestWithRsvpDto>(`/api/admin/guests/${id}/regenerate`, {
				method: "POST",
			}),
		onSuccess: invalidate,
	});
}

export function useSendInviteEmailMutation() {
	const invalidate = useInvalidateGuestData();
	return useMutation({
		mutationFn: ({ id, locale }: { id: string; locale: Locale }) =>
			apiFetch<GuestWithRsvpDto>(`/api/admin/guests/${id}/send-invite`, {
				method: "POST",
				body: JSON.stringify({ locale }),
			}),
		// A failed send is recorded on the guest row too, so refresh either way.
		onSettled: invalidate,
	});
}
