import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RsvpForm } from "#/components/invitation/RsvpForm";
import { changeLocale } from "#/lib/locale";

// Radix RadioGroup measures itself; jsdom has no ResizeObserver.
globalThis.ResizeObserver ??= class {
	observe() {}
	unobserve() {}
	disconnect() {}
};

function renderForm() {
	const queryClient = new QueryClient();
	return render(
		<QueryClientProvider client={queryClient}>
			<RsvpForm
				code="Ab3x9Q2m"
				invitation={{ fullName: "Nguyen Van A", maxAttendees: 1, rsvp: null }}
			/>
		</QueryClientProvider>,
	);
}

describe("RsvpForm required contact details", () => {
	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
	});

	it("blocks an attending RSVP until company, position, phone and email are filled", async () => {
		changeLocale("vi");
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		renderForm();

		fireEvent.click(screen.getByRole("button", { name: /Gửi phản hồi/ }));

		expect(await screen.findByText("Vui lòng nhập tên công ty")).toBeTruthy();
		expect(screen.getByText("Vui lòng nhập vị trí hiện tại")).toBeTruthy();
		expect(screen.getByText("Vui lòng nhập số điện thoại")).toBeTruthy();
		expect(screen.getByText("Vui lòng nhập email")).toBeTruthy();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("clears the required errors when the guest switches to not attending", async () => {
		changeLocale("vi");
		vi.stubGlobal("fetch", vi.fn());
		renderForm();

		fireEvent.click(screen.getByRole("button", { name: /Gửi phản hồi/ }));
		expect(await screen.findByText("Vui lòng nhập tên công ty")).toBeTruthy();

		fireEvent.click(screen.getByLabelText("Tôi không thể tham dự"));
		expect(screen.queryByText("Vui lòng nhập tên công ty")).toBeNull();
	});
});
