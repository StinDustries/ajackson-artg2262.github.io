/*
Class name: Prototyping with Code
Name: Austin Jackson
Email: jackson.au@northeastern.edu
Assignment[4]
"A Very Small Amount of Color"

Note: The assignment details stated that we should feature >=3 non-gray colors. Technically, that gradient is a very large amount of different colors.
*/

function setup() {
  createCanvas(1024, 1024);
  noLoop();
  rectMode(CENTER);
}

function colliding(circles, myCirc) {
  let minBufferPx = 10; // modify to space out circles a little
  for (let circ of circles) {
    if (circ == myCirc) {
      continue;
    }
    let d = Math.sqrt((circ[0] - myCirc[0]) ** 2 + (circ[1] - myCirc[1]) ** 2);
    if (circ[2] + myCirc[2] + minBufferPx >= 2 * d) {
      return true;
    }
  }
  return false;
}

function drawSpiral(x, y, maxRadius, rotations = 3, segments = 200) {
  let angleStep = (2 * PI * rotations) / segments;
  let radiusStep = maxRadius / segments;
  let angleSeed = random(2 * PI * 100) / 100;
  let direction = random([1, -1]);

  for (let i = 0; i < segments; i++) {
    let angle = direction * (i * angleStep + angleSeed);
    let radius = i * radiusStep;

    let x1 = x + cos(angle) * radius;
    let y1 = y + sin(angle) * radius;

    let progress = i / segments;
    stroke(255, 255, 255, map(progress, 0, 1, 200, 50));
    strokeWeight(map(progress, 0, 1, maxRadius / 20, 0.5));
    square(x1, y1, 1);
  }
}

function drawVoronoiOutlines(graphics) {
  // generate 60 random seed points
  let points = [];
  for (let i = 0; i < 60; i++) {
    points.push([random(width), random(height)]);
  }

  graphics.stroke(255, 255, 255, 150);
  graphics.strokeWeight(1.5);
  graphics.noFill();

  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) {
      let minDist = width * height;
      let secondMinDist = width * height;

      // find two closest points
      for (let p of points) {
        let d = dist(x, y, p[0], p[1]);
        if (d < minDist) {
          secondMinDist = minDist;
          minDist = d;
        } else if (d < secondMinDist) {
          secondMinDist = d;
        }
      }

      // if pixel near boundary, draw point
      if (abs(minDist - secondMinDist) < 2) {
        graphics.point(x, y);
      }
    }
  }
}

function getGoodCoords(circles) {
  while (true) {
    let circ = [int(random(width)), int(random(height)), 10];
    if (!colliding(circles, circ)) {
      return circ;
    }
  }
}

function draw() {
  background(220);

  // radial gradient
  // not that it ended up mattering
  let centerX = width / 2;
  let centerY = height / 2;
  let maxRadius = Math.sqrt(width * width / 4 + height * height / 4);
  //console.log(maxRadius);
  for (let x = 0; x <= width; x++) {
    for (let y = 0; y <= height; y++) {
      let radius = Math.sqrt((x - centerX) * (x - centerX) + (y - centerY) * (y - centerY));
      stroke(255 * x / width, 255 * y / height, 255 * radius / maxRadius);
      point(x, y);
    }
  }

  // for(let x = 0; x <= width; x+=10) {
  //   for(let y = 0; y <= height; y+=10) {
  //     let radius = Math.sqrt((x-centerX)*(x-centerX) + (y-centerY)*(y-centerY));
  //     fill(color(255*x/width, 255*y/height, 255*radius/maxRadius, 255*radius/maxRadius));
  //     square(x, y, 2);
  //   }
  // }

  let g = createGraphics(width, height);
  let circleCount = 20;
  g.background(0);
  g.noFill(); // originally a mistake but looks cool
  g.erase();
  circles = [];
  circles.push([int(random(width)), int(random(height)), Math.min(width, height) / 10]);
  for (let x = 0; x < circleCount; x++) {
    let circ = getGoodCoords(circles);
    while (!colliding(circles, circ) && circ[2] <= Math.min(width, height) / 2) {
      circ[2] += 1;
    }
    circles.push(circ);
  }
  for (let circ of circles) {
    g.circle(circ[0], circ[1], circ[2]);
  }
  // was gonna find a point nemo but honestly i think this looks fine

  image(g, 0, 0, width, height);

  drawVoronoiOutlines(this);

  for (let circ of circles) {
    let rotations = map(circ[2], 10, Math.min(width, height) / 2, 2, 5);
    let segments = int(map(circ[2], 10, Math.min(width, height) / 2, 100, 300));
    drawSpiral(circ[0], circ[1], circ[2] / 2 - 10, rotations);
  }


}


function keyPressed() {
  if (key == 'S' || key == 's') {
    saveCanvas("assignment[4]_pattern_jackson_austin");
  }
}
