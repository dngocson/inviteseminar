/**
 * Best-effort in-memory rate limiter, keyed per warm serverless instance.
 * Good enough to blunt casual abuse of the public lookup/RSVP endpoints; it
 * is not a substitute for a shared store (e.g. Redis) if stronger guarantees
 * are ever needed across instances/regions.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
	key: string,
	{ limit, windowMs }: { limit: number; windowMs: number },
): boolean {
	const now = Date.now();
	const bucket = buckets.get(key);

	if (!bucket || bucket.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return true;
	}

	if (bucket.count >= limit) return false;

	bucket.count += 1;
	return true;
}

export function getClientIp(request: Request): string {
	const forwardedFor = request.headers.get("x-forwarded-for");
	if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
	return request.headers.get("x-real-ip") ?? "unknown";
}
