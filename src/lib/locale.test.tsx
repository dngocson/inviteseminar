import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useLocaleRerender } from "#/lib/locale";
import { m } from "#/paraglide/messages";
import { locales, setLocale } from "#/paraglide/runtime";

function TestDashboard() {
	const [localeKey, rerender] = useLocaleRerender();
	return (
		<div key={localeKey}>
			<p data-testid="text">{m.admin_dashboard_title()}</p>
			{locales.map((l) => (
				<button
					key={l}
					type="button"
					onClick={() => {
						setLocale(l, { reload: false });
						rerender();
					}}
				>
					{l}
				</button>
			))}
		</div>
	);
}

describe("useLocaleRerender", () => {
	it("updates rendered text after clicking a locale switcher", () => {
		render(<TestDashboard />);
		expect(screen.getByTestId("text").textContent).toBe("Quản lý khách mời");

		fireEvent.click(screen.getByText("en"));

		expect(screen.getByTestId("text").textContent).toBe("Guest management");
	});
});
