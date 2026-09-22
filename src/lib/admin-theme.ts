import { useEffect } from "react";

/**
 * shadcn's Dialog/DropdownMenu/Select portal their content straight to
 * `document.body`, outside whatever React tree renders `.admin-theme` — CSS
 * custom properties only inherit through the actual DOM, not the React
 * component tree, so a class scoped to a wrapping `<div>` would style the
 * page but leave every dialog/menu/select popover in the default (unthemed)
 * colors. Toggling the class on `<body>` itself keeps it an ancestor of
 * those portaled nodes too.
 */
export function useAdminTheme() {
	useEffect(() => {
		document.body.classList.add("admin-theme");
		return () => {
			document.body.classList.remove("admin-theme");
		};
	}, []);
}
