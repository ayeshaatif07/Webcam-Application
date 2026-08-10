//track panel index for safety checks
let BG_PANEL_INDEX = -1;

//current mode UI and state
let bgSelect, bgMode = "Starfield";

//offscreen bufferring for rendering effects
let bgBuffer = null;

//starfield data
let stars = [];

// matrix rain columns
let matrixCols = [];

//gradient animation time
let gradientT = 0;

function setupBackgroundExtension() {
  //looking up this panels index in the grid list
  BG_PANEL_INDEX = PANEL_NAMES.indexOf("Backgrounds Extension");
  if (BG_PANEL_INDEX < 0) {
    console.warn('backgrounds Extension: Panel "Backgrounds Extension" not found in PANEL_NAMES');
    return;
  }

  //adding a centered section heading in the right sidebar
  addPanelLabel("Backgrounds Ext (6th Row)");

  //create an offscreen buffer sized to a tile
  bgBuffer = createGraphics(TILE_W, TILE_H);
  bgBuffer.pixelDensity(1);

  //create a dropdown in sidebar and wiring its change handler
  bgSelect = createSelect();
  ["Starfield", "Matrix", "Gradient"].forEach(name => bgSelect.option(name));
  bgSelect.selected(bgMode);
  bgSelect.changed(() => (bgMode = bgSelect.value()));
  addDropdownToPanel('BG', bgSelect);

  //prepare the effect state
  initStarfield();
  initMatrix();
}

function drawBackgroundExtensionPanel(panelX, panelY) {
  //the label bar area
  const imgY = panelY + LABEL_H;

  //render selected effect into the offscreen buffer
  bgBuffer.push();
  bgBuffer.noStroke();
  if (bgMode === "Starfield")      drawStarfieldG(bgBuffer);
  else if (bgMode === "Matrix")    drawMatrixG(bgBuffer);
  else                             drawMovingGradientG(bgBuffer);
  bgBuffer.pop();

  //Blit the offscreen buffer into the tile
  image(bgBuffer, panelX, imgY);

  //show a hint if no snapshot captured yet
  if (!baseImg) {
    fill(220);
    textAlign(CENTER, CENTER);
    text("Press 'S' to take snapshot", panelX + TILE_W / 2, imgY + TILE_H / 2);
    return;
  }

  // If  the faces are detected than overlay the face regions on top of the background
  if (Array.isArray(detectedFaces) && detectedFaces.length > 0) {
    for (let k = 0; k < detectedFaces.length; k++) {
      const [fx, fy, fw, fh] = detectedFaces[k];

      // Extract face ROI from the snapshot
      const faceROI = baseImg.get(fx, fy, fw, fh);

      // Draw the face back into the same position in the tile
      image(faceROI, panelX + fx, imgY + fy, fw, fh);
    }
  } else {
    //informative message when no face is detected
    fill(255, 255, 0);
    textAlign(CENTER, CENTER);
    text("No face detected", panelX + TILE_W / 2, imgY + TILE_H / 2);
  }
}

// -------- Starfield ------
function initStarfield() {
  // Reset stars and spawn a fixed number
  stars = [];
  const count = 100;
  for (let i = 0; i < count; i++) stars.push(spawnStar());
}

function spawnStar() {
  //create a star with random position, depth and speed
  return {
    x: random(-TILE_W / 2, TILE_W / 2),
    y: random(-TILE_H / 2, TILE_H / 2),
    z: random(0.2, 1.0),
    speed: random(0.6, 1.3)
  };
}

function drawStarfieldG(g) {
  //clear background
  g.fill(0);
  g.rect(0, 0, TILE_W, TILE_H);

  //center of the field
  const cx = TILE_W / 2, cy = TILE_H / 2;

  // Draw and animate the stars
  for (let s of stars) {
    const sx = cx + s.x / s.z;
    const sy = cy + s.y / s.z;

    //the size grows as star approaches (smaller z)
    const size = map(1 / s.z, 1, 5, 1, 3);

    //draw the star
    g.noStroke();
    g.fill(230);
    g.circle(sx, sy, size);

    //movee the  star forward (decrease z)
    s.z -= 0.02 * s.speed;

    // Respawn star when it passes the viewer
    if (s.z < 0.15) Object.assign(s, spawnStar());
  }
}

// ------- Matrix Rain --------
function initMatrix() {
  // Build column descriptors across the tile width
  matrixCols = [];
  const colW = 10;
  const cols = floor(TILE_W / colW);
  for (let i = 0; i < cols; i++) {
    matrixCols.push({
      x: i * colW,
      y: random(-200, 0),
      speed: random(2, 4),
      trail: floor(random(8, 16))
    });
  }
}

function drawMatrixG(g) {
  //fade the previous frame to create trailing effect
  g.fill(0, 150);
  g.rect(0, 0, TILE_W, TILE_H);

  // use monospace font for consistent glyph spacing
  g.textFont("monospace");
  g.textSize(12);

  // Draw each column's falling glyph trail
  for (let c of matrixCols) {
    for (let t = 0; t < c.trail; t++) {
      const yy = c.y - t * 12;

      //kkip drawing when out of bounds
      if (yy < 0 || yy > TILE_H) continue;

      // Pick a Katakana-like character
      const ch = String.fromCharCode(0x30A0 + floor(random(96)));

      // Fade the glyph along the trail
      const alpha = map(t, 0, c.trail - 1, 255, 60);
      g.fill(0, 255, 100, alpha);

      // Render the character
      g.text(ch, c.x, yy);
    }

    // Advance the head of the column
    c.y += c.speed;

    // Reset the column when it scrolls past the bottom
    if (c.y - c.trail * 12 > TILE_H) {
      c.y = random(-150, 0);
      c.speed = random(2, 4);
      c.trail = floor(random(8, 16));
    }
  }
}

// -------- Moving Gradient --------
function drawMovingGradientG(g) {
  // Switch to HSB for intuitive hue sweep
  g.colorMode(HSB, 360, 100, 100, 100);

  // Paint verticel lines with hue that shifts over the time
  for (let x = 0; x < TILE_W; x++) {
    const t = (x / TILE_W + gradientT) % 1.0;
    const col = g.color(360 * t, 80, 90);
    g.stroke(col);
    g.line(x, 0, x, TILE_H);
  }

  // Restore RGB color mode for other drawing code
  g.colorMode(RGB, 255, 255, 255, 255);

  // Advance time to animate the gradient
  gradientT = (gradientT + 0.003) % 1.0;
}