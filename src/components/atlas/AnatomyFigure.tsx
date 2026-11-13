import { memo, type RefObject } from "react";
import { BODY_CONTOURS, BODY_PATH, FIGURE_PARTS, MOTION_PATHS, type FigurePart, type Layer, type OrganId } from "./geometry";
import { LAYER_ORDER } from "./chapters";

type Props = {
  /** The camera group: its transform is written every frame by the scroll driver. */
  cameraRef: RefObject<SVGGElement>;
  onOrganHover: (organ: OrganId | null) => void;
  animate: boolean;
};

const partsByLayer = LAYER_ORDER.reduce((groups, layer) => {
  groups[layer] = FIGURE_PARTS.filter((part) => part.layer === layer);
  return groups;
}, {} as Record<Layer, FigurePart[]>);

/** Blood and nerve signals travelling along the vessel guides. */
const PULSES: { path: keyof typeof MOTION_PATHS; layer: Layer; duration: number; delays: number[] }[] = [
  { path: "aorta", layer: "circulation", duration: 2.2, delays: [0, 0.75, 1.5] },
  { path: "carotidRight", layer: "circulation", duration: 1.8, delays: [0.2, 1.1] },
  { path: "carotidLeft", layer: "circulation", duration: 1.8, delays: [0.6, 1.5] },
  { path: "femoralRight", layer: "circulation", duration: 3.4, delays: [0, 1.7] },
  { path: "femoralLeft", layer: "circulation", duration: 3.4, delays: [0.8, 2.5] },
  { path: "spinalCord", layer: "nerves", duration: 2.6, delays: [0, 1.3] },
  { path: "sciaticRight", layer: "nerves", duration: 3, delays: [0.4] },
  { path: "sciaticLeft", layer: "nerves", duration: 3, delays: [1.9] },
];

function Part({ part, onOrganHover }: { part: FigurePart; onOrganHover: Props["onOrganHover"] }) {
  const interactive = Boolean(part.organ);
  return <path
    id={part.id}
    d={part.d}
    className={`atlas-part tone-${part.tone ?? "line"} region-${part.region}${part.organ ? ` organ organ-${part.organ}` : ""}`}
    data-organ={part.organ}
    onPointerEnter={interactive ? () => onOrganHover(part.organ ?? null) : undefined}
    onPointerLeave={interactive ? () => onOrganHover(null) : undefined}
  />;
}

function AnatomyFigure({ cameraRef, onOrganHover, animate }: Props) {
  return <g ref={cameraRef} className="atlas-camera">
    <defs>
      <linearGradient id="atlas-skin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#cfe6cf" stopOpacity=".16" />
        <stop offset=".55" stopColor="#9fcaa9" stopOpacity=".09" />
        <stop offset="1" stopColor="#9fcaa9" stopOpacity=".05" />
      </linearGradient>
      <radialGradient id="atlas-aura" cx=".5" cy=".45" r=".6">
        <stop offset="0" stopColor="#8fd0a2" stopOpacity=".16" />
        <stop offset="1" stopColor="#8fd0a2" stopOpacity="0" />
      </radialGradient>
      {Object.entries(MOTION_PATHS).map(([key, d]) => <path key={key} id={`atlas-motion-${key}`} d={d} />)}
    </defs>
    <ellipse cx="200" cy="490" rx="230" ry="520" fill="url(#atlas-aura)" />
    <path className="atlas-silhouette" d={BODY_PATH} />
    <path className="atlas-contours" d={BODY_CONTOURS} />
    {LAYER_ORDER.map((layer) => <g key={layer} className={`atlas-layer layer-${layer}`}>
      {partsByLayer[layer].map((part) => <Part key={part.key} part={part} onOrganHover={onOrganHover} />)}
      {animate && PULSES.filter((pulse) => pulse.layer === layer).flatMap((pulse) => pulse.delays.map((delay) =>
        <circle key={`${pulse.path}-${delay}`} className={`atlas-pulse pulse-${layer}`} r="2.1">
          <animateMotion dur={`${pulse.duration}s`} begin={`${delay}s`} repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
            <mpath href={`#atlas-motion-${pulse.path}`} />
          </animateMotion>
        </circle>))}
    </g>)}
  </g>;
}

export default memo(AnatomyFigure);
