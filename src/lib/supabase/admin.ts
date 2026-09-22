import { createClient } from "@supabase/supabase-js";

import { env } from "#/env";

/**
 * Service-role client. Server-only — every table has RLS enabled with no
 * public policies, so this is the only client that can read/write guests,
 * rsvps, or admin_users. Never import this module from client code.
 */
export function getSupabaseAdminClient() {
	return createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}
