// main.js

/* ------------------------COMMENTARY (502 words)--------------------------

Three different methods for mathematically precise pixel level filtering are demonstrated by my image thresholding implementations. 
In order to apply binary thresholding to individual RGB channels, I created the thresholdChannel function. This function extracts values
from designated channels and outputs solid colours when thresholds are exceeded, producing stark binary visualizations that are helpful for
identifying colour-specific features. In order to avoid sharp cutoffs, I converted RGB pixels and applied hue based filtering with complex 
fade transitions close to boundary values at 0° and 360° using the thresholdHSVColor function to function in HSV colour space. As it 
distinguishes between chromaticity and brightness, this method outperformed others for colour based segmentation and is more resilient 
to changes in lighting. I used brightness based filtering with comparable fade mechanics to separate objects based on perceived brightness 
rather than raw RGB values when designing the thresholdYCbCrColor function, which focuses on the Y luminance channel of the YCbCr colour space. 
With the help of the computationally efficient refineFaceDetections function I created, my face detection system integrates intelligent 
post-processing. By employing size difference analysis, minimum distance restrictions between face centers, and intersection over union 
analysis, this system gets rid of overlapping detections. My multi-stage filtering preserves real multiple face detections while drastically
lowering false positives. I developed several face replacement modes, such as weighted luminance grayscale conversion and HSV channel 
visualization, and I created the applyPixelation function to create unique mosaic effects by averaging 5x5 pixel blocks and painting uniform colours. 
I used iterative debugging techniques to successfully overcome a number of technical obstacles. I resolved the harsh binary outputs from my 
first threshold implementations by employing lerp interpolation near boundary conditions in HSV and YCbCr thresholding to create smooth fade transitions.
I developed refineFaceDetections with IoU analysis and geometric constraints to address the multiple overlapping bounding boxes for single faces that 
initially plagued my face detection. I used consistent 5x5 block processing with appropriate boundary handling to get rid of pixelation artifacts from block averaging.
I was able to implement multiple extensions because I was able to stay on track with the project and even make progress ahead of schedule. 
If I had fallen behind, I would have concentrated on finishing the necessary fundamental elements before looking into more imaginative ideas. 
In order to offer real-time emoji overlay on identified faces with dropdown selection and dynamic scaling according to face dimensions, I developed 
the Emoji Extension. Three animated procedural backgrounds are implemented by My Backgrounds Extension, which combines intelligent face region 
preservation with a 3D starfield with perspective projection, matrix rain simulation, and colour gradients. In order to achieve clean comic-book aesthetics,
I created the Cartoon Extension, which uses posterization for colour quantization, Sobel edge detection, and black outline overlay to create multi-stage cartoonification.
My Neon Extension uses Sobel operators with rainbow hue mapping and radial glow effects to create imagery through edge-based visualization. I created the Fractal Extension to 
create psychedelic images using portal kaleidoscope effects that combine vignette overlays, radial mirroring, and recursive layer stacking.

---------------------------COMMENTARY--------------------------------------
 */
// ---- Config ----
// Tile sizes, spacing, and panel layout
const TILE_W = 160;
const TILE_H = 120;
const LABEL_H = 18;
const PADDING = 38;
const COLS = 3;

// All panels to be shown in the grid
const PANEL_NAMES = [
  "Webcam image",
  "Grayscale +20%",
  "Emoji Extension",
  "Red channel",
  "Green channel",
  "Blue channel",
  "Threshold R",
  "Threshold G",
  "Threshold B",
  "Webcam (repeat)",
  "Colour space (HSV)",
  "Colour space (YCbCr)",
  "Face detect & replace",
  "Threshold (HSV)",
  "Threshold (YCbCr)",
  "Backgrounds Extension",
  "Cartoon Extension",
  "Neon Extension",
  "Fractal Extension"
];

// ---- Control Panel Helpers ----
// Helper to add sliders with label and value text
function addSliderToPanel(labelText, slider, min=0, max=255) {
  const row = createDiv().addClass('ctrl');
  createSpan(labelText).addClass('lbl').parent(row);
  slider.parent(row);
  const val = createSpan(String(slider.value())).addClass('val').parent(row);
  slider.attribute('min', min); slider.attribute('max', max);
  slider.input(() => val.html(slider.value()));
  row.parent('controls-list');
  return {row, val};
}

//helpers to add dropdown menus to sidebar
function addDropdownToPanel(labelText, selectEl) {
  const row = createDiv().addClass('ctrl');
  createSpan(labelText).addClass('lbl').parent(row);
  selectEl.parent(row);
  row.parent('controls-list');
}

//helper to add bold section labels in sidebar
function addPanelLabel(text) {
  const row = createDiv().addClass('ctrl');
  row.style('justify-content', 'center');
  row.style('font-weight', '700');
  row.style('letter-spacing', '0.2px');
  row.style('opacity', '0.95');
  const span = createSpan(text);
  span.parent(row);
  row.parent('controls-list');
  return row;
}

// ------ State -----
//webcam and images
let cam;
let baseImg = null;
let grayBrightImg = null; 
let canvasW, canvasH;

// RGB channel images
let redImg = null;
let greenImg = null;
let blueImg = null;

// Threshold slider + results
let sliderR, sliderG, sliderB;
let thresholdedR, thresholdedG, thresholdedB;

// Color space images
let hsvImg = null;
let ycbcrImg = null;

// Threshold filters
let hsvThreshImg, ycbcrThreshImg;
let sliderH, sliderY;

// Face replacement mode
let faceImg;
let faceReplaceMode = 0;

// Compute rows of panel grid
const ROWS = Math.ceil(PANEL_NAMES.length / COLS);

// Layout size calculator
function layoutSize() {
  canvasW = PADDING + COLS * (TILE_W + PADDING);
  canvasH = PADDING + ROWS * (TILE_H + LABEL_H + PADDING);
}

function setup() {
  // Setup canvas and webcam
  layoutSize();
  const c = createCanvas(canvasW, canvasH);
  c.parent("canvas-holder");

  cam = createCapture(VIDEO, () => console.log("Webcam ready"));
  cam.size(640, 480);
  cam.hide();

  textFont("monospace");
  textSize(12);
  noSmooth();

  // Threshold sliders for channels, HSV and YCbCr
  sliderR = createSlider(0, 255, 128);
  addSliderToPanel('Threshold Red', sliderR);

  sliderG = createSlider(0, 255, 128);
  addSliderToPanel('Threshold Green', sliderG);

  sliderB = createSlider(0, 255, 128);
  addSliderToPanel('Threshold Blue', sliderB);

  sliderH = createSlider(0, 360, 180);
  addSliderToPanel('Threshold HSV', sliderH, 0, 360);

  sliderY = createSlider(0, 255, 128);
  addSliderToPanel('Threshold YCbCr', sliderY);

  // Setup of face detector
  setupFaceDetection();

  //initialize extensions if present
  if (typeof setupEmojiExtension === 'function') setupEmojiExtension();
  if (typeof setupBackgroundExtension === 'function') setupBackgroundExtension();
  if (typeof setupCartoonExtension === 'function') setupCartoonExtension();
  if (typeof setupNeonExtension === 'function') setupNeonExtension();
  if (typeof setupFractalExtension  === 'function') setupFractalExtension(); 
}

// Compute panel position by index
function panelXY(index) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const x = PADDING + col * (TILE_W + PADDING);
  const y = PADDING + row * (TILE_H + LABEL_H + PADDING);
  return { x, y };
}

// Draw panel border and label header
function drawPanelFrame(x, y, label) {
  stroke(60);
  fill(24);
  rect(x - 1, y + LABEL_H - 1, TILE_W + 2, TILE_H + 2);
  noStroke();
  fill(34);
  rect(x - 1, y - 1, TILE_W + 2, LABEL_H);
  fill(230);
  textAlign(LEFT, CENTER);
  text(label, x + 6, y + LABEL_H / 2);
}

function draw() {
  background(16);
  detectFace();

  // Loop through and draw all panels
  for (let i = 0; i < PANEL_NAMES.length; i++) {
    const { x, y } = panelXY(i);
    drawPanelFrame(x, y, PANEL_NAMES[i]);

    // ------- Panels -----
    if (PANEL_NAMES[i] === "Webcam image") {
      if (baseImg) image(baseImg, x, y + LABEL_H, TILE_W, TILE_H);
      else if (cam) image(cam, x, y + LABEL_H, TILE_W, TILE_H);
      else drawHint(x, y);
    }

    else if (PANEL_NAMES[i] === "Webcam (repeat)") {
      if (baseImg) image(baseImg, x, y + LABEL_H, TILE_W, TILE_H);
      else drawHint(x, y);
    }

    else if (PANEL_NAMES[i] === "Emoji Extension") { 
      drawEmojiExtensionPanel(x, y);
    }

    else if (PANEL_NAMES[i] === "Grayscale +20%") {
      if (grayBrightImg) image(grayBrightImg, x, y + LABEL_H, TILE_W, TILE_H);
      else drawHint(x, y);
    }

    else if (PANEL_NAMES[i] === "Red channel") {
      if (redImg) image(redImg, x, y + LABEL_H, TILE_W, TILE_H);
      else drawHint(x, y);
    }

    else if (PANEL_NAMES[i] === "Green channel") {
      if (greenImg) image(greenImg, x, y + LABEL_H, TILE_W, TILE_H);
      else drawHint(x, y);
    }

    else if (PANEL_NAMES[i] === "Blue channel") {
      if (blueImg) image(blueImg, x, y + LABEL_H, TILE_W, TILE_H);
      else drawHint(x, y);
    }

    else if (PANEL_NAMES[i] === "Threshold R") {
      if (thresholdedR) image(thresholdedR, x, y + LABEL_H, TILE_W, TILE_H);
      else drawHint(x, y);
    }

    else if (PANEL_NAMES[i] === "Threshold G") {
      if (thresholdedG) image(thresholdedG, x, y + LABEL_H, TILE_W, TILE_H);
      else drawHint(x, y);
    }

    else if (PANEL_NAMES[i] === "Threshold B") {
      if (thresholdedB) image(thresholdedB, x, y + LABEL_H, TILE_W, TILE_H);
      else drawHint(x, y);
    }

    else if (PANEL_NAMES[i] === "Colour space (HSV)") {
      if (hsvImg) image(hsvImg, x, y + LABEL_H, TILE_W, TILE_H);
      else drawHint(x, y);
    }

    else if (PANEL_NAMES[i] === "Colour space (YCbCr)") {
      if (ycbcrImg) image(ycbcrImg, x, y + LABEL_H, TILE_W, TILE_H);
      else drawHint(x, y);
    }

    // Face detection + replacement panel
    else if (PANEL_NAMES[i] === "Face detect & replace") {
      if (baseImg && detectedFaces.length > 0) {
        let displayImg = baseImg.get();
        for (let j = 0; j < detectedFaces.length; j++) {
          const [fx, fy, fw, fh] = detectedFaces[j];
          let processedFace = applyFaceReplacement(baseImg, detectedFaces[j]);
          if (processedFace) {
            displayImg.copy(processedFace, 0, 0, processedFace.width, processedFace.height, fx, fy, fw, fh);
          }
        }
        image(displayImg, x, y + LABEL_H, TILE_W, TILE_H);
        noFill(); stroke(255,0,0); strokeWeight(2);
        for (let j = 0; j < detectedFaces.length; j++) {
          const [fx, fy, fw, fh] = detectedFaces[j];
          rect(x+fx, y+LABEL_H+fy, fw, fh);
        }
        fill(255,255,0); textAlign(LEFT,BOTTOM); textSize(10);
        text(`Mode: ${faceReplaceMode} - ${getFaceReplacementModeName()}`, x+2, y+LABEL_H+TILE_H-2);
        textSize(12);
      }
      else if (baseImg) {
        image(baseImg, x, y + LABEL_H, TILE_W, TILE_H);
        fill(255,255,0); textAlign(CENTER,CENTER);
        text("No faces detected", x+TILE_W/2, y+LABEL_H+TILE_H/2);
      } 
      else {
        fill(60); rect(x, y+LABEL_H, TILE_W, TILE_H);
        fill(255); textAlign(CENTER,CENTER);
        text("Press 'S' to capture", x+TILE_W/2, y+LABEL_H+TILE_H/2);
      }
    }

    else if (PANEL_NAMES[i] === "Threshold (HSV)") {
      if (hsvThreshImg) image(hsvThreshImg, x, y + LABEL_H, TILE_W, TILE_H);
      else drawHint(x, y);
    }

    else if (PANEL_NAMES[i] === "Threshold (YCbCr)") {
      if (ycbcrThreshImg) image(ycbcrThreshImg, x, y + LABEL_H, TILE_W, TILE_H);
      else drawHint(x, y);
    }

    else if (PANEL_NAMES[i] === "Backgrounds Extension") {
      drawBackgroundExtensionPanel(x, y);
    }

    else if (PANEL_NAMES[i] === "Cartoon Extension") {
      drawCartoonExtensionPanel(x, y);
    }

    else if (PANEL_NAMES[i] === "Neon Extension") {
      drawNeonExtensionPanel(x, y);
    }

    else if (PANEL_NAMES[i] === "Fractal Extension") {
      drawFractalExtensionPanel(x, y);
    }

    else drawPlaceholder(x, y);
  }

  //compute threshold images for R, G, B.
  if (baseImg) {
    thresholdedR = thresholdChannel(baseImg, 0, sliderR.value());
    thresholdedG = thresholdChannel(baseImg, 1, sliderG.value());
    thresholdedB = thresholdChannel(baseImg, 2, sliderB.value());
  }

  //compute threshold images for HSV and YCbCr
  if (hsvImg) hsvThreshImg = thresholdHSVColor(hsvImg, sliderH.value());
  if (ycbcrImg) ycbcrThreshImg = thresholdYCbCrColor(ycbcrImg, sliderY.value());
}

//draw hint placeholder text
function drawHint(x,y){ 
  fill(200); textAlign(CENTER,CENTER);
  text("Press 'S' to take snapshot", x+TILE_W/2, y+LABEL_H+TILE_H/2); 
}

//handle key presses (S = snapshot, 0–4 = face mode)
function keyPressed() {
  if (key==='s'||key==='S') takeSnapshot();
  if (key>='0' && key<='4') faceReplaceMode = parseInt(key);
}

//capture snapshot from webcam and prepare derived images
function takeSnapshot() {
  if (!cam) return;
  const frame = cam.get();
  frame.resize(TILE_W, TILE_H);
  baseImg = frame;

  // Generate processed versions
  grayBrightImg = grayscalePlus20(baseImg);
  const {rImg,gImg,bImg} = separateRGBChannels(baseImg);
  redImg=rImg; greenImg=gImg; blueImg=bImg;
  hsvImg = convertToHSV(baseImg);
  ycbcrImg = convertToYCbCr(baseImg);

  // Run face detection
  detectFace();
}

// Get face replacement mode name for display
function getFaceReplacementModeName() {
  return ["Red Box","Grayscale","Blur","HSV","Pixelated"][faceReplaceMode]||"Unknown";
}