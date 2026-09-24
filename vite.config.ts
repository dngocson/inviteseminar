import { paraglideVitePlugin } from "@inlang/paraglide-js";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	// Vite minifies the client bundle by default but leaves server (SSR)
	// output unminified; minify both so the whole `dist` ships compact.
	build: {
		minify: true,
		cssMinify: true,
		sourcemap: false,
		reportCompressedSize: false,
	},
	environments: {
		client: {
			build: {
				rolldownOptions: {
					output: {
						// Strip every comment (incl. license banners) and drop
						// console/debugger from the browser bundle. Server keeps its
						// console output so production errors still reach the logs.
						comments: false,
						minify: {
							compress: { dropConsole: true, dropDebugger: true },
							mangle: true,
						},
					},
				},
			},
		},
		ssr: {
			build: {
				minify: true,
				rolldownOptions: { output: { comments: false } },
			},
		},
	},
	plugins: [
		devtools({
			// The browser<->terminal console relay re-prints its whole
			// accumulated history on every new message, so any handful of
			// warnings (e.g. a one-time three.js deprecation notice, a
			// hydration mismatch) snowballs into a multi-hundred-MB log and
			// visibly stalls the page. Keep the router/query devtools panels;
			// just skip the console piping.
			consolePiping: { enabled: false },
		}),
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./src/paraglide",
			// The invitation URL carries locale in `?l=vi|en`, not a path prefix,
			// so Paraglide's own URL strategy doesn't apply here. `src/lib/locale.ts`
			// syncs the cookie strategy from that search param client-side instead.
			strategy: ["cookie", "baseLocale"],
		}),
		tailwindcss(),
		tanstackStart(),
		// Packages the server for the host it builds on (auto-detects Vercel).
		nitro(),
		viteReact(),
		babel({ presets: [reactCompilerPreset()] }),
	],
});

export default config;
