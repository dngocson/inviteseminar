import {
	createContext,
	createElement,
	type ReactNode,
	useContext,
	useEffect,
	useSyncExternalStore,
} from "react";
import type { Locale } from "#/lib/schemas";
import { m } from "#/paraglide/messages";
import {
	baseLocale,
	extractLocaleFromCookie,
	overwriteGetLocale,
	setLocale,
} from "#/paraglide/runtime";

// Why not call the ambient `m.xxx()` in render?
//
// The React Compiler memoizes `m.xxx()` forever: it has no reactive input,
// so switching the locale never re-evaluates it. Components read messages
// through `useMessages()` instead, which returns a locale-bound copy of `m`.
// That copy changes identity with the locale, so the compiler recomputes
// exactly what depends on it — no remount, no page "reload".
//
// Ambient `m.xxx()` / `getLocale()` stay fine outside render (event
// handlers, toasts, route `head`).

// SSR always renders `baseLocale`. Ambient reads also return `baseLocale`
// until the client has hydrated, so the first client render matches SSR.
let hydrated = false;

if (typeof window !== "undefined") {
	overwriteGetLocale(() =>
		hydrated ? (extractLocaleFromCookie() ?? baseLocale) : baseLocale,
	);
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

function getClientSnapshot(): Locale {
	return extractLocaleFromCookie() ?? baseLocale;
}

function getServerSnapshot(): Locale {
	return baseLocale;
}

/** Persists the locale (cookie) and re-renders every `useLocale()` reader. */
export function changeLocale(locale: Locale) {
	if (getClientSnapshot() !== locale) {
		setLocale(locale, { reload: false });
	}
	document.documentElement.lang = locale;
	for (const listener of listeners) {
		listener();
	}
}

/**
 * Pins the locale for a subtree, e.g. the invitation page where the `?l=`
 * search param is the source of truth. Because the URL is known on the
 * server too, SSR and hydration render the right language immediately.
 */
const LocaleOverrideContext = createContext<Locale | null>(null);

export function LocaleProvider({
	locale,
	children,
}: {
	locale: Locale;
	children: ReactNode;
}) {
	return createElement(
		LocaleOverrideContext.Provider,
		{ value: locale },
		children,
	);
}

export function useLocale(): Locale {
	const override = useContext(LocaleOverrideContext);
	const stored = useSyncExternalStore(
		subscribe,
		getClientSnapshot,
		getServerSnapshot,
	);

	useEffect(() => {
		hydrated = true;
	}, []);

	return override ?? stored;
}

type Messages = typeof m;

const boundMessages = new Map<Locale, Messages>();

function bindMessages(locale: Locale): Messages {
	let bound = boundMessages.get(locale);
	if (!bound) {
		bound = Object.fromEntries(
			Object.entries(m).map(([key, message]) => [
				key,
				(inputs?: object, options?: object) =>
					(message as (i: object, o: object) => string)(inputs ?? {}, {
						...options,
						locale,
					}),
			]),
		) as Messages;
		boundMessages.set(locale, bound);
	}
	return bound;
}

/** Messages bound to the current locale; use instead of `m` in render. */
export function useMessages(): Messages {
	return bindMessages(useLocale());
}

/**
 * Invitation route: mirrors the URL locale (`?l=vi|en`) into the cookie so
 * ambient reads (toasts, other pages) follow it. Rendering itself reads the
 * URL locale through `LocaleProvider`, so nothing waits on this effect.
 */
export function useLocaleSync(locale: Locale) {
	useEffect(() => {
		changeLocale(locale);
	}, [locale]);
}
