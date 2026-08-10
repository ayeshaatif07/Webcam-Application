//track panel index in PANEL_NAMES
let CARTOON_PANEL_INDEX = -1;

// Sliders: one for edge thresholda and one for the posterize levels
let ctEdgeSlider, ctLevelsSlider;

function setupCartoonExtension() {
  //find panel index for Cartoon Extension
  CARTOON_PANEL_INDEX = PANEL_NAMES.indexOf("Cartoon Extension");
  if (CARTOON_PANEL_INDEX < 0) {
    console.warn('cartoon Extension: Panel "Cartoon Extension" not found in PANEL_NAMES');
    return;
  }

  //adding a heading label in the controls sidebar
  addPanelLabel("Cartoon Extension (6th Row)");

  //ceate slider to adjust edge threshold
  ctEdgeSlider   = createSlider(10, 200, 70, 1);
  addSliderToPanel('Edge', ctEdgeSlider, 10, 200);

  //create slider to adjust  levels
  ctLevelsSlider = createSlider(2, 8, 4, 1);
  addSliderToPanel('Levels', ctLevelsSlider, 2, 8);
}

function drawCartoonExtensionPanel(panelX, panelY) {
  // Y offset to leave room for the label
  const imgY = panelY + LABEL_H;

  // If no snapshot yet then show hint text
  if (!baseImg) {
    fill(200); textAlign(CENTER, CENTER);
    text("Press 'S' to take snapshot", panelX + TILE_W/2, imgY + TILE_H/2);
    return;
  }

  //Clone base image where tile is 160x120
  const src = baseImg.get();

  //read current slider values (with defaults)
  const levels = ctLevelsSlider ? ctLevelsSlider.value() : 4;
  const edgeTh = ctEdgeSlider   ? ctEdgeSlider.value()   : 70;

  // Run the cartoonify process
  const out = cartoonifyClean(src, levels, edgeTh);

  // Draw output in the panel slot
  image(out, panelX, imgY, TILE_W, TILE_H);
}

// --------- Cartoonify  --------
function cartoonifyClean(img, levels, edgeThresh) {
  const w = img.width, h = img.height;

  // Step 1 is tto blur to reduce noise
  const blurred = boxBlurFilter(img);

  // Step 2 is to  posterize colors
  const poster  = posterize(blurred, levels);

  // Step 3 is to grayscale for edge detection
  const gray = toGray(blurred);

  // Step 4 is to apply Sobel operator
  const sob  = sobelMag(gray, w, h);
  normalizeArray(sob);

  // Step 5 is for threshold edges into binary mask
  const th = edgeThresh / 255;
  const edges = new Uint8Array(w * h);
  for (let i = 0; i < w*h; i++) edges[i] = sob[i] >= th ? 255 : 0;

  // Step 6 is for painting the edges onto posterized image (black lines)
  poster.loadPixels();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = 4 * (y*w + x);
      if (edges[y*w + x] === 255) {
        poster.pixels[i  ] = 0;
        poster.pixels[i+1] = 0;
        poster.pixels[i+2] = 0;
        poster.pixels[i+3] = 255;
      }
    }
  }
  poster.updatePixels();
  return poster;
}

// ------ helper functions ------

function toGray(img) {
  //convert an image to a grayscale float array
  const w = img.width, h = img.height;
  img.loadPixels();
  const g = new Float32Array(w*h);
  for (let i = 0; i < w*h; i++) {
    const idx = 4*i;
    const r = img.pixels[idx], g1 = img.pixels[idx+1], b = img.pixels[idx+2];
    g[i] = 0.299*r + 0.587*g1 + 0.114*b;
  }
  return g;
}

function sobelMag(gray, w, h) {
  //compute Sobel edge magnitude at each pixel
  const out = new Float32Array(w*h);
  const kx = [-1,0,1,-2,0,2,-1,0,1];
  const ky = [-1,-2,-1,0,0,0,1,2,1];
  for (let y = 1; y < h-1; y++) {
    for (let x = 1; x < w-1; x++) {
      let gx = 0, gy = 0, p = 0;
      p = gray[(y-1)*w + (x-1)]; gx += kx[0]*p; gy += ky[0]*p;
      p = gray[(y-1)*w + (x  )]; gx += kx[1]*p; gy += ky[1]*p;
      p = gray[(y-1)*w + (x+1)]; gx += kx[2]*p; gy += ky[2]*p;
      p = gray[(y  )*w + (x-1)]; gx += kx[3]*p; gy += ky[3]*p;
      p = gray[(y  )*w + (x  )]; gx += kx[4]*p; gy += ky[4]*p;
      p = gray[(y  )*w + (x+1)]; gx += kx[5]*p; gy += ky[5]*p;
      p = gray[(y+1)*w + (x-1)]; gx += kx[6]*p; gy += ky[6]*p;
      p = gray[(y+1)*w + (x  )]; gx += kx[7]*p; gy += ky[7]*p;
      p = gray[(y+1)*w + (x+1)]; gx += kx[8]*p; gy += ky[8]*p;
      out[y*w + x] = Math.hypot(gx, gy);
    }
  }
  return out;
}

function normalizeArray(arr) {
  // Normalize values to range [0..1]
  let mx = 1e-6;
  for (let v of arr) if (v>mx) mx=v;
  for (let i=0;i<arr.length;i++) arr[i]/=mx;
}

function posterize(img, levels) {
  //reduce image colors to a set number of discrete levels
  const out = createImage(img.width, img.height);
  img.loadPixels(); out.loadPixels();
  const step = 255 / Math.max(1, (levels - 1));
  const q = c => Math.round(c / step) * step;
  for (let i = 0; i < img.pixels.length; i += 4) {
    out.pixels[i  ] = q(img.pixels[i  ]);
    out.pixels[i+1] = q(img.pixels[i+1]);
    out.pixels[i+2] = q(img.pixels[i+2]);
    out.pixels[i+3] = 255;
  }
  out.updatePixels();
  return out;
}

function boxBlurFilter(img) {
  //apply a simple 3x3 box blur
  const w = img.width, h = img.height;
  img.loadPixels();
  const out = createImage(w, h);
  out.loadPixels();

  // Helper to sample pixel with boundary clamping
  function px(x,y,c){
    x = constrain(x,0,w-1); y = constrain(y,0,h-1);
    return img.pixels[4*(y*w+x)+c];
  }

  //avg 3x3 neighborhood per channel
  for (let y=0; y<h; y++){
    for (let x=0; x<w; x++){
      for (let c=0; c<3; c++){
        let s=0;
        s += px(x-1,y-1,c)+px(x,y-1,c)+px(x+1,y-1,c)
           + px(x-1,y  ,c)+px(x,y  ,c)+px(x+1,y  ,c)
           + px(x-1,y+1,c)+px(x,y+1,c)+px(x+1,y+1,c);
        out.pixels[4*(y*w+x)+c] = s/9;
      }
      out.pixels[4*(y*w+x)+3] = 255;
    }
  }
  out.updatePixels();
  return out;
}