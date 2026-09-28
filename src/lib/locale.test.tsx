import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { changeLocale, LocaleProvider, useMessages } from "#/lib/locale";
import { locales } from "#/paraglide/runtime";

function Title() {
	const m = useMessages();
	return <p data-testid="text">{m.admin_dashboard_title()}</p>;
}

function TestDashboard() {
	const m = useMessages();
	return (
		<div>
			<h1 data-testid="parent">{m.admin_guest_list_title()}</h1>
			<Title />
			{locales.map((l) => (
				<button key={l} type="button" onClick={() => changeLocale(l)}>
					{l}
				</button>
			))}
		</div>
	);
}

describe("useMessages", () => {
	afterEach(cleanup);

	it("updates parent and child text after clicking a locale switcher", () => {
		act(() => changeLocale("vi"));
		render(<TestDashboard />);
		expect(screen.getByTestId("text").textContent).toBe("Quản lý khách mời");

		fireEvent.click(screen.getByText("en"));

		expect(screen.getByTestId("text").textContent).toBe("Guest management");
		expect(screen.getByTestId("parent").textContent).toBe("Guest list");
	});

	it("prefers the LocaleProvider locale over the stored one", () => {
		act(() => changeLocale("vi"));
		render(
			<LocaleProvider locale="en">
				<Title />
			</LocaleProvider>,
		);
		expect(screen.getByTestId("text").textContent).toBe("Guest management");
	});
});
