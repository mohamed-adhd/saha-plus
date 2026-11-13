/**
 * Anatomy geometry for the body atlas, authored in a 400 × 1000 SVG coordinate space
 * (body centred on x = 200, crown at y ≈ 26, soles at y ≈ 956).
 *
 * Shapes are described as control points and converted to smooth cubic Bézier paths at
 * module load, so the figure stays editable as data rather than as opaque path strings.
 * Most structures are authored for the figure's right-hand side of the screen and mirrored.
 */

export type Pt = readonly [number, number];
export type Layer = "organs" | "skeleton" | "muscles" | "circulation" | "nerves";
export type FocusRegion = "head-mind" | "chest-heart" | "core-digestion" | "legs-strength" | "body";
export type OrganId = "brain" | "lungs" | "heart" | "liver" | "stomach" | "intestines" | "kidneys" | "quadriceps" | "knee" | "calves";

export type FigurePart = {
  key: string;
  layer: Layer;
  region: FocusRegion;
  d: string;
  /** Visual treatment, mapped to a CSS class. */
  tone?: "fill" | "line" | "faint" | "dashed" | "tube";
  organ?: OrganId;
  /** Id for paths used as motion guides (pulses travelling through vessels and nerves). */
  id?: string;
};

export const CENTER_X = 200;
const r1 = (value: number) => Math.round(value * 10) / 10;
const fmt = ([x, y]: Pt) => `${r1(x)} ${r1(y)}`;

/** Catmull-Rom spline through the points, emitted as cubic Bézier segments. */
export function smoothPath(points: readonly Pt[], closed = false, tension = 1): string {
  const count = points.length;
  if (count < 2) return "";
  const at = (index: number): Pt => closed ? points[(index + count) % count] : points[Math.max(0, Math.min(count - 1, index))];
  let d = `M${fmt(points[0])}`;
  const segments = closed ? count : count - 1;
  for (let index = 0; index < segments; index++) {
    const p0 = at(index - 1), p1 = at(index), p2 = at(index + 1), p3 = at(index + 2);
    const c1: Pt = [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension];
    const c2: Pt = [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension];
    d += `C${fmt(c1)} ${fmt(c2)} ${fmt(p2)}`;
  }
  return closed ? `${d}Z` : d;
}

export const mirror = (points: readonly Pt[]): Pt[] => points.map(([x, y]) => [CENTER_X * 2 - x, y] as const);
const both = (points: readonly Pt[], closed = false, tension = 1) => `${smoothPath(points, closed, tension)}${smoothPath(mirror(points), closed, tension)}`;
const lineBoth = (points: readonly Pt[]) => both(points, false);
const scalePoints = (points: readonly Pt[], cx: number, cy: number, sx: number, sy = sx): Pt[] => points.map(([x, y]) => [cx + (x - cx) * sx, cy + (y - cy) * sy] as const);
const circle = (cx: number, cy: number, r: number) => `M${r1(cx - r)} ${r1(cy)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(r * 2)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-r * 2)} 0`;
const ellipse = (cx: number, cy: number, rx: number, ry: number) => `M${r1(cx - rx)} ${r1(cy)}a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(rx * 2)} 0a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-rx * 2)} 0`;
const roundedRect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${r1(x + r)} ${r1(y)}h${r1(w - r * 2)}a${r} ${r} 0 0 1 ${r} ${r}v${r1(h - r * 2)}a${r} ${r} 0 0 1 ${-r} ${r}h${r1(-(w - r * 2))}a${r} ${r} 0 0 1 ${-r} ${-r}v${r1(-(h - r * 2))}a${r} ${r} 0 0 1 ${r} ${-r}Z`;

/** A long bone: a shaft whose edges meet two rounded epiphyses. */
function bone(x1: number, y1: number, x2: number, y2: number, width: number): string {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / length, uy = (y2 - y1) / length;
  const half = width / 2;
  const knob = width * 0.82;
  const inset = Math.sqrt(Math.max(knob * knob - half * half, 0));
  const nx = -uy * half, ny = ux * half;
  const a: Pt = [x1 + ux * inset, y1 + uy * inset];
  const b: Pt = [x2 - ux * inset, y2 - uy * inset];
  return `M${fmt([a[0] + nx, a[1] + ny])}L${fmt([b[0] + nx, b[1] + ny])}M${fmt([a[0] - nx, a[1] - ny])}L${fmt([b[0] - nx, b[1] - ny])}${circle(x1, y1, knob)}${circle(x2, y2, knob)}`;
}
const boneBoth = (x1: number, y1: number, x2: number, y2: number, width: number) =>
  `${bone(x1, y1, x2, y2, width)}${bone(CENTER_X * 2 - x1, y1, CENTER_X * 2 - x2, y2, width)}`;

/* ------------------------------------------------------------------ silhouette */

/** Right half of the body outline, from the crown to the crotch. */
const BODY_RIGHT: Pt[] = [
  [200, 26],
  [221, 29], [235, 43], [241, 66], [240, 92], [235, 114], [226, 132], [214, 145],
  [214, 158], [217, 170],
  [238, 178], [262, 184], [280, 192], [292, 206],
  [298, 230], [302, 262], [307, 300], [312, 334],
  [318, 374], [325, 416], [331, 452], [334, 472],
  [340, 490], [345, 514], [343, 538], [335, 554], [327, 552], [322, 534], [318, 510],
  [312, 486],
  [304, 444], [295, 400], [287, 354], [281, 322],
  [276, 290], [271, 262], [266, 244],
  [260, 260], [256, 296], [252, 334], [248, 368],
  [254, 402], [264, 438], [270, 472],
  [272, 512], [269, 562], [263, 612], [256, 654], [252, 686],
  [255, 718], [257, 760], [251, 812], [243, 862], [238, 898],
  [242, 918], [255, 934], [262, 946], [255, 955], [226, 955], [216, 948],
  [214, 922], [214, 892],
  [212, 842], [214, 792], [213, 746], [210, 710],
  [210, 672], [209, 622], [206, 570], [203, 536],
  [200, 527],
];
const BODY_OUTLINE: Pt[] = [...BODY_RIGHT, ...mirror(BODY_RIGHT.slice(1, -1)).reverse()];
export const BODY_PATH = smoothPath(BODY_OUTLINE, true, 0.9);
/** Soft surface contours: collarbone shadow, sternum line, navel, knee creases. */
export const BODY_CONTOURS = [
  lineBoth([[206, 180], [228, 182], [252, 180]]),
  smoothPath([[200, 300], [200, 330]]),
  circle(200, 392, 2.2),
  lineBoth([[222, 684], [236, 690], [248, 684]]),
  lineBoth([[214, 148], [214, 160]]),
].join("");

/* ------------------------------------------------------------------ skeleton */

const SKULL: Pt[] = [[200, 30], [219, 32], [233, 45], [238, 66], [237, 90], [231, 108], [226, 120], [221, 134], [211, 142], [200, 144], [189, 142], [179, 134], [174, 120], [169, 108], [163, 90], [162, 66], [167, 45], [181, 32]];
const vertebrae = Array.from({ length: 28 }, (_, index) => {
  const y = 148 + index * 11.6;
  const width = 7 + (index / 27) * 9;
  return roundedRect(CENTER_X - width / 2, y, width, 8.2, 2);
}).join("");
const RIB_WIDTHS = [22, 31, 39, 44, 47, 49, 49, 47, 43, 37];
const ribs = RIB_WIDTHS.map((width, index) => {
  const y = 188 + index * 13.4;
  const start = index < 7 ? 205 : 205 + (index - 6) * 9;
  return lineBoth([[start, y], [start + (width - (start - 205)) * 0.45, y - 2], [205 + width * 0.86, y + 5], [205 + width, y + 16], [205 + width * 0.95, y + 27]]);
}).join("");
const PELVIS_RIGHT: Pt[] = [[204, 452], [220, 438], [244, 428], [262, 434], [266, 452], [258, 472], [246, 486], [234, 500], [216, 506], [206, 500]];

export const SKELETON_PARTS: FigurePart[] = [
  { key: "skull", layer: "skeleton", region: "head-mind", d: smoothPath(SKULL, true) + ellipse(187, 103, 7.5, 6.5) + ellipse(213, 103, 7.5, 6.5) + "M200 108l-5 11h10Z" + "M187 129h26M190 129v5M195 129v6M200 129v6M205 129v6M210 129v5", tone: "line" },
  { key: "spine", layer: "skeleton", region: "body", d: vertebrae, tone: "faint" },
  { key: "clavicles", layer: "skeleton", region: "chest-heart", d: lineBoth([[204, 176], [224, 178], [250, 174], [280, 187]]), tone: "line" },
  { key: "sternum", layer: "skeleton", region: "chest-heart", d: smoothPath([[196, 184], [204, 184], [206, 238], [202, 272], [198, 272], [194, 238]], true), tone: "line" },
  { key: "ribs", layer: "skeleton", region: "chest-heart", d: ribs, tone: "line" },
  { key: "pelvis", layer: "skeleton", region: "core-digestion", d: both(PELVIS_RIGHT, true) + ellipse(223, 487, 7, 6) + ellipse(177, 487, 7, 6) + smoothPath([[192, 446], [208, 446], [206, 474], [200, 484], [194, 474]], true), tone: "line" },
  { key: "arms", layer: "skeleton", region: "body", d: boneBoth(284, 202, 303, 328, 8) + boneBoth(308, 340, 328, 466, 5) + boneBoth(299, 341, 318, 470, 4.4) + lineBoth([[324, 482], [328, 522]]) + lineBoth([[331, 480], [336, 524]]) + lineBoth([[337, 480], [343, 518]]), tone: "line" },
  { key: "femur", layer: "skeleton", region: "legs-strength", d: boneBoth(240, 490, 232, 676, 11), tone: "line" },
  { key: "patella", layer: "skeleton", region: "legs-strength", d: ellipse(232, 692, 8, 9.5) + ellipse(168, 692, 8, 9.5), tone: "line", organ: "knee" },
  { key: "shin", layer: "skeleton", region: "legs-strength", d: boneBoth(229, 709, 226, 892, 9) + boneBoth(246, 713, 240, 888, 4.4), tone: "line" },
  { key: "feet-bones", layer: "skeleton", region: "legs-strength", d: lineBoth([[228, 906], [234, 930], [248, 946]]) + lineBoth([[222, 910], [224, 934], [232, 950]]) + lineBoth([[234, 902], [246, 926], [258, 944]]), tone: "line" },
];

/* ------------------------------------------------------------------ muscles */

export const MUSCLE_PARTS: FigurePart[] = [
  { key: "pecs", layer: "muscles", region: "chest-heart", d: both([[203, 192], [228, 186], [256, 192], [268, 210], [258, 232], [236, 242], [212, 240], [203, 226]], true), tone: "line" },
  { key: "abs", layer: "muscles", region: "core-digestion", d: [0, 1, 2, 3].map((row) => roundedRect(187, 278 + row * 25, 11.5, 21, 4) + roundedRect(201.5, 278 + row * 25, 11.5, 21, 4)).join("") + lineBoth([[250, 300], [240, 332], [228, 370], [216, 404]]), tone: "line" },
  { key: "shoulders", layer: "muscles", region: "legs-strength", d: both([[262, 182], [282, 190], [294, 208], [297, 236], [288, 248], [278, 222], [268, 200]], true), tone: "line" },
  { key: "arms-muscle", layer: "muscles", region: "legs-strength", d: both([[286, 236], [296, 262], [302, 300], [300, 322], [292, 300], [286, 266]], true) + lineBoth([[304, 344], [316, 388], [324, 440]]) + lineBoth([[296, 346], [304, 396], [314, 448]]), tone: "line" },
  { key: "quads", layer: "muscles", region: "legs-strength", organ: "quadriceps", tone: "fill",
    d: both([[238, 486], [248, 520], [250, 580], [244, 640], [236, 668], [228, 640], [226, 580], [230, 520]], true) + both([[216, 600], [226, 628], [230, 664], [222, 677], [212, 660], [210, 630]], true) },
  { key: "thigh-lines", layer: "muscles", region: "legs-strength", d: lineBoth([[262, 486], [268, 540], [264, 600], [254, 660], [246, 680]]) + lineBoth([[260, 466], [244, 520], [226, 590], [214, 650], [212, 700]]) + lineBoth([[208, 524], [218, 562], [220, 600]]), tone: "line" },
  { key: "calves", layer: "muscles", region: "legs-strength", organ: "calves", tone: "fill",
    d: both([[212, 720], [220, 750], [220, 800], [214, 830], [208, 800], [208, 750]], true) + both([[252, 722], [258, 760], [254, 810], [246, 830], [244, 790], [246, 750]], true) },
  { key: "shin-line", layer: "muscles", region: "legs-strength", d: lineBoth([[238, 716], [242, 780], [240, 850], [236, 890]]), tone: "line" },
];

/* ------------------------------------------------------------------ organs */

const BRAIN: Pt[] = [[200, 36], [216, 36], [229, 43], [236, 56], [237, 72], [233, 86], [222, 94], [210, 95], [200, 90], [190, 95], [178, 94], [167, 86], [163, 72], [164, 56], [171, 43], [184, 36]];
const BRAIN_GYRI = [
  lineBoth([[206, 44], [216, 48], [212, 58], [224, 62]]),
  lineBoth([[226, 50], [231, 64], [221, 70], [229, 80]]),
  lineBoth([[206, 64], [214, 72], [208, 82], [218, 88]]),
  smoothPath([[200, 38], [200, 90]]),
].join("");
const LUNG_RIGHT: Pt[] = [[193, 194], [183, 192], [171, 202], [161, 224], [155, 252], [152, 286], [155, 316], [166, 328], [182, 324], [192, 312], [196, 282], [197, 240], [196, 212]];
const LUNG_LEFT: Pt[] = [[207, 196], [217, 192], [229, 202], [239, 224], [245, 252], [248, 286], [245, 316], [234, 328], [218, 326], [212, 316], [222, 304], [226, 292], [214, 284], [206, 262], [204, 230]];
const HEART: Pt[] = [[206, 252], [218, 246], [230, 252], [237, 266], [234, 284], [224, 300], [210, 312], [200, 304], [193, 288], [192, 268], [198, 256]];
const LIVER: Pt[] = [[150, 336], [172, 330], [200, 334], [222, 338], [232, 346], [222, 358], [202, 368], [180, 378], [160, 374], [150, 358]];
const STOMACH: Pt[] = [[224, 340], [240, 338], [252, 348], [255, 366], [248, 386], [232, 396], [216, 394], [206, 386], [210, 378], [224, 380], [238, 372], [240, 358], [232, 350], [222, 352]];
const KIDNEY_RIGHT: Pt[] = [[170, 384], [180, 382], [186, 392], [182, 404], [184, 414], [176, 420], [166, 412], [164, 396]];
const COLON: Pt[] = [[176, 494], [166, 478], [162, 450], [163, 424], [172, 408], [200, 411], [228, 408], [237, 424], [239, 450], [235, 476], [222, 490], [206, 494]];
const colonOuter = scalePoints(COLON, 200, 450, 1.1, 1.12);
const colonInner = scalePoints(COLON, 200, 450, 0.9, 0.88);
const haustra = COLON.map((_, index) => `M${fmt(colonInner[index])}L${fmt(colonOuter[index])}`).join("");
const smallIntestine: Pt[] = Array.from({ length: 5 }, (_, row) => {
  const y = 424 + row * 12;
  const xs = row % 2 === 0 ? [180, 190, 200, 210, 220] : [220, 210, 200, 190, 180];
  return xs.map((x, column) => [x, y + (column % 2 === 0 ? -3 : 3)] as const);
}).flat();

export const ORGAN_PARTS: FigurePart[] = [
  { key: "brain", layer: "organs", region: "head-mind", organ: "brain", d: smoothPath(BRAIN, true), tone: "fill" },
  { key: "brain-gyri", layer: "organs", region: "head-mind", d: BRAIN_GYRI, tone: "line" },
  { key: "trachea", layer: "organs", region: "chest-heart", d: "M196 146V206M204 146V206" + Array.from({ length: 8 }, (_, i) => `M196 ${152 + i * 7}h8`).join("") + lineBoth([[200, 206], [190, 214], [180, 228]]), tone: "line" },
  { key: "lungs", layer: "organs", region: "chest-heart", organ: "lungs", d: smoothPath(LUNG_RIGHT, true) + smoothPath(LUNG_LEFT, true), tone: "fill" },
  { key: "lung-fissures", layer: "organs", region: "chest-heart", d: smoothPath([[156, 256], [176, 252], [194, 232]]) + smoothPath([[158, 292], [178, 284], [196, 278]]) + smoothPath([[246, 300], [228, 286], [210, 242]]), tone: "faint" },
  { key: "heart", layer: "organs", region: "chest-heart", organ: "heart", d: smoothPath(HEART, true), tone: "fill" },
  { key: "heart-detail", layer: "organs", region: "chest-heart", d: smoothPath([[214, 258], [217, 282], [208, 306]]) + smoothPath([[198, 262], [206, 270], [214, 268]]), tone: "line" },
  { key: "diaphragm", layer: "organs", region: "core-digestion", d: smoothPath([[150, 330], [172, 320], [196, 330], [200, 333], [204, 330], [228, 320], [250, 330]]), tone: "faint" },
  { key: "liver", layer: "organs", region: "core-digestion", organ: "liver", d: smoothPath(LIVER, true), tone: "fill" },
  { key: "stomach", layer: "organs", region: "core-digestion", organ: "stomach", d: smoothPath(STOMACH, true), tone: "fill" },
  { key: "pancreas", layer: "organs", region: "core-digestion", d: smoothPath([[184, 394], [204, 390], [228, 394], [240, 400], [230, 404], [206, 402], [186, 404]], true), tone: "line" },
  { key: "kidneys", layer: "organs", region: "core-digestion", organ: "kidneys", d: both(KIDNEY_RIGHT, true), tone: "dashed" },
  { key: "colon", layer: "organs", region: "core-digestion", organ: "intestines", d: smoothPath(colonOuter) + smoothPath(colonInner) + haustra, tone: "fill" },
  { key: "small-intestine", layer: "organs", region: "core-digestion", organ: "intestines", d: smoothPath(smallIntestine), tone: "tube" },
  { key: "bladder", layer: "organs", region: "core-digestion", d: smoothPath([[190, 492], [210, 492], [217, 503], [200, 513], [183, 503]], true), tone: "line" },
];

/* ------------------------------------------------------------------ circulation & nerves */

const FEMORAL_RIGHT: Pt[] = [[203, 452], [218, 474], [232, 510], [238, 560], [238, 620], [236, 680], [236, 740], [238, 820], [238, 890], [244, 930]];
const CAROTID_RIGHT: Pt[] = [[214, 238], [212, 200], [212, 160], [214, 130], [222, 108], [227, 86]];
const BRACHIAL_RIGHT: Pt[] = [[222, 230], [244, 198], [272, 197], [290, 220], [298, 270], [306, 330], [316, 390], [326, 450], [334, 488]];
const AORTA: Pt[] = [[212, 252], [210, 234], [218, 224], [228, 230], [224, 248], [208, 270], [205, 320], [204, 380], [204, 440], [203, 452]];
export const MOTION_PATHS = {
  aorta: smoothPath(AORTA),
  femoralRight: smoothPath(FEMORAL_RIGHT),
  femoralLeft: smoothPath(mirror(FEMORAL_RIGHT)),
  carotidRight: smoothPath(CAROTID_RIGHT),
  carotidLeft: smoothPath(mirror(CAROTID_RIGHT)),
  spinalCord: smoothPath([[200, 92], [200, 146], [200, 300], [200, 470]]),
  sciaticRight: smoothPath([[202, 456], [214, 484], [226, 530], [232, 600], [232, 680], [234, 760], [236, 840], [240, 900]]),
  sciaticLeft: smoothPath(mirror([[202, 456], [214, 484], [226, 530], [232, 600], [232, 680], [234, 760], [236, 840], [240, 900]])),
};

export const VESSEL_PARTS: FigurePart[] = [
  { key: "aorta", id: "atlas-aorta", layer: "circulation", region: "chest-heart", d: MOTION_PATHS.aorta, tone: "line" },
  { key: "carotids", layer: "circulation", region: "head-mind", d: MOTION_PATHS.carotidRight + MOTION_PATHS.carotidLeft + lineBoth([[222, 108], [214, 80], [204, 62]]), tone: "line" },
  { key: "arm-arteries", layer: "circulation", region: "body", d: lineBoth(BRACHIAL_RIGHT), tone: "line" },
  { key: "leg-arteries", layer: "circulation", region: "legs-strength", d: MOTION_PATHS.femoralRight + MOTION_PATHS.femoralLeft, tone: "line" },
  { key: "veins", layer: "circulation", region: "chest-heart", d: smoothPath([[196, 250], [195, 320], [196, 440], [197, 452]]) + lineBoth([[197, 452], [212, 478], [224, 516], [228, 600]]), tone: "faint" },
];

const GANGLIA = Array.from({ length: 14 }, (_, index) => circle(200, 160 + index * 22, 1.3)).join("");
export const NERVE_PARTS: FigurePart[] = [
  { key: "brainstem", layer: "nerves", region: "head-mind", d: smoothPath([[200, 90], [200, 146]]) + lineBoth([[204, 96], [214, 116], [220, 140]]), tone: "line" },
  { key: "spinal-cord", id: "atlas-cord", layer: "nerves", region: "body", d: smoothPath([[200, 146], [200, 300], [200, 470]]) + GANGLIA, tone: "line" },
  { key: "arm-nerves", layer: "nerves", region: "body", d: lineBoth([[202, 180], [226, 190], [258, 196], [284, 216], [296, 264], [304, 318], [314, 380], [324, 444], [332, 480], [338, 520]]), tone: "faint" },
  { key: "intercostal", layer: "nerves", region: "chest-heart", d: [0, 1, 2, 3, 4, 5].map((index) => lineBoth([[202, 200 + index * 20], [222, 204 + index * 20], [242, 214 + index * 20]])).join(""), tone: "faint" },
  { key: "leg-nerves", layer: "nerves", region: "legs-strength", d: MOTION_PATHS.sciaticRight + MOTION_PATHS.sciaticLeft + lineBoth([[234, 700], [246, 760], [244, 840]]), tone: "faint" },
];

export const FIGURE_PARTS: FigurePart[] = [...SKELETON_PARTS, ...MUSCLE_PARTS, ...ORGAN_PARTS, ...VESSEL_PARTS, ...NERVE_PARTS];

/** Landmark ticks for the measuring scale beside the figure. */
export const SCALE_MARKS = [
  { y: 66, label: "HEAD" },
  { y: 262, label: "CHEST" },
  { y: 420, label: "CORE" },
  { y: 690, label: "LEGS" },
] as const;
export const FIGURE_TOP = 26;
export const FIGURE_BOTTOM = 956;
