/*
Class name: Prototyping with Code
Name: Austin Jackson
Email: jackson.au@northeastern.edu
Assignment[5]
"What If Pixels Were Slightly Worse"

Note: This code is quite slow. While I did make sure it works in fullscreen and at different resolutions, I *highly* recommend running it at 400x400, especially because it seems people have an easier time reading the text at lower sizes in general.
*/
let i_respect_the_artistic_vision = false;
//change this to true to run at 400x400

let ballCount = 500;
let balls = [];
let squares = [];
let font;
let points = [];
let maxVelocity;

let dateColor;
let ballColor;
let timeColor;
let sqColor;

let maxDist;

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let today;
let lastMinute = -1;

function setup() {
  if (i_respect_the_artistic_vision) {
    createCanvas(400, 400);
  }
  else {
    createCanvas(windowWidth, windowHeight);
  }
  maxVelocity = min(width, height) / 80;
  maxDist = min(width, height) / 50;
  let ballXVel = random(-1 * maxVelocity, maxVelocity);
  let ballYVel = random(-1 * maxVelocity, maxVelocity);
  let sqXVel = random(-1 * maxVelocity, maxVelocity);
  let sqYVel = random(-1 * maxVelocity, maxVelocity);
  for (let count = 0; count < ballCount; count++) {
    //balls.push({x:random(width), y:random(height), xVel:random(-1*maxVelocity, maxVelocity), yVel:random(-1*maxVelocity, maxVelocity)});
    //squares.push({x:random(width), y:random(height), xVel:random(-1*maxVelocity, maxVelocity), yVel:random(-1*maxVelocity, maxVelocity)});
    balls.push({ x: random(width / 2), y: random(height / 2), xVel: maxVelocity, yVel: -1 * maxVelocity });
    squares.push({ x: random(width / 2), y: random(height / 2, height), xVel: -1 * maxVelocity, yVel: -1 * maxVelocity });
    balls.push({ x: random(width / 2, width), y: random(height / 2, height), xVel: -1 * maxVelocity, yVel: maxVelocity });
    squares.push({ x: random(width / 2, width), y: random(height / 2), xVel: maxVelocity, yVel: maxVelocity });
  }
  font = loadFont("Inconsolata.otf");
  textFont(font);
  textAlign(CENTER, CENTER);
  //noStroke();
  ballColor = color(90, 180, 255);
  sqColor = color(255, 140, 180);
  dateColor = color(255, 210, 140);
  timeColor = color(140, 255, 220);
  today = WEEKDAYS[new Date().getDay()];
}


function getDistFromText(t, x, y) {
  let minDist = maxDist ** 2;
  let checkRad = maxDist * 2;
  for (let p of t) {
    if (abs(y - p.y) > checkRad || abs(x - p.x) > checkRad) {
      continue;
    }
    d = (x - p.x) ** 2 + (y - p.y) ** 2;
    if (d < minDist) {
      minDist = d;
    }
  }
  return Math.sqrt(minDist);
}

function updateShape(pointArray, shapeColor, textColor, shape) {
  let c = getDistFromText(pointArray, shape.x, shape.y);
  c = constrain(c / maxDist, 0, 1);
  c = (1 - c * c);
  //let d = getDistFromText(points, ball.x, ball.y);
  //d = constrain(d/maxDist, 0, 1);
  //let alph = 255 * (1 - d * d);
  fill(map(c, 0, 1, red(textColor), red(shapeColor)), map(c, 0, 1, green(textColor), green(shapeColor)), map(c, 0, 1, blue(textColor), blue(shapeColor)), 255);
  shape.x += shape.xVel;
  shape.y += shape.yVel;
  if (shape.x > width || shape.x < 0) {
    shape.xVel *= -1;
  }
  if (shape.y > height || shape.y < 0) {
    shape.yVel *= -1;
  }
}

function fixSize(input, w, h) {
  let size = 999;
  let increment = 1;
  while (size > 1) {
    let bounds = font.textBounds(input, 0, 0, size);
    if (bounds.h <= h && bounds.w <= w) {
      if (increment == 1) {
        increment = 0.1;
      }
      else if (increment == 0.1) {
        increment = 0.01;
      } else {
        break;
      }
    }
    size -= increment;
    textSize(size);
  }
  textSize(size);
  return size;
}

function getTime() {
  let h = hour();
  let m = minute();

  h = h % 12;
  if (h == 0) {
    h = 12;
  }
  return nf(h, 2) + ":" + nf(m, 2);
}

let counter = 1;
let date = [];
function draw() {
  background(10, 12, 18);
  //text("test", width/2, height/2);
  if (counter > 100 && minute() != lastMinute) {
    lastMinute = minute();
    time = getTime();
    let timeSize = fixSize(time, width * 0.875, height / 4);
    points = font.textToPoints(time, width / 2, height / 4, textSize(), { sampleFactor: 0.1 });
    let dateSize = fixSize(today, width * 0.875, height / 4);
    date = font.textToPoints(today, width / 2, 3 * height / 4, textSize(), { sampleFactor: 0.1 });
    // date = date.concat(points);
    // points = points.concat(date);
  }
  for (let ball of balls) {
    updateShape(date, ballColor, dateColor, ball);
    circle(ball.x, ball.y, min(width, height) / 40);
  }
  for (let s of squares) {
    updateShape(points, sqColor, timeColor, s);
    circle(s.x, s.y, min(width, height) / 40); //yeah i know they aren't squares, but squares looked bad
  }
  counter++;
}