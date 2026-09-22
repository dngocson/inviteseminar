import type { ReactNode } from "react";
import { LanguageToggle } from "#/components/invitation/LanguageToggle";
import type { Locale } from "#/lib/schemas";

export function InvitationShell({
	locale,
	children,
}: {
	locale: Locale;
	children: ReactNode;
}) {
	return (
		<div className="min-h-dvh w-full bg-[#eef0ee] py-0 sm:py-10">
			<div className="lab-theme relative mx-auto min-h-dvh w-full max-w-[425px] overflow-x-hidden sm:min-h-0 sm:rounded-[2rem] sm:shadow-2xl">
				<div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-end p-4">
					<div className="pointer-events-auto">
						<LanguageToggle locale={locale} />
					</div>
				</div>
				{children}
			</div>
		</div>
	);
}
