export const queryKeys = {
	invitation: (code: string) => ["invitation", code] as const,
	adminSession: () => ["admin", "session"] as const,
	adminGuests: () => ["admin", "guests"] as const,
	adminStats: () => ["admin", "stats"] as const,
};
