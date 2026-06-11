// Generates recognizable stick-figure SVGs for every exercise and writes them
// into src/data/exercises.json (the `svg` field of each row).
//
// Why a generator: exercises.json is the source of truth, but hand-authoring 62
// distinct figures inline drifts in style and ends up generic. Here every figure
// is composed from one shared vocabulary of primitives + poses, on a fixed
// 150x150 canvas using `currentColor`, so they read as a coherent set and the
// pose actually communicates the movement. Re-run after editing: `node
// scripts/gen-figures.mjs`. Verify visually with scripts/gen-figure-gallery.mjs.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(__dirname, '..', 'src', 'data', 'exercises.json');

// ── Primitives ──────────────────────────────────────────────────────────────
// All coordinates are in a 0..150 box. Ground sits at y=132 by convention.
const GY = 132;

const n = (v) => Math.round(v * 10) / 10;
const head = (cx, cy, r = 9) => `<circle cx="${n(cx)}" cy="${n(cy)}" r="${r}" fill="currentColor"/>`;
const line = (x1, y1, x2, y2, extra = '') =>
  `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"${extra ? ' ' + extra : ''}/>`;
const path = (d, extra = '') => `<path d="${d}"${extra ? ' ' + extra : ''}/>`;
const circle = (cx, cy, r, extra = '') =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"${extra ? ' ' + extra : ''}/>`;
const rect = (x, y, w, h, extra = '') =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="2"${extra ? ' ' + extra : ''}/>`;

const DASH = 'stroke-dasharray="5 3"';
const THIN = 'stroke-width="1.5"';
// Environment marker: elements tagged with REF (ground/wall/floor) are excluded
// from the figure-centering bounding box, so the *figure* gets centered rather
// than being pinned by a full-width ground line. They're still kept inside the
// canvas by the clip guard in SVG().
const REF = 'data-ref="1"';
const ground = (x1 = 16, x2 = 134, y = GY) =>
  line(x1, y, x2, y, `stroke-dasharray="2 5" opacity="0.55" ${REF}`);
// A solid floor line (same role as ground, but solid).
const floor = (x1, x2, y = GY) => line(x1, y, x2, y, REF);
// A vertical wall on the right.
const wall = (x = 126, y1 = 24, y2 = GY) => line(x, y1, x, y2, `opacity="0.55" ${DASH} ${REF}`);
// Polyline through [x,y] joint pairs.
const limb = (pts, extra = '') => {
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${n(p[0])} ${n(p[1])}`).join(' ');
  return path(d, extra);
};
// A motion/direction arrow (single chevron-tipped segment).
const arrow = (x1, y1, x2, y2) => {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const a = 0.5;
  const len = 6;
  const wing1 = [x2 - len * Math.cos(ang - a), y2 - len * Math.sin(ang - a)];
  const wing2 = [x2 - len * Math.cos(ang + a), y2 - len * Math.sin(ang + a)];
  return [
    line(x1, y1, x2, y2, THIN),
    line(x2, y2, wing1[0], wing1[1], THIN),
    line(x2, y2, wing2[0], wing2[1], THIN),
  ];
};
// Small equipment helpers.
const ball = (cx, cy, r = 11) => circle(cx, cy, r, THIN);
const box = (x, y, w, h) => rect(x, y, w, h, 'opacity="0.85"');
const dumbbell = (cx, cy) =>
  [line(cx - 5, cy, cx + 5, cy, THIN), line(cx - 5, cy - 4, cx - 5, cy + 4), line(cx + 5, cy - 4, cx + 5, cy + 4)];
const barbell = (cx, cy, half = 26) =>
  [
    line(cx - half, cy, cx + half, cy),
    line(cx - half, cy - 5, cx - half, cy + 5),
    line(cx - half + 4, cy - 6, cx - half + 4, cy + 6),
    line(cx + half, cy - 5, cx + half, cy + 5),
    line(cx + half - 4, cy - 6, cx + half - 4, cy + 6),
  ];

// Bounding box of a single element string (accounts for circle r and rect size;
// for paths, every coordinate pair — including curve control points — is
// included, which keeps the curve safely inside). Returns null if none found.
const numsIn = (re, s) => {
  const m = re.exec(s);
  return m ? m.slice(1).map(Number) : null;
};
function elementBounds(s) {
  if (s.startsWith('<circle')) {
    const v = numsIn(/cx="(-?[\d.]+)" cy="(-?[\d.]+)" r="(-?[\d.]+)"/, s);
    if (!v) return null;
    const [cx, cy, r] = v;
    return [cx - r, cy - r, cx + r, cy + r];
  }
  if (s.startsWith('<line')) {
    const v = numsIn(/x1="(-?[\d.]+)" y1="(-?[\d.]+)" x2="(-?[\d.]+)" y2="(-?[\d.]+)"/, s);
    if (!v) return null;
    const [x1, y1, x2, y2] = v;
    return [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
  }
  if (s.startsWith('<rect')) {
    const v = numsIn(/x="(-?[\d.]+)" y="(-?[\d.]+)" width="(-?[\d.]+)" height="(-?[\d.]+)"/, s);
    if (!v) return null;
    const [x, y, w, h] = v;
    return [x, y, x + w, y + h];
  }
  if (s.startsWith('<path')) {
    const d = /d="([^"]+)"/.exec(s);
    if (!d) return null;
    const nums = (d[1].match(/-?[\d.]+/g) || []).map(Number);
    const xs = [];
    const ys = [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      xs.push(nums[i]);
      ys.push(nums[i + 1]);
    }
    if (!xs.length) return null;
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  }
  return null;
}

// Composes elements into a figure, auto-centered in the 150x150 canvas. The
// figure (non-REF elements) is centered and scaled to fit an inner margin;
// REF elements (ground/wall) are kept inside the canvas but don't bias centering.
const MARGIN = 12; // inner padding for the figure
const SAFE = 5; // hard padding the full drawing (incl. refs) must stay within
const MAX_SCALE = 1.15; // never enlarge a figure more than this
const r3 = (v) => Math.round(v * 1000) / 1000;
const r2 = (v) => Math.round(v * 100) / 100;

const SVG = (...parts) => {
  const flat = parts.flat(Infinity).filter(Boolean);
  const PAD = 2; // stroke allowance around each element
  let fig = [Infinity, Infinity, -Infinity, -Infinity];
  let full = [Infinity, Infinity, -Infinity, -Infinity];
  const grow = (bb, b) => {
    bb[0] = Math.min(bb[0], b[0] - PAD);
    bb[1] = Math.min(bb[1], b[1] - PAD);
    bb[2] = Math.max(bb[2], b[2] + PAD);
    bb[3] = Math.max(bb[3], b[3] + PAD);
  };
  for (const s of flat) {
    const b = elementBounds(s);
    if (!b) continue;
    grow(full, b);
    if (!s.includes('data-ref')) grow(fig, b);
  }
  if (!Number.isFinite(fig[0])) fig = full;

  const cx = (fig[0] + fig[2]) / 2;
  const cy = (fig[1] + fig[3]) / 2;
  const figW = fig[2] - fig[0];
  const figH = fig[3] - fig[1];
  const inner = 150 - 2 * MARGIN;
  const halfSafe = 75 - SAFE;
  // Largest reach of the *full* drawing from the figure centre, per axis — used
  // to ensure even the ground/wall stay on-canvas after centering.
  const reachX = Math.max(cx - full[0], full[2] - cx, 1);
  const reachY = Math.max(cy - full[1], full[3] - cy, 1);
  const scale = Math.min(MAX_SCALE, inner / figW, inner / figH, halfSafe / reachX, halfSafe / reachY);

  const transform = `translate(75 75) scale(${r3(scale)}) translate(${r2(-cx)} ${r2(-cy)})`;
  return `<svg viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n  <g transform="${transform}">\n    ${flat.join('\n    ')}\n  </g>\n</svg>`;
};

// ── Poses ─────────────────────────────────────────────────────────────────
// Each returns an array of element strings. Composed into a figure by SVG().

const poses = {
  // Prone, face down, gentle breathing arcs over the back.
  proneBreathing: () => [
    ground(),
    head(36, GY - 8, 8),
    limb([[44, GY - 6], [78, GY - 2], [118, GY - 2]]), // torso + legs along floor
    limb([[118, GY - 2], [130, GY - 2]]),
    limb([[48, GY - 6], [40, GY + 0], [50, GY + 0]], THIN), // forearm under head
    path(`M70 ${GY - 14} Q82 ${GY - 22} 94 ${GY - 14}`, THIN), // breath arc
    path(`M74 ${GY - 12} Q82 ${GY - 18} 90 ${GY - 12}`, THIN),
  ],
  // Glute bridge: shoulders + feet down, hips lifted into a triangle.
  gluteBridge: () => [
    ground(),
    head(34, GY - 6, 8),
    limb([[42, GY - 4], [70, GY - 4]]), // shoulders/upper back on floor
    limb([[70, GY - 4], [92, GY - 26], [104, GY - 4]]), // hip lift + thigh down to feet
    limb([[104, GY - 4], [104, GY - 2]]),
  ],
  // Foot in profile with a lifted arch (short-foot doming).
  shortFoot: () => [
    floor(30, 118), // floor
    limb([[40, GY - 26], [40, GY - 4]]), // shin
    path(`M40 ${GY - 4} Q44 ${GY} 58 ${GY} Q86 ${GY - 2} 104 ${GY - 6}`, THIN), // foot top
    path(`M52 ${GY} Q70 ${GY - 9} 100 ${GY - 5}`, THIN + ' stroke-dasharray="3 2"'), // raised arch
    line(40, GY - 26, 40, GY - 34), // toward leg
  ],
  // Spanish squat: upright torso, knees bent, band behind knees to an anchor.
  spanishSquat: () => [
    ground(),
    head(70, 30, 9),
    limb([[70, 39], [70, 74]]), // torso (upright)
    limb([[70, 48], [54, 64]]), // arms forward
    limb([[70, 48], [86, 64]]),
    limb([[70, 74], [56, 96], [56, GY]]), // bent legs
    limb([[70, 74], [86, 96], [86, GY]]),
    line(56, 96, 124, 96, DASH), // band to anchor
    line(86, 96, 124, 96, DASH),
    line(124, 84, 124, 108, 'opacity="0.55"'),
  ],
  // Single-leg RDL: hinge, torso + free leg form a horizontal line ("T").
  slRDL: (db = false) => [
    ground(),
    head(40, 58, 9),
    limb([[48, 60], [104, 70]]), // torso tipped forward
    limb([[104, 70], [70, 96], [70, GY]]), // stance leg
    limb([[60, 64], [60, 86]]), // hanging arm
    limb([[104, 70], [128, 64]]), // free leg extended back/up
    db ? dumbbell(60, 88) : null,
  ],
  // Split squat / lunge iso: both knees bent, front shin vertical.
  splitSquat: (platform = false, mirror = false) => {
    const f = (x) => (mirror ? 150 - x : x);
    return [
      platform ? null : ground(),
      head(f(75), 30, 9),
      limb([[f(75), 39], [f(75), 74]]), // upright torso
      limb([[f(75), 48], [f(60), 62]]),
      limb([[f(75), 74], [f(58), 98], [f(58), GY - (platform ? 8 : 0)]]), // front leg
      limb([[f(75), 74], [f(96), 96], [f(110), GY - (platform ? 8 : 0)]]), // rear leg
      platform ? box(f(48), GY - 8, 66, 8) : null,
    ];
  },
  // Parallel squat: thighs horizontal, torso slightly forward.
  squatParallel: (platform = false, bar = false) => [
    platform ? null : ground(),
    bar ? barbell(75, 46, 24) : null,
    head(75, 30, 9),
    limb([[75, 39], [78, 70]]),
    bar ? null : limb([[75, 46], [60, 60]]),
    bar ? null : limb([[75, 46], [90, 60]]),
    limb([[78, 70], [98, 70], [98, GY - (platform ? 8 : 0)]]), // thigh parallel then shin down
    limb([[78, 70], [58, 70], [58, GY - (platform ? 8 : 0)]]),
    platform ? box(46, GY - 8, 64, 8) : null,
  ],
  // Single-leg calf raise on toes, hand to wall.
  calfRaise: () => [
    floor(24, 120),
    wall(122, 24, GY),
    head(60, 30, 9),
    limb([[60, 39], [60, 84]]),
    limb([[60, 48], [92, 56]]), // arm to wall
    line(92, 56, 110, 56),
    limb([[60, 84], [60, GY - 6]]), // stance leg
    path(`M58 ${GY - 6} L58 ${GY} L70 ${GY}`, THIN), // foot on toes (heel raised)
    limb([[60, 84], [44, 100], [50, 112]], THIN), // tucked free leg
    arrow(78, 96, 78, 80), // up
  ],
  // Tibialis raise: heels down, toes pulled up off the floor.
  tibRaise: () => [
    floor(20, 116),
    wall(118, 24, GY),
    head(62, 30, 9),
    limb([[62, 39], [74, 56]]), // torso leaning back to wall
    limb([[74, 56], [96, 56]]), // shoulders to wall
    limb([[62, 46], [50, 58]]),
    limb([[74, 56], [60, 98], [44, GY]]), // legs forward, heels planted
    path(`M44 ${GY} L40 ${GY - 14}`, 'stroke-width="2.5"'), // toes lifted clearly up
    arrow(30, GY - 4, 30, GY - 18), // up
  ],
  // Half-kneeling hip-flexor stretch.
  hipFlexorStretch: () => [
    ground(),
    head(56, 32, 9),
    limb([[56, 41], [56, 74]]), // upright torso
    limb([[56, 50], [70, 40]]), // arm up
    limb([[56, 74], [40, 96], [40, GY]]), // front foot planted
    limb([[56, 74], [78, 92], [104, GY], [118, GY]]), // back knee down + shin
  ],
  // Step-down off a box, hand on front of working thigh (tactile).
  stepDown: () => [
    ground(),
    box(86, GY - 30, 40, 30),
    head(70, 26, 9),
    limb([[70, 35], [70, 70]]),
    limb([[70, 44], [82, 62]]), // hand to front of thigh
    limb([[70, 70], [88, 86], [88, GY - 30]]), // stance leg on box
    limb([[70, 70], [58, 96], [58, GY]]), // lowering leg toward floor
  ],
  // Wall-supported single-leg squat.
  wallSLSquat: () => [
    floor(24, 116),
    wall(118, 24, GY),
    head(64, 32, 9),
    limb([[64, 41], [78, 64]]), // torso leaning back to wall
    limb([[78, 64], [98, 64]]), // back to wall contact
    limb([[64, 41], [50, 54]]),
    limb([[78, 64], [60, 84], [60, GY]]), // stance leg bent
    limb([[78, 64], [92, 80], [98, 74]], THIN), // free leg forward
  ],
  // Eccentric sit-to-stand: lowering to a high box on one leg.
  boxSitToStand: () => [
    ground(),
    box(82, GY - 26, 44, 26),
    head(60, 34, 9),
    limb([[60, 43], [74, 70]]), // torso hinged
    limb([[60, 43], [48, 58]]),
    limb([[74, 70], [62, 96], [62, GY]]), // working leg
    limb([[74, 70], [88, 82], [104, 78]], THIN), // free leg forward
    arrow(98, 78, 98, 96),
  ],
  // Supine, legs up to a ball overhead (kicks / taps).
  supineBall: (toes = false) => [
    ground(),
    ball(96, GY - 40),
    head(30, GY - 6, 8),
    limb([[38, GY - 4], [66, GY - 4]]), // back on floor
    limb([[66, GY - 4], [78, GY - 28], [92, GY - 30]]), // one leg up to ball
    limb([[66, GY - 4], [82, GY - 18], [96, GY - 20]], THIN), // other leg lower (alternating)
    toes ? arrow(96, GY - 26, 96, GY - 34) : null,
  ],
  // Prone, heels tapping toward glutes (alternating).
  proneHeelTaps: () => [
    ground(),
    head(34, GY - 6, 8),
    limb([[42, GY - 4], [86, GY - 2]]), // torso prone
    limb([[86, GY - 2], [104, GY - 18]]), // one heel up
    limb([[86, GY - 2], [106, GY - 4]], THIN), // other leg down
    arrow(104, GY - 20, 96, GY - 8),
  ],
  // Seated on a Swiss ball, trunk rotating.
  seatedBallRotation: () => [
    ground(),
    ball(75, GY - 14, 14),
    head(75, 40, 9),
    limb([[75, 49], [75, GY - 26]]), // torso seated on ball
    limb([[75, 58], [98, 50]]), // arms out, rotated
    limb([[75, 58], [52, 66]]),
    limb([[75, GY - 26], [60, GY], [60, GY + 2]]),
    limb([[75, GY - 26], [90, GY], [90, GY + 2]]),
    path(`M96 44 Q108 52 100 62`, THIN), // rotation arc
  ],
  // Quadruped with hands on a ball, rocking.
  quadrupedBall: () => [
    ground(),
    ball(104, GY - 12),
    head(40, GY - 30, 8),
    limb([[47, GY - 28], [86, GY - 18]]), // back
    limb([[86, GY - 18], [104, GY - 12]]), // arms to ball
    limb([[60, GY - 22], [56, GY]]), // knee down
    limb([[80, GY - 19], [82, GY]]),
    arrow(70, GY - 30, 92, GY - 24),
  ],
  // Jump rope: small hop, rope arc over the head.
  jumpRope: () => [
    ground(),
    path(`M30 ${GY} Q75 ${GY - 96} 120 ${GY}`, THIN), // rope arc
    head(75, 32, 9),
    limb([[75, 41], [75, 80]]),
    limb([[75, 48], [64, 62], [62, 70]]), // arms to handles
    limb([[75, 48], [86, 62], [88, 70]]),
    limb([[75, 80], [68, 104], [68, GY - 6]]), // slight hop (feet off floor)
    limb([[75, 80], [82, 104], [82, GY - 6]]),
  ],
  // World's greatest stretch: deep lunge, one hand down, other arm up rotating.
  greatestStretch: () => [
    ground(),
    head(48, 40, 9),
    limb([[48, 49], [62, 78]]), // torso
    limb([[62, 78], [44, 100], [44, GY]]), // front foot
    limb([[62, 78], [86, 100], [112, GY], [124, GY]]), // back leg extended
    limb([[54, 60], [40, 86], [40, GY]]), // lead hand to floor
    limb([[56, 56], [74, 36]]), // top arm rotating up
  ],
  // Inchworm: hips high, hands walked out, heading to plank.
  inchworm: () => [
    ground(),
    head(104, GY - 14, 8),
    limb([[98, GY - 16], [60, GY - 26]]), // back sloping up to high hips
    limb([[60, GY - 26], [40, GY]]), // legs straight to floor
    limb([[98, GY - 16], [108, GY]]), // arms down to floor
    arrow(112, GY - 22, 124, GY - 22),
  ],
  // Scapular push-up: plank top, small protraction arc on the back.
  scapPushup: () => [
    ground(),
    head(36, GY - 22, 8),
    limb([[43, GY - 21], [112, GY - 10]]), // plank body
    limb([[112, GY - 10], [124, GY]]), // legs/feet
    limb([[48, GY - 20], [48, GY]]), // arms straight down
    path(`M64 ${GY - 28} Q74 ${GY - 34} 84 ${GY - 28}`, THIN), // scap arc
  ],
  // Down-dog: inverted V.
  downDog: () => [
    ground(),
    limb([[28, GY], [75, GY - 56], [122, GY]]), // inverted V
    head(40, GY - 30, 7),
  ],
  // Walking lunge with torso rotation.
  lungeRotation: () => [
    ground(),
    head(70, 32, 9),
    limb([[70, 41], [70, 74]]),
    limb([[70, 50], [96, 50]]), // arms out rotated
    limb([[70, 50], [48, 56]]),
    limb([[70, 74], [54, 98], [54, GY]]), // front leg
    limb([[70, 74], [92, 96], [112, GY]]), // back leg
    path(`M94 44 Q104 50 96 58`, THIN),
  ],
  // Cossack squat: wide stance, one knee deep, other leg straight.
  cossack: () => [
    ground(),
    head(58, 36, 9),
    limb([[58, 45], [58, 78]]),
    limb([[58, 52], [76, 58]]), // arms forward for counterbalance
    limb([[58, 52], [44, 60]]),
    limb([[58, 78], [44, 100], [40, GY]]), // deep bent leg
    limb([[58, 78], [98, 110], [120, GY]]), // straight leg out wide
  ],
  // A-skip: tall posture, one knee driven high.
  aSkip: (extend = false) => [
    ground(),
    head(64, 28, 9),
    limb([[64, 37], [66, 76]]),
    limb([[64, 46], [50, 62]]), // arms in run swing
    limb([[64, 46], [80, 60]]),
    extend
      ? limb([[66, 76], [86, 72], [104, 84]]) // B-skip: knee up then leg extended forward
      : limb([[66, 76], [78, 60], [74, 80]]), // A-skip: knee driven high
    limb([[66, 76], [60, 104], [60, GY - 8]]), // support leg (slight hop)
    arrow(96, 96, 96, 80),
  ],
  // Pogo / hop family: stiff legs, feet off ground; amplitude + 1 vs 2 legs vary.
  pogo: ({ singleLeg = false, amp = 16 } = {}) => {
    const feetY = GY - amp;
    return [
      ground(),
      head(75, 30, 9),
      limb([[75, 39], [75, 78]]),
      limb([[75, 46], [62, 60]]),
      limb([[75, 46], [88, 60]]),
      singleLeg
        ? [limb([[75, 78], [75, feetY]]), limb([[75, 78], [62, 92], [66, 104]], THIN)]
        : [limb([[75, 78], [66, feetY]]), limb([[75, 78], [84, feetY]])],
      arrow(104, GY - 6, 104, GY - 6 - amp),
      arrow(46, GY - 6 - amp, 46, GY - 6),
    ];
  },
  // Med-ball throw: chest pass (forward) or overhead.
  medBall: (overhead = false, small = false) => {
    const r = small ? 8 : 11;
    return overhead
      ? [
          ground(),
          ball(75, 20, r),
          head(75, 40, 9),
          limb([[75, 49], [75, 86]]),
          limb([[75, 52], [70, 30]]), // arms overhead to ball
          limb([[75, 52], [80, 30]]),
          limb([[75, 86], [64, 110], [64, GY]]),
          limb([[75, 86], [86, 110], [86, GY]]),
          arrow(100, 30, 112, 18),
        ]
      : [
          ground(),
          ball(102, 60, r),
          head(60, 34, 9),
          limb([[60, 43], [60, 82]]),
          limb([[60, 50], [92, 60]]), // arms pressing ball forward
          limb([[60, 50], [92, 64]]),
          limb([[60, 82], [50, 108], [50, GY]]),
          limb([[60, 82], [72, 108], [72, GY]]),
          arrow(116, 60, 130, 60),
        ];
  },
  // Reclined incline DB press: backrest high on the left, pressing up.
  inclineDbPress: () => [
    ground(),
    limb([[34, GY - 52], [58, GY - 8], [86, GY - 6]]), // incline backrest + seat
    head(48, GY - 46, 8),
    limb([[54, GY - 40], [76, GY - 22]]), // reclined torso down the backrest
    limb([[76, GY - 22], [98, GY - 20], [98, GY]]), // thigh + shin to floor
    limb([[60, GY - 34], [64, GY - 58]]), // arms pressing straight up
    limb([[64, GY - 32], [78, GY - 58]]),
    dumbbell(64, GY - 60),
    dumbbell(80, GY - 60),
    arrow(106, GY - 32, 106, GY - 52), // up
  ],
  // Bent-over barbell row.
  barbellRow: () => [
    ground(),
    head(40, 46, 9),
    limb([[48, 50], [96, 62]]), // torso hinged forward
    limb([[96, 62], [80, 96], [80, GY]]), // legs
    limb([[96, 62], [98, 96], [98, GY]]),
    limb([[72, 58], [72, 86]]), // arms pulling bar up to torso
    barbell(72, 88, 22),
    arrow(72, 100, 72, 84),
  ],
  // Seated pulldown: bar from overhead frame.
  pulldown: () => [
    ground(),
    line(30, 18, 120, 18), // overhead frame
    line(60, 18, 56, 40),
    line(90, 18, 94, 40),
    barbell(75, 42, 22),
    head(75, 58, 9),
    limb([[75, 50], [60, 44]]), // arms up to bar
    limb([[75, 50], [90, 44]]),
    limb([[75, 67], [75, 104]]),
    limb([[75, 104], [64, GY], [64, GY + 2]]),
    limb([[75, 104], [86, GY], [86, GY + 2]]),
    arrow(110, 52, 110, 70),
  ],
  // Standing barbell curl (depth-drop).
  barbellCurl: () => [
    ground(),
    head(75, 28, 9),
    limb([[75, 37], [75, 82]]),
    limb([[75, 46], [66, 66], [72, 70]]), // upper arm + forearm curling
    limb([[75, 46], [84, 66], [78, 70]]),
    barbell(75, 70, 20),
    limb([[75, 82], [66, 106], [66, GY]]),
    limb([[75, 82], [84, 106], [84, GY]]),
    arrow(102, 84, 102, 66),
  ],
  // Dead hang from a high bar.
  deadHang: () => [
    line(28, 22, 122, 22), // bar
    head(75, 44, 9),
    limb([[68, 36], [68, 23]]), // arms up to bar
    limb([[82, 36], [82, 23]]),
    limb([[75, 53], [75, 104]]),
    limb([[75, 104], [70, 124]]),
    limb([[75, 104], [80, 124]]),
  ],
  // Weighted dip on parallel bars.
  dip: () => [
    ground(),
    line(40, GY - 40, 40, GY), // bar stands
    line(110, GY - 40, 110, GY),
    line(36, GY - 40, 64, GY - 40), // left bar
    line(86, GY - 40, 114, GY - 40), // right bar
    head(75, GY - 60, 9),
    limb([[75, GY - 51], [75, GY - 20]]), // torso between bars
    limb([[75, GY - 48], [58, GY - 40]]), // arms supporting on bars
    limb([[75, GY - 48], [92, GY - 40]]),
    limb([[75, GY - 20], [70, GY - 6]]), // legs tucked
    limb([[75, GY - 20], [82, GY - 6]]),
    circle(75, GY - 8, 4, THIN), // hanging weight
  ],
  // Vertical jump reaching to a wall.
  verticalJump: () => [
    line(24, 18, 24, GY, `opacity="0.55" ${REF}`), // wall on left
    line(20, 26, 32, 26, THIN), // touch target
    ground(40, 134),
    head(64, 40, 9),
    limb([[64, 31], [64, 26]]), // reaching arm up to target
    limb([[64, 40], [50, 30]]),
    limb([[64, 49], [66, 84]]),
    limb([[66, 84], [60, 108], [60, GY - 12]]), // airborne
    limb([[66, 84], [74, 108], [74, GY - 12]]),
    arrow(96, 96, 96, 70),
  ],
  // Approach jump: angled run-in arrow then two-foot takeoff to a target.
  approachJump: (target = true, oneStep = false, mirror = false) => {
    const f = (x) => (mirror ? 150 - x : x);
    return [
      ground(),
      target ? line(f(118), 20, f(130), 20, THIN) : null,
      head(f(66), 40, 9),
      limb([[f(66), 31], [f(78), 22]]), // reaching arm
      limb([[f(66), 40], [f(52), 50]]),
      limb([[f(66), 49], [f(68), 84]]),
      oneStep
        ? limb([[f(68), 84], [f(58), 106], [f(58), GY - 8]]) // single-leg takeoff
        : [
            limb([[f(68), 84], [f(60), 106], [f(60), GY - 8]]),
            limb([[f(68), 84], [f(76), 106], [f(76), GY - 8]]),
          ],
      arrow(f(30), GY - 6, f(52), 64), // approach run-in
    ];
  },
  // Broad jump: a horizontal leap (forward trajectory arc), distinct from the
  // vertical reach of approach jumps. `dist` shrinks the arc (e.g. 50% efforts);
  // `singleLand` lands on one leg; `mirror` flips left/right.
  broadJump: ({ dist = 1, singleLand = false, mirror = false } = {}) => {
    const f = (x) => (mirror ? 150 - x : x);
    const startX = 22;
    const endX = startX + 96 * dist;
    const apexX = (startX + endX) / 2;
    return [
      ground(),
      path(`M${n(f(startX))} ${GY - 2} Q${n(f(apexX))} ${GY - 52} ${n(f(endX))} ${GY - 4}`, THIN),
      arrow(f(endX - 12), GY - 22, f(endX), GY - 4), // landing direction (forward + down)
      head(f(apexX - 4), 42, 9), // airborne at the apex, leaning into travel
      limb([[f(apexX - 4), 51], [f(apexX + 10), 70]]), // torso leaning forward
      limb([[f(apexX - 4), 55], [f(apexX - 20), 50]]), // trailing arm back
      limb([[f(apexX - 4), 55], [f(apexX + 14), 50]]), // lead arm forward
      singleLand
        ? limb([[f(apexX + 10), 70], [f(apexX + 22), 88], [f(apexX + 22), GY - 6]])
        : [
            limb([[f(apexX + 10), 70], [f(apexX + 20), 88], [f(apexX + 20), GY - 6]]),
            limb([[f(apexX + 10), 70], [f(apexX + 8), 90], [f(apexX + 8), GY - 6]]),
          ],
    ];
  },
  // Box jump: takeoff toward a box.
  boxJump: (stepUp = false) => [
    ground(),
    box(92, GY - 34, 40, 34),
    head(54, 44, 9),
    limb([[54, 53], [58, 86]]),
    limb([[54, 56], [40, 46]]),
    limb([[54, 56], [68, 48]]),
    stepUp
      ? limb([[58, 86], [78, 88], [92, GY - 34]]) // driving one leg up onto box
      : [limb([[58, 86], [52, 108], [52, GY - 8]]), limb([[58, 86], [66, 108], [66, GY - 8]])],
    arrow(78, 70, 96, GY - 40),
  ],
  // Step-down soft landing: stepping off a box, holding a soft landing.
  softLanding: () => [
    ground(),
    box(88, GY - 28, 38, 28),
    head(64, 40, 9),
    limb([[64, 49], [66, 80]]),
    limb([[64, 52], [50, 64]]),
    limb([[64, 52], [80, 64]]),
    limb([[66, 80], [58, 102], [58, GY]]), // landing leg, knee soft
    limb([[66, 80], [82, 90], [96, GY - 28]]), // trailing foot still on box
  ],
  // Overhead press iso against a machine bar.
  overheadPressIso: () => [
    ground(),
    head(75, 44, 9),
    line(52, 24, 98, 24), // machine bar overhead
    line(56, 24, 56, 18, THIN),
    line(94, 24, 94, 18, THIN),
    limb([[68, 38], [66, 24]]), // arms pressing up to bar
    limb([[82, 38], [84, 24]]),
    limb([[75, 53], [75, 92]]),
    limb([[75, 92], [64, 116], [64, GY]]),
    limb([[75, 92], [86, 116], [86, GY]]),
  ],
  // Standing DB overhead press: dumbbells pressed straight overhead.
  dbOverheadPress: () => [
    ground(),
    head(75, 36, 9),
    limb([[75, 45], [75, 86]]), // upright torso
    limb([[75, 52], [64, 24]]), // arms pressing straight overhead
    limb([[75, 52], [86, 24]]),
    dumbbell(64, 22),
    dumbbell(86, 22),
    limb([[75, 86], [66, 110], [66, GY]]), // straight legs
    limb([[75, 86], [84, 110], [84, GY]]),
    arrow(104, 72, 104, 50), // up
  ],
  // DB push press: shallow dip-drive in the legs, dumbbells launched overhead.
  pushPress: () => [
    ground(),
    head(75, 34, 9),
    limb([[75, 43], [75, 80]]), // torso
    limb([[75, 50], [64, 22]]), // arms driving overhead
    limb([[75, 50], [86, 22]]),
    dumbbell(64, 20),
    dumbbell(86, 20),
    limb([[75, 80], [62, 96], [66, GY]]), // bent legs (the dip-drive)
    limb([[75, 80], [88, 96], [84, GY]]),
    arrow(104, 78, 104, 48), // strong upward drive
  ],
  // Face pull: high elbows, band/cable pulled toward the face from a front anchor.
  facePull: () => [
    ground(),
    line(124, 28, 124, 60, `opacity="0.55" ${REF}`), // anchor in front
    head(58, 34, 9),
    limb([[58, 43], [58, 86]]), // torso
    limb([[58, 50], [80, 44], [68, 40]]), // arm: shoulder -> high elbow -> hand by face
    limb([[58, 52], [80, 56], [68, 46]]), // second arm, slightly lower
    line(68, 41, 124, 41, DASH), // band to anchor
    line(68, 46, 124, 46, DASH),
    limb([[58, 86], [50, 110], [50, GY]]),
    limb([[58, 86], [66, 110], [66, GY]]),
    arrow(98, 43, 82, 43), // pull toward the face
  ],
  // Plyometric push-up: hands off the floor.
  plyoPushup: () => [
    ground(),
    head(34, GY - 18, 8),
    limb([[41, GY - 17], [104, GY - 8]]), // body
    limb([[104, GY - 8], [122, GY]]), // legs to toes
    limb([[50, GY - 16], [50, GY - 6]]), // hands raised above floor
    limb([[64, GY - 14], [64, GY - 6]]),
    arrow(40, GY - 30, 40, GY - 42), // up
  ],
  // Smith ballistic bench: supine under a racked bar.
  smithBench: () => [
    ground(),
    line(28, 24, 28, GY, `opacity="0.55" ${REF}`), // smith uprights
    line(122, 24, 122, GY, `opacity="0.55" ${REF}`),
    line(40, GY - 52, 40, GY - 20, THIN),
    line(110, GY - 52, 110, GY - 20, THIN),
    barbell(75, GY - 50, 26),
    box(46, GY - 18, 58, 6), // bench
    head(44, GY - 24, 8),
    limb([[52, GY - 22], [96, GY - 22]]), // supine torso on bench
    limb([[66, GY - 24], [66, GY - 48]]), // arms pressing bar
    limb([[80, GY - 24], [80, GY - 48]]),
    limb([[96, GY - 22], [104, GY - 4], [104, GY]]),
  ],
  // Nordic hamstring curl: kneeling, body lowering forward, ankles anchored.
  nordic: () => [
    ground(),
    limb([[112, GY - 4], [120, GY - 4]]), // ankle anchor pad
    head(46, GY - 42, 8),
    limb([[52, GY - 40], [92, GY - 16]]), // body lowering forward in a line
    limb([[92, GY - 16], [108, GY - 4]]), // shins to anchored ankles
    limb([[58, GY - 36], [58, GY - 16]]), // arms ready to catch
    arrow(40, GY - 44, 30, GY - 30),
  ],
  // Easy run: clean running silhouette.
  run: () => [
    ground(),
    head(78, 30, 9),
    limb([[78, 39], [74, 74]]), // torso with slight lean
    limb([[76, 48], [92, 58]]), // arms swinging
    limb([[76, 48], [60, 60]]),
    limb([[74, 74], [92, 92], [98, GY]]), // trailing leg push-off
    limb([[74, 74], [62, 96], [54, 108]]), // lead leg, knee up
  ],
  // Seated figure-4 glute stretch.
  gluteStretch: () => [
    ground(),
    head(54, 44, 9),
    limb([[54, 53], [54, 86]]), // seated torso
    limb([[54, 86], [86, 86]]), // hips/thigh
    limb([[86, 86], [72, 70], [60, 76]]), // crossed (figure-4) leg
    limb([[86, 86], [102, 102], [102, GY]]), // down leg
    limb([[54, 60], [70, 74]]), // arm pulling knee in
  ],
  // Doorway pec stretch: arm on the door frame.
  pecStretch: () => [
    line(100, 20, 100, GY, `opacity="0.55" ${REF}`), // door frame
    ground(24, 100),
    head(64, 32, 9),
    limb([[64, 41], [66, 82]]),
    limb([[64, 48], [88, 40], [100, 44]]), // arm up on frame
    limb([[64, 48], [52, 64]]),
    limb([[66, 82], [58, 108], [58, GY]]),
    limb([[66, 82], [76, 108], [76, GY]]),
    path(`M70 60 Q60 56 58 66`, THIN), // rotation away from frame
  ],
};

// ── Exercise → pose mapping ──────────────────────────────────────────────────
const FIGURES = {
  // Morning EI
  ei_1: poses.proneBreathing(),
  ei_2: poses.gluteBridge(),
  ei_3: poses.shortFoot(),
  ei_4: poses.spanishSquat(),
  ei_5: poses.slRDL(false),
  ei_6: poses.splitSquat(false),
  ei_7: poses.squatParallel(false),
  ei_8: poses.calfRaise(),
  ei_9: poses.tibRaise(),
  ei_10: poses.hipFlexorStretch(),
  // Re-education
  reed_1: poses.stepDown(),
  reed_2: poses.wallSLSquat(),
  reed_3: poses.boxSitToStand(),
  reed_4: poses.slRDL(true),
  // Rapid response
  rr_1: poses.supineBall(false),
  rr_2: poses.supineBall(true),
  rr_3: poses.proneHeelTaps(),
  rr_4: poses.seatedBallRotation(),
  rr_5: poses.quadrupedBall(),
  // Warmup
  wu_jump_rope: poses.jumpRope(),
  wu_greatest_stretch: poses.greatestStretch(),
  wu_inchworm: poses.inchworm(),
  wu_scap_pushup: poses.scapPushup(),
  wu_pushup_downdog: poses.downDog(),
  wu_walking_lunge_rotation: poses.lungeRotation(),
  wu_cossack_squat: poses.cossack(),
  wu_a_skip: poses.aSkip(false),
  wu_b_skip: poses.aSkip(true),
  wu_pogos_light: poses.pogo({ amp: 12 }),
  wu_med_ball_light: poses.medBall(false, true),
  // Strength
  str_db_incline: poses.inclineDbPress(),
  str_barbell_row: poses.barbellRow(),
  str_hammer_pulldown: poses.pulldown(),
  str_depth_drop_curl: poses.barbellCurl(),
  str_dead_hang: poses.deadHang(),
  str_weighted_dip: poses.dip(),
  str_db_overhead_press: poses.dbOverheadPress(),
  str_face_pull: poses.facePull(),
  // Athletic
  ath_ankle_hops: poses.pogo({ amp: 8 }),
  ath_pogos: poses.pogo({ amp: 20 }),
  ath_standing_vertical_jump: poses.verticalJump(),
  ath_two_foot_approach_jump: poses.approachJump(true, false),
  ath_box_jump: poses.boxJump(false),
  ath_step_down_landing: poses.softLanding(),
  ath_med_ball_chest_pass: poses.medBall(false, false),
  ath_med_ball_overhead_throw: poses.medBall(true, false),
  ath_loaded_iso_overhead_press: poses.overheadPressIso(),
  ath_db_push_press: poses.pushPress(),
  ath_plyo_pushup: poses.plyoPushup(),
  ath_smith_ballistic_bench: poses.smithBench(),
  ath_loaded_iso_split_squat: poses.splitSquat(true),
  ath_loaded_iso_parallel_squat: poses.squatParallel(true, true),
  ath_bilateral_broad_single_landing_left: poses.broadJump({ singleLand: true }),
  ath_bilateral_broad_single_landing_right: poses.broadJump({ singleLand: true, mirror: true }),
  ath_box_step_up_jump: poses.boxJump(true),
  ath_sl_pogos_low: poses.pogo({ singleLeg: true, amp: 8 }),
  ath_sl_calf_raise_iso: poses.calfRaise(),
  ath_nordic_hamstring: poses.nordic(),
  ath_sl_broad_jump_left: poses.broadJump({ dist: 0.6, singleLand: true }),
  ath_one_step_approach_left: poses.approachJump(true, true, false),
  ath_one_step_approach_right: poses.approachJump(true, true, true),
  // Running
  run_easy_wednesday: poses.run(),
  run_long_saturday: poses.run(),
  // Cooldown
  cool_glute_stretch: poses.gluteStretch(),
  cool_pec_stretch: poses.pecStretch(),
};

// ── Write back into exercises.json ──────────────────────────────────────────
const data = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
let updated = 0;
const missing = [];
for (const ex of data) {
  const fig = FIGURES[ex.id];
  if (!fig) {
    missing.push(ex.id);
    continue;
  }
  ex.svg = SVG(fig);
  updated++;
}
writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`Updated ${updated}/${data.length} figures.`);
if (missing.length) console.warn('No figure mapped for:', missing.join(', '));
