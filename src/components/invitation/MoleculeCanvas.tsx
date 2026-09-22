import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface Atom {
	id: string;
	position: [number, number, number];
	radius: number;
	color: string;
}

// A small, hand-placed procedural cluster — no external model needed. One
// larger "core" atom, a coral highlight, and a few mineral satellites
// connected by bonds, loosely resembling a molecule diagram.
const ATOMS: Atom[] = [
	{ id: "core", position: [0, 0, 0], radius: 0.62, color: "#3f9c96" },
	{ id: "sat-1", position: [1.05, 0.55, 0.2], radius: 0.34, color: "#cdbfa0" },
	{ id: "sat-2", position: [-0.95, 0.5, -0.35], radius: 0.3, color: "#cdbfa0" },
	{ id: "sat-3", position: [0.35, -1.0, 0.4], radius: 0.26, color: "#ff6a52" },
	{
		id: "sat-4",
		position: [-0.6, -0.85, -0.15],
		radius: 0.24,
		color: "#cdbfa0",
	},
	{ id: "sat-5", position: [0.15, 0.95, -0.7], radius: 0.22, color: "#3f9c96" },
];

const atomById = new Map(ATOMS.map((atom) => [atom.id, atom]));

const BONDS: Array<[string, string]> = [
	["core", "sat-1"],
	["core", "sat-2"],
	["core", "sat-3"],
	["core", "sat-4"],
	["core", "sat-5"],
];

function Bond({
	from,
	to,
}: {
	from: [number, number, number];
	to: [number, number, number];
}) {
	const { position, rotation, length } = useMemo(() => {
		const start = new THREE.Vector3(...from);
		const end = new THREE.Vector3(...to);
		const mid = start.clone().add(end).multiplyScalar(0.5);
		const dir = end.clone().sub(start);
		const quaternion = new THREE.Quaternion().setFromUnitVectors(
			new THREE.Vector3(0, 1, 0),
			dir.clone().normalize(),
		);
		return {
			position: mid.toArray() as [number, number, number],
			rotation: new THREE.Euler().setFromQuaternion(quaternion),
			length: dir.length(),
		};
	}, [from, to]);

	return (
		<mesh position={position} rotation={rotation}>
			<cylinderGeometry args={[0.035, 0.035, length, 12]} />
			<meshStandardMaterial
				color="#14181a"
				opacity={0.25}
				transparent
				roughness={0.6}
			/>
		</mesh>
	);
}

function MoleculeGroup({ reducedMotion }: { reducedMotion: boolean }) {
	const group = useRef<THREE.Group>(null);

	useFrame((state, delta) => {
		if (!group.current) return;
		if (reducedMotion) return;

		group.current.rotation.y += delta * 0.15;
		// Gentle pointer parallax — pointer-only, never device orientation, so
		// it never triggers a motion-sensor permission prompt on iOS.
		const targetX = state.pointer.y * 0.25;
		const targetZ = -state.pointer.x * 0.25;
		group.current.rotation.x = THREE.MathUtils.lerp(
			group.current.rotation.x,
			targetX,
			0.05,
		);
		group.current.rotation.z = THREE.MathUtils.lerp(
			group.current.rotation.z,
			targetZ,
			0.05,
		);
	});

	return (
		<group ref={group}>
			{BONDS.map(([fromId, toId]) => {
				const from = atomById.get(fromId);
				const to = atomById.get(toId);
				if (!from || !to) return null;
				return (
					<Bond
						key={`${fromId}-${toId}`}
						from={from.position}
						to={to.position}
					/>
				);
			})}
			{ATOMS.map((atom) => (
				<mesh key={atom.id} position={atom.position}>
					<sphereGeometry args={[atom.radius, 48, 48]} />
					<meshPhysicalMaterial
						color={atom.color}
						roughness={0.15}
						metalness={0.05}
						transmission={0.75}
						thickness={1.2}
						ior={1.3}
						clearcoat={1}
						clearcoatRoughness={0.1}
					/>
				</mesh>
			))}
		</group>
	);
}

export function MoleculeCanvas({
	reducedMotion,
	active,
}: {
	reducedMotion: boolean;
	/** Whether the scene is in view and the tab is visible — false pauses the render loop entirely. */
	active: boolean;
}) {
	return (
		<Canvas
			dpr={[1, 1.5]}
			frameloop={active ? "always" : "demand"}
			gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
			camera={{ position: [0, 0, 4.2], fov: 42 }}
		>
			<ambientLight intensity={0.9} />
			<directionalLight position={[3, 4, 2]} intensity={1.4} />
			<directionalLight
				position={[-3, -2, -2]}
				intensity={0.4}
				color="#3f9c96"
			/>
			<MoleculeGroup reducedMotion={reducedMotion} />
		</Canvas>
	);
}
