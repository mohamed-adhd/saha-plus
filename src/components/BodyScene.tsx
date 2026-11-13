"use client";

import { Html, Scroll, ScrollControls, useGLTF, useProgress, useScroll } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Suspense, useMemo, useRef, useState, type RefObject } from "react";

const MODEL_PATH = "/models/human.glb";

const CAMERA_CONFIG = {
  modelHeight: 4,
  headY: 4.35,
  feetY: 0.62,
  minDistance: 4.15,
  maxDistance: 14,
  cameraFov: 36,
  damping: 2.6,
  zoomInStart: 0.1,
  zoomInEnd: 0.44,
  zoomOutStart: 0.62,
  zoomOutEnd: 1,
  pages: 6,
  scrollDamping: 0.3,
  background: "#10241b",
  fogNear: 7,
  fogFar: 18,
} as const;

const BODY_SECTIONS = [
  {
    id: "head-mind",
    title: "Head and Mind",
    description: "Your brain, senses and nervous system help you understand and respond to the world.",
    detail: "Rest, focus and emotional wellbeing are connected parts of caring for your mind.",
    zone: "HEAD",
    side: "left",
  },
  {
    id: "chest-heart",
    title: "Chest and Heart",
    description: "Your heart and lungs work together to move oxygen through your body.",
    detail: "The heart, lungs and blood vessels form a closely connected system that supports everyday activity.",
    zone: "CHEST",
    side: "right",
  },
  {
    id: "core-digestion",
    title: "Core and Digestion",
    description: "Your digestive system helps break down food and absorb the nutrients your body needs.",
    detail: "Digestion involves a connected set of organs that process food and support the rest of the body.",
    zone: "CORE",
    side: "left",
  },
  {
    id: "legs-strength",
    title: "Legs and Strength",
    description: "Large muscle groups help you stand, walk, climb and move through the day.",
    detail: "Strength, balance and mobility work together in many ordinary movements.",
    zone: "LEGS",
    side: "right",
  },
  {
    id: "feet-mobility",
    title: "Feet and Mobility",
    description: "Your feet help support balance and connect each step to the ground.",
    detail: "The feet and ankles help absorb impact and make small adjustments as you move.",
    zone: "FEET",
    side: "left",
  },
] as const;

let modelHeightLogged = false;

function Model() {
  const { scene } = useGLTF(MODEL_PATH);
  const fittedModel = useMemo(() => {
    const model = scene.clone(true);
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = CAMERA_CONFIG.modelHeight / size.y;

    model.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    const fit = new THREE.Group();
    fit.add(model);
    fit.scale.setScalar(scale);
    fit.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    fit.updateMatrixWorld(true);

    const finalBounds = new THREE.Box3().setFromObject(fit);
    const finalHeight = finalBounds.getSize(new THREE.Vector3()).y;
    if (!modelHeightLogged) {
      console.info(`[Saha Plus] Fitted human model height: ${finalHeight.toFixed(2)} units`);
      modelHeightLogged = true;
    }
    return fit;
  }, [scene]);

  return <primitive object={fittedModel} />;
}

function SceneCamera() {
  const scroll = useScroll();

  useFrame(({ camera }, delta) => {
    const progress = THREE.MathUtils.clamp(scroll.offset, 0, 1);
    const targetY = THREE.MathUtils.lerp(CAMERA_CONFIG.headY, CAMERA_CONFIG.feetY, progress);
    const zoomIn = THREE.MathUtils.smoothstep(progress, CAMERA_CONFIG.zoomInStart, CAMERA_CONFIG.zoomInEnd);
    const zoomOut = THREE.MathUtils.smoothstep(progress, CAMERA_CONFIG.zoomOutStart, CAMERA_CONFIG.zoomOutEnd);
    const targetDistance = CAMERA_CONFIG.maxDistance -
      (CAMERA_CONFIG.maxDistance - CAMERA_CONFIG.minDistance) * zoomIn +
      (CAMERA_CONFIG.maxDistance - CAMERA_CONFIG.minDistance) * zoomOut;

    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, CAMERA_CONFIG.damping, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetDistance, CAMERA_CONFIG.damping, delta);
    camera.lookAt(0, camera.position.y, 0);
  });

  return null;
}

function LoadingScreen() {
  const { progress } = useProgress();
  return (
    <Html fullscreen style={{ pointerEvents: "none" }}>
      <div className="body-model-loader" role="status" aria-live="polite">
        <span className="loader-kicker">SAHA PLUS · BODY ATLAS</span>
        <strong>{Math.round(progress)}%</strong>
        <span>Preparing your 3D anatomy view</span>
      </div>
    </Html>
  );
}

function StoryPages() {
  const scroll = useScroll();
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useFrame(() => {
    const pageLength = 1 / CAMERA_CONFIG.pages;
    const overlap = 0.035;

    BODY_SECTIONS.forEach((section, index) => {
      const element = sectionRefs.current[index];
      if (!element) return;

      const start = (index + 1) * pageLength;
      const visibleStart = Math.max(0, start - overlap);
      const visibleLength = pageLength + overlap * 2;
      const isVisible = scroll.visible(visibleStart, visibleLength);
      const fadeIn = scroll.range(visibleStart, overlap * 2);
      const fadeOut = 1 - scroll.range(start + pageLength - overlap, overlap * 2);
      const opacity = isVisible ? Math.min(fadeIn, fadeOut) : 0;

      element.style.opacity = `${opacity}`;
      element.style.visibility = opacity > 0.01 ? "visible" : "hidden";
      element.style.pointerEvents = opacity > 0.08 ? "auto" : "none";
      element.style.transform = `translate3d(0, ${(1 - opacity) * 16}px, 0)`;
    });
  });

  return (
    <Scroll html>
      <div className="body-story-pages">
        <section className="body-hero" id="overview" aria-label="Saha Plus body atlas">
          <div className="body-hero-topline"><span className="hero-status-dot" /> PERSONAL WELLNESS · BODY ATLAS</div>
          <div className="body-hero-copy">
            <p className="body-brand">SAHA <span>PLUS</span></p>
            <h1>Your health,<br /><em>in focus.</em></h1>
            <p>Explore the systems that help you move through every day.</p>
            <a href="#head-mind" className="body-scroll-cue"><span>SCROLL TO EXPLORE</span><b aria-hidden="true">↓</b></a>
          </div>
          <p className="body-model-credit">
            3D model <a href="https://sketchfab.com/3d-models/male-body-base-be0810fb4fb3477091a408e8fc2d2e46" target="_blank" rel="noreferrer">“Male Body Base” by Luciano O. Mollo</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>
          </p>
        </section>
        {BODY_SECTIONS.map((section, index) => (
          <section
            className={`body-zone body-zone-${section.side}`}
            id={section.id}
            key={section.id}
            ref={(element) => { sectionRefs.current[index] = element; }}
            aria-label={section.title}
            style={{ height: "100svh" }}
          >
            <div className="body-zone-card">
              <span className="body-zone-number">0{index + 1} <i /> {section.zone}</span>
              <h2>{section.title}</h2>
              <p>{section.description}</p>
              {expandedSection === section.id && <p className="body-zone-detail">{section.detail}</p>}
              <button
                type="button"
                className="body-learn-more"
                aria-expanded={expandedSection === section.id}
                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              >
                {expandedSection === section.id ? "Close details" : "Learn more"}<span aria-hidden="true">↗</span>
              </button>
            </div>
          </section>
        ))}
      </div>
    </Scroll>
  );
}

function ZoneProgress({ progressRef }: { progressRef: RefObject<HTMLElement> }) {
  const scroll = useScroll();

  useFrame(() => {
    const page = Math.max(0, scroll.offset * CAMERA_CONFIG.pages - 1);
    const activeIndex = Math.min(BODY_SECTIONS.length - 1, Math.floor(page));
    progressRef.current?.querySelectorAll<HTMLElement>("[data-body-zone]").forEach((element, index) => {
      element.classList.toggle("is-active", index === activeIndex);
      if (index === activeIndex) element.setAttribute("aria-current", "step");
      else element.removeAttribute("aria-current");
    });
  });

  return null;
}

function LightsAndModel() {
  return (
    <>
      <color attach="background" args={[CAMERA_CONFIG.background]} />
      <fog attach="fog" args={[CAMERA_CONFIG.background, CAMERA_CONFIG.fogNear, CAMERA_CONFIG.fogFar]} />
      <ambientLight intensity={0.62} color="#d7e4d8" />
      <directionalLight position={[-3, 6, 5]} intensity={2.2} color="#fff1dc" />
      <pointLight position={[3, 3.4, -3.2]} intensity={16} distance={12} color="#6fbd8a" />
      <pointLight position={[-3, 1.8, 3]} intensity={5} distance={10} color="#b4d7ae" />
      <mesh position={[0, 2.05, -1.25]}>
        <circleGeometry args={[2.7, 96]} />
        <meshBasicMaterial color="#244a34" transparent opacity={0.23} depthWrite={false} />
      </mesh>
      <mesh position={[0, 2.05, -1.2]}>
        <ringGeometry args={[2.48, 2.505, 128]} />
        <meshBasicMaterial color="#73aa79" transparent opacity={0.42} depthWrite={false} />
      </mesh>
      <Model />
    </>
  );
}

export default function BodyScene({ progressRef }: { progressRef: RefObject<HTMLElement> }) {
  return (
    <Canvas
      className="body-scene-canvas"
      dpr={[1, 1.5]}
      shadows
      camera={{ position: [0, CAMERA_CONFIG.headY, CAMERA_CONFIG.maxDistance], fov: CAMERA_CONFIG.cameraFov, near: 0.1, far: 40 }}
      gl={{ antialias: true, alpha: false }}
    >
      <Suspense fallback={<LoadingScreen />}>
        <ScrollControls pages={CAMERA_CONFIG.pages} damping={CAMERA_CONFIG.scrollDamping}>
          <LightsAndModel />
          <SceneCamera />
          <StoryPages />
          <ZoneProgress progressRef={progressRef} />
        </ScrollControls>
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_PATH);
