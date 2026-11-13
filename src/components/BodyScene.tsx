"use client";

import { Environment, Html, Scroll, ScrollControls, useGLTF, useProgress, useScroll } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { clone as cloneSkinnedScene } from "three/examples/jsm/utils/SkeletonUtils.js";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject, type RefObject } from "react";

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
  exposure: 0.9,
  hemisphereLight: 0.3,
  keyLight: 1.0,
  fillLight: 0.35,
  greenRimLight: 2.1,
  environmentIntensity: 0.2,
  rotationSensitivity: 0.006,
  rotationSmoothing: 8,
  rotationInertiaDecay: 5,
  idleReturnDelay: 5000,
  returnSpeed: 2.5,
  feetProgress: 0.8,
  pullbackStart: 5 / 6,
  pullbackEnd: 0.98,
  finaleFadeStart: 0.93,
  finaleFadeEnd: 0.98,
  backToTopThreshold: 0.34,
  skinTone: "#c9a58a",
} as const;

type CameraKeyframe = { t: number; y: number; distance: number; label: string };
type ModelYLevels = { head: number; chest: number; core: number; feet: number };
const HERO_KEYFRAME = { t: 0, y: CAMERA_CONFIG.modelHeight / 2, distance: 11.5, label: "hero" } as const;
const CAMERA_KEYFRAMES: CameraKeyframe[] = [
  HERO_KEYFRAME,
  { t: 0.18, y: 0, distance: CAMERA_CONFIG.headDistance, label: "head" },
  { t: 0.38, y: 0, distance: CAMERA_CONFIG.chestDistance, label: "chest" },
  { t: 0.58, y: 0, distance: CAMERA_CONFIG.coreDistance, label: "core" },
  { t: CAMERA_CONFIG.feetProgress, y: 0, distance: CAMERA_CONFIG.coreDistance, label: "feet" },
  { t: CAMERA_CONFIG.pullbackStart, y: 0, distance: CAMERA_CONFIG.coreDistance, label: "feet-hold" },
  { t: CAMERA_CONFIG.pullbackEnd, y: HERO_KEYFRAME.y, distance: HERO_KEYFRAME.distance, label: "pullback" },
  { t: 1, y: HERO_KEYFRAME.y, distance: HERO_KEYFRAME.distance, label: "finale-hold" },
];

const BODY_SECTIONS = [
  { id: "head-mind", title: "Head and Mind", description: "Your brain, senses and nervous system help you understand and respond to the world.", detail: "Rest, focus and emotional wellbeing are connected parts of caring for your mind.", zone: "HEAD", side: "left" },
  { id: "chest-heart", title: "Chest and Heart", description: "Your heart and lungs work together to move oxygen through your body.", detail: "The heart, lungs and blood vessels form a closely connected system that supports everyday activity.", zone: "CHEST", side: "right" },
  { id: "core-digestion", title: "Core and Digestion", description: "Your digestive system helps break down food and absorb the nutrients your body needs.", detail: "Digestion involves a connected set of organs that process food and support the rest of the body.", zone: "CORE", side: "left" },
  { id: "legs-strength", title: "Legs and Strength", description: "Large muscle groups help you stand, walk, climb and move through the day.", detail: "Strength, balance and mobility work together in many ordinary movements.", zone: "LEGS", side: "right" },
] as const;

type BodySceneControls = { goToTop: () => void };
type BodySceneProps = { progressRef: RefObject<HTMLElement>; controlsRef: MutableRefObject<BodySceneControls | null>; backToTopRef: RefObject<HTMLButtonElement | null>; renderModel?: boolean };
let modelDiagnosticsLogged = false;
let appearanceLogged = false;

function smoothKeyframe(progress: number, levels: ModelYLevels): { y: number; distance: number } {
  const frames = CAMERA_KEYFRAMES.map((frame) => ({
    ...frame,
    y: frame.label === "hero" || frame.label === "pullback" || frame.label === "finale-hold" ? HERO_KEYFRAME.y :
      frame.label === "head" ? levels.head : frame.label === "chest" ? levels.chest :
      frame.label === "core" ? levels.core : levels.feet,
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
    const model = cloneSkinnedScene(scene);
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
          const hasVertexColors = Boolean(mesh.geometry.attributes.color);
          material.vertexColors = hasVertexColors;
          if (material.map) {
            material.map.colorSpace = THREE.SRGBColorSpace;
            material.map.needsUpdate = true;
          }
          const colorChannels = [material.color.r, material.color.g, material.color.b];
          const isNeutralClay = Math.max(...colorChannels) - Math.min(...colorChannels) < 0.1 && Math.max(...colorChannels) < 0.5;
          if (!material.map && !hasVertexColors && isNeutralClay) {
            material.color.set(CAMERA_CONFIG.skinTone);
            material.roughness = 0.65;
            material.metalness = 0;
            if (!appearanceLogged) {
              console.info(`[Saha Plus] Skin appearance: applied ${CAMERA_CONFIG.skinTone} to the untextured neutral-gray base material.`);
              appearanceLogged = true;
            }
          } else if (!appearanceLogged) {
            console.info("[Saha Plus] Skin appearance: kept the original GLB material and warm vertex colors.", {
              hasColorMap: Boolean(material.map),
              hasVertexColors,
              vertexColorSample: mesh.geometry.attributes.color?.array.slice(0, 4) ?? null,
            });
            appearanceLogged = true;
          }
          material.envMapIntensity = CAMERA_CONFIG.environmentIntensity;
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

type DragAxis = "pending" | "rotate" | "scroll";
type DragState = { active: boolean; pointerId: number; axis: DragAxis; startX: number; startY: number; lastX: number; lastMoveAt: number; startRotation: number; totalX: number };

function ModelRig({ levelsRef, modelRef, rotationResetRef }: { levelsRef: MutableRefObject<ModelYLevels | null>; modelRef: MutableRefObject<THREE.Group | null>; rotationResetRef: MutableRefObject<boolean> }) {
  const { gl } = useThree();
  const scroll = useScroll();
  const drag = useRef<DragState>({ active: false, pointerId: -1, axis: "pending", startX: 0, startY: 0, lastX: 0, lastMoveAt: 0, startRotation: 0, totalX: 0 });
  const targetRotation = useRef(0);
  const velocity = useRef(0);
  const lastInteractionTime = useRef(0);

  const setCursor = (cursor: string) => {
    gl.domElement.style.cursor = cursor;
    if (scroll.el) scroll.el.style.cursor = cursor;
  };
  const finishDrag = (event: { stopPropagation: () => void; pointerId: number }, leaving = false) => {
    event.stopPropagation();
    const state = drag.current;
    if (!state.active || state.pointerId !== event.pointerId) return;
    state.active = false;
    state.axis = "pending";
    lastInteractionTime.current = performance.now();
    setCursor(leaving ? "default" : "grab");
  };

  useFrame((_, delta) => {
    const group = modelRef.current;
    if (!group) return;
    const state = drag.current;
    if (rotationResetRef.current) {
      rotationResetRef.current = false;
      state.active = false;
      velocity.current = 0;
      targetRotation.current = 0;
      group.rotation.y = 0;
      lastInteractionTime.current = performance.now();
      setCursor("default");
      return;
    }
    if (!state.active && performance.now() - lastInteractionTime.current >= CAMERA_CONFIG.idleReturnDelay) {
      velocity.current = 0;
      const shortest = THREE.MathUtils.euclideanModulo(-group.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
      if (Math.abs(shortest) < 0.0005) group.rotation.y = 0;
      else group.rotation.y = THREE.MathUtils.damp(group.rotation.y, group.rotation.y + shortest, CAMERA_CONFIG.returnSpeed, delta);
      targetRotation.current = group.rotation.y;
      return;
    }
    if (!state.active) {
      targetRotation.current += velocity.current * delta;
      velocity.current *= Math.exp(-CAMERA_CONFIG.rotationInertiaDecay * delta);
    }
    const difference = THREE.MathUtils.euclideanModulo(targetRotation.current - group.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, group.rotation.y + difference, CAMERA_CONFIG.rotationSmoothing, delta);
  });

  return <>
  <group ref={modelRef} position={[0, CAMERA_CONFIG.modelHeight / 2, 0]}>
    <group position={[0, -CAMERA_CONFIG.modelHeight / 2, 0]}><Model levelsRef={levelsRef} /></group>
  </group>
    <mesh
    position={[0, CAMERA_CONFIG.modelHeight / 2, 0]}
    renderOrder={-1}
    onPointerOver={() => setCursor("grab")}
    onPointerOut={() => { if (!drag.current.active) setCursor("default"); }}
    onPointerDown={(event) => {
      event.stopPropagation();
      const now = performance.now();
      const group = modelRef.current;
      if (!group) return;
      targetRotation.current = group.rotation.y;
      velocity.current = 0;
      lastInteractionTime.current = now;
      drag.current = { active: true, pointerId: event.pointerId, axis: "pending", startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastMoveAt: now, startRotation: group.rotation.y, totalX: 0 };
      (event.target as (EventTarget & { setPointerCapture?: (pointerId: number) => void }) | null)?.setPointerCapture?.(event.pointerId);
      setCursor("grabbing");
    }}
    onPointerMove={(event) => {
      const state = drag.current;
      if (!state.active || state.pointerId !== event.pointerId) return;
      event.stopPropagation();
      const now = performance.now();
      const dx = event.clientX - state.lastX;
      const dt = Math.max((now - state.lastMoveAt) / 1000, 1 / 120);
      state.lastX = event.clientX;
      state.totalX = event.clientX - state.startX;
      state.lastMoveAt = now;
      lastInteractionTime.current = now;
      if (state.axis === "pending" && Math.hypot(event.clientX - state.startX, event.clientY - state.startY) >= 7) {
        state.axis = Math.abs(state.totalX) > Math.abs(event.clientY - state.startY) ? "rotate" : "scroll";
        if (state.axis === "scroll") {
          state.active = false;
          velocity.current = 0;
          (event.target as (EventTarget & { releasePointerCapture?: (pointerId: number) => void }) | null)?.releasePointerCapture?.(event.pointerId);
          setCursor("default");
          return;
        }
      }
      if (state.axis === "rotate") {
        const previousTarget = targetRotation.current;
        targetRotation.current = state.startRotation + state.totalX * CAMERA_CONFIG.rotationSensitivity;
        velocity.current = THREE.MathUtils.clamp((targetRotation.current - previousTarget) / dt, -4, 4);
      } else if (dx) {
        velocity.current = 0;
      }
    }}
    onPointerUp={(event) => finishDrag(event)}
    onPointerCancel={(event) => finishDrag(event, true)}
    onPointerLeave={(event) => finishDrag(event, true)}
  >
    <cylinderGeometry args={[1.45, 1.45, CAMERA_CONFIG.modelHeight + 0.2, 32]} />
    <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} colorWrite={false} />
  </mesh>
  </>;
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
  });
  return (
    <Scroll html>
      <div className="body-story-pages">
        <section className="body-hero" id="overview" aria-label="Saha Plus body atlas">
          <div className="body-hero-topline"><span className="hero-status-dot" /> PERSONAL WELLNESS · BODY ATLAS</div>
          <div className="body-hero-copy"><p className="body-brand">SAHA <span>PLUS</span></p><h1>Your health,<br /><em>in focus.</em></h1><p>Explore the systems that help you move through every day.</p><a href="#head-mind" className="body-scroll-cue"><span>SCROLL TO EXPLORE</span><b aria-hidden="true">↓</b></a></div>
          <p className="body-model-credit">3D model <a href="https://www.innerscene.com/tools/library/3d-parts/male-base-mesh-3d-person-rigged-a-pose-380e6d89" target="_blank" rel="noreferrer">Male base mesh by Innerscene, adapted from MakeHuman</a> · <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">CC0 1.0</a></p>
        </section>
        {BODY_SECTIONS.map((section, index) => (
          <section className={`body-zone body-zone-${section.side}`} id={section.id} key={section.id} ref={(element) => { sectionRefs.current[index] = element; }} aria-label={section.title} style={{ height: "100svh" }}>
            <div className="body-zone-card"><span className="body-zone-number">0{index + 1} <i /> {section.zone}</span><h2>{section.title}</h2><p>{section.description}</p>{expandedSection === section.id && <p className="body-zone-detail">{section.detail}</p>}<button type="button" className="body-learn-more" aria-expanded={expandedSection === section.id} onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}>{expandedSection === section.id ? "Close details" : "Learn more"}<span aria-hidden="true">↗</span></button></div>
          </section>
        ))}
        <section className="body-finale-spacer" id="finale" aria-label="Finale" style={{ height: "100svh" }} />
      </div>
    </Scroll>
  );
}

function ScrollOverlays({ rotationResetRef, controlsRef, backToTopRef }: { rotationResetRef: MutableRefObject<boolean>; controlsRef: MutableRefObject<BodySceneControls | null>; backToTopRef: RefObject<HTMLButtonElement | null> }) {
  const scroll = useScroll();
  const finaleRef = useRef<HTMLDivElement | null>(null);
  const goToTop = useCallback(() => {
    rotationResetRef.current = true;
    scroll.el?.scrollTo({ top: 0, behavior: "smooth" });
  }, [rotationResetRef, scroll]);
  useEffect(() => {
    controlsRef.current = { goToTop };
    return () => { controlsRef.current = null; };
  }, [controlsRef, goToTop]);
  useFrame(() => {
    const progress = THREE.MathUtils.clamp(scroll.offset, 0, 1);
    const finaleAlpha = THREE.MathUtils.smoothstep(progress, CAMERA_CONFIG.finaleFadeStart, CAMERA_CONFIG.finaleFadeEnd);
    const finale = finaleRef.current;
    if (finale) {
      finale.style.opacity = `${finaleAlpha}`;
      finale.style.visibility = finaleAlpha > 0.01 ? "visible" : "hidden";
      finale.style.transform = `translate(-50%, calc(-50% + ${(1 - finaleAlpha) * 16}px))`;
      finale.style.pointerEvents = finaleAlpha > 0.9 ? "auto" : "none";
      finale.setAttribute("aria-hidden", finaleAlpha > 0.9 ? "false" : "true");
      finale.querySelectorAll<HTMLElement>("a, button").forEach((control) => { control.tabIndex = finaleAlpha > 0.9 ? 0 : -1; });
    }
    const topAlpha = THREE.MathUtils.smoothstep(progress, CAMERA_CONFIG.backToTopThreshold - 0.035, CAMERA_CONFIG.backToTopThreshold + 0.04);
    const backToTop = backToTopRef.current;
    if (backToTop) {
      backToTop.style.opacity = `${topAlpha}`;
      backToTop.style.visibility = topAlpha > 0.01 ? "visible" : "hidden";
      backToTop.style.transform = `translateY(${(1 - topAlpha) * 12}px)`;
      backToTop.style.pointerEvents = topAlpha > 0.9 ? "auto" : "none";
      backToTop.tabIndex = topAlpha > 0.9 ? 0 : -1;
    }
  });
  return <Html fullscreen style={{ pointerEvents: "none" }}>
    <div className="body-fixed-overlays">
      <div className="finale-card body-fixed-finale" ref={finaleRef} aria-hidden="true">
        <span className="body-zone-number">05 <i /> FINALE</span>
        <h2>Your body.<br />Your data.<br /><em>Your journey.</em></h2>
        <p>Track, understand and improve your health every day.</p>
        <div className="finale-actions">
          <a className="finale-primary" href="#overview">Go to dashboard <span aria-hidden="true">→</span></a>
          <button className="finale-secondary" type="button" onClick={goToTop}>Back to top <span aria-hidden="true">↑</span></button>
        </div>
      </div>
    </div>
  </Html>;
}

function ZoneProgress({ progressRef }: { progressRef: RefObject<HTMLElement> }) {
  const scroll = useScroll();
  useFrame(() => {
    const page = Math.max(0, scroll.offset * CAMERA_CONFIG.pages - 1);
    const activeIndex = scroll.offset >= CAMERA_CONFIG.pullbackStart
      ? BODY_SECTIONS.length
      : Math.min(BODY_SECTIONS.length - 1, Math.floor(page));
    progressRef.current?.querySelectorAll<HTMLElement>("[data-body-zone]").forEach((element, index) => {
      element.classList.toggle("is-active", index === activeIndex);
      if (index === activeIndex) element.setAttribute("aria-current", "step");
      else element.removeAttribute("aria-current");
    });
  });
  return null;
}

function FinaleEffects({ keyLightRef, modelRef }: { keyLightRef: MutableRefObject<THREE.DirectionalLight | null>; modelRef: MutableRefObject<THREE.Group | null> }) {
  const scroll = useScroll();
  useFrame((_, delta) => {
    const finale = THREE.MathUtils.smoothstep(scroll.offset, CAMERA_CONFIG.finaleFadeStart, CAMERA_CONFIG.finaleFadeEnd);
    if (keyLightRef.current) keyLightRef.current.intensity = THREE.MathUtils.damp(keyLightRef.current.intensity, CAMERA_CONFIG.keyLight * (1 - finale * 0.18), 2.5, delta);
    if (modelRef.current) modelRef.current.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((material) => { material.transparent = finale > 0.01; material.opacity = 1 - finale * 0.08; material.depthWrite = finale < 0.01; });
    });
  });
  return null;
}

function LightsAndModel({ levelsRef, keyLightRef, modelRef, rotationResetRef }: { levelsRef: MutableRefObject<ModelYLevels | null>; keyLightRef: MutableRefObject<THREE.DirectionalLight | null>; modelRef: MutableRefObject<THREE.Group | null>; rotationResetRef: MutableRefObject<boolean> }) {
  return <>
    <fog attach="fog" args={[CAMERA_CONFIG.background, CAMERA_CONFIG.fogNear, CAMERA_CONFIG.fogFar]} />
    <hemisphereLight args={["#e1eadc", "#26352c", CAMERA_CONFIG.hemisphereLight]} />
    <directionalLight ref={keyLightRef} position={[-3, 6, 6]} intensity={CAMERA_CONFIG.keyLight} color="#fff1dc" />
    <pointLight position={[0, 3.5, 5]} intensity={CAMERA_CONFIG.fillLight} distance={12} color="#e3eddb" />
    <pointLight position={[3, 3.4, -3.2]} intensity={CAMERA_CONFIG.greenRimLight} distance={12} color="#6fbd8a" />
    <ModelRig levelsRef={levelsRef} modelRef={modelRef} rotationResetRef={rotationResetRef} />
    <Environment preset="studio" />
  </>;
}

export default function BodyScene({ progressRef, controlsRef, backToTopRef, renderModel = true }: BodySceneProps) {
  const levelsRef = useRef<ModelYLevels | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const rotationResetRef = useRef(false);
  return <Canvas className="body-scene-canvas" style={{ background: "transparent" }} dpr={[1, 1.5]} camera={{ position: [0, 2, 11.5], fov: CAMERA_CONFIG.cameraFov, near: 0.1, far: 50 }} gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: CAMERA_CONFIG.exposure }}>
    <Suspense fallback={<LoadingScreen />}><ScrollControls pages={CAMERA_CONFIG.pages} damping={CAMERA_CONFIG.scrollDamping} style={{ touchAction: "pan-y", overscrollBehavior: "contain" }}>
      {renderModel && <>
        <LightsAndModel levelsRef={levelsRef} keyLightRef={keyLightRef} modelRef={modelRef} rotationResetRef={rotationResetRef} />
        <SceneCamera levelsRef={levelsRef} /><FinaleEffects keyLightRef={keyLightRef} modelRef={modelRef} />
      </>}
      <StoryPages /><ScrollOverlays rotationResetRef={rotationResetRef} controlsRef={controlsRef} backToTopRef={backToTopRef} /><ZoneProgress progressRef={progressRef} />
    </ScrollControls></Suspense>
  </Canvas>;
}
