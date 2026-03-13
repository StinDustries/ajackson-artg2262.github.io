/*
Name: Austin Jackson
Email: jackson.au@northeastern.edu
Course Name: Prototyping with Code
Lab Section: 3
Assignment #3
"anonymous"

Note: I don't like depictions of myself, abstract or otherwise, so I chose to make my Discord profile picture. There are enough people who associate this image with me that it may as well be a self-portrait.
*/

let pg;

function setup() {
  createCanvas(400, 400);
  pg = createGraphics(400, 400);
  noLoop();
}

function fadeQuad(x1, y1, x2, y2, x3, y3, x4, y4, c, pg) {
  let steps = 120;
  for (let i = 0; i < steps; i++) {
    let t1 = i / steps;
    let t2 = (i + 1) / steps;
    //top left of slice
    let lx1 = lerp(x1, x4, t1);
    let ly1 = lerp(y1, y4, t1);
    //bottom left of slice
    let lx2 = lerp(x1, x4, t2);
    let ly2 = lerp(y1, y4, t2);
    //top right of slice
    let rx1 = lerp(x2, x3, t1);
    let ry1 = lerp(y2, y3, t1);
    //bottom right of slice
    let rx2 = lerp(x2, x3, t2);
    let ry2 = lerp(y2, y3, t2);

    // alpha fades downward
    let newAlph = lerp(alpha(c), 0, t1);
    pg.fill(red(c), green(c), blue(c), newAlph);
    pg.noStroke();
    pg.beginShape();
    pg.vertex(lx1, ly1);
    pg.vertex(rx1, ry1);
    pg.vertex(rx2, ry2);
    pg.vertex(lx2, ly2);
    pg.endShape(CLOSE);
  }
}

const head_width = 200;
const head_height = 180;
const eye_width_px = 75;
const eye_height_px = 90;
const eye_pupil_scale = 0.9;
const eye_hor_offset_px = 50;
const mouth_offset_y_px = 50;
const nose_width = 25;
const nose_height = 15;
const mouth_width = 75;
const mouth_height = 50;

function drawFace(graphics) {
  let skinColor = color(251, 238, 221);
  let myBlack = color(0, 0, 0);
  let myWhite = color(255, 255, 255);
  let noseColor = color(217, 166, 151);
  let offBlack = color(25, 25, 25);

  //body
  fadeQuad(200 - head_width / 6, 200 + head_height / 4, 200 + head_width / 6, 200 + head_height / 4, 250, 400, 150, 400, skinColor, graphics);

  //head and ears
  graphics.fill(skinColor);
  graphics.triangle(110, 75, 125, 200, 200, 125);
  graphics.triangle(width - 110, 75, width - 125, 200, width - 200, 125);
  graphics.ellipse(200, 200, head_width, head_height);

  //eyes
  graphics.fill(myWhite);
  graphics.ellipse(200 - eye_hor_offset_px, 200, eye_width_px, eye_height_px);
  graphics.ellipse(200 + eye_hor_offset_px, 200, eye_width_px, eye_height_px);
  graphics.fill(offBlack);
  graphics.ellipse(200 - eye_hor_offset_px - (eye_width_px * (1 - eye_pupil_scale)) / 2, 200, eye_width_px * eye_pupil_scale, eye_height_px * eye_pupil_scale);
  graphics.ellipse(200 + eye_hor_offset_px + (eye_width_px * (1 - eye_pupil_scale)) / 2, 200, eye_width_px * eye_pupil_scale, eye_height_px * eye_pupil_scale);
  graphics.fill(myWhite);
  graphics.circle(200 + eye_hor_offset_px, 200 - eye_height_px * 0.25, 15);
  graphics.circle(200 - eye_hor_offset_px * 1.25, 200 - eye_height_px * 0.25, 15);


  //mouth
  graphics.fill(myBlack);
  graphics.arc(200, 200 + mouth_offset_y_px + nose_height / 2, mouth_width, mouth_height * 0.9, 2 * PI, PI);
  graphics.fill(skinColor);
  graphics.stroke(myBlack);
  graphics.arc(200 - mouth_width / 4, 200 + mouth_offset_y_px + nose_height / 2, mouth_width / 2, mouth_width / 2, 0, PI);
  graphics.arc(200 + mouth_width / 4, 200 + mouth_offset_y_px + nose_height / 2, mouth_width / 2, mouth_width / 2, 0, PI);
  graphics.noStroke();
  graphics.arc(200, 200 + mouth_offset_y_px + nose_height + 18, 40, 15, PI + 0.3, 0 - 0.3);
  graphics.fill(noseColor);
  graphics.ellipse(200, 200 + mouth_offset_y_px, nose_width, nose_height);
}

function chromAberration(pg) {
  pg.loadPixels();
  let src = pg.pixels.slice();
  loadPixels();

  let amt = 10;
  let d = pixelDensity();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let j = 0; j < d; j++) {   //subpixel y
        for (let i = 0; i < d; i++) { //subpixel x
          let px = x * d + i;
          let py = y * d + j;

          let dx = px - width * d / 2;
          let dy = py - height * d / 2;
          let r = sqrt(dx * dx + dy * dy);
          let off = amt * r / (width * d);

          let rx = constrain(floor(px + off), 0, width * d - 1);
          let bx = constrain(floor(px - off), 0, width * d - 1);
          let ry = constrain(floor(py + off), 0, height * d - 1);
          let by = constrain(floor(py - off), 0, height * d - 1);

          let idx = 4 * (px + py * width * d);
          let rIdx = 4 * (rx + ry * width * d);
          let bIdx = 4 * (bx + by * width * d);

          pg.pixels[idx] = src[rIdx];
          pg.pixels[idx + 1] = src[idx + 1];
          pg.pixels[idx + 2] = src[bIdx + 2];
          pg.pixels[idx + 3] = src[idx + 3];
        }
      }
    }
  }
  pg.updatePixels();
}

function fisheye(pg) {
  pg.loadPixels();
  let src = pg.pixels.slice();
  loadPixels();

  let k = 0.025;
  let d = pixelDensity();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let j = 0; j < d; j++) {   //subpixel y
        for (let i = 0; i < d; i++) { //subpixel x
          let px = x * d + i;
          let py = y * d + j;

          let dx = px - width * d / 2;
          let dy = py - height * d / 2;
          let r = sqrt(dx * dx + dy * dy);
          let rDist = r + k * r ** 2;

          let xDist = floor(width * d / 2 + dx / r * rDist);
          let yDist = floor(height * d / 2 + dy / r * rDist);

          let idx = 4 * (px + py * width * d);
          let dIdx = 4 * (xDist + yDist * width * d);

          pg.pixels[idx] = src[dIdx];
          pg.pixels[idx + 1] = src[dIdx + 1];
          pg.pixels[idx + 2] = src[dIdx + 2];
          pg.pixels[idx + 3] = src[dIdx + 3];
        }
      }
    }
  }
  pg.updatePixels();
}

function draw() {
  background(220);
  pg.background(0);
  pg.noStroke();
  drawFace(pg);
  chromAberration(pg);
  fisheye(pg);
  let s = 5;
  image(pg, -width * (s - 1) / 2, -height * (s - 1) / 2, width * s, height * s);
  textAlign(RIGHT);
  textSize(14);
  textFont("Jazz LET");
  fill(color(255, 255, 255));
  text("anonymous", width - 5, height - 5);
}