// רינדור המודלים התלת־ממדיים (React Three Fiber). נטען בטעינה עצלה רק כשבוחרים "תלת־ממד".
// מצלמה אורתוגרפית אקסונומטרית, חומרים מט עם קווי מתאר, צל רך, צמיחה בכניסה, והנפשה לפי המושג.
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges, Html, Line, OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { scenes3d, type Anim, type Kind, type Prim, type Scene3, type V3 } from "./scenes3d";
import { toneOf } from "../../design/tone";

interface Pal { [k: string]: string }

function readPal(tone: string): Pal {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
  return {
    mass: v("--model-mass", "#eef0f1"), soft: v("--model-soft", "#dfe2e5"), ground: v("--model-ground", "#dadde0"),
    edge: v("--model-edge", "#3b3f45"), dark: v("--model-dark", "#5d636b"), glass: v("--model-glass", "#b8c6cf"),
    pad: v("--model-pad", "#c9ccd0"), road: v("--model-road", "#b9bcc0"), green: v("--model-green", "#b9c9a6"),
    water: v("--model-water", "#9fb8c6"), earth: v("--model-earth", "#c9b79c"), limit: v("--bad", "#a3485c"),
    tone: tone ? toneOf(tone).fill : v("--model-dark", "#5d636b"),
  };
}

const ease = (t: number) => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;

function useClock(reduced: boolean) {
  const t0 = useRef<number | null>(null);
  return () => {
    if (reduced) return 10;
    const now = performance.now();
    if (t0.current === null) t0.current = now;
    return (now - t0.current) / 1000;
  };
}

function Mat({ kind, pal }: { kind: Kind; pal: Pal }) {
  const c = pal[kind] ?? pal.mass;
  const transparent = kind === "glass" || kind === "soft" || kind === "water";
  return <meshStandardMaterial color={c} roughness={kind === "glass" ? 0.35 : 0.92} transparent={transparent} opacity={kind === "soft" ? 0.55 : kind === "glass" ? 0.6 : kind === "water" ? 0.8 : 1} />;
}

function Box({ p, pal, clock, delay }: { p: Extract<Prim, { t: "box" }>; pal: Pal; clock: () => number; delay: number }) {
  const g = useRef<THREE.Group>(null);
  const [w, h, d] = p.size;
  useFrame(() => {
    if (!p.grow || !g.current) return;
    const s = ease((clock() - delay) / 0.9);
    g.current.scale.y = Math.max(0.001, s);
  });
  return (
    <group ref={g} position={[p.at[0], p.y ?? 0, p.at[1]]} scale={[1, p.grow ? 0.001 : 1, 1]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <Mat kind={p.kind} pal={pal} />
        <Edges threshold={30} color={h > 0.2 ? pal.edge : pal.dark} />
      </mesh>
    </group>
  );
}

function Tree({ p, pal, clock, delay }: { p: Extract<Prim, { t: "tree" }>; pal: Pal; clock: () => number; delay: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!g.current) return;
    const s = ease((clock() - delay) / (p.grow ? 2.2 : 0.9));
    g.current.scale.setScalar(Math.max(0.001, s));
  });
  return (
    <group ref={g} position={[p.at[0], 0, p.at[1]]}>
      <mesh position={[0, p.h * 0.3, 0]} castShadow><cylinderGeometry args={[0.15, 0.2, p.h * 0.6, 8]} /><meshStandardMaterial color={pal.dark} roughness={1} /></mesh>
      <mesh position={[0, p.h * 0.72, 0]} castShadow><icosahedronGeometry args={[p.h * 0.28, 1]} /><meshStandardMaterial color={pal.green} roughness={0.95} flatShading /></mesh>
    </group>
  );
}

function Rain({ area, clock }: { area: [number, number, number, number]; clock: () => number }) {
  const ref = useRef<THREE.Points>(null);
  const N = 260;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = area[0] + Math.random() * (area[2] - area[0]);
      pos[i * 3 + 1] = Math.random() * 22;
      pos[i * 3 + 2] = area[1] + Math.random() * (area[3] - area[1]);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [area]);
  useFrame((_, dt) => {
    const a = ref.current?.geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (!a || clock() > 9) return;
    for (let i = 0; i < N; i++) {
      let y = a.getY(i) - dt * 14;
      if (y < 0) y = 22;
      a.setY(i, y);
    }
    a.needsUpdate = true;
  });
  return <points ref={ref} geometry={geo}><pointsMaterial size={0.12} color="#7f97a6" transparent opacity={0.7} /></points>;
}

function Flow({ path, clock }: { path: V3[]; clock: () => number }) {
  const ref = useRef<THREE.Group>(null);
  const pts = useMemo(() => path.map((p) => new THREE.Vector3(...p)), [path]);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0), [pts]);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const t = clock();
    g.children.forEach((c, i) => {
      const u = ((t * 0.18 + i / g.children.length) % 1 + 1) % 1;
      c.position.copy(curve.getPointAt(u));
    });
  });
  return <group ref={ref}>{Array.from({ length: 8 }, (_, i) => <mesh key={i}><sphereGeometry args={[0.28, 10, 10]} /><meshStandardMaterial color="#5f8ea6" /></mesh>)}</group>;
}

function Prims({ scene, pal, clock }: { scene: Scene3; pal: Pal; clock: () => number }) {
  const moverRefs = useRef<Record<number, THREE.Group | null>>({});
  const movers = (scene.anims ?? []).filter((a): a is Extract<Anim, { kind: "mover" }> => a.kind === "mover");
  const cars = (scene.anims ?? []).find((a): a is Extract<Anim, { kind: "cars" }> => a.kind === "cars");
  const fill = (scene.anims ?? []).find((a): a is Extract<Anim, { kind: "fill" }> => a.kind === "fill");
  useFrame(() => {
    const t = clock();
    for (const m of movers) {
      const g = moverRefs.current[m.prim];
      if (!g) continue;
      const u = ease((t - 0.8) / 2.6);
      g.position.set(m.from[0] + (m.to[0] - m.from[0]) * u, 0, m.from[1] + (m.to[1] - m.from[1]) * u);
    }
    if (cars) cars.prims.forEach((pi, i) => {
      const g = moverRefs.current[pi];
      if (!g) return;
      const u = ease((t - 0.6 - i * 0.35) / 1.1);
      g.position.z = 10 * (1 - u);
    });
    if (fill) {
      const g = moverRefs.current[fill.prim];
      if (g) g.scale.y = Math.max(0.05, ease((t - 1) / 6));
    }
  });
  return (
    <>
      {scene.prims.map((p, i) => {
        const delay = 0.05 * i;
        const isMover = movers.some((m) => m.prim === i) || cars?.prims.includes(i) || fill?.prim === i;
        const node =
          p.t === "box" ? <Box p={p} pal={pal} clock={clock} delay={delay} />
          : p.t === "tree" ? <Tree p={p} pal={pal} clock={clock} delay={delay} />
          : p.t === "cyl" ? (
            <mesh position={[p.at[0], (p.y ?? 0) + p.h / 2, p.at[1]]} castShadow receiveShadow>
              <cylinderGeometry args={[p.r, p.r, p.h, 24]} />
              <Mat kind={p.kind} pal={pal} />
              <Edges threshold={40} color={pal.edge} />
            </mesh>
          ) : (
            <Line points={p.pts} color={p.kind === "limit" || p.kind === "dim" ? pal.limit : p.kind === "flow" ? "#6d97ad" : pal.edge} lineWidth={p.kind === "flow" ? 2.5 : p.kind === "dim" ? 1.2 : 1} dashed={!!p.dashed} dashSize={0.8} gapSize={0.5} />
          );
        if (!isMover) return <group key={i}>{node}</group>;
        const base = p.t === "box" || p.t === "cyl" ? p.at : [0, 0];
        return (
          <group key={i} ref={(el) => { moverRefs.current[i] = el; }}>
            <group position={movers.some((m) => m.prim === i) ? [-base[0], 0, -base[1]] : [0, 0, 0]}>{node}</group>
          </group>
        );
      })}
    </>
  );
}

function Content({ scene, pal, active, reduced }: { scene: Scene3; pal: Pal; active: number | null; reduced: boolean }) {
  const clock = useClock(reduced);
  const [gw, gd] = scene.ground;
  const span = Math.max(gw, gd);
  return (
    <>
      <hemisphereLight args={["#ffffff", pal.ground, 0.85]} />
      <directionalLight position={[-span * 0.6, span, span * 0.5]} intensity={1.35} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005} shadow-camera-left={-span} shadow-camera-right={span} shadow-camera-top={span} shadow-camera-bottom={-span} shadow-camera-far={span * 4} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[gw, gd]} />
        <meshStandardMaterial color={pal.ground} roughness={1} />
      </mesh>
      <Prims scene={scene} pal={pal} clock={clock} />
      {(scene.anims ?? []).map((a, i) => a.kind === "rain" ? <Rain key={i} area={a.area} clock={clock} /> : a.kind === "flow" ? <Flow key={i} path={a.path} clock={clock} /> : null)}
      {(scene.labels ?? []).map((l, i) => (
        <Html key={`l${i}`} position={l.at} center zIndexRange={[20, 0]}>
          <span className={`l3 ${l.dim ? "dim3" : ""}`}>{l.text}</span>
        </Html>
      ))}
      {scene.callouts.map((c) => (
        <Html key={c.n} position={c.at} center zIndexRange={[20, 0]}>
          <span className={`c3 ${active === c.n ? "on" : ""} ${active !== null && active !== c.n ? "dim" : ""}`}>{c.n}</span>
        </Html>
      ))}
    </>
  );
}

export default function Scene3D({ id, scene: given, active, tone }: { id: string; scene?: Scene3 | null; active: number | null; tone?: string }) {
  const scene = given ?? scenes3d[id];
  const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pal = useMemo(() => readPal(tone ?? ""), [tone]);
  if (!scene) return null;
  const span = Math.max(...scene.ground);
  const dir = new THREE.Vector3(-0.62, 0.55, 0.62).normalize().multiplyScalar(120);
  return (
    <Canvas shadows orthographic dpr={[1, 2]} gl={{ antialias: true, alpha: true }} camera={{ position: dir.toArray(), zoom: 520 / span, near: -500, far: 1000 }} style={{ width: "100%", height: "100%" }}>
      <OrbitControls enableDamping makeDefault enableZoom zoomSpeed={0.9} minZoom={2} maxZoom={200} maxPolarAngle={Math.PI / 2.05} />
      <Content scene={scene} pal={pal} active={active} reduced={reduced} />
    </Canvas>
  );
}

