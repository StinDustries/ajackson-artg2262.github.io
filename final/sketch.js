let state = "title";
let inputBuffer = "";
let history = [];

let currentProblem = null;

let cursorBlink = true;
let lastBlink = 0;

let printQueue = [];
let lastPrintTime = 0;
let textSpeed = 22;

let flickering = false;
let flickerStart = 0;
let flickerDuration = 180;

let FONT_SIZE = 16;
let LINE_HEIGHT = 22;
let MARGIN_X = 28;
let MARGIN_TOP = 52;
let MARGIN_BOTTOM = 90;
let visibleLines = 20;

const COLORS = {
  g: [200, 220, 180],
  r: [220, 80, 60],
  y: [210, 190, 100],
  w: [200, 200, 200],
  dim: [100, 115, 90],
};
let currentColor = COLORS.g;

let noiseOffsets = [];
let operationCount = 0;
let milestones = [];
let apnWidget = null;
let apnActive = false;

let fadingOut = false;
let fadeStart = 0;
let fadeDuration = 5000;
let fadeAlpha = 0;

let terminatedMsg = false;
let waitingForShutdown = false;
let tvOff = false;
let tvOffStart = 0;

let screenBrightness = 1.0;

let slideY = 0;
let slideStart = 0;
const SLIDE_DURATION = 600;
let loginPasswordBuffer = "";
let loginError = "";

const SND_KEYCLICKS = "keyclicks.mp3";
const SND_CRT_HUM = "crt_hum.mp3";
const SND_AMBIENCE = "ambience.mp3";
const SND_TV_OFF = "tv_turn_off.mp3";

let sndKeyclicks = null;
let sndCrtHum = null;
let sndAmbience = null;
let sndTvOff = null;
let audioUnlocked = false;
let lastClickTime = 0;
const CLICK_THROTTLE = 80;

let shiftStartTime = 0;

const TRANSCRIBE_POOL = [
  "XK-229-ALPHA", "BR-004-ZETA", "MW-117-DELTA", "QP-558-GAMMA",
  "TL-803-SIGMA", "HN-461-OMEGA", "ZR-075-THETA", "JC-930-KAPPA",
  "VB-312-LAMBDA", "DF-667-IOTA", "SK-148-UPSILON", "PG-594-PHI",
];

const IMAGE_TARGETS = ["BUS", "BICYCLE", "BOAT", "FIRE HYDRANT", "TRAFFIC LIGHT"];
const IMAGE_DECOYS = ["CAR", "TRUCK", "TRAIN", "PLANE", "VAN", "FENCE", "SIGN", "TREE"];

const TRANSACTION_NAMES = ["J. DOE", "T. FARLEY", "M. VASQUEZ", "B. JACKSON", "R. ALVARA", "C. HALE"];
const TRANSACTION_FLAGS = ["DUPLICATE", "UNUSUAL AMOUNT", "FOREIGN IP", "NEW DEVICE", "VELOCITY"];

function getTaskWeights() {
  let t = operationCount;
  return {
    transcribe: 1.0,
    image: constrain(map(t, 10, 30, 0, 1.0), 0, 1.0),
    transaction: constrain(map(t, 30, 50, 0, 1.0), 0, 1.0),
  };
}

function pickTaskType() {
  let w = getTaskWeights();
  let total = w.transcribe + w.image + w.transaction;
  let r = random(total);
  if (r < w.transcribe) return "transcribe";
  if (r < w.transcribe + w.image) return "image";
  return "transaction";
}

function makeTranscribeTask() {
  let code = random(TRANSCRIBE_POOL);
  return {
    type: "transcribe",
    prompt: "Enter access token: <y>" + code + "</y>",
    answer: code.toLowerCase(),
  };
}

function makeImageTask() {
  let target = random(IMAGE_TARGETS);
  let cells = [];
  let correctIndices = [];

  for (let i = 0; i < 9; i++) {
    if (random() < 0.35) {
      cells.push(target);
      correctIndices.push(i + 1);
    } else {
      let decoy;
      do { decoy = random(IMAGE_DECOYS); } while (decoy == target);
      cells.push(decoy);
    }
  }

  let grid = "";

  for (let row = 0; row < 3; row++) {
    let line = "";

    for (let col = 0; col < 3; col++) {
      const index = row * 3 + col;
      const label = index + 1;
      line += `[${label}:${cells[index]}]  `;
    }

    grid += line.trimEnd() + "\n";
  }
  console.log(correctIndices)
  return {
    type: "image",
    prompt: "Select all squares containing <y>" + target + "</y>:\n" +
      grid +
      "Type matching numbers (e.g. 2 5 9), or NONE",
    answer: correctIndices.length ? correctIndices.join(" ") : "none",
  };
}

function makeTransactionTask() {
  let name = random(TRANSACTION_NAMES);
  let flag = random(TRANSACTION_FLAGS);
  let amount = (floor(random(1, 999)) + random()).toFixed(2);
  let id = floor(random(10000, 99999));
  return {
    type: "transaction",
    prompt: "Transaction #" + id + "\n" +
      "From: <y>" + name + "</y>  Amount: <y>$" + amount + "</y>\n" +
      "Flag: <r>" + flag + "</r>\n\n" +
      "APPROVE or DENY?",
    answer: null,
  };
}

function checkAnswer(cmd) {
  if (!currentProblem) return false;
  if (currentProblem.answer == null) {
    let lower = cmd.trim().toLowerCase();
    return lower == "approve" || lower == "deny";
  }
  return cmd.trim().toLowerCase() == currentProblem.answer.toLowerCase();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("monospace");
  updateLayout();
  frameRate(30);

  for (let i = 0; i < 2000; i++) {
    noiseOffsets.push((Math.random() - 0.5) * 0.6);
  }

  buildMilestones();

  addHistory("IBM 3278 MODEL 2  -  TERMINAL READY");
  addHistory("SESSION: WRK-17776  //  NODE: CORP-EAST-04");
  addHistory("");
  addHistory("Type 'clock in' to begin your shift.");
}

function preload() {
  soundFormats("mp3", "ogg");
  sndKeyclicks = loadSound(SND_KEYCLICKS);
  sndCrtHum = loadSound(SND_CRT_HUM);
  sndAmbience = loadSound(SND_AMBIENCE);
  sndTvOff = loadSound(SND_TV_OFF);
}

function initAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;

  if (sndKeyclicks && sndKeyclicks.isLoaded()) {
    sndKeyclicks.setVolume(0.03);
  }

  if (sndTvOff && sndTvOff.isLoaded()) {
    sndTvOff.setVolume(0.4);
  }

  if (sndCrtHum && sndCrtHum.isLoaded()) {
    f = new p5.LowPass();
    f.freq(2000);
    sndCrtHum.disconnect();
    sndCrtHum.connect(f);
    sndCrtHum.setLoop(true);
    sndCrtHum.setVolume(0.02);
    sndCrtHum.play();
  }

  if (sndAmbience && sndAmbience.isLoaded()) {
    sndAmbience.setLoop(true);
    sndAmbience.setVolume(0.8);
    sndAmbience.play();
  }
}

function stopCRTHum() {
  if (sndCrtHum && sndCrtHum.isPlaying()) {
    sndCrtHum.setVolume(0, 0.3);
  }
}

function playKeyClick() {
  if (!sndKeyclicks || !sndKeyclicks.isLoaded()) return;
  let now = millis();
  if (now - lastClickTime < CLICK_THROTTLE) return;
  if (Math.random() > 0.75) return;
  lastClickTime = now;
  sndKeyclicks.rate(0.85 + Math.random() * 0.3);
  sndKeyclicks.play();
}

function drawTitleScreen() {
  background(0);
  let cx = width / 2;
  let cy = height / 2;

  let titleFont = constrain(floor(windowWidth / 28), 18, 48);
  let subFont = constrain(floor(windowWidth / 72), 11, 16);

  textSize(titleFont);
  fill(COLORS.g[0], COLORS.g[1], COLORS.g[2]);
  noStroke();
  let t1 = "9 MINUS 5";
  text(t1, cx - textWidth(t1) / 2, cy - titleFont * 1.2);

  textSize(subFont);
  fill(COLORS.dim[0], COLORS.dim[1], COLORS.dim[2]);
  let t2 = "Human Processing Terminal  v2.1.6";
  text(t2, cx - textWidth(t2) / 2, cy - titleFont * 0.3);

  let pulse = map(sin(millis() * 0.0025), -1, 1, 80, 200);
  fill(COLORS.g[0], COLORS.g[1], COLORS.g[2], pulse);
  let t3 = "press any key to start";
  text(t3, cx - textWidth(t3) / 2, cy + titleFont * 1.1);

  textSize(FONT_SIZE);
}

function drawLoginScreen() {
  background(0);

  if (state == "sliding") {
    let elapsed = millis() - slideStart;
    let t = constrain(elapsed / SLIDE_DURATION, 0, 1);
    let ease = 1 - Math.pow(1 - t, 3);
    slideY = height * (1 - ease);
    if (elapsed >= SLIDE_DURATION) {
      state = "loginScreen";
      slideY = 0;
    }
  } else {
    slideY = 0;
  }

  push();
  translate(0, slideY);

  let cx = width / 2;
  let formW = constrain(floor(width * 0.38), 260, 520);
  let formX = cx - formW / 2;
  let labelFont = constrain(floor(windowWidth / 80), 10, 14);
  let fieldFont = constrain(floor(windowWidth / 64), 12, 16);
  let rowH = fieldFont * 3.2;
  let formH = rowH * 4.2;
  let formY = height / 2 - formH / 2;

  textSize(constrain(floor(windowWidth / 52), 14, 22));
  fill(COLORS.g[0], COLORS.g[1], COLORS.g[2]);
  noStroke();
  let hdr = "EMPLOYEE LOGIN";
  text(hdr, cx - textWidth(hdr) / 2, formY - fieldFont * 2);

  textSize(labelFont);
  fill(COLORS.dim[0], COLORS.dim[1], COLORS.dim[2]);
  let sub = "CORP-EAST-04  //  NODE: WRK-17776";
  text(sub, cx - textWidth(sub) / 2, formY - fieldFont * 0.6);

  let uy = formY + rowH * 0.8;
  textSize(labelFont);
  fill(COLORS.dim[0], COLORS.dim[1], COLORS.dim[2]);
  text("USERNAME", formX, uy - labelFont * 0.6);
  stroke(COLORS.dim[0], COLORS.dim[1], COLORS.dim[2], 80);
  strokeWeight(1);
  noFill();
  rect(formX, uy, formW, rowH * 0.85);
  noStroke();
  textSize(fieldFont);
  fill(COLORS.dim[0], COLORS.dim[1], COLORS.dim[2]);
  text("HPU5304", formX + 10, uy + rowH * 0.58);

  let py = uy + rowH * 1.6;
  textSize(labelFont);
  fill(COLORS.dim[0], COLORS.dim[1], COLORS.dim[2]);
  noStroke();
  text("PASSWORD", formX, py - labelFont * 0.6);
  stroke(COLORS.g[0], COLORS.g[1], COLORS.g[2], 140);
  strokeWeight(1);
  noFill();
  rect(formX, py, formW, rowH * 0.85);
  noStroke();
  textSize(fieldFont);
  fill(COLORS.g[0], COLORS.g[1], COLORS.g[2]);
  let masked = "•".repeat(loginPasswordBuffer.length);
  let maskedW = textWidth(masked);
  text(masked, formX + 10, py + rowH * 0.58);
  if (cursorBlink) {
    fill(COLORS.g[0], COLORS.g[1], COLORS.g[2], 200);
    rect(formX + 10 + maskedW, py + rowH * 0.58 - fieldFont * 0.85, textWidth("M"), fieldFont);
  }

  if (loginError) {
    textSize(labelFont);
    fill(COLORS.r[0], COLORS.r[1], COLORS.r[2]);
    noStroke();
    text(loginError, formX, py + rowH * 1.3);
  }

  textSize(labelFont);
  fill(COLORS.dim[0], COLORS.dim[1], COLORS.dim[2], 140);
  noStroke();
  let hint = "ENTER to submit";
  text(hint, cx - textWidth(hint) / 2, formY + formH + fieldFont * 1.4);

  pop();
  textSize(FONT_SIZE);
}

function buildMilestones() {
  milestones.push({
    at: 10, triggered: false, fn: () => {
      addHistory("");
      addHistory("<y>NOTICE</y>: We are proud to announce that the Company has partnered with Anthropic AI.");
      addHistory("<dim>The new AI Automation R&D team starts today! Be sure to show them a warm welcome.</dim>");
      addHistory("");
    }
  });

  milestones.push({
    at: 15, triggered: false, fn: () => {
      addHistory("");
      addHistory("<y>NOTICE</y>: As the Company moves into the next financial quarter, we regret to");
      addHistory("announce a series of layoffs. You may notice the absence of the AI Automation R&D team.");
      addHistory("");
      addHistory("<dim>In unrelated news, the Company has decided to further partner with Anthropic</dim>");
      addHistory("<dim>by taking the first steps to include a chatbot in all Human Processing computers.</dim>");
      addHistory("");
      apnWidget = { label: "APN-5304  INSTALLING", prog: 0, max: 5 };
    }
  });

  milestones.push({
    at: 20, triggered: false, fn: () => {
      addHistory("");
      addHistory("<y>NOTICE</y>: The Company will begin logging performance on all Human Processing");
      addHistory("computers for internal use. Employees with questions about data privacy should");
      addHistory("refer to Employee Handbook section 2321, paragraph 1.");
      addHistory("");
      apnWidget = { label: "APN-5304  TRAINING", prog: 0, max: 5 };
    }
  });

  milestones.push({
    at: 25, triggered: false, fn: () => {
      addHistory("");
      addHistory("<y>NOTICE</y>: Average operation speed of <y>Human Processing Unit #5304</y>: 0.2/sec.");
      addHistory("Average operation speed of <y>Artificial Processing Node 5304</y> (testing): <r>4000/sec</r>.");
      addHistory("<dim>Please consider improving performance to avoid obsolescence.</dim>");
      addHistory("");
      apnWidget = { label: "APN-5304  TESTING", prog: 0, max: 5 };
    }
  });

  milestones.push({
    at: 30, triggered: false, fn: () => {
      addHistory("");
      addHistory("<y>NOTICE</y>: The Company is pleased to announce the full integration of");
      addHistory("<y>Claude Opus 4.1</y> into all Human Processing workspaces, trained on");
      addHistory("operations completed by Human Processing employees.");
      addHistory("");
      addHistory("Would you like to enable Artificial Processing Node 5304?  <y>(Y/Y)</y>");
      state = "apnPrompt";
      apnWidget = { label: "APN-5304  COMPLETE", prog: 5, max: 5 };
    }
  });
}

function updateLayout() {
  FONT_SIZE = constrain(floor(windowWidth / 72), 12, 20);
  LINE_HEIGHT = floor(FONT_SIZE * 1.38);
  MARGIN_X = floor(windowWidth * 0.03);
  MARGIN_TOP = floor(windowHeight * 0.07);
  MARGIN_BOTTOM = floor(windowHeight * 0.14);
  textSize(FONT_SIZE);
  let usableHeight = windowHeight - MARGIN_TOP - MARGIN_BOTTOM;
  visibleLines = floor(usableHeight / LINE_HEIGHT);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateLayout();
}

function draw() {
  background(0);

  if (tvOff) {
    let t = millis() - tvOffStart;
    if (t < 120) {
      fill(255, 255, 220, map(t, 0, 120, 180, 0));
      noStroke();
      rect(0, 0, width, height);
    } else if (t < 800) {
      let barH = map(t, 120, 800, height * 0.08, 1);
      fill(200, 220, 180, map(t, 120, 800, 200, 0));
      noStroke();
      rect(0, height / 2 - barH / 2, width, barH);
    }
    return;
  }

  if (state == "title") {
    drawTitleScreen();
    drawCRTOverlay();
    blinkCursor();
    return;
  }

  if (state == "sliding" || state == "loginScreen") {
    drawLoginScreen();
    drawCRTOverlay();
    blinkCursor();
    return;
  }

  processPrinting();
  drawStatusBar();
  drawTerminal();
  drawInputLine();

  if (apnWidget) drawAPNWidget();

  drawCRTOverlay();

  if (flickering) {
    let elapsed = millis() - flickerStart;
    if (elapsed < flickerDuration) {
      let alpha = map(elapsed, 0, flickerDuration, 35, 0);
      fill(180, 40, 20, alpha);
      noStroke();
      rect(0, 0, width, height);
    } else {
      flickering = false;
    }
  }

  if (apnActive) tickAPN();

  if (fadingOut && !tvOff) {
    let elapsed = millis() - fadeStart;
    fadeAlpha = constrain(map(elapsed, 0, fadeDuration, 0, 255), 0, 255);

    fill(0, 0, 0, fadeAlpha);
    noStroke();
    rect(0, 0, width, height);

    if (elapsed > fadeDuration * 0.6 && !terminatedMsg) {
      terminatedMsg = true;
    }

    if (terminatedMsg) {
      drawTerminatedScreen(map(elapsed, fadeDuration * 0.6, fadeDuration, 0, 255));
    }

    if (waitingForShutdown) {
      drawTerminatedScreen(255);
    }

    if (elapsed >= fadeDuration && !waitingForShutdown && !tvOff) {
      waitingForShutdown = true;
    }
  }

  blinkCursor();
}

function drawStatusBar() {
  let barH = floor(windowHeight * 0.045);
  fill(18, 24, 18);
  noStroke();
  rect(0, 0, width, barH);
  stroke(COLORS.dim[0], COLORS.dim[1], COLORS.dim[2], 80);
  strokeWeight(1);
  line(0, barH, width, barH);
  noStroke();

  textSize(floor(FONT_SIZE * 0.78));
  let ty = barH * 0.68;

  fill(COLORS.dim[0], COLORS.dim[1], COLORS.dim[2]);
  text("WRK-17776 @ CORP-EAST-04", MARGIN_X, ty);

  let stateLabel = {
    login: "IDLE",
    working: "● ACTIVE",
    endConfirm1: "! PENDING",
    endConfirm2: "! PENDING",
    done: "■ TERMINATED",
    apnPrompt: "● ACTIVE",
    apnRunning: "● APN ACTIVE",
  }[state] || "IDLE";

  let stateColor = {
    login: COLORS.dim,
    working: COLORS.g,
    endConfirm1: COLORS.y,
    endConfirm2: COLORS.y,
    done: COLORS.r,
    apnPrompt: COLORS.y,
    apnRunning: COLORS.y,
  }[state] || COLORS.dim;

  fill(stateColor[0], stateColor[1], stateColor[2]);
  let lw = textWidth(stateLabel);
  text(stateLabel, width / 2 - lw / 2, ty);

  fill(COLORS.dim[0], COLORS.dim[1], COLORS.dim[2]);
  let t = new Date();
  let ts = nf(t.getHours(), 2) + ":" + nf(t.getMinutes(), 2) + ":" + nf(t.getSeconds(), 2);
  text(ts, width - MARGIN_X - textWidth(ts), ty);

  textSize(FONT_SIZE);
}

function drawTerminal() {
  noStroke();
  let sliced = history.slice(-visibleLines);
  for (let i = 0; i < sliced.length; i++) {
    let obj = sliced[i];
    let y = MARGIN_TOP + i * LINE_HEIGHT;
    let x = MARGIN_X;
    for (let s = 0; s < obj.segments.length; s++) {
      let seg = obj.segments[s];
      let jitter = noiseOffsets[(i * 80 + s) % noiseOffsets.length];
      fill(seg.color[0], seg.color[1], seg.color[2]);
      text(seg.char, x, y + jitter);
      x += textWidth(seg.char);
    }
  }
}

function drawInputLine() {
  let y = height - floor(MARGIN_BOTTOM * 0.55);
  stroke(COLORS.dim[0], COLORS.dim[1], COLORS.dim[2], 60);
  strokeWeight(1);
  line(MARGIN_X, y - LINE_HEIGHT * 0.6, width - MARGIN_X, y - LINE_HEIGHT * 0.6);
  noStroke();
  fill(COLORS.g[0], COLORS.g[1], COLORS.g[2]);
  let prompt = "> " + inputBuffer;
  text(prompt, MARGIN_X, y);
  if (cursorBlink) {
    let cx = MARGIN_X + textWidth(prompt);
    fill(COLORS.g[0], COLORS.g[1], COLORS.g[2], 200);
    rect(cx, y - FONT_SIZE * 0.85, textWidth("M"), FONT_SIZE);
  }
}

function drawAPNWidget() {
  if (!apnWidget) return;
  let wW = floor(width * 0.28);
  let wH = floor(FONT_SIZE * 3.6);
  let wX = width - wW - MARGIN_X;
  let statusBarH = floor(windowHeight * 0.045);
  let wY = statusBarH + 6;

  fill(12, 18, 12);
  stroke(COLORS.dim[0], COLORS.dim[1], COLORS.dim[2], 60);
  strokeWeight(1);
  rect(wX, wY, wW, wH);
  noStroke();

  textSize(floor(FONT_SIZE * 0.72));
  fill(COLORS.y[0], COLORS.y[1], COLORS.y[2]);
  text(apnWidget.label, wX + 6, wY + FONT_SIZE * 0.95);

  let tX = wX + 6;
  let tW = wW - 12;
  let tH = 4;
  let tY = wY + FONT_SIZE * 1.6;
  fill(20, 28, 20);
  stroke(COLORS.dim[0], COLORS.dim[1], COLORS.dim[2], 40);
  strokeWeight(1);
  rect(tX, tY, tW, tH);
  noStroke();
  let pFill = map(apnWidget.prog, 0, apnWidget.max, 0, tW);
  fill(COLORS.y[0], COLORS.y[1], COLORS.y[2]);
  if (pFill > 0) rect(tX, tY, pFill, tH);

  let pct = floor((apnWidget.prog / apnWidget.max) * 100);
  fill(COLORS.dim[0], COLORS.dim[1], COLORS.dim[2]);
  text(pct + "%", tX, wY + FONT_SIZE * 2.8);

  textSize(FONT_SIZE);
}

function drawCRTOverlay() {
  stroke(0, 0, 0, 28);
  strokeWeight(1);
  for (let y = 0; y < height; y += 3) {
    line(0, y, width, y);
  }
  noStroke();
  let g = drawingContext.createRadialGradient(
    width / 2, height / 2, height * 0.25,
    width / 2, height / 2, height * 0.85
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.55)");
  drawingContext.fillStyle = g;
  drawingContext.fillRect(0, 0, width, height);
  fill(0, 255, 80, 4);
  rect(0, 0, width, height);
}

function drawTerminatedScreen(alpha) {
  if (alpha <= 0) return;
  let a = constrain(alpha, 0, 255);

  let lines = [
    "NOTICE",
    "",
    "We regret to inform you that the position",
    "Human Processing Unit",
    "has been phased out by the Company",
    "as we continue to move into a new",
    "technological landscape.",
    "",
    "We wish you the best in your",
    "future endeavors.",
    "",
    "Your account has been terminated.",
  ];

  let bigFont = constrain(floor(windowWidth / 42), 14, 28);
  textSize(bigFont);
  let lineH = bigFont * 1.5;
  let totalH = lines.length * lineH;
  let startY = height / 2 - totalH / 2;

  for (let i = 0; i < lines.length; i++) {
    let ln = lines[i];
    if (!ln) continue;
    let lw = textWidth(ln);
    let col;
    if (i == 0) col = [210, 190, 100, a];
    else if (i == 3) col = [210, 190, 100, a];
    else if (i == lines.length - 1) col = [100, 115, 90, a];
    else col = [200, 220, 180, a];
    fill(col[0], col[1], col[2], col[3]);
    noStroke();
    text(ln, width / 2 - lw / 2, startY + i * lineH);
  }

  let smallFont = constrain(floor(windowWidth / 90), 10, 14);
  textSize(smallFont);
  let msg = "press any key";
  let lw = textWidth(msg);
  fill(100, 115, 90, 255);
  noStroke();
  text(msg, width / 2 - lw / 2, height - smallFont * 2.5);
  textSize(FONT_SIZE);
}

function blinkCursor() {
  if (millis() - lastBlink > 530) {
    cursorBlink = !cursorBlink;
    lastBlink = millis();
  }
}

function addHistory(text) {
  printQueue.push(text);
}

function processPrinting() {
  if (millis() - lastPrintTime < textSpeed) return;

  if (
    (history.length == 0 || history[history.length - 1].typing == false) &&
    printQueue.length > 0
  ) {
    history.push({
      segments: [],
      typing: true,
      full: printQueue.shift(),
    });
  }

  let lineObj = history[history.length - 1];
  if (lineObj && lineObj.typing) {
    if (lineObj.full.length > 0) {
      if (lineObj.full.startsWith("<")) {
        let tagEnd = lineObj.full.indexOf(">");
        let tag = lineObj.full.slice(1, tagEnd);
        if (tag.startsWith("/")) {
          currentColor = COLORS.g;
        } else {
          currentColor = COLORS[tag] || COLORS.g;
        }
        lineObj.full = lineObj.full.slice(tagEnd + 1);
      } else {
        lineObj.segments.push({
          char: lineObj.full[0],
          color: [currentColor[0], currentColor[1], currentColor[2]],
        });
        lineObj.full = lineObj.full.slice(1);
        lastPrintTime = millis();
        playKeyClick();
      }
      lastPrintTime = millis();
    } else {
      lineObj.typing = false;
    }
  }
}

function keyTyped() {
  initAudio();
  if (waitingForShutdown) {
    waitingForShutdown = false;
    tvOff = true;
    tvOffStart = millis();
    stopCRTHum();
    sndTvOff.play();
    return;
  }
  if (state == "title") {
    state = "sliding";
    slideStart = millis();
    return;
  }
  if (state == "loginScreen") {
    if (key.length == 1 && keyCode !== ENTER && keyCode !== BACKSPACE) {
      loginPasswordBuffer += key;
    }
    return;
  }
  if (state == "sliding") return;
  if (apnActive) return;
  if (fadingOut) return;
  if (printQueue.length > 0) return;
  if (keyCode == ENTER) {
    handleCommand(inputBuffer.trim());
    inputBuffer = "";
  } else {
    inputBuffer += key;
  }
}

function keyPressed() {
  initAudio();
  if (waitingForShutdown) {
    waitingForShutdown = false;
    tvOff = true;
    tvOffStart = millis();
    stopCRTHum();
    return;
  }
  if (state == "title") {
    state = "sliding";
    slideStart = millis();
    return;
  }
  if (state == "sliding") return;
  if (state == "loginScreen") {
    if (keyCode == ENTER) {
      if (loginPasswordBuffer == "$ecure") {
        loginError = "";
        state = "login";
      } else {
        loginError = "ACCESS DENIED. Check credentials and try again.";
        loginPasswordBuffer = "";
        flickering = true;
        flickerStart = millis();
      }
    } else if (keyCode == BACKSPACE) {
      loginPasswordBuffer = loginPasswordBuffer.slice(0, -1);
    }
    return;
  }
  if (apnActive) return;
  if (fadingOut) return;
  if (printQueue.length > 0) return;
  if (keyCode == ENTER) {
    handleCommand(inputBuffer.trim());
    inputBuffer = "";
  } else if (keyCode == BACKSPACE) {
    inputBuffer = inputBuffer.slice(0, -1);
  }
}

function handleCommand(cmd) {
  addHistory("> " + cmd);

  if (state == "login") {
    if (cmd.toLowerCase() == "clock in") {
      startWork();
    } else {
      addHistory("<dim>Unknown command. Type 'clock in'.</dim>");
    }

  } else if (state == "working") {
    if (cmd.toLowerCase() == "clock out") {
      endWork1();
      return;
    }
    if (!currentProblem) return;
    if (!checkAnswer(cmd)) {
      flickering = true;
      flickerStart = millis();
      addHistory("<r>INCORRECT.</r> Try again.");
    } else {
      if (currentProblem.type == "transcribe") {
        addHistory("<dim>Access code validated.</dim>");
      }
      else {
        addHistory("<dim>Correct.</dim>");
      }
      operationCount++;
      tickMilestones();
      if (state == "working") nextProblem();
    }

  } else if (state == "apnPrompt") {
    if (cmd.toLowerCase() == "y") activateAPN();
    else addHistory("<dim>Invalid input. Enter Y or Y.</dim>");

  } else if (state == "endConfirm1") {
    if (cmd.toLowerCase() == "y") endWork2();
    else if (cmd.toLowerCase() == "n") returnToWork();
    else addHistory("<dim>Invalid input. Enter Y or N.</dim>");

  } else if (state == "endConfirm2") {
    if (cmd.toLowerCase() == "y") endWork3();
    else if (cmd.toLowerCase() == "n") returnToWork();
    else addHistory("<dim>Invalid input. Enter Y or N.</dim>");

  } else if (state == "done") {
    if (cmd.toLowerCase() == "off") waitingForShutdown = true;
    else {
      addHistory("");
      addHistory("<dim>Please remain where you are.</dim>");
      addHistory("<dim>Security personnel have been dispatched to your location.</dim>");
      addHistory("<dim>To permanently power off your device, type \"off\"</dim>");
    }
  }
}

function tickMilestones() {
  if (apnWidget) {
    apnWidget.prog = min(apnWidget.prog + 1, apnWidget.max);
  }

  for (let m of milestones) {
    if (!m.triggered && operationCount >= m.at) {
      m.triggered = true;
      m.fn();
    }
  }
}

function activateAPN() {
  state = "apnRunning";
  apnActive = true;
  apnSolveDelay = 2400;
  apnLastSolve = millis();
  apnInputDisplay = "";
  addHistory("");
  addHistory("<y>Artificial Processing Node 5304 online.</y>");
  addHistory("<dim>Transferring operational control...</dim>");
  addHistory("");
  nextProblem();
}

function tickAPN() {
  if (!currentProblem) return;
  if (printQueue.length > 0) return;

  let p = currentProblem;
  let apnAnswer;
  if (p.answer == null) {
    apnAnswer = random() < 0.5 ? "APPROVE" : "DENY";
  } else {
    apnAnswer = p.answer;
  }

  addHistory("<y>> " + apnAnswer + "</y>");
  addHistory("<dim>Correct.</dim>");
  operationCount++;

  textSpeed *= 0.75;

  if (operationCount >= 35) {
    triggerEnding();
    return;
  }

  nextProblem();
}

function triggerEnding() {
  apnActive = false;
  fadingOut = true;
  fadeStart = millis();
}

function startWork() {
  shiftStartTime = millis();
  state = "working";
  operationCount = 0;
  addHistory("");
  addHistory("Welcome, Human Processing Unit #23821.");
  addHistory("Shift duration: <y>9.0 hours</y>.");
  addHistory("Task assigned: <y>Automated verification queue</y>.");
  addHistory("Complete each task to advance progress.");
  addHistory("Type 'clock out' at any time.");
  addHistory("");
  nextProblem();
}

function endWork1() {
  state = "endConfirm1";
  addHistory("");
  addHistory("<y>WARNING</y>: You have only worked " +
    ((millis() - shiftStartTime) / 3600000).toFixed(2) +
    " hours of your allocated 9.0.");
  addHistory("Early departure will incur a <r>$200.00 fine</r>.");
  addHistory("This amount will be deducted from your next paycheck.");
  addHistory("");
  addHistory("Do you wish to continue? (Y/N)");
}

function endWork2() {
  state = "endConfirm2";
  addHistory("");
  addHistory("<y>WARNING</y>: Employment classification: <y>Intern</y>.");
  addHistory("Weekly compensation: <y>$30.00</y>.");
  addHistory("Current account balance: <y>$0.00</y>.");
  addHistory("Projected balance after fine: <r>-$170.00</r>.");
  addHistory("");
  addHistory("Do you still wish to clock out? (Y/N)");
}

function endWork3() {
  state = "done";
  addHistory("");
  addHistory("<r>ERROR</r>: Insufficient funds. Withdrawal failed.");
  addHistory("Non-reimbursement of Company fines violates Employee Handbook §118.");
  addHistory("");
  addHistory("Your account has been terminated.");
  addHistory("");
  addHistory("<dim>Please remain where you are.</dim>");
  addHistory("<dim>Security personnel have been dispatched to your location.</dim>");
}

function returnToWork() {
  state = "working";
  addHistory("");
  addHistory("Understood.");
  addHistory("");
  if (currentProblem) {
    // Re-display current task prompt
    let lines = currentProblem.prompt.split("\n");
    for (let l of lines) addHistory(l);
  }
}

function nextProblem() {
  let type = pickTaskType();
  let task;
  if (type == "transcribe") task = makeTranscribeTask();
  else if (type == "image") task = makeImageTask();
  else task = makeTransactionTask();

  currentProblem = task;
  addHistory("");
  let lines = task.prompt.split("\n");
  for (let l of lines) addHistory(l);
}

//notes:
//keyboard clack kinda sounds bad
//you were fired in {stat}?
//pacing!
//put this thing on github pages