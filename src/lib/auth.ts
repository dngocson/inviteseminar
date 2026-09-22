import type { User } from "@supabase/supabase-js";
import { ApiError } from "#/lib/api-response";
import { getSupabaseAdminClient } from "#/lib/supabase/admin";
import { createSupabaseServerClient } from "#/lib/supabase/server";

/**
 * Verifies the request's session cookie against Supabase Auth, then checks
 * `admin_users` membership with the service-role client (RLS blocks every
 * other role from reading that table). Every admin API route must call this
 * itself — a client-side route guard is UX only, not a security boundary.
 */
export async function requireAdminUser(request: Request): Promise<{
	user: User;
	applyCookies: (response: Response) => Response;
}> {
	const { supabase, applyCookies } = createSupabaseServerClient(request);

	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) {
		throw new ApiError("UNAUTHENTICATED", "Bạn cần đăng nhập để tiếp tục");
	}

	const admin = getSupabaseAdminClient();
	const { data: adminRow, error: adminLookupError } = await admin
		.from("admin_users")
		.select("user_id")
		.eq("user_id", user.id)
		.maybeSingle();

	if (adminLookupError) {
		throw new ApiError("INTERNAL_ERROR", "Không thể xác thực quyền quản trị");
	}
	if (!adminRow) {
		throw new ApiError("FORBIDDEN", "Tài khoản không có quyền quản trị");
	}

	return { user, applyCookies };
}
