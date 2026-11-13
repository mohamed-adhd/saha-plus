"use client";

import { Environment, Html, Scroll, ScrollControls, useGLTF, useProgress, useScroll } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Suspense, useMemo, useRef, useState, type MutableRefObject, type RefObject } from "react";

const MODEL_PATH = "/models/human.glb";
const CAMERA_CONFIG = {
  modelHeight: 4,
  cameraFov: 36,
  headFov: 20,
  headDistance: 4.7,
  chestDistance: 4.7,
  coreDistance: 4.15,
  damping: 2.6,
  pages: 6,
  scrollDamping: 0.3,
  background: "#10241b",
  fogNear: 8,
  fogFar: 22,
  headRatio: 0.93,
  chestRatio: 0.72,
  coreRatio: 0.52,
  feetRatio: 0.035,
} as const;

type CameraKeyframe = { t: number; y: number; distance: number; label: string };
type ModelYLevels = { head: number; chest: number; core: number; feet: number };
const CAMERA_KEYFRAMES: CameraKeyframe[] = [
  { t: 0, y: 2, distance: 11.5, label: "hero" },
  { t: 0.18, y: 0, distance: CAMERA_CONFIG.headDistance, label: "head" },
  { t: 0.38, y: 0, distance: CAMERA_CONFIG.chestDistance, label: "chest" },
  { t: 0.58, y: 0, distance: CAMERA_CONFIG.coreDistance, label: "core" },
  { t: 0.8, y: 0, distance: CAMERA_CONFIG.coreDistance, label: "feet" },
  { t: 1, y: 0, distance: CAMERA_CONFIG.coreDistance, label: "hold" },
];

const BODY_SECTIONS = [
  { id: "head-mind", title: "Head and Mind", description: "Your brain, senses and nervous system help you understand and respond to the world.", detail: "Rest, focus and emotional wellbeing are connected parts of caring for your mind.", zone: "HEAD", side: "left" },
  { id: "chest-heart", title: "Chest and Heart", description: "Your heart and lungs work together to move oxygen through your body.", detail: "The heart, lungs and blood vessels form a closely connected system that supports everyday activity.", zone: "CHEST", side: "right" },
  { id: "core-digestion", title: "Core and Digestion", description: "Your digestive system helps break down food and absorb the nutrients your body needs.", detail: "Digestion involves a connected set of organs that process food and support the rest of the body.", zone: "CORE", side: "left" },
  { id: "legs-strength", title: "Legs and Strength", description: "Large muscle groups help you stand, walk, climb and move through the day.", detail: "Strength, balance and mobility work together in many ordinary movements.", zone: "LEGS", side: "right" },
] as const;

type BodySceneProps = { progressRef: RefObject<HTMLElement> };
let modelDiagnosticsLogged = false;

function smoothKeyframe(progress: number, levels: ModelYLevels): { y: number; distance: number } {
  const frames = CAMERA_KEYFRAMES.map((frame) => ({
    ...frame,
    y: frame.label === "hero" ? levels.core : frame.label === "head" ? levels.head :
      frame.label === "chest" ? levels.chest : frame.label === "core" ? levels.core : levels.feet,
  }));
  let next = frames.findIndex((frame) => frame.t >= progress);
  if (next <= 0) return { y: frames[0].y, distance: frames[0].distance };
  if (next < 0) next = frames.length - 1;
  const a = frames[next - 1];
  const b = frames[next];
  const raw = THREE.MathUtils.clamp((progress - a.t) / (b.t - a.t), 0, 1);
  const eased = raw * raw * (3 - 2 * raw);
  return {
    y: THREE.MathUtils.lerp(a.y, b.y, eased),
    distance: THREE.MathUtils.lerp(a.distance, b.distance, eased),
  };
}

function Model({ levelsRef }: { levelsRef: MutableRefObject<ModelYLevels | null> }) {
  const { scene } = useGLTF(MODEL_PATH);
  const fittedModel = useMemo(() => {
    const model = scene.clone(true);
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = CAMERA_CONFIG.modelHeight / size.y;
    const fit = new THREE.Group();
    fit.add(model);
    fit.scale.setScalar(scale);
    fit.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    fit.updateMatrixWorld(true);

    const finalBounds = new THREE.Box3().setFromObject(fit);
    const finalHeight = finalBounds.getSize(new THREE.Vector3()).y;
    levelsRef.current = {
      head: finalBounds.min.y + finalHeight * CAMERA_CONFIG.headRatio,
      chest: finalBounds.min.y + finalHeight * CAMERA_CONFIG.chestRatio,
      core: finalBounds.min.y + finalHeight * CAMERA_CONFIG.coreRatio,
      feet: finalBounds.min.y + finalHeight * CAMERA_CONFIG.feetRatio,
    };
    fit.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const sourceNormalMaps = materials.map((material) => Boolean((material as THREE.MeshStandardMaterial).normalMap));
      const sourceSides = materials.map((material) => material.side);
      materials.forEach((material) => {
        const sourceHasNormalMap = Boolean((material as THREE.MeshStandardMaterial).normalMap);
        // The supplied GLB stores its normal texture as a JPEG; that lossy normal data causes the visible dark/shading patches.
        if (sourceHasNormalMap) (material as THREE.MeshStandardMaterial).normalMap = null;
        material.side = THREE.FrontSide;
        if (material instanceof THREE.MeshStandardMaterial) {
          material.roughness = 0.6;
          material.metalness = 0;
          material.envMapIntensity = 0.4;
        }
        if (!mesh.geometry.attributes.normal) mesh.geometry.computeVertexNormals();
        material.needsUpdate = true;
      });
      if (!modelDiagnosticsLogged) {
        console.info("[Saha Plus] GLTF mesh diagnostics", {
          name: mesh.name || "(unnamed)",
          materialTypes: materials.map((material) => material.type),
          hasNormals: Boolean(mesh.geometry.attributes.normal),
          hasNormalMap: sourceNormalMaps,
          normalMapRemoved: sourceNormalMaps,
          hasMap: materials.map((material) => Boolean((material as THREE.MeshStandardMaterial).map)),
          hasVertexColors: Boolean(mesh.geometry.attributes.color),
          sourceMaterialSides: sourceSides,
          materialSides: materials.map((material) => material.side),
          vertexCount: mesh.geometry.attributes.position?.count ?? 0,
          scale: mesh.scale.toArray(),
          localBounds: new THREE.Box3().setFromObject(mesh).getSize(new THREE.Vector3()).toArray(),
        });
      }
    });
    if (!modelDiagnosticsLogged) {
      console.info("[Saha Plus] Bounding-box levels (model height percentages)", levelsRef.current);
      console.info(`[Saha Plus] Fitted human model height: ${finalHeight.toFixed(2)} units`);
      console.info("[Saha Plus] Redundant meshes hidden: none. The GLB has three separately named body meshes; no mesh is hidden because the source geometry needs visual overlap inspection before removing parts.");
      modelDiagnosticsLogged = true;
    }
    return fit;
  }, [levelsRef, scene]);

  return <primitive object={fittedModel} />;
}

function SceneCamera({ levelsRef }: { levelsRef: MutableRefObject<ModelYLevels | null> }) {
  const scroll = useScroll();
  useFrame(({ camera }, delta) => {
    const levels = levelsRef.current;
    if (!levels) return;
    const progress = THREE.MathUtils.clamp(scroll.offset, 0, 1);
    const target = smoothKeyframe(progress, levels);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, target.y, CAMERA_CONFIG.damping, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, target.distance, CAMERA_CONFIG.damping, delta);
    const headZoom = THREE.MathUtils.smoothstep(progress, 0.1, 0.18) * (1 - THREE.MathUtils.smoothstep(progress, 0.28, 0.38));
    const fovTarget = THREE.MathUtils.lerp(CAMERA_CONFIG.cameraFov, CAMERA_CONFIG.headFov, headZoom);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.damp(camera.fov, fovTarget, CAMERA_CONFIG.damping, delta);
      camera.updateProjectionMatrix();
    }
    camera.lookAt(0, camera.position.y, 0);
  });
  return null;
}

function LoadingScreen() {
  const { progress } = useProgress();
  return <Html fullscreen style={{ pointerEvents: "none" }}><div className="body-model-loader" role="status" aria-live="polite"><span className="loader-kicker">SAHA PLUS · BODY ATLAS</span><strong>{Math.round(progress)}%</strong><span>Preparing your 3D anatomy view</span></div></Html>;
}

function StoryPages() {
  const scroll = useScroll();
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const finaleRef = useRef<HTMLElement | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  useFrame(() => {
    const pageLength = 1 / CAMERA_CONFIG.pages;
    const fade = (element: HTMLElement | null, start: number, length: number) => {
      if (!element) return;
      const fadeIn = scroll.range(start, length * 0.14);
      const fadeOut = 1 - scroll.range(start + length * 0.86, length * 0.14);
      const opacity = scroll.visible(start, length) ? Math.min(fadeIn, fadeOut) : 0;
      element.style.opacity = `${opacity}`;
      element.style.visibility = opacity > 0.01 ? "visible" : "hidden";
      element.style.pointerEvents = opacity > 0.08 ? "auto" : "none";
      element.style.transform = `translate3d(0, ${(1 - opacity) * 16}px, 0)`;
    };
    BODY_SECTIONS.forEach((_, index) => fade(sectionRefs.current[index], (index + 1) * pageLength, pageLength));
    fade(finaleRef.current, 5 * pageLength, pageLength);
  });
  const backToTop = () => scroll.el?.scrollTo({ top: 0, behavior: "smooth" });
  return (
    <Scroll html>
      <div className="body-story-pages">
        <section className="body-hero" id="overview" aria-label="Saha Plus body atlas">
          <div className="body-hero-topline"><span className="hero-status-dot" /> PERSONAL WELLNESS · BODY ATLAS</div>
          <div className="body-hero-copy"><p className="body-brand">SAHA <span>PLUS</span></p><h1>Your health,<br /><em>in focus.</em></h1><p>Explore the systems that help you move through every day.</p><a href="#head-mind" className="body-scroll-cue"><span>SCROLL TO EXPLORE</span><b aria-hidden="true">↓</b></a></div>
          <p className="body-model-credit">3D model <a href="https://sketchfab.com/3d-models/male-body-base-be0810fb4fb3477091a408e8fc2d2e46" target="_blank" rel="noreferrer">“Male Body Base” by Luciano O. Mollo</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a></p>
        </section>
        {BODY_SECTIONS.map((section, index) => (
          <section className={`body-zone body-zone-${section.side}`} id={section.id} key={section.id} ref={(element) => { sectionRefs.current[index] = element; }} aria-label={section.title} style={{ height: "100svh" }}>
            <div className="body-zone-card"><span className="body-zone-number">0{index + 1} <i /> {section.zone}</span><h2>{section.title}</h2><p>{section.description}</p>{expandedSection === section.id && <p className="body-zone-detail">{section.detail}</p>}<button type="button" className="body-learn-more" aria-expanded={expandedSection === section.id} onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}>{expandedSection === section.id ? "Close details" : "Learn more"}<span aria-hidden="true">↗</span></button></div>
          </section>
        ))}
        <section className="body-zone body-finale" id="finale" ref={finaleRef} aria-label="Your wellness journey" style={{ height: "100svh" }}>
          <div className="finale-card"><span className="body-zone-number">05 <i /> FINALE</span><h2>Your body.<br />Your data.<br /><em>Your journey.</em></h2><p>Track, understand and improve your health every day.</p><div className="finale-actions"><a className="finale-primary" href="#overview">Go to dashboard <span aria-hidden="true">→</span></a><button className="finale-secondary" type="button" onClick={backToTop}>Back to top <span aria-hidden="true">↑</span></button></div></div>
        </section>
      </div>
    </Scroll>
  );
}

function ZoneProgress({ progressRef }: { progressRef: RefObject<HTMLElement> }) {
  const scroll = useScroll();
  useFrame(() => {
    const page = Math.max(0, scroll.offset * CAMERA_CONFIG.pages - 1);
    const activeIndex = Math.min(BODY_SECTIONS.length, Math.floor(page));
    progressRef.current?.querySelectorAll<HTMLElement>("[data-body-zone]").forEach((element, index) => {
      element.classList.toggle("is-active", index === activeIndex);
      if (index === activeIndex) element.setAttribute("aria-current", "step");
      else element.removeAttribute("aria-current");
    });
  });
  return null;
}

function FinaleEffects({ keyLightRef, ringRef, modelRef }: { keyLightRef: MutableRefObject<THREE.DirectionalLight | null>; ringRef: MutableRefObject<THREE.MeshBasicMaterial | null>; modelRef: MutableRefObject<THREE.Group | null> }) {
  const scroll = useScroll();
  useFrame((_, delta) => {
    const finale = THREE.MathUtils.smoothstep(scroll.offset, 0.83, 0.97);
    if (keyLightRef.current) keyLightRef.current.intensity = THREE.MathUtils.damp(keyLightRef.current.intensity, 2.1 - finale * 1.2, 2.5, delta);
    if (ringRef.current) ringRef.current.opacity = 0.34 + finale * (0.16 + Math.sin(performance.now() * 0.0017) * 0.08);
    if (modelRef.current) modelRef.current.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((material) => { material.transparent = finale > 0.01; material.opacity = 1 - finale * 0.18; material.depthWrite = finale < 0.01; });
    });
  });
  return null;
}

function LightsAndModel({ levelsRef, keyLightRef, ringRef, modelRef }: { levelsRef: MutableRefObject<ModelYLevels | null>; keyLightRef: MutableRefObject<THREE.DirectionalLight | null>; ringRef: MutableRefObject<THREE.MeshBasicMaterial | null>; modelRef: MutableRefObject<THREE.Group | null> }) {
  return <>
    <color attach="background" args={[CAMERA_CONFIG.background]} /><fog attach="fog" args={[CAMERA_CONFIG.background, CAMERA_CONFIG.fogNear, CAMERA_CONFIG.fogFar]} />
    <hemisphereLight args={["#e1eadc", "#26352c", 1.05]} />
    <directionalLight ref={keyLightRef} position={[-3, 6, 6]} intensity={2.1} color="#fff1dc" />
    <pointLight position={[0, 3.5, 5]} intensity={7} distance={12} color="#e3eddb" />
    <pointLight position={[3, 3.4, -3.2]} intensity={13} distance={12} color="#6fbd8a" />
    <mesh position={[0, 2.05, -1.25]}><circleGeometry args={[2.7, 96]} /><meshBasicMaterial color="#244a34" transparent opacity={0.23} depthWrite={false} /></mesh>
    <mesh position={[0, 2.05, -1.2]}><ringGeometry args={[2.48, 2.505, 128]} /><meshBasicMaterial ref={ringRef} color="#83bc82" transparent opacity={0.34} depthWrite={false} /></mesh>
    <group ref={modelRef}><Model levelsRef={levelsRef} /></group>
    <Environment preset="studio" />
  </>;
}

export default function BodyScene({ progressRef }: BodySceneProps) {
  const levelsRef = useRef<ModelYLevels | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ringRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  return <Canvas className="body-scene-canvas" dpr={[1, 1.5]} camera={{ position: [0, 2, 11.5], fov: CAMERA_CONFIG.cameraFov, near: 0.1, far: 50 }} gl={{ antialias: true, alpha: false }}>
    <Suspense fallback={<LoadingScreen />}><ScrollControls pages={CAMERA_CONFIG.pages} damping={CAMERA_CONFIG.scrollDamping}>
      <LightsAndModel levelsRef={levelsRef} keyLightRef={keyLightRef} ringRef={ringRef} modelRef={modelRef} />
      <SceneCamera levelsRef={levelsRef} /><FinaleEffects keyLightRef={keyLightRef} ringRef={ringRef} modelRef={modelRef} /><StoryPages /><ZoneProgress progressRef={progressRef} />
    </ScrollControls></Suspense>
  </Canvas>;
}

useGLTF.preload(MODEL_PATH);
