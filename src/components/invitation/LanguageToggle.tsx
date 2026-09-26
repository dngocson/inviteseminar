import { useNavigate } from "@tanstack/react-router";
import type { Locale } from "#/lib/schemas";
import { cn } from "#/lib/utils";
import { locales } from "#/paraglide/runtime";

export function LanguageToggle({ locale }: { locale: Locale }) {
	const navigate = useNavigate({ from: "/" });

	const handleLocaleChange = (nextLocale: Locale) => {
		if (nextLocale === locale) {
			return;
		}

		navigate({
			search: (prev) => ({
				...prev,
				l: nextLocale,
			}),
		});
	};

	return (
		<div className="fixed right-4 bottom-4 z-50">
			<div className="flex items-center gap-0.5 rounded-full border border-(--lab-line) bg-(--lab-surface-strong)/90 p-1 shadow-lg backdrop-blur-md">
				{locales.map((option) => {
					const active = option === locale;

					return (
						<button
							key={option}
							type="button"
							aria-label={option === "vi" ? "Tiếng Việt" : "English"}
							aria-pressed={active}
							onClick={() => handleLocaleChange(option)}
							className={cn(
								"min-h-8 min-w-10 rounded-full px-3 text-[11px] font-bold uppercase tracking-wider transition-all duration-200",
								active
									? "bg-(--mineral-deep) text-white shadow-sm"
									: "text-(--carbon-soft) hover:bg-(--lab-line)/50 hover:text-(--carbon)",
							)}
						>
							{option}
						</button>
					);
				})}
			</div>
		</div>
	);
}
