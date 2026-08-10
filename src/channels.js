function separateRGBChannels(img) {
  // Create blank images for each channel
  let rImg = createImage(img.width, img.height);
  let gImg = createImage(img.width, img.height);
  let bImg = createImage(img.width, img.height);

  //load pixel arrays for source and outputs
  img.loadPixels();
  rImg.loadPixels();
  gImg.loadPixels();
  bImg.loadPixels();

  //looping through all pixels
  for (let x = 0; x < img.width; x++) {
    for (let y = 0; y < img.height; y++) {
      let index = (y * img.width + x) * 4;

      //extract the RGB valuess
      let r = img.pixels[index + 0];
      let g = img.pixels[index + 1];
      let b = img.pixels[index + 2];

      //Red channel keep R, set others to 0
      rImg.pixels[index + 0] = r;
      rImg.pixels[index + 1] = 0;
      rImg.pixels[index + 2] = 0;
      rImg.pixels[index + 3] = 255;

      //Green channel keepss G only
      gImg.pixels[index + 0] = 0;
      gImg.pixels[index + 1] = g;
      gImg.pixels[index + 2] = 0;
      gImg.pixels[index + 3] = 255;

      //Blue channel keeps B only
      bImg.pixels[index + 0] = 0;
      bImg.pixels[index + 1] = 0;
      bImg.pixels[index + 2] = b;
      bImg.pixels[index + 3] = 255;
    }
  }

  //apply changes back to images
  rImg.updatePixels();
  gImg.updatePixels();
  bImg.updatePixels();

  //return an object holding all three channel images
  return { rImg, gImg, bImg };
}