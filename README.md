# Webcam Application

A browser-based webcam image-processing app built with [p5.js](https://p5js.org/). Press a key to take a snapshot from your webcam and the app shows it in a grid of 19 panels, each applying a different filter: colour channels, thresholds, colour-space conversions, face detection and replacement, plus several creative extensions.

## Features

### Core filters

| Panel | What it does |
|-------|--------------|
| Webcam image | The snapshot you captured |
| Grayscale +20% | Grayscale version brightened by 20% |
| Red / Green / Blue channel | The snapshot split into its separate colour channels |
| Threshold R / G / B | Binary threshold of each RGB channel, controlled by a slider |
| Colour space (HSV) | The snapshot converted to the HSV colour space |
| Colour space (YCbCr) | The snapshot converted to the YCbCr colour space |
| Threshold (HSV) | Hue-based threshold with smooth fades near the boundaries |
| Threshold (YCbCr) | Luminance-based threshold with smooth fades near the boundaries |
| Face detect & replace | Detects faces and replaces them using one of five modes |

### Extensions

| Panel | What it does |
|-------|--------------|
| Emoji Extension | Overlays a chosen emoji on each detected face, scaled to the face size |
| Backgrounds Extension | Replaces the background with an animated starfield, matrix rain or gradient while keeping the face region |
| Cartoon Extension | Cartoon look using colour quantisation (posterisation) and Sobel edge outlines |
| Neon Extension | Glowing rainbow edges drawn with Sobel edge detection |
| Fractal Extension | Kaleidoscope portal effect with radial mirroring and recursive layers |

### Face detection

Faces are found with the Viola-Jones detector from the `objectdetect` library. A refinement step removes overlapping and duplicate detections using size differences, a minimum distance between face centres and intersection over union.

## Controls

| Input | Action |
|-------|--------|
| `S` | Take a snapshot from the webcam |
| `0` to `4` | Choose the face replacement mode: Red Box, Grayscale, Blur, HSV, Pixelated |

The control panel on the right has sliders and dropdowns:

- Threshold sliders for Red, Green, Blue, HSV and YCbCr.
- Emoji selector and background selector.
- Cartoon sliders: Edge and Levels.
- Neon sliders: Edge and Glow.
- Fractal sliders: Depth, Zoom and Hue Layer.

## Run Locally

The webcam only works on `localhost` or HTTPS, so serve the project from a local web server. You need Python 3 and a webcam.

```bash
git clone https://github.com/ayeshaatif07/Webcam-Application.git
cd Webcam-Application
python3 -m http.server 8000
```

Then:

1. Open http://localhost:8000 in your browser.
2. Allow camera access when the browser asks.
3. Press `S` to take a snapshot and fill the panels.

Press `Ctrl+C` in the terminal to stop the server.

## Project Structure

| File / folder | Purpose |
|---------------|---------|
| `index.html` | Page layout, styling and script loading |
| `src/main.js` | Setup, the panel grid, the draw loop and key handling |
| `src/grayscalePlus20.js`, `src/channels.js`, `src/thresholdChannel.js` | Grayscale, channel splitting and RGB thresholds |
| `src/colorSpaces.js`, `src/thresholdFilters.js` | HSV and YCbCr conversion and thresholds |
| `src/faceDetection.js`, `src/faceReplacement.js` | Face detection, refinement and replacement modes |
| `src/emojiExt.js`, `src/backgroundsExt.js`, `src/cartoonExt.js`, `src/neonExt.js`, `src/fractalExt.js` | The five extensions |
| `libraries/` | p5.js and the objectdetect face detection library |

## Author and Credits

- **Author:** Ayesha Atif
- **Coursework:** Graphics – Final Submission
- Built with [p5.js](https://p5js.org/).
- Face detection uses the [objectdetect.js](https://github.com/mtschirs/js-objectdetect) library by Martin Tschirsich.
