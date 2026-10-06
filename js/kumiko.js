// Kumiko Maker -- Japanese wooden lattice, assembled piece by piece.
//
// A kumiko panel starts with a frame and a grid of long strips, the jigumi,
// joined by half-lap joints so the crossing strips sit flush. The grid is
// made of triangles (mitsukude) or squares. Then every cell is filled with
// small pieces, the tsukeko, planed to exact angles so they lock in by
// pressure alone, without glue or nails. The pattern is in the tsukeko:
// three pieces to the middle of a triangle make the hemp leaf (asanoha),
// three pieces along its sides make sesame seeds (goma), and so on.

const S = 720; // drawing size
const C = S / 2;
const SQ3 = Math.sqrt(3);

const FRAMES = {
  square: { name: "Square" },
  hex: { name: "Hexagon" },
  round: { name: "Round" },
};
const GRIDS = {
  tri: { name: "Triangles", jp: "三つ組手", romaji: "mitsukude" },
  sq: { name: "Squares", jp: "四つ組", romaji: "yotsugumi" },
};
const PATTERNS = {
  asanoha: {
    grid: "tri",
    name: "Asanoha",
    jp: "麻の葉",
    en: "Hemp leaf",
    pieces: 3,
    about:
      "Three pieces from the corners of each triangle meet in its middle, and six triangles make a star of diamond leaves. Hemp grows tall and straight, so the hemp leaf wishes for health and growth, and wards off evil.",
  },
  goma: {
    grid: "tri",
    name: "Goma",
    jp: "胡麻",
    en: "Sesame seeds",
    pieces: 3,
    about:
      "Three pieces in each triangle, each one running alongside a side of the triangle. Next to every strip of the grid, two pieces leave a thin seed-shaped gap: sesame seeds scattered across the panel.",
  },
  kikko: {
    grid: "tri",
    name: "Kikkō",
    jp: "亀甲",
    en: "Tortoise shell",
    pieces: 3,
    about:
      "Three pieces from the middle of each triangle to the middle of its sides. Around every crossing of the grid they close a hexagon, like the plates of a tortoise shell: a wish for a long life.",
  },
  tsuno: {
    grid: "tri",
    name: "Tsuno-asanoha",
    jp: "つの麻の葉",
    en: "Horned hemp leaf",
    pieces: 6,
    about:
      "The hemp leaf with horns: the three pieces from the corners still meet in the middle of each triangle, and three short pieces carry on past the middle toward the sides, so every leaf grows a pair of horns.",
  },
  sakura: {
    grid: "tri",
    name: "Sakura",
    jp: "桜",
    en: "Cherry blossom",
    pieces: 6,
    about:
      "Six pieces per triangle: three thick pieces cut off its corners, so a small hexagon rings every joint of the grid, and three thin pieces run from the middle of the triangle to them. Around each joint, five-sided petals open into a cherry blossom, the flower of spring and of life's fleeting beauty.",
  },
  mitsukude: {
    grid: "tri",
    name: "Plain",
    jp: "三つ組手",
    en: "Grid only",
    pieces: 0,
    about:
      "The bare triangle grid, mitsukude: three sets of strips crossing at 60 degrees, with three strips meeting at every joint, the hardest joint of kumiko.",
  },
  kakuasa: {
    grid: "sq",
    name: "Kaku-asanoha",
    jp: "角麻の葉",
    en: "Square hemp leaf",
    pieces: 7,
    about:
      "The hemp leaf on a square grid: a diagonal cuts each square into two triangles, and three pieces meet in the middle of each. Seven pieces per square, cut at 22.5, 45 and 67.5 degrees.",
  },
  izutsu: {
    grid: "sq",
    name: "Izutsu-tsunagi",
    jp: "井筒つなぎ",
    en: "Linked well frames",
    pieces: 8,
    about:
      "A small square held in the middle of each square by four diagonal pieces, like the wooden frame around the mouth of a well.",
  },
  hishi: {
    grid: "sq",
    name: "Hishi",
    jp: "菱",
    en: "Diamonds",
    pieces: 4,
    about:
      "Four pieces join the middles of the sides of each square, so diamonds (water chestnut leaves, hishi) appear across the grid.",
  },
  yotsugumi: {
    grid: "sq",
    name: "Plain",
    jp: "四つ組",
    en: "Grid only",
    pieces: 0,
    about: "The bare square grid, like the lattice of a shoji door before any pattern is added.",
  },
};
const WOODS = {
  hinoki: { name: "Hinoki", wood: "#e9d2a2", edge: "#8a6638", frame: "#d6b981" },
  cedar: { name: "Cedar", wood: "#dca57a", edge: "#93623d", frame: "#c98e60" },
  walnut: { name: "Walnut", wood: "#80593c", edge: "#3e2a1b", frame: "#6b4a31" },
  black: { name: "Lacquered", wood: "#2e2925", edge: "#0e0c0b", frame: "#26211d" },
};
const LIGHTS = {
  shoji: { name: "Shoji paper", inner: "#fffaf0", outer: "#efe4cc" },
  lantern: { name: "Lantern", inner: "#ffe2a8", outer: "#d48a3c" },
  night: { name: "Night", inner: "#2a3344", outer: "#121822" },
};

const opts = {
  frame: "hex",
  grid: "tri",
  pattern: "asanoha",
  n: 8, // cells across
  width: 5, // strip width, px
  border: 26, // frame thickness, px
  wood: "hinoki",
  light: "shoji",
  speed: 5,
};
let cells = []; // [{ pts: [[x,y]...], p: pattern id }]
let pieces = []; // [{ a, b, kind }]
let frameShape = null;
let anim = null;

const $e = (id) => document.getElementById(id);
const f1 = (v) => Math.round(v * 10) / 10;
const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
const mid = (p, q) => lerp(p, q, 0.5);
const dist = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);

// ---------------------------------------------------------------- the frame

const OUT = 345; // outer radius (half side of the square)
function makeFrame() {
  const T = opts.border;
  if (opts.frame === "round") return { kind: "circle", R: OUT, r: OUT - T };
  const poly = (k, R, rot) =>
    Array.from({ length: k }, (_, i) => {
      const a = rot + (2 * Math.PI * i) / k;
      return [C + R * Math.cos(a), C + R * Math.sin(a)];
    });
  if (opts.frame === "square") {
    const sq = (h) => [[C - h, C - h], [C + h, C - h], [C + h, C + h], [C - h, C + h]];
    return { kind: "poly", outer: sq(OUT), inner: sq(OUT - T) };
  }
  // flat-topped hexagon: sides parallel to the strips of the triangle grid
  const R = OUT;
  const r = R - T / Math.cos(Math.PI / 6);
  return { kind: "poly", outer: poly(6, R, 0), inner: poly(6, r, 0) };
}

// part of segment a-b inside the frame opening, or null
function clip(a, b) {
  const F = frameShape;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  let t0 = 0, t1 = 1;
  if (F.kind === "circle") {
    const fx = a[0] - C, fy = a[1] - C;
    const A = dx * dx + dy * dy, B = 2 * (fx * dx + fy * dy), Cc = fx * fx + fy * fy - F.r * F.r;
    const disc = B * B - 4 * A * Cc;
    if (disc <= 0) return null;
    const s = Math.sqrt(disc);
    t0 = Math.max(0, (-B - s) / (2 * A));
    t1 = Math.min(1, (-B + s) / (2 * A));
  } else {
    // Cyrus-Beck against a convex polygon (clockwise on screen)
    const P = F.inner;
    for (let i = 0; i < P.length; i++) {
      const p = P[i], q = P[(i + 1) % P.length];
      const nx = q[1] - p[1], ny = p[0] - q[0]; // outward normal
      const num = nx * (a[0] - p[0]) + ny * (a[1] - p[1]);
      const den = nx * dx + ny * dy;
      if (Math.abs(den) < 1e-12) {
        if (num > 0) return null;
        continue;
      }
      const t = -num / den;
      if (den < 0) t0 = Math.max(t0, t);
      else t1 = Math.min(t1, t);
    }
  }
  if (t1 - t0 < 1e-6) return null;
  const A2 = [a[0] + dx * t0, a[1] + dy * t0], B2 = [a[0] + dx * t1, a[1] + dy * t1];
  return dist(A2, B2) < 2 ? null : [A2, B2];
}
const insideFrame = (p) => {
  const F = frameShape;
  if (F.kind === "circle") return dist(p, [C, C]) < F.r;
  const P = F.inner;
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length];
    if ((b[1] - a[1]) * (p[0] - a[0]) - (b[0] - a[0]) * (p[1] - a[1]) > 0) return false;
  }
  return true;
};

// ---------------------------------------------------------------- the grid

function innerHalf() {
  const F = frameShape;
  return F.kind === "circle" ? F.r : opts.frame === "square" ? OUT - opts.border : dist(F.inner[0], [C, C]);
}
const cellSize = () => (2 * innerHalf()) / opts.n;

function jigumi() {
  const a = cellSize(), L = S, out = [];
  const fam = (th, d, off, fam) => {
    const ux = Math.cos(th), uy = Math.sin(th);
    let nx = -uy, ny = ux;
    if (nx + ny * 1.01 < 0) (nx = -nx), (ny = -ny);
    const k = Math.ceil(S / d);
    for (let i = -k; i <= k; i++) {
      const o = off + i * d;
      const px = C + nx * o, py = C + ny * o;
      const c = clip([px - ux * L, py - uy * L], [px + ux * L, py + uy * L]);
      if (c) out.push({ a: c[0], b: c[1], kind: "jigumi", fam });
    }
  };
  if (opts.grid === "tri") {
    const h = (a * SQ3) / 2;
    fam(0, h, 0, 0);
    fam(Math.PI / 3, h, 0, 1);
    fam((2 * Math.PI) / 3, h, 0, 2);
  } else {
    const off = opts.n % 2 ? a / 2 : 0;
    fam(Math.PI / 2, a, off, 0);
    fam(0, a, off, 1);
  }
  return out;
}

function makeCells(keep) {
  const a = cellSize(), out = [];
  const k = Math.ceil(S / a) + 2;
  if (opts.grid === "tri") {
    const h = (a * SQ3) / 2;
    const V = (i, j) => [C + (i + j / 2) * a, C + j * h];
    for (let j = -k; j < k; j++)
      for (let i = -2 * k; i < 2 * k; i++) {
        out.push([V(i, j), V(i + 1, j), V(i, j + 1)]);
        out.push([V(i + 1, j), V(i + 1, j + 1), V(i, j + 1)]);
      }
  } else {
    const off = opts.n % 2 ? a / 2 : 0;
    for (let j = -k; j < k; j++)
      for (let i = -k; i < k; i++) {
        const x = C + off + i * a, y = C + off + j * a;
        out.push([[x, y], [x + a, y], [x + a, y + a], [x, y + a]]);
      }
  }
  // keep the cells that show at least partly inside the frame
  const vis = out.filter((pts) => {
    const g = centroid(pts);
    return insideFrame(g) || pts.some(insideFrame);
  });
  return vis.map((pts, i) => ({ pts, p: keep && keep[i] !== undefined ? keep[i] : opts.pattern }));
}
const centroid = (pts) => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];

// ---------------------------------------------------------------- the tsukeko

function fill(cell, idx) {
  const P = cell.pts, segs = [];
  switch (cell.p) {
    case "asanoha": {
      const g = centroid(P);
      for (const v of P) segs.push([v, g]);
      break;
    }
    case "goma": {
      // each piece runs alongside a side, 22% of the way to the far corner
      const f = 0.22;
      for (let i = 0; i < 3; i++) {
        const p = P[i], q = P[(i + 1) % 3], r = P[(i + 2) % 3];
        segs.push([lerp(r, p, 1 - f), lerp(r, q, 1 - f)]);
      }
      break;
    }
    case "kikko": {
      const g = centroid(P);
      for (let i = 0; i < 3; i++) segs.push([g, mid(P[i], P[(i + 1) % 3])]);
      break;
    }
    case "tsuno": {
      // asanoha, plus horns: each spoke carries on past the middle, 55% of the way to the far side
      const g = centroid(P);
      for (const v of P) segs.push([v, g]);
      for (let i = 0; i < 3; i++) segs.push([g, lerp(g, mid(P[(i + 1) % 3], P[(i + 2) % 3]), 0.55)]);
      break;
    }
    case "sakura": {
      // a thick piece across each corner (25% up the sides), a thin piece from the middle to each
      const g = centroid(P), f = 0.25;
      for (let i = 0; i < 3; i++) {
        const v = P[i], p = P[(i + 1) % 3], q = P[(i + 2) % 3];
        const a = lerp(v, p, f), b = lerp(v, q, f);
        segs.push([a, b]);
        segs.push([g, mid(a, b)]);
      }
      break;
    }
    case "kakuasa": {
      const [tl, tr, br, bl] = P;
      const a = cellSize();
      const i = Math.round((tl[0] - C) / a), j = Math.round((tl[1] - C) / a);
      const flip = (i + j) % 2 !== 0;
      const tris = flip ? [[tr, bl, tl], [tr, bl, br]] : [[tl, br, tr], [tl, br, bl]];
      segs.push(flip ? [tr, bl] : [tl, br]);
      for (const t of tris) {
        const [A, B, Cc] = t;
        const la = dist(B, Cc), lb = dist(A, Cc), lc = dist(A, B);
        const s = la + lb + lc;
        const I = [(la * A[0] + lb * B[0] + lc * Cc[0]) / s, (la * A[1] + lb * B[1] + lc * Cc[1]) / s];
        for (const v of t) segs.push([v, I]);
      }
      break;
    }
    case "izutsu": {
      const g = centroid(P), a = cellSize() / 4;
      const sq = [[g[0] - a, g[1] - a], [g[0] + a, g[1] - a], [g[0] + a, g[1] + a], [g[0] - a, g[1] + a]];
      for (let i = 0; i < 4; i++) segs.push([sq[i], sq[(i + 1) % 4]]);
      for (let i = 0; i < 4; i++) segs.push([P[i], sq[i]]);
      break;
    }
    case "hishi": {
      const m = P.map((p, i) => mid(p, P[(i + 1) % 4]));
      for (let i = 0; i < 4; i++) segs.push([m[i], m[(i + 1) % 4]]);
      break;
    }
  }
  const out = [];
  for (const [a, b] of segs) {
    const c = clip(a, b);
    if (c) out.push({ a: c[0], b: c[1], kind: "tsukeko", cell: idx });
  }
  return out;
}

function build(keep) {
  stopAnim();
  frameShape = makeFrame();
  if (PATTERNS[opts.pattern].grid !== opts.grid) opts.pattern = opts.grid === "tri" ? "asanoha" : "kakuasa";
  cells = makeCells(keep);
  pieces = jigumi();
  // fill from the middle out, the way a panel is usually assembled
  const order = cells.map((c, i) => i).sort((i, j) => dist(centroid(cells[i].pts), [C, C]) - dist(centroid(cells[j].pts), [C, C]));
  for (const i of order) pieces.push(...fill(cells[i], i));
}

// ---------------------------------------------------------------- drawing

function frameMarkup(W) {
  const F = frameShape;
  const d = (P) => "M" + P.map((p) => f1(p[0]) + " " + f1(p[1])).join("L") + "Z";
  const circ = (r) => `M${C - r} ${C}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  const ring = F.kind === "circle" ? circ(F.R) + circ(F.r) : d(F.outer) + d(F.inner);
  const opening = F.kind === "circle" ? circ(F.r) : d(F.inner);
  return {
    opening,
    ring: `<path d="${ring}" fill="${W.frame}" fill-rule="evenodd" stroke="${W.edge}" stroke-width="1.5"/>
      <path d="${ring}" fill="url(#frame-shade)" fill-rule="evenodd"/>`,
  };
}

const seg = (p) => `<line x1="${f1(p.a[0])}" y1="${f1(p.a[1])}" x2="${f1(p.b[0])}" y2="${f1(p.b[1])}"/>`;

function layer(list, W, w) {
  return `<g stroke="${W.edge}" stroke-width="${w + 1.6}">${list.map(seg).join("")}</g><g stroke="${W.wood}" stroke-width="${w}">${list.map(seg).join("")}</g>`;
}

function svgMarkup(forExport, empty) {
  const W = WOODS[opts.wood], Lt = LIGHTS[opts.light];
  const fr = frameMarkup(W);
  const w = opts.width;
  const jig = pieces.filter((p) => p.kind === "jigumi");
  const tsu = pieces.filter((p) => p.kind === "tsukeko");
  const ns = forExport ? ' xmlns="http://www.w3.org/2000/svg"' : "";
  const size = forExport ? S : "100%";
  return `<svg${ns} class="plain" viewBox="0 0 ${S} ${S}" width="${size}" height="${size}" role="img" aria-label="Kumiko panel">
  <defs>
    <radialGradient id="glow" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="${Lt.inner}"/><stop offset="1" stop-color="${Lt.outer}"/></radialGradient>
    <linearGradient id="frame-shade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.18"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.22"/></linearGradient>
    <filter id="soft" x="-5%" y="-5%" width="110%" height="110%"><feDropShadow dx="1.2" dy="1.6" stdDeviation="1.2" flood-color="#000" flood-opacity="0.35"/></filter>
  </defs>
  ${forExport ? "" : `<rect width="${S}" height="${S}" fill="transparent"/>`}
  <path d="${fr.opening}" fill="url(#glow)"/>
  <g id="lattice" fill="none" stroke-linecap="butt" filter="url(#soft)">${empty ? "" : layer(jig, W, w) + layer(tsu, W, w * 0.82)}</g>
  <g id="frame" filter="url(#soft)">${fr.ring}</g>
  ${forExport ? "" : `<g id="cells">${cells.map((c, i) => `<path data-i="${i}" d="M${c.pts.map((p) => f1(p[0]) + " " + f1(p[1])).join("L")}Z"/>`).join("")}</g>`}
</svg>`;
}

function render() {
  stopAnim();
  $e("kumiko").innerHTML = svgMarkup(false);
  renderInfo();
}

function renderInfo() {
  const jig = pieces.filter((p) => p.kind === "jigumi");
  const tsu = pieces.filter((p) => p.kind === "tsukeko");
  let laps = 0;
  for (let i = 0; i < jig.length; i++) for (let j = i + 1; j < jig.length; j++) if (jig[i].fam !== jig[j].fam && crosses(jig[i], jig[j])) laps++;
  const px2cm = 30 / (2 * OUT); // a 30 cm panel
  const len = pieces.reduce((s, p) => s + dist(p.a, p.b), 0) * px2cm;
  const used = [...new Set(cells.map((c) => c.p))].filter((p) => PATTERNS[p].pieces);
  const tile = (k, v) => `<div class="stat"><div class="k">${k}</div><div class="v">${v}</div></div>`;
  $e("stats").innerHTML =
    tile("Grid strips", jig.length) +
    tile("Half-lap joints", laps) +
    tile("Infill pieces", tsu.length.toLocaleString()) +
    tile("All pieces", (pieces.length + (opts.frame === "round" ? 1 : opts.frame === "square" ? 4 : 6)).toLocaleString()) +
    tile("Strips of wood*", `${(len / 100).toFixed(1)} m`);
  const P = PATTERNS[opts.pattern];
  const mixed = used.length > 1 ? ` This panel mixes ${used.map((u) => PATTERNS[u].name).join(", ")}.` : "";
  $e("pattern-about").innerHTML = `<strong>${P.name}</strong> <span class="jp">${P.jp}</span>, “${P.en}”. ${P.about}${mixed}`;
}
function crosses(p, q) {
  const o = (a, b, c) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
  return o(p.a, p.b, q.a) * o(p.a, p.b, q.b) < 0 && o(q.a, q.b, p.a) * o(q.a, q.b, p.b) < 0;
}

// ---------------------------------------------------------------- assembly

function stopAnim() {
  if (anim) cancelAnimationFrame(anim.raf);
  anim = null;
  const b = $e("assemble");
  if (b) b.textContent = "Assemble it";
}

function assemble() {
  if (anim) {
    render();
    return;
  }
  const box = $e("kumiko");
  box.innerHTML = svgMarkup(false, true);
  const lat = box.querySelector("#lattice");
  const frame = box.querySelector("#frame");
  frame.classList.add("drop");
  const W = WOODS[opts.wood];
  const note = $e("assemble-note");
  const fams = opts.grid === "tri" ? ["the horizontal strips", "the strips at 60°", "the strips at 120°"] : ["the vertical strips", "the horizontal strips"];
  let i = 0, acc = -0.6, last = performance.now(), stage = "";
  $e("assemble").textContent = "Stop";
  anim = {};
  const ns = "http://www.w3.org/2000/svg";
  const add = (p) => {
    const g = document.createElementNS(ns, "g");
    const w = p.kind === "jigumi" ? opts.width : opts.width * 0.82;
    g.innerHTML = `<g stroke="${W.edge}" stroke-width="${w + 1.6}">${seg(p)}</g><g stroke="${W.wood}" stroke-width="${w}">${seg(p)}</g>`;
    g.setAttribute("class", "drop");
    lat.appendChild(g);
  };
  const step = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    acc += dt * (1 + opts.speed * opts.speed * 1.2);
    while (acc >= 1 && i < pieces.length) {
      acc -= 1;
      const p = pieces[i++];
      const s = p.kind === "jigumi" ? "Grid (jigumi): " + fams[p.fam] + ", joined by half laps." : "Infill (tsukeko): each piece planed to fit, held by pressure alone.";
      if (s !== stage) note.textContent = stage = s;
      add(p);
    }
    if (i >= pieces.length) {
      anim = null;
      note.textContent = `Done: ${pieces.length.toLocaleString()} pieces, and not a single nail.`;
      setTimeout(() => {
        if (!anim) {
          box.innerHTML = svgMarkup(false);
          $e("assemble").textContent = "Assemble it";
        }
      }, 700);
      return;
    }
    anim.raf = requestAnimationFrame(step);
  };
  anim.raf = requestAnimationFrame(step);
}

// ---------------------------------------------------------------- click a cell

function clickCell(e) {
  const t = e.target.closest("#cells path");
  if (!t || anim) return;
  const i = +t.dataset.i;
  const list = Object.keys(PATTERNS).filter((k) => PATTERNS[k].grid === opts.grid);
  const cur = list.indexOf(cells[i].p);
  cells[i].p = list[(cur + 1) % list.length];
  rebuildPieces();
}
function rebuildPieces() {
  const keep = cells.map((c) => c.p);
  build(keep);
  render();
  writeUrl();
}

// ---------------------------------------------------------------- address & storage

const CODES = { asanoha: "a", goma: "g", kikko: "k", tsuno: "t", sakura: "r", mitsukude: "m", kakuasa: "s", izutsu: "i", hishi: "h", yotsugumi: "y" };
function writeUrl() {
  const q = new URLSearchParams();
  q.set("f", opts.frame);
  q.set("g", opts.grid);
  q.set("n", opts.n);
  q.set("p", opts.pattern);
  if (cells.some((c) => c.p !== opts.pattern)) q.set("c", cells.map((c) => CODES[c.p]).join(""));
  history.replaceState(null, "", "#" + q.toString());
}
function readUrl() {
  const q = new URLSearchParams(location.hash.slice(1));
  if (!q.get("g")) return null;
  if (FRAMES[q.get("f")]) opts.frame = q.get("f");
  if (GRIDS[q.get("g")]) opts.grid = q.get("g");
  const n = parseInt(q.get("n"), 10);
  if (!isNaN(n)) opts.n = Math.max(2, Math.min(16, n));
  if (PATTERNS[q.get("p")] && PATTERNS[q.get("p")].grid === opts.grid) opts.pattern = q.get("p");
  const c = q.get("c");
  if (!c) return null;
  const inv = Object.fromEntries(Object.entries(CODES).map(([k, v]) => [v, k]));
  return [...c].map((ch) => (inv[ch] && PATTERNS[inv[ch]].grid === opts.grid ? inv[ch] : opts.pattern));
}
const LS = "kumiko-maker";
function save() {
  try {
    const { width, border, wood, light, speed } = opts;
    localStorage.setItem(LS, JSON.stringify({ width, border, wood, light, speed }));
  } catch (e) {}
}
function load() {
  try {
    Object.assign(opts, JSON.parse(localStorage.getItem(LS)) || {});
  } catch (e) {}
  if (!WOODS[opts.wood]) opts.wood = "hinoki";
  if (!LIGHTS[opts.light]) opts.light = "shoji";
}

// ---------------------------------------------------------------- controls

function chips(id, items, key, onPick, filter = () => true, label = (v) => v.name) {
  const el = $e(id);
  el.innerHTML = Object.entries(items)
    .filter(([k, v]) => filter(v))
    .map(([k, v]) => `<button type="button" data-k="${k}" aria-pressed="${opts[key] === k}">${label(v)}</button>`)
    .join("");
  el.onclick = (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    opts[key] = b.dataset.k;
    el.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    onPick();
  };
}
function patternChips() {
  chips("pattern-chips", PATTERNS, "pattern", update, (v) => v.grid === opts.grid, (v) => `${v.name}<small>${v.en}</small>`);
}
function rangeCtl(id, key, fmt, onChange) {
  const el = $e(id);
  el.value = opts[key];
  const show = () => ($e(id + "-val").textContent = fmt(opts[key]));
  show();
  el.addEventListener("input", () => {
    opts[key] = +el.value;
    show();
    onChange();
  });
}
function update() {
  build();
  render();
  writeUrl();
  save();
}
function restyle() {
  render();
  save();
}

function download(name, href) {
  const a = document.createElement("a");
  a.download = name;
  a.href = href;
  a.click();
}
const fileName = () => "kumiko-" + opts.pattern;
function saveSvg() {
  download(fileName() + ".svg", URL.createObjectURL(new Blob([svgMarkup(true)], { type: "image/svg+xml" })));
}
function savePng() {
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = c.height = 2000;
    c.getContext("2d").drawImage(img, 0, 0, 2000, 2000);
    download(fileName() + ".png", c.toDataURL("image/png"));
  };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgMarkup(true));
}

function initKumiko() {
  load();
  const keep = readUrl();
  chips("frame-chips", FRAMES, "frame", update);
  chips("grid-chips", GRIDS, "grid", () => {
    opts.pattern = opts.grid === "tri" ? "asanoha" : "kakuasa";
    patternChips();
    update();
  }, () => true, (v) => `${v.name}<small>${v.romaji}</small>`);
  patternChips();
  chips("wood-chips", WOODS, "wood", restyle);
  chips("light-chips", LIGHTS, "light", restyle);
  rangeCtl("n", "n", (v) => `${v} across`, update);
  rangeCtl("width", "width", (v) => `${((v * 300) / (2 * OUT)).toFixed(1)} mm`, restyle);
  rangeCtl("border", "border", (v) => `${((v * 300) / (2 * OUT)).toFixed(0)} mm`, update);
  rangeCtl("speed", "speed", (v) => v, () => {});
  $e("assemble").addEventListener("click", assemble);
  $e("export-png").addEventListener("click", savePng);
  $e("export-svg").addEventListener("click", saveSvg);
  $e("kumiko").addEventListener("click", clickCell);
  $e("reset").addEventListener("click", update);
  build(keep);
  render();
  writeUrl();
}
