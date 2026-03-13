/*
Class name: Prototyping with Code
Name: Austin Jackson
Email: jackson.au@northeastern.edu
Assignment[6]
"Etch-A-Sketch"

How to interact (computer):
Use the arrow keys to move the stylus up/down, or click on the arrows in the sketch to do the same.
To change the stroke weight, use the number keys.
To erase, press and hold backspace to simulate shaking.
To save, press "S".

How to interact (phone):
Touch the arrows in the sketch to move the knobs.
To erase, shake your phone!

Please do try to load this on your phone if possible, it took quite a while to get that working nice.
*/


keyboard = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
nums = "123456789"
let c;
let s = 1;
let lastCoords = []
let lines = []
let leftAngle;
let rightAngle;
let leftCenter;
let rightCenter;
let upCenter;
let downCenter;
let sensitivity = 1;
let rotSensitivity = 0.1;
let stylus = [];
let font;
//use accelerometer for erasing

function preload() {
  font = loadFont('OhioPlayer.ttf');
}

function setup() {
  c = color(0, 0, 0, 255);
  createCanvas(windowWidth, windowHeight);
  background(255);
  leftAngle = rightAngle = 3 * HALF_PI;
  leftCenter = [width / 18, 7 * height / 8];
  rightCenter = [5 * width / 18, 7 * height / 8];
  upCenter = [17 * width / 18, 7 * height / 8];
  downCenter = [13 * width / 18, 7 * height / 8];
  stylus = [width / 2, height / 2];
  background(color(255, 10, 0, 255));
  fill(255, 255, 255, 255);
  rect(width / 12, height / 8, 5 * width / 6, 5 * height / 8);
  textAlign(CENTER, BOTTOM);
  fill(0, 0, 0, 255);
  textSize(3 * min(width, height) / 32);
  textFont(font);
  text("Etch A Sketch!", width / 2, height / 8);

  //generated with Chat to stop selection of canvas on iOS
  let canvas = document.querySelector("canvas");
  canvas.style.webkitUserSelect = "none";
  canvas.style.webkitTouchCallout = "none";
  canvas.style.touchAction = "none";
}

function draw() {
  let xOff = 0;
  let yOff = 0;
  if (getDown().includes("LEFT")) {
    xOff--;
  }
  if (getDown().includes("RIGHT")) {
    xOff++;
  }
  if (getDown().includes("UP")) {
    yOff--;
  }
  if (getDown().includes("DOWN")) {
    yOff++;
  }
  stylus[0] += xOff;
  stylus[1] += yOff;
  leftAngle += xOff * rotSensitivity;
  rightAngle -= yOff * rotSensitivity;
  //make sure the stylus doesn't go out of bounds
  stylus[0] = constrain(stylus[0], width / 12 + s / 2, 11 * width / 12 - s / 2);
  stylus[1] = constrain(stylus[1], height / 8 + s / 2, 6 * height / 8 - s / 2);
  strokeWeight(s);
  stroke(c);
  line(stylus[0] - xOff, stylus[1] - yOff, stylus[0], stylus[1]);

  //draw rotation knobs
  strokeWeight(1);
  stroke(0);
  fill(255, 255, 255, 255);
  circle(width / 6, 7 * height / 8, min(width, height) / 8);
  line(width / 6, 7 * height / 8, width / 6 + Math.cos(leftAngle) * min(width, height) / 16, 7 * height / 8 + Math.sin(leftAngle) * min(width, height) / 16);
  circle(5 * width / 6, 7 * height / 8, min(width, height) / 8);
  line(5 * width / 6, 7 * height / 8, 5 * width / 6 + Math.cos(rightAngle) * min(width, height) / 16, 7 * height / 8 + Math.sin(rightAngle) * min(width, height) / 16);

  //draw interaction arrows
  line(leftCenter[0], leftCenter[1], leftCenter[0] + width / 30, leftCenter[1] - height / 30);
  line(leftCenter[0], leftCenter[1], leftCenter[0] + width / 30, leftCenter[1] + height / 30);
  line(rightCenter[0], rightCenter[1], rightCenter[0] - width / 30, rightCenter[1] - height / 30);
  line(rightCenter[0], rightCenter[1], rightCenter[0] - width / 30, rightCenter[1] + height / 30);
  line(upCenter[0], upCenter[1], upCenter[0] - width / 30, upCenter[1] - height / 30);
  line(upCenter[0], upCenter[1], upCenter[0] - width / 30, upCenter[1] + height / 30);
  line(downCenter[0], downCenter[1], downCenter[0] + width / 30, downCenter[1] - height / 30);
  line(downCenter[0], downCenter[1], downCenter[0] + width / 30, downCenter[1] + height / 30);

  //clear board if shaken or backspace
  let shakeIntensity = accelerationX + accelerationY + accelerationZ;
  if (keyIsDown(BACKSPACE) || shakeIntensity > 20) {
    if (keyIsDown(BACKSPACE)) {
      shakeIntensity = 20;
    }
    for (let i = 0; i < shakeIntensity * 0.4; i++) {
      fill(255, 255, 255, random(40, 120));
      noStroke();
      rect(
        random(width / 12, 10 * width / 12),
        random(height / 8, 5 * height / 8),
        random(width / 24, width / 12),
        random(height / 16, height / 8)
      );
    }
  }

  c = getGradientColor(frameCount * 0.02);
}

function getGradientColor(t) {
  let r = map(sin(t), -1, 1, 0, 255);
  let g = map(sin(t + TWO_PI / 3), -1, 1, 0, 255);
  let b = map(sin(t + 2 * TWO_PI / 3), -1, 1, 0, 255);

  return color(r, g, b);
}

function keyPressed() {
  if (nums.includes(key)) {
    s = nums.indexOf(key) + 1;
  }

  if (key == 'S' || key == 's') {
    let x = width / 12;
    let y = height / 8;
    let w = 10 * width / 12;
    let h = 5 * height / 8;
    let g = createGraphics(w, h);
    g.copy(get(), x, y, w, h, 0, 0, w, h);
    save(g, "etch_a_sketch_drawing.png");
  }

}

function getDown() {
  let toReturn = []
  if (keyIsDown(LEFT_ARROW) || touchingArrow(leftCenter[0], leftCenter[1])) {
    toReturn.push("LEFT");
  }
  if (keyIsDown(RIGHT_ARROW) || touchingArrow(rightCenter[0], rightCenter[1])) {
    toReturn.push("RIGHT");
  }
  if (keyIsDown(UP_ARROW) || touchingArrow(upCenter[0], upCenter[1])) {
    toReturn.push("UP");
  }
  if (keyIsDown(DOWN_ARROW) || touchingArrow(downCenter[0], downCenter[1])) {
    toReturn.push("DOWN");
  }
  return toReturn;
}

function touchingArrow(x, y) {
  if (abs(mouseX - x) < width / 30 && abs(mouseY - y) < height / 30) {
    if (mouseIsPressed) {
      return true; //only return if we're clicking
    }
  }
  for (let touch of touches) { //support touchscreen
    if (abs(touch.x - x) < width / 30 && abs(touch.y - y) < height / 30) {
      return true;
    }
  }
  return false;
}

//used ChatGPT for this - basic cut+paste solution for actually getting iOS to give you accelerometer data. Took forever to figure out.
motionEnabled = false;
function touchStarted() {
  if (!motionEnabled &&
    typeof DeviceMotionEvent !== 'undefined' &&
    typeof DeviceMotionEvent.requestPermission === 'function') {

    DeviceMotionEvent.requestPermission()
      .then(response => {
        if (response === 'granted') {
          motionEnabled = true;
          console.log("Motion granted");
        }
      })
      .catch(console.error);

  }
}
