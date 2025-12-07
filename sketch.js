let blackBall;
let whiteBall;
let attractorForce = 0.5;
let repulsionCount = 0;
const MAX_REPULSIONS = 10;
const BALL_RADIUS = 25; // Diameter 50
const SEPARATION_DISTANCE = 10;

let separated = false;
let outOfBoundsStartTime = 0;
const RESET_TIME = 5000; // 5 seconds

function setup() {
  createCanvas(800, 600);
  resetBalls();
}

function resetBalls() {
  blackBall = new Particle(random(width), random(height), 10, color(0));
  whiteBall = new Particle(random(width), random(height), 10, color(255));
  repulsionCount = 0;
  separated = false;
  outOfBoundsStartTime = 0;
}

function draw() {
  background(220);

  if (!separated) {
    let distance = p5.Vector.dist(blackBall.position, whiteBall.position);

    // Apply attraction
    let forceTowardsWhite = p5.Vector.sub(whiteBall.position, blackBall.position);
    forceTowardsWhite.normalize();
    forceTowardsWhite.mult(attractorForce);
    blackBall.applyForce(forceTowardsWhite);

    let forceTowardsBlack = p5.Vector.sub(blackBall.position, whiteBall.position);
    forceTowardsBlack.normalize();
    forceTowardsBlack.mult(attractorForce);
    whiteBall.applyForce(forceTowardsBlack);

    // Repulsion logic
    if (distance < SEPARATION_DISTANCE && random(1) < 0.5) {
      repulsionCount++;
      let repulsionForce = p5.Vector.sub(whiteBall.position, blackBall.position);
      repulsionForce.normalize();
      repulsionForce.mult(50); // Stronger repulsion
      blackBall.applyForce(repulsionForce.mult(-1));
      whiteBall.applyForce(repulsionForce);

      if (repulsionCount >= MAX_REPULSIONS) {
        separated = true;
        console.log("Balls separated!");
      }
    }

    blackBall.update();
    whiteBall.update();

    blackBall.bounceOffWalls(0, 0, width, height, BALL_RADIUS);
    whiteBall.bounceOffWalls(0, 0, width, height, BALL_RADIUS);

    // Draw line connecting them
    stroke(0);
    line(blackBall.position.x, blackBall.position.y, whiteBall.position.x, whiteBall.position.y);

  } else {
    // Weak attraction even when separated, but no repulsion
    let forceTowardsWhite = p5.Vector.sub(whiteBall.position, blackBall.position);
    forceTowardsWhite.normalize();
    forceTowardsWhite.mult(attractorForce * 0.1); // Weaker attraction
    blackBall.applyForce(forceTowardsWhite);

    let forceTowardsBlack = p5.Vector.sub(blackBall.position, whiteBall.position);
    forceTowardsBlack.normalize();
    forceTowardsBlack.mult(attractorForce * 0.1); // Weaker attraction
    whiteBall.applyForce(forceTowardsBlack);

    blackBall.update();
    whiteBall.update();
    // No bouncing off walls when separated

    // Check if balls are out of bounds
    let blackOutOfBounds = !isInsideCanvas(blackBall.position);
    let whiteOutOfBounds = !isInsideCanvas(whiteBall.position);

    if (blackOutOfBounds || whiteOutOfBounds) {
      if (outOfBoundsStartTime === 0) {
        outOfBoundsStartTime = millis();
      } else if (millis() - outOfBoundsStartTime > RESET_TIME) {
        console.log("Resetting balls after 5 seconds out of bounds.");
        resetBalls();
      }
    } else {
      outOfBoundsStartTime = 0; // Reset timer if balls come back in
    }
  }

  blackBall.display(BALL_RADIUS);
  whiteBall.display(BALL_RADIUS);

  // Display repulsion count
  fill(0);
  textSize(16);
  text("Repulsions: " + repulsionCount + " / " + MAX_REPULSIONS, 10, 20);
  text("Separated: " + separated, 10, 40);
  if (separated && outOfBoundsStartTime > 0) {
    let timeLeft = max(0, ceil((RESET_TIME - (millis() - outOfBoundsStartTime)) / 1000));
    text("Reset in: " + timeLeft + "s", 10, 60);
  }
}

function isInsideCanvas(pos) {
  return pos.x > -BALL_RADIUS && pos.x < width + BALL_RADIUS &&
         pos.y > -BALL_RADIUS && pos.y < height + BALL_RADIUS;
}


class Particle {
  constructor(x, y, m, c) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D();
    this.velocity.mult(random(0.5, 2));
    this.acceleration = createVector(0, 0);
    this.mass = m;
    this.col = c;
  }

  applyForce(force) {
    let f = p5.Vector.div(force, this.mass);
    this.acceleration.add(f);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.mult(0); // Clear acceleration each frame
  }

  display(radius) {
    noStroke();
    fill(this.col);
    ellipse(this.position.x, this.position.y, radius * 2);
  }

  bounceOffWalls(xMin, yMin, xMax, yMax, radius) {
    if (this.position.x > xMax - radius) {
      this.position.x = xMax - radius;
      this.velocity.x *= -1;
    } else if (this.position.x < xMin + radius) {
      this.position.x = xMin + radius;
      this.velocity.x *= -1;
    }

    if (this.position.y > yMax - radius) {
      this.position.y = yMax - radius;
      this.velocity.y *= -1;
    } else if (this.position.y < yMin + radius) {
      this.position.y = yMin + radius;
      this.velocity.y *= -1;
    }
  }
}