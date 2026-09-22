import type { ApiErrorBody, ApiErrorCode } from "#/lib/schemas";

export class ApiRequestError extends Error {
	code: ApiErrorCode;
	status: number;
	constructor(code: ApiErrorCode, message: string, status: number) {
		super(message);
		this.code = code;
		this.status = status;
	}
}

export async function apiFetch<T>(
	input: string,
	init?: RequestInit,
): Promise<T> {
	const response = await fetch(input, {
		...init,
		headers: { "Content-Type": "application/json", ...init?.headers },
		credentials: "same-origin",
	});

	if (!response.ok) {
		const body = (await response
			.json()
			.catch(() => null)) as ApiErrorBody | null;
		throw new ApiRequestError(
			body?.error.code ?? "INTERNAL_ERROR",
			body?.error.message ?? "Đã xảy ra lỗi, vui lòng thử lại",
			response.status,
		);
	}

	if (response.status === 204) return undefined as T;
	return response.json() as Promise<T>;
}
