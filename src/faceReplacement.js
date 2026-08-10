//convert RGB → HSV values (normalized 0–1 input)
function convertRgbToHsv(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, v = max;

  const d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max === min) {
    //no color, grayscale
    h = 0;
  } else {
    //find hue based on dominant channel
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h, s, v];
}

//friendly names for the face replacement modes
function getFaceReplacementModeName() {
  const modes = ["Original", "Grayscale", "Blurred", "HSV Color", "Pixelated"];
  return modes[faceReplaceMode] || "Unknown";
}

//main switch: apply chosen face replacement mode
function applyFaceReplacement(img, faceBox) {
  const [x, y, w, h] = faceBox;

  //extract the face region (ROI)
  let faceROI = img.get(x, y, Math.ceil(w) - 1, Math.ceil(h) + 5);
  let processedFace;

  switch (faceReplaceMode) {
    case 0:
      // Mode 0 is for Original face
      return faceROI;

    case 1:
      // Mode 1 is for Grayscale
      processedFace = applyGrayscale(faceROI);
      break;

    case 2:
      // Mode 2 is for Blurred
      processedFace = applyBlur(faceROI);
      break;

    case 3:
      // Mode 3 is for HSV color visualization
      processedFace = applyHSVConversion(faceROI);
      break;

    case 4:
      // Mode 4 is for the  Pixelated
      processedFace = applyPixelation(faceROI);
      break;

    default:
      return faceROI;
  }

  return processedFace;
}

//convert face to grayscale
function applyGrayscale(faceImg) {
  let result = faceImg.get();
  result.loadPixels();

  for (let i = 0; i < result.pixels.length; i += 4) {
    const r = result.pixels[i];
    const g = result.pixels[i + 1];
    const b = result.pixels[i + 2];

    //weighted average for luminance
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    result.pixels[i]     = gray;
    result.pixels[i + 1] = gray;
    result.pixels[i + 2] = gray;
  }

  result.updatePixels();
  return result;
}

//apply blur filter to face
function applyBlur(faceImg) {
  let result = faceImg.get();
  result.filter(BLUR, 8);
  return result;
}

//convert face pixels to HSV visualization
function applyHSVConversion(faceImg) {
  let result = faceImg.get();
  result.loadPixels();

  for (let i = 0; i < result.pixels.length; i += 4) {
    const r = result.pixels[i] / 255.0;
    const g = result.pixels[i + 1] / 255.0;
    const b = result.pixels[i + 2] / 255.0;

    //convert each pixel
    const hsv = convertRgbToHsv(r, g, b);

    result.pixels[i]     = hsv[0] * 255; // hue → red
    result.pixels[i + 1] = hsv[1] * 255; // saturation → green
    result.pixels[i + 2] = hsv[2] * 255; // value → blue
  }

  result.updatePixels();
  return result;
}

//pixelation effect (blocky mosaic)
function applyPixelation(faceImg) {
  let rImg = createImage(faceImg.width, faceImg.height);

  faceImg.loadPixels();
  rImg.loadPixels();

  //loop in 5x5 blocks
  for (let x = 0; x < faceImg.width; x += 5) {
    for (let y = 0; y < faceImg.height; y += 5) {

      let sum_r = 0, sum_g = 0, sum_b = 0, count = 0;

      //average colors inside this block
      for (let i = x; i < x + 5; i++) {
        for (let j = y; j < y + 5; j++) {
          let index = (i * faceImg.width + j) * 4;
          let r = faceImg.pixels[index + 0];
          let g = faceImg.pixels[index + 1];
          let b = faceImg.pixels[index + 2];
          sum_r += r; sum_g += g; sum_b += b;
          count += 1;
        }
      }

      //compute average color
      let avg_r = sum_r / count;
      let avg_g = sum_g / count;
      let avg_b = sum_b / count;

      //paint the block with the avg color
      for (let i = x; i < x + 5; i++) {
        for (let j = y; j < y + 5; j++) {
          let index = (i * rImg.width + j) * 4;
          rImg.pixels[index + 0] = avg_r;
          rImg.pixels[index + 1] = avg_g;
          rImg.pixels[index + 2] = avg_b;
          rImg.pixels[index + 3] = 255;
        }
      }
    }
  }

  rImg.updatePixels();
  return rImg;
}