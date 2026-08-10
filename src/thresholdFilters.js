function thresholdHSVColor(inputImg, hThresh) {
  //create output image
  let out = createImage(inputImg.width, inputImg.height);
  inputImg.loadPixels();
  out.loadPixels();

  //compute fade percentages for smoother transition
  let fadeToWhite = constrain(map(hThresh, 0, 30, 1, 0), 0, 1);   // fade near hue=0
  let fadeToBlack = constrain(map(hThresh, 330, 360, 0, 1), 0, 1); // fade near hue=360

  //loop over all pixels
  for (let y = 0; y < inputImg.height; y++) {
    for (let x = 0; x < inputImg.width; x++) {
      let index = (y * inputImg.width + x) * 4;

      //convert RGB to [0-1] range
      let r = inputImg.pixels[index + 0] / 255;
      let g = inputImg.pixels[index + 1] / 255;
      let b = inputImg.pixels[index + 2] / 255;

      //compute Hue (H) from HSV model
      let max = Math.max(r, g, b);
      let min = Math.min(r, g, b);
      let delta = max - min;
      let h = 0;
      if (delta !== 0) {
        if (max === r) h = 60 * (((g - b) / delta) % 6);
        else if (max === g) h = 60 * (((b - r) / delta) + 2);
        else h = 60 * (((r - g) / delta) + 4);
      }
      if (h < 0) h += 360;

      //get original color
      let origR = inputImg.pixels[index + 0];
      let origG = inputImg.pixels[index + 1];
      let origB = inputImg.pixels[index + 2];

      //default output color (black)
      let rOut = 0, gOut = 0, bOut = 0;

      //keep color if hue is above threshold
      if (h >= hThresh) {
        rOut = origR;
        gOut = origG;
        bOut = origB;
      }

      //apply fade to white if threshold is near 0
      if (fadeToWhite > 0) {
        rOut = lerp(rOut, 255, fadeToWhite);
        gOut = lerp(gOut, 255, fadeToWhite);
        bOut = lerp(bOut, 255, fadeToWhite);
      }

      //apply fade to black if threshold is near 360
      if (fadeToBlack > 0) {
        rOut = lerp(rOut, 0, fadeToBlack);
        gOut = lerp(gOut, 0, fadeToBlack);
        bOut = lerp(bOut, 0, fadeToBlack);
      }

      //store pixel in output
      out.pixels[index + 0] = rOut;
      out.pixels[index + 1] = gOut;
      out.pixels[index + 2] = bOut;
      out.pixels[index + 3] = 255;
    }
  }

  out.updatePixels();
  return out;
}

function thresholdYCbCrColor(inputImg, yThresh) {
  //creating the  output image
  let out = createImage(inputImg.width, inputImg.height);
  inputImg.loadPixels();
  out.loadPixels();

  //fade mapping for brightness threshold
  let fadeToWhite = constrain(map(yThresh, 0, 30, 1, 0), 0, 1);
  let fadeToBlack = constrain(map(yThresh, 225, 255, 0, 1), 0, 1);

  //loop over pixels
  for (let y = 0; y < inputImg.height; y++) {
    for (let x = 0; x < inputImg.width; x++) {
      let index = (y * inputImg.width + x) * 4;

      //extract RGB values
      let r = inputImg.pixels[index + 0];
      let g = inputImg.pixels[index + 1];
      let b = inputImg.pixels[index + 2];

      //compute Y channel from YCbCr
      let Y = 0.299 * r + 0.587 * g + 0.114 * b;

      //default output = black
      let rOut = 0, gOut = 0, bOut = 0;

      //keep original color if Y ≥ threshold
      if (Y >= yThresh) {
        rOut = r;
        gOut = g;
        bOut = b;
      }

      //fade toward white
      if (fadeToWhite > 0) {
        rOut = lerp(rOut, 255, fadeToWhite);
        gOut = lerp(gOut, 255, fadeToWhite);
        bOut = lerp(bOut, 255, fadeToWhite);
      }

      //fade toward black
      if (fadeToBlack > 0) {
        rOut = lerp(rOut, 0, fadeToBlack);
        gOut = lerp(gOut, 0, fadeToBlack);
        bOut = lerp(bOut, 0, fadeToBlack);
      }

      //store result
      out.pixels[index + 0] = rOut;
      out.pixels[index + 1] = gOut;
      out.pixels[index + 2] = bOut;
      out.pixels[index + 3] = 255;
    }
  }

  out.updatePixels();
  return out;
}