//the dropdown element and currently chosen emoji
let emojiSel;
let selectedEmoji = '🥰';

//available emoji choices
const emojiOptions = ['🥰','🤪','🌚','💀','😚'];

//panel index reference
let EXT_PANEL_INDEX = -1;

function setupEmojiExtension() {
  //find index of "Emoji Extension" panel
  EXT_PANEL_INDEX = PANEL_NAMES.indexOf("Emoji Extension");
  if (EXT_PANEL_INDEX < 0) {
    console.warn('Emoji Extension: Panel "Emoji Extension" not found in PANEL_NAMES');
    return;
  }

  //adding section label to the controls sidebar
  addPanelLabel("Emoji Extension (1st Row)");

  //building the  dropdown for emoji selection
  emojiSel = createSelect();
  emojiOptions.forEach(e => emojiSel.option(e, e));
  emojiSel.selected(selectedEmoji);

  //update selected emoji on change
  emojiSel.changed(() => (selectedEmoji = emojiSel.value()));
  addDropdownToPanel('Emoji', emojiSel);
}

function drawEmojiExtensionPanel(panelX, panelY) {
  //leeave room for the panel label
  const imgY = panelY + LABEL_H;

  //show hint if no snapshot has been taken
  if (!baseImg) {
    fill(200); 
    textAlign(CENTER, CENTER);
    text("Press 'S' to take snapshot", panelX + TILE_W/2, imgY + TILE_H/2);
    return;
  }

  //draw the snapshot image in this panel
  image(baseImg, panelX, imgY, TILE_W, TILE_H);

  //if a face is detected, overlay the emoji on top
  if (Array.isArray(detectedFaces) && detectedFaces.length > 0) {
    const [fx, fy, fw, fh] = detectedFaces[0];

    //compute center of the face bounding box
    const cx = panelX + fx + fw / 2;
    const cy = imgY   + fy + fh / 2;

    //scale emoji size relative to face size
    const sz = Math.max(fw, fh) * 1.6;

    //draw the emoji at the detected face position
    push();
    textAlign(CENTER, CENTER);
    noStroke();
    textSize(sz);
    text(selectedEmoji, cx, cy);
    pop();
  } else {
    //message when there is  no face  detected
    fill(255, 255, 0);
    textAlign(CENTER, CENTER);
    text("No face detected", panelX + TILE_W/2, imgY + TILE_H/2);
  }
}