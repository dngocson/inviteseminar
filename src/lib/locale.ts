import { useCallback, useEffect, useState } from "react";
import type { Locale } from "#/lib/schemas";
import {
	baseLocale,
	extractLocaleFromCookie,
	getLocale,
	overwriteGetLocale,
	setLocale,
} from "#/paraglide/runtime";

// SSR always renders `baseLocale`.
//
// On the first client render we also return `baseLocale`, regardless of
// what locale cookie already exists in the browser. This guarantees that
// the first client render matches SSR and avoids hydration mismatches.
let hydrated = false;

if (typeof window !== "undefined") {
	overwriteGetLocale(() =>
		hydrated ? (extractLocaleFromCookie() ?? baseLocale) : baseLocale,
	);
}

function markHydrated() {
	hydrated = true;
}

/**
 * Makes ambient Paraglide messages (`m.xxx()`) switch from the SSR locale
 * to the real browser locale after hydration.
 *
 * `localeKey` can be used as a React `key` to force a remount for components
 * that read the ambient locale through `m.xxx()` instead of receiving locale
 * through props.
 *
 * `rerender()` can be called after changing the locale manually because
 * changing the cookie itself does not tell React that `m.xxx()` needs to
 * be evaluated again.
 */
export function useLocaleRerender(): [localeKey: number, rerender: () => void] {
	const [tick, setTick] = useState(0);

	const rerender = useCallback(() => {
		setTick((current) => current + 1);
	}, []);

	useEffect(() => {
		// From this point onward, m.xxx() may read the real cookie-backed
		// locale instead of the SSR/base locale.
		markHydrated();

		// Re-render once after hydration so ambient m.xxx() messages can
		// switch from baseLocale to the browser's actual locale.
		rerender();
	}, [rerender]);

	return [tick, rerender];
}

/**
 * Invitation route locale synchronization.
 *
 * The `l` search parameter is the canonical source of truth:
 *
 *   /?l=vi
 *   /?l=en
 *
 * Whenever the URL locale changes:
 *
 *   URL locale
 *      ↓
 *   setLocale()
 *      ↓
 *   cookie updated
 *      ↓
 *   rerender()
 *      ↓
 *   m.xxx() reads the new locale
 *
 * The URL is intentionally not changed here. Navigation is handled by
 * TanStack Router / LanguageToggle.
 */
export function useLocaleSync(
	locale: Locale,
): [localeKey: number, rerender: () => void] {
	const [localeKey, rerender] = useLocaleRerender();

	useEffect(() => {
		// This effect runs after the hydration effect from
		// useLocaleRerender(), so the first client render remains hydration-safe.
		if (!hydrated) {
			return;
		}

		const currentLocale = getLocale();

		if (currentLocale !== locale) {
			setLocale(locale, { reload: false });

			// setLocale() updates the cookie, but React does not know that
			// components calling m.xxx() need to render again.
			rerender();
		}

		document.documentElement.lang = locale;
	}, [locale, rerender]);

	return [localeKey, rerender];
}
