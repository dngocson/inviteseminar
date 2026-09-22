import type { ApiErrorCode } from "#/lib/schemas";

const statusByCode: Record<ApiErrorCode, number> = {
	VALIDATION_ERROR: 422,
	NOT_FOUND: 404,
	RATE_LIMITED: 429,
	UNAUTHENTICATED: 401,
	FORBIDDEN: 403,
	CONFLICT: 409,
	INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
	code: ApiErrorCode;
	constructor(code: ApiErrorCode, message: string) {
		super(message);
		this.code = code;
	}
}

export function apiErrorResponse(
	code: ApiErrorCode,
	message: string,
): Response {
	return Response.json(
		{ error: { code, message } },
		{ status: statusByCode[code] },
	);
}

export function apiJsonResponse<T>(data: T, init?: ResponseInit): Response {
	return Response.json(data, init);
}

/** Wraps a route handler, turning thrown `ApiError`s into stable JSON error responses. */
export function withApiErrorHandling(
	handler: (request: Request) => Promise<Response>,
): (args: { request: Request }) => Promise<Response> {
	return async ({ request }) => {
		try {
			return await handler(request);
		} catch (error) {
			if (error instanceof ApiError) {
				return apiErrorResponse(error.code, error.message);
			}
			console.error(error);
			return apiErrorResponse("INTERNAL_ERROR", "Unexpected server error");
		}
	};
}
