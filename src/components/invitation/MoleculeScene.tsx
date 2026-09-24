import type { ReactNode } from "react";
import { Component, lazy, Suspense, useEffect, useRef, useState } from "react";

// The canvas only ever mounts client-side (see `mounted` below), so stub it
// out of the SSR build entirely to keep three.js out of the server function.
const MoleculeCanvas = import.meta.env.SSR
	? () => null
	: lazy(() =>
			import("#/components/invitation/MoleculeCanvas").then((mod) => ({
				default: mod.MoleculeCanvas,
			})),
		);

function supportsWebGL(): boolean {
	try {
		const canvas = document.createElement("canvas");
		return Boolean(
			window.WebGLRenderingContext &&
				(canvas.getContext("webgl") || canvas.getContext("experimental-webgl")),
		);
	} catch {
		return false;
	}
}

function StaticFallback() {
	return (
		<div
			aria-hidden="true"
			className="h-full w-full"
			style={{
				background:
					"radial-gradient(circle at 38% 32%, rgba(63,156,150,0.55), transparent 60%), radial-gradient(circle at 65% 60%, rgba(255,106,82,0.35), transparent 55%), radial-gradient(circle at 50% 78%, rgba(205,191,160,0.45), transparent 60%)",
			}}
		/>
	);
}

class CanvasErrorBoundary extends Component<
	{ children: ReactNode; fallback: ReactNode },
	{ hasError: boolean }
> {
	state = { hasError: false };

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch(error: unknown) {
		console.error(
			"MoleculeScene render error, falling back to static visual",
			error,
		);
	}

	render() {
		return this.state.hasError ? this.props.fallback : this.props.children;
	}
}

/**
 * Full-bleed procedural molecule visual for the hero. Client-only (lazy
 * loaded, keeps three.js out of the initial and admin bundles), paused
 * off-viewport/hidden-tab, and degrades to a static CSS gradient whenever
 * WebGL is unavailable, rendering throws, or the visitor prefers reduced
 * motion.
 */
export function MoleculeScene() {
	const containerRef = useRef<HTMLDivElement>(null);
	const [mounted, setMounted] = useState(false);
	const [webglOk, setWebglOk] = useState(true);
	const [reducedMotion, setReducedMotion] = useState(false);
	const [inView, setInView] = useState(true);
	const [tabVisible, setTabVisible] = useState(true);

	useEffect(() => {
		setMounted(true);
		setWebglOk(supportsWebGL());

		const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		setReducedMotion(motionQuery.matches);
		const onMotionChange = (e: MediaQueryListEvent) =>
			setReducedMotion(e.matches);
		motionQuery.addEventListener("change", onMotionChange);

		const onVisibilityChange = () =>
			setTabVisible(document.visibilityState === "visible");
		document.addEventListener("visibilitychange", onVisibilityChange);

		let observer: IntersectionObserver | undefined;
		if (containerRef.current) {
			observer = new IntersectionObserver(
				([entry]) => setInView(Boolean(entry?.isIntersecting)),
				{ threshold: 0.1 },
			);
			observer.observe(containerRef.current);
		}

		return () => {
			motionQuery.removeEventListener("change", onMotionChange);
			document.removeEventListener("visibilitychange", onVisibilityChange);
			observer?.disconnect();
		};
	}, []);

	const shouldRenderCanvas = mounted && webglOk;

	return (
		<div ref={containerRef} className="absolute inset-0 overflow-hidden">
			{shouldRenderCanvas ? (
				<CanvasErrorBoundary fallback={<StaticFallback />}>
					<Suspense fallback={<StaticFallback />}>
						<MoleculeCanvas
							reducedMotion={reducedMotion}
							active={inView && tabVisible && !reducedMotion}
						/>
					</Suspense>
				</CanvasErrorBoundary>
			) : (
				<StaticFallback />
			)}
		</div>
	);
}
