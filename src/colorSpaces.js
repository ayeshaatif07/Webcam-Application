function convertToHSV(inputImg) {
  //create output image same size as input
  let img = createImage(inputImg.width, inputImg.height);
  inputImg.loadPixels();
  img.loadPixels();

  //looping over all pixels
  for (let y = 0; y < inputImg.height; y++) {
    for (let x = 0; x < inputImg.width; x++) {
      let index = (y * inputImg.width + x) * 4;

      // Normalize RGB values to [0..1]
      let r = inputImg.pixels[index + 0] / 255;
      let g = inputImg.pixels[index + 1] / 255;
      let b = inputImg.pixels[index + 2] / 255;

      //finding min, max and thee difference
      let max = Math.max(r, g, b);
      let min = Math.min(r, g, b);
      let delta = max - min;

      //compute the hue
      let h = 0;
      if (delta !== 0) {
        if (max === r) {
          h = 60 * (((g - b) / delta) % 6);
        } else if (max === g) {
          h = 60 * (((b - r) / delta) + 2);
        } else {
          h = 60 * (((r - g) / delta) + 4);
        }
      }
      if (h < 0) h += 360;

      //compute saturation and value
      let s = (max === 0) ? 0 : delta / max;
      let v = max;

      //mapping the  HSV to RGB channels for visualization
      img.pixels[index + 0] = (h / 360) * 255; // red = hue
      img.pixels[index + 1] = s * 255;         // green = saturation
      img.pixels[index + 2] = v * 255;         // blue = value
      img.pixels[index + 3] = 255;
    }
  }

  //commit pixel changes
  img.updatePixels();
  return img;
}

function convertToYCbCr(inputImg) {
  //create output image same size as input
  let img = createImage(inputImg.width, inputImg.height);
  inputImg.loadPixels();
  img.loadPixels();

  //loop over all pixels
  for (let y = 0; y < inputImg.height; y++) {
    for (let x = 0; x < inputImg.width; x++) {
      let index = (y * inputImg.width + x) * 4;

      //get RGB values directly (0–255)
      let r = inputImg.pixels[index + 0];
      let g = inputImg.pixels[index + 1];
      let b = inputImg.pixels[index + 2];

      //convert RGB to YCbCr using ITU-BT.601 formula
      let Y  = 0.299 * r + 0.587 * g + 0.114 * b;
      let Cb = -0.169 * r - 0.331 * g + 0.5 * b + 128;
      let Cr = 0.5 * r - 0.419 * g - 0.081 * b + 128;

      //mapping channels to RGB for visualization
      img.pixels[index + 0] = Y;   // green channel shows luma
      img.pixels[index + 1] = Cb;  // blue-ish channel shows Cb
      img.pixels[index + 2] = Cr;  // red-ish channel shows Cr
      img.pixels[index + 3] = 255;
    }
  }

  //commit pixel changes
  img.updatePixels();
  return img;
}