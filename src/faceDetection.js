//global detector instance and detected faces list
let detector;
let detectedFaces = [];

//initialize face detector with objectdetect.js
function setupFaceDetection() {
  detector = new objectdetect.detector(
    TILE_W, TILE_H,        // working resolution
    1.1,                   // scale factor
    objectdetect.frontalface // frontal face classifier
  );
}

//runn face detection with filttering
function detectFace() {
  if (!baseImg || !detector) return;

  //scale/copy snapshot image to tile size
  const scaled = createImage(TILE_W, TILE_H);
  scaled.copy(baseImg, 0, 0, baseImg.width, baseImg.height, 0, 0, TILE_W, TILE_H);
  scaled.loadPixels();

  //raw detections from detector
  const rawDetections = detector.detect(scaled.canvas);

  //filttering out faces that are too small
  const minSize = 40;
  const valid = rawDetections.filter(([x, y, w, h]) => w >= minSize && h >= minSize);

  //apply stricter filtering (IoU, distance, size difference)
  detectedFaces = refineFaceDetections(valid, 0.3, 25, 15);
}

//remove overlapping orr duplicate detections
function refineFaceDetections(faces, iouThreshold, minDistance, maxSizeDiff) {
  const result = [];

  for (let i = 0; i < faces.length; i++) {
    const [x1, y1, w1, h1] = faces[i];
    let keep = true;

    //compare each new face against already kept faces
    for (let j = 0; j < result.length; j++) {
      const [x2, y2, w2, h2] = result[j];

      //overlap measure (Intersection over Union)
      const iou = computeIoU([x1, y1, w1, h1], [x2, y2, w2, h2]);

      //distance between face centers
      const cx1 = x1 + w1 / 2;
      const cy1 = y1 + h1 / 2;
      const cx2 = x2 + w2 / 2;
      const cy2 = y2 + h2 / 2;
      const dist = distBetween(cx1, cy1, cx2, cy2);

      //difference in size
      const sizeDiff = Math.abs(w1 - w2) + Math.abs(h1 - h2);

      //reject overlapping or near-duplicate boxes
      if (iou > iouThreshold || dist < minDistance || sizeDiff < maxSizeDiff) {
        keep = false;
        break;
      }
    }

    //keep face if not filtered out
    if (keep) result.push(faces[i]);
  }

  return result;
}

//compute Intersection over Union between two bounding boxes
function computeIoU(boxA, boxB) {
  const [xA, yA, wA, hA] = boxA;
  const [xB, yB, wB, hB] = boxB;

  const x1 = Math.max(xA, xB);
  const y1 = Math.max(yA, yB);
  const x2 = Math.min(xA + wA, xB + wB);
  const y2 = Math.min(yA + hA, yB + hB);

  //overlapping area
  const interArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const boxAArea = wA * hA;
  const boxBArea = wB * hB;

  return interArea / (boxAArea + boxBArea - interArea);
}

//distance formula between two points
function distBetween(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

//draw the detection panel with bounding boxes
function drawFaceDetectionPanel(x, y) {
  if (baseImg) {
    //draw base image
    image(baseImg, x, y, TILE_W, TILE_H);

    //draw red rectangles around detected faces
    noFill();
    stroke(255, 0, 0);
    strokeWeight(2);

    for (let i = 0; i < detectedFaces.length; i++) {
      const [fx, fy, fw, fh] = detectedFaces[i];
      rect(x + fx, y + fy, fw, fh);
    }
  } else {
    //show placeholder if no snapshot available
    fill(60);
    rect(x, y, TILE_W, TILE_H);
    fill(255);
    textAlign(CENTER, CENTER);
    text("No face", x + TILE_W / 2, y + TILE_H / 2);
  }
}