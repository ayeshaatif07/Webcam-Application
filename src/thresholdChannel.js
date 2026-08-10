function thresholdChannel(img, channelIndex, t) {
  //create a new output image
  let output = createImage(img.width, img.height);

  //load pixel data for input and output
  img.loadPixels();
  output.loadPixels();

  //looping through all pixels
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let index = (y * img.width + x) * 4;

      //get original RGB values
      let r = img.pixels[index + 0];
      let g = img.pixels[index + 1];
      let b = img.pixels[index + 2];

      //extract the value of the selected channel
      let channelValue = img.pixels[index + channelIndex];

      //check if pixel passes threshold
      let keep = channelValue >= t;

      if (keep) {
        //output solid color for selected channel
        output.pixels[index + 0] = (channelIndex === 0) ? 255 : 0; // Red
        output.pixels[index + 1] = (channelIndex === 1) ? 255 : 0; // Green
        output.pixels[index + 2] = (channelIndex === 2) ? 255 : 0; // Blue
      } else {
        //below threshold → black
        output.pixels[index + 0] = 0;
        output.pixels[index + 1] = 0;
        output.pixels[index + 2] = 0;
      }

      //always set alpha to fully opaque
      output.pixels[index + 3] = 255;
    }
  }

  //apply changes to the output image
  output.updatePixels();
  return output;
}