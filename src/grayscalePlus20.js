function grayscalePlus20(img) {
  //create an output image of the same size
  let imgOut = createImage(img.width, img.height);

  //prepare the pixel arrays
  imgOut.loadPixels();
  img.loadPixels();

  //loop over all thee pixels
  for (let x = 0; x < img.width; x++) {
    for (let y = 0; y < img.height; y++) {
      let index = (y * img.width + x) * 4;

      //read RGB values
      let r = img.pixels[index + 0];
      let g = img.pixels[index + 1];
      let b = img.pixels[index + 2];

      //convert to grayscale using simple average
      let gray = (r + g + b) / 3;

      //increase brightness by 20%
      let bright = gray * 1.2;

      //clamp brightness to max 255
      if (bright > 255) bright = 255;

      //write the grayscale and brightened values back
      imgOut.pixels[index + 0] = bright;
      imgOut.pixels[index + 1] = bright;
      imgOut.pixels[index + 2] = bright;
      imgOut.pixels[index + 3] = 255; // set alpha
    }
  }

  //apply changes to output image
  imgOut.updatePixels();
  return imgOut;
}