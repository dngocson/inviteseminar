import { useCallback, useEffect, useState } from "react";
import type { Locale } from "#/lib/schemas";
import {
	baseLocale,
	extractLocaleFromCookie,
	getLocale,
	overwriteGetLocale,
	setLocale,
} from "#/paraglide/runtime";

// SSR always renders `baseLocale` (see docs/process.md "Known limitations" —
// the server has no per-request access to the locale cookie). A returning
// visitor's browser can already hold a *different* locale cookie from an
// earlier page (e.g. they switched the invitation card to English, then
// later opened /admin fresh) — client hydration must not read that cookie
// on its very first render, or React throws a hydration mismatch (the
// server's Vietnamese text vs. the client's English text) and discards and
// rebuilds the whole subtree.
//
// This override keeps every `m.xxx()` call reporting `baseLocale` — matching
// SSR exactly — until `markHydrated()` runs (once, from `useLocaleRerender`
// in each route's top-level component), at which point it starts reporting
// the real cookie-backed locale.
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
 * Call once from the top-level component of every route (not from a shared
 * layout that only forwards `children` — a re-render triggered there would
 * be skipped for children whose element reference didn't change). Forces
 * that component to re-render exactly once right after hydration, so its
 * `m.xxx()` calls — and everything it constructs below it — can safely
 * switch from the server's base-locale text to the visitor's real locale.
 *
 * Returns `[localeKey, rerender]`:
 * - `rerender`: call after changing the locale yourself (e.g. an in-page
 *   switcher that doesn't navigate) to force the same kind of correction,
 *   since setting the cookie alone doesn't make React re-run `m.xxx()`.
 * - `localeKey`: put this on a wrapping element's `key` prop. Components
 *   that only read the ambient locale via `m.xxx()` — without receiving it
 *   as a prop — give React Compiler no reason to think their output needs
 *   to change, so it can memoize past a plain re-render and leave stale
 *   text on screen. Changing `key` forces a full remount, which bypasses
 *   that memoization unconditionally. (The invitation card doesn't need
 *   this — it threads `locale` through props explicitly, which the
 *   compiler already tracks — but nothing else in this app does.)
 */
export function useLocaleRerender(): [localeKey: number, rerender: () => void] {
	const [tick, setTick] = useState(0);
	const rerender = useCallback(() => setTick((t) => t + 1), []);

	useEffect(() => {
		markHydrated();
		rerender();
	}, [rerender]);

	return [tick, rerender];
}

/**
 * Invitation-route-specific: on top of the hydration-safe re-render above,
 * syncs Paraglide's cookie-backed locale to the `l` search param — the
 * canonical, shareable source of truth for this app's locale (not a path
 * prefix, so Paraglide's own URL strategy doesn't apply; see
 * vite.config.ts) — and keeps `document.lang` in sync.
 */
export function useLocaleSync(locale: Locale) {
	useLocaleRerender();

	if (hydrated && getLocale() !== locale) {
		setLocale(locale, { reload: false });
	}

	useEffect(() => {
		document.documentElement.lang = locale;
	}, [locale]);
}
