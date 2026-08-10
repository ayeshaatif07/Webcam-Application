let NEON_PANEL_INDEX = -1;
let neonEdgeSlider, neonGlowSlider;

function setupNeonExtension() {
  //find this panel in the grid
  NEON_PANEL_INDEX = PANEL_NAMES.indexOf("Neon Extension");
  if (NEON_PANEL_INDEX < 0) {
    console.warn('neon Extension: Panel "Neon Extension" not found in PANEL_NAMES');
    return;
  }

  //adding label to sidebar
  addPanelLabel("Neon Extension (6th Row)");

  //edge threshold slider
  neonEdgeSlider = createSlider(30, 200, 80, 1);
  addSliderToPanel('Edge', neonEdgeSlider, 30, 200);

  //glow size slider
  neonGlowSlider = createSlider(2, 10, 4, 1);
  addSliderToPanel('Glow', neonGlowSlider, 2, 10);
}

function drawNeonExtensionPanel(panelX, panelY) {
  const imgY = panelY + LABEL_H;

  //show the hint if no snapshot yet
  if (!baseImg) {
    fill(200); textAlign(CENTER, CENTER);
    text("Press 'S' to take snapshot", panelX + TILE_W/2, imgY + TILE_H/2);
    return;
  }

  //gett slider values
  const edgeTh  = neonEdgeSlider ? neonEdgeSlider.value() : 80;
  const glow    = neonGlowSlider ? neonGlowSlider.value() : 4;

  //copy base image and apply neon effect
  const src     = baseImg.get();
  const neonImg = neonify(src, edgeTh, glow);

  //draw final neon image
  image(neonImg, panelX, imgY, TILE_W, TILE_H);
}

//neon effect core function
function neonify(img, edgeTh, glowSize) {
  const w = img.width, h = img.height;

  //convert to grayscale and compute Sobel edges
  const gray = toGray(img);
  const sob  = sobelMag(gray, w, h);
  normalizeArray(sob);

  //prepare output image
  const out = createImage(w, h);
  out.loadPixels();

  //loop through all pixels
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = 4 * (y*w + x);
      const val = sob[y*w + x];

      if (val > edgeTh/255) {
        //assign rainbow hue based on position
        const hue = (x + y) % 360;
        const col = color(`hsb(${hue},100%,100%)`);

        //paint edge pixel
        out.pixels[idx  ] = red(col);
        out.pixels[idx+1] = green(col);
        out.pixels[idx+2] = blue(col);
        out.pixels[idx+3] = 255;

        //add glow around edges
        for (let gy=-glowSize; gy<=glowSize; gy++) {
          for (let gx=-glowSize; gx<=glowSize; gx++) {
            const xx = x+gx, yy = y+gy;
            if (xx>=0 && xx<w && yy>=0 && yy<h) {
              const ii = 4 * (yy*w + xx);
              const falloff = 1 - (Math.sqrt(gx*gx+gy*gy) / (glowSize+1));
              if (falloff > 0) {
                out.pixels[ii  ] = max(out.pixels[ii  ], red(col)   * falloff);
                out.pixels[ii+1] = max(out.pixels[ii+1], green(col) * falloff);
                out.pixels[ii+2] = max(out.pixels[ii+2], blue(col)  * falloff);
                out.pixels[ii+3] = 255;
              }
            }
          }
        }
      } else {
        //background (dark blue-gray)
        out.pixels[idx  ] = 20;
        out.pixels[idx+1] = 20;
        out.pixels[idx+2] = 30;
        out.pixels[idx+3] = 255;
      }
    }
  }

  out.updatePixels();
  return out;
}

// ---------- Helpers reused from cartoon extension ------

//convert image to grayscale float array
function toGray(img) {
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

//sobel edge magnitude
function sobelMag(gray, w, h) {
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

//normalize float array to [0..1]
function normalizeArray(arr){
  let mx = 1e-6;
  for (let v of arr) if (v>mx) mx=v;
  for (let i=0; i<arr.length; i++) arr[i] /= mx;
}