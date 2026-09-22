import { useNavigate } from "@tanstack/react-router";
import type { Locale } from "#/lib/schemas";
import { locales } from "#/paraglide/runtime";

export function LanguageToggle({ locale }: { locale: Locale }) {
	const navigate = useNavigate({ from: "/" });

	return (
		<div className="inline-flex items-center gap-1 rounded-full border border-(--lab-line) bg-(--lab-surface-strong) p-1">
			{locales.map((option) => (
				<button
					key={option}
					type="button"
					aria-pressed={option === locale}
					onClick={() =>
						navigate({ search: (prev) => ({ ...prev, l: option }) })
					}
					className={`min-h-[32px] rounded-full px-3 text-xs font-semibold uppercase tracking-wide transition-colors ${
						option === locale
							? "bg-(--carbon) text-white"
							: "text-(--carbon-soft) hover:text-(--carbon)"
					}`}
				>
					{option}
				</button>
			))}
		</div>
	);
}
