import { useNavigate } from "@tanstack/react-router";
import type { Locale } from "#/lib/schemas";
import { cn } from "#/lib/utils";
import { locales } from "#/paraglide/runtime";

export function LanguageToggle({ locale }: { locale: Locale }) {
	const navigate = useNavigate({ from: "/" });

	return (
		<div className="inline-flex shrink-0 items-center rounded-md border border-(--lab-line) bg-(--lab-surface-strong) p-1">
			{locales.map((option) => (
				<button
					key={option}
					type="button"
					aria-label={option === "vi" ? "Tiếng Việt" : "English"}
					aria-pressed={option === locale}
					onClick={() =>
						navigate({ search: (prev) => ({ ...prev, l: option }) })
					}
					className={cn(
						"min-h-9 rounded-sm px-3 text-xs font-semibold uppercase transition-colors",
						option === locale
							? "bg-(--mineral-deep) text-white"
							: "text-(--carbon-soft) hover:text-(--carbon)",
					)}
				>
					{option}
				</button>
			))}
		</div>
	);
}
