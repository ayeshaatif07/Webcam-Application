let fkDepthSlider;
let fkZoomSlider;
let fkHueDriftSlider;

//fixed parameters
const ROT_SPEED_DEG = 16;   // rotation speed in degrees per second
const KALEIDO_SLICES = 8;   // number of mirrored slices

function setupFractalExtension() {
  //adding label row in the sidebar
  addPanelLabel("Fractal Extension (7th Row)");
   
  //depth slider (number of layers)
  fkDepthSlider = createSlider(2, 12, 6, 1);
  addSliderToPanel("Depth", fkDepthSlider, 2, 12);

  //zoom slider (percent scaling per layer)
  fkZoomSlider = createSlider(70, 95, 85, 1);
  addSliderToPanel("Zoom", fkZoomSlider, 70, 95);

  //hue drift slider (per layer color shift)
  fkHueDriftSlider = createSlider(0, 180, 30, 1);
  addSliderToPanel("Hue Layer", fkHueDriftSlider, 0, 180);
}

function drawFractalExtensionPanel(px, py) {
  //if no snapshot, show hint
  if (!baseImg) {
    drawHint(px, py);
    return;
  }

  //read slider values (with defaults)
  const depth = fkDepthSlider ? fkDepthSlider.value() : 6;
  const zoomPct = fkZoomSlider ? fkZoomSlider.value() : 85;
  const zoom = zoomPct / 100.0;
  const hueDrift = fkHueDriftSlider ? fkHueDriftSlider.value() : 30;

  //make a working copy of the snapshot
  const snap = baseImg.get();
  const W = snap.width, H = snap.height;

  // 1) Portal stacking effect (recursive layers)
  const portal = createGraphics(W, H);
  portal.imageMode(CENTER);
  portal.colorMode(HSB, 360, 100, 100, 100);
  portal.background(0);

  const t = millis() / 1000.0;
  const globalRot = radians(ROT_SPEED_DEG * t);

  //draw each layer with rotation and fading
  for (let i = 0; i < depth; i++) {
    const s = Math.pow(zoom, i);
    const a = globalRot * (1 + i * 0.15);
    const alpha = map(i, 0, depth - 1, 100, 45);

    //optionally shift hue per layer
    let layerImg = snap.get();
    if (hueDrift !== 0) {
      layerImg.loadPixels();
      for (let p = 0; p < layerImg.pixels.length; p += 4) {
        const r = layerImg.pixels[p], g = layerImg.pixels[p + 1], b = layerImg.pixels[p + 2];
        const hsv = rgbToHsv(r, g, b);
        hsv[0] = (hsv[0] + hueDrift * i) % 360;
        const rgb = hsvToRgb(hsv[0], hsv[1], hsv[2]);
        layerImg.pixels[p] = rgb[0];
        layerImg.pixels[p + 1] = rgb[1];
        layerImg.pixels[p + 2] = rgb[2];
      }
      layerImg.updatePixels();
    }

    portal.push();
    portal.translate(W / 2, H / 2);
    portal.rotate(a);
    portal.tint(255, 255 * (alpha / 100));
    portal.image(layerImg, 0, 0, W * s, H * s);
    portal.pop();
  }

  //2)radial kaleidoscope tiling
  const kaleido = createGraphics(W, H);
  kaleido.imageMode(CENTER);
  kaleido.push();
  kaleido.translate(W / 2, H / 2);

  const sliceAng = TWO_PI / KALEIDO_SLICES;
  for (let sIdx = 0; sIdx < KALEIDO_SLICES; sIdx++) {
    kaleido.push();
    kaleido.rotate(sIdx * sliceAng);
    if (sIdx % 2 === 1) {
      //mirror every other slice
      kaleido.scale(-1, 1);
    }
    kaleido.image(portal, 0, 0, W, H);
    kaleido.pop();
  }
  kaleido.pop();

  //3)apply vignette overlay
  vignetteOverlay(kaleido, 0.65, 0.9, 60);

  //draw final result into the tile
  image(kaleido, px, py + LABEL_H, TILE_W, TILE_H);
}

// -------helpers----------

//dark vignette rings for focus
function vignetteOverlay(gfx, innerNorm, outerNorm, strength) {
  const W = gfx.width, H = gfx.height;
  const cx = W / 2, cy = H / 2;
  const maxR = Math.min(W, H) * 0.5 * outerNorm;
  const innerR = Math.min(W, H) * 0.5 * innerNorm;

  gfx.push();
  gfx.noFill();
  gfx.stroke(0, 0, 0, 0);

  const rings = 40;
  for (let i = 0; i < rings; i++) {
    const t = i / (rings - 1);
    const r = lerp(innerR, maxR, t);
    const a = (strength / rings) * (t * t);
    gfx.stroke(0, 0, 0, a);
    gfx.strokeWeight(2 + t * 6);
    gfx.ellipse(cx, cy, r * 2, r * 2);
  }
  gfx.pop();
}

//convert RGB to HSV (0–360, 0–100, 0–100)
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, v * 100];
}

//convert HSV to RGB
function hsvToRgb(h, s, v) {
  s /= 100; v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  let rr, gg, bb;
  if (h < 60) { rr = c; gg = x; bb = 0; }
  else if (h < 120) { rr = x; gg = c; bb = 0; }
  else if (h < 180) { rr = 0; gg = c; bb = x; }
  else if (h < 240) { rr = 0; gg = x; bb = c; }
  else if (h < 300) { rr = x; gg = 0; bb = c; }
  else { rr = c; gg = 0; bb = x; }
  return [(rr + m) * 255, (gg + m) * 255, (bb + m) * 255];
}

// --------Provided hint helpers (unchanged)--------- 

// Draw placeholder tile with message
function _drawHintTile(px, py, msg) {
  push();
  noStroke();
  fill(245);
  rect(px, py, TILE_W, TILE_H);
  fill(80);
  textSize(12);
  text(msg, px + 10, py + 20);
  pop();
}

//ovverlaying the  translucent hint box with text
function _overlayHint(px, py, msg) {
  push();
  noStroke();
  fill(0, 150);
  rect(px, py, textWidth(msg) + 16, 22);
  fill(255);
  textSize(12);
  text(msg, px + 8, py + 15);
  pop();
}