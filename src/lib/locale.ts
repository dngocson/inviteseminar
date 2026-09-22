import { useEffect, useState } from "react";
import type { Locale } from "#/lib/schemas";
import { getLocale, setLocale } from "#/paraglide/runtime";

/**
 * Keeps Paraglide's active locale (cookie strategy) in sync with the `l`
 * search param, which is the canonical, shareable source of truth for this
 * app's locale — not a path prefix, so Paraglide's own URL strategy doesn't
 * apply (see vite.config.ts).
 *
 * The sync is skipped on the very first (hydrating) render so the client's
 * initial markup matches the server-rendered base-locale HTML exactly; a
 * `hydrated` flag flips true right after mount, and every render after that
 * corrects the locale synchronously (so `m.xxx()` calls later in the same
 * render already reflect it) before `document.lang` is updated in an effect.
 */
export function useLocaleSync(locale: Locale) {
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		setHydrated(true);
	}, []);

	if (hydrated && getLocale() !== locale) {
		setLocale(locale, { reload: false });
	}

	useEffect(() => {
		document.documentElement.lang = locale;
	}, [locale]);
}
