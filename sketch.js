let blackBall;
let whiteBall;
let attractorForce = 0.2;
let repulsionCount = 0;
const MAX_REPULSIONS = 10;
const BASE_RADIUS = 25;
const SEPARATION_DISTANCE = 10;

let separated = false;
let outOfBoundsStartTime = 0;
const RESET_TIME = 5000; // 5 seconds
let dominantType = 'black'; // 'black' or 'white'
let dominanceSwitched = false; // Flag to prevent rapid switching

// Smooth transition variables
let currentBlackRadius = BASE_RADIUS;
let currentWhiteRadius = BASE_RADIUS;

// Interaction variables
let interactionCount = 0;
let isClose = false;
const CLOSE_DISTANCE_THRESHOLD = 150; // Distance to trigger "close" interaction
const SHAKE_THRESHOLD = 5;
const INTERACTION_BUFFER = 50;

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

  // Initial random choice
  dominantType = random(1) < 0.5 ? 'black' : 'white';
  dominanceSwitched = false;

  // Reset sizes
  currentBlackRadius = BASE_RADIUS;
  currentWhiteRadius = BASE_RADIUS;

  console.log("Dominant Ball: " + dominantType);

  interactionCount = 0;
  isClose = false;
}

function draw() {
  background(220);

  let distance = p5.Vector.dist(blackBall.position, whiteBall.position);
  let targetBlackRadius = BASE_RADIUS;
  let targetWhiteRadius = BASE_RADIUS;

  // Dynamic size and logic
  if (!separated) {
    // Check for proximity to switch dominance
    let switchThreshold = BASE_RADIUS * 4;
    let switchBuffer = 50;

    if (distance < switchThreshold) {
      if (!dominanceSwitched) {
        dominantType = random(1) < 0.5 ? 'black' : 'white';
        dominanceSwitched = true;
        console.log("Switched dominance to: " + dominantType);
      }
    } else if (distance > switchThreshold + switchBuffer) {
      dominanceSwitched = false; // Reset flag when they move apart
    }

    // Interaction Counting Logic
    if (distance < CLOSE_DISTANCE_THRESHOLD) {
      if (!isClose) {
        interactionCount++;
        isClose = true;
        console.log("Interaction Count: " + interactionCount);
      }
    } else if (distance > CLOSE_DISTANCE_THRESHOLD + INTERACTION_BUFFER) {
      isClose = false;
    }

    // Map distance to a factor (0 to 1 approx)
    let maxDist = Math.sqrt(width * width + height * height) / 1.5;
    let factor = constrain(map(distance, 0, maxDist, 0, 1), 0, 1);

    // Calculate TARGET radii based on dominance
    if (dominantType === 'black') {
      targetBlackRadius = BASE_RADIUS * (1 + factor * 1.5);
      targetWhiteRadius = BASE_RADIUS * (1 - factor * 0.6);
    } else {
      targetWhiteRadius = BASE_RADIUS * (1 + factor * 1.5);
      targetBlackRadius = BASE_RADIUS * (1 - factor * 0.6);
    }
  }

  // Smoothly interpolate current radius towards target radius
  // 0.1 is the smoothing speed (higher = faster)
  currentBlackRadius = lerp(currentBlackRadius, targetBlackRadius, 0.1);
  currentWhiteRadius = lerp(currentWhiteRadius, targetWhiteRadius, 0.1);

  if (!separated) {
    // Update Mass (Mass proportional to Area ~ Radius^2)
    blackBall.mass = 10 * (currentBlackRadius / BASE_RADIUS) ** 2;
    whiteBall.mass = 10 * (currentWhiteRadius / BASE_RADIUS) ** 2;

    // Apply attraction
    let baseForce = attractorForce;
    let massFactor = (blackBall.mass / 10) * (whiteBall.mass / 10);
    // Limit lower bound of massFactor to avoid zero force if they get too tiny
    massFactor = max(massFactor, 0.1);

    let magnitude = baseForce * massFactor;

    // Force on Black towards White
    let forceTowardsWhite = p5.Vector.sub(whiteBall.position, blackBall.position);
    forceTowardsWhite.normalize();
    forceTowardsWhite.mult(magnitude);
    blackBall.applyForce(forceTowardsWhite);

    // Force on White towards Black
    let forceTowardsBlack = p5.Vector.sub(blackBall.position, whiteBall.position);
    forceTowardsBlack.normalize();
    forceTowardsBlack.mult(magnitude);
    whiteBall.applyForce(forceTowardsBlack);

    // Repulsion logic
    // Use current dynamic radii for collision distance
    if (distance < SEPARATION_DISTANCE + (currentBlackRadius + currentWhiteRadius) / 4 && random(1) < 0.5) {
      repulsionCount++;
      let repulsionRef = p5.Vector.sub(whiteBall.position, blackBall.position);
      repulsionRef.normalize();
      repulsionRef.mult(50);

      whiteBall.applyForce(repulsionRef);
      let repulsionForBlack = p5.Vector.mult(repulsionRef, -1);
      blackBall.applyForce(repulsionForBlack);

      if (repulsionCount >= MAX_REPULSIONS) {
        separated = true;
        console.log("Balls separated!");
      }
    }

    blackBall.update();
    whiteBall.update();

    blackBall.bounceOffWalls(0, 0, width, height, currentBlackRadius);
    whiteBall.bounceOffWalls(0, 0, width, height, currentWhiteRadius);

    // Draw line connecting them
    // Draw line connecting them

    // Dynamic Stroke Weight (Thicker when close)
    // Map distance (0 to maxDist) inversely to weight (e.g., 5 to 1)
    let weight = map(distance, 0, width, 5, 1);
    weight = constrain(weight, 1, 5);
    strokeWeight(weight);
    stroke(0);

    let x1 = blackBall.position.x;
    let y1 = blackBall.position.y;
    let x2 = whiteBall.position.x;
    let y2 = whiteBall.position.y;

    // Apply Shaking Effect if interaction threshold met
    if (interactionCount >= SHAKE_THRESHOLD) {
      let shakeAmount = 5; // Adjust shake intensity
      x1 += random(-shakeAmount, shakeAmount);
      y1 += random(-shakeAmount, shakeAmount);
      x2 += random(-shakeAmount, shakeAmount);
      y2 += random(-shakeAmount, shakeAmount);
    }

    line(x1, y1, x2, y2);
    strokeWeight(0.5); // Reset trigger weight for other elements

  } else {
    // SEPARATED STATE
    blackBall.mass = 10;
    whiteBall.mass = 10;

    let forceTowardsWhite = p5.Vector.sub(whiteBall.position, blackBall.position);
    forceTowardsWhite.normalize();
    forceTowardsWhite.mult(attractorForce * 0.1);
    blackBall.applyForce(forceTowardsWhite);

    let forceTowardsBlack = p5.Vector.sub(blackBall.position, whiteBall.position);
    forceTowardsBlack.normalize();
    forceTowardsBlack.mult(attractorForce * 0.1);
    whiteBall.applyForce(forceTowardsBlack);

    blackBall.update();
    whiteBall.update();

    // Check if balls are out of bounds
    // Use current radius (likely BASE_RADIUS if separated, but strictly current)
    let blackOutOfBounds = !isInsideCanvas(blackBall.position, currentBlackRadius);
    let whiteOutOfBounds = !isInsideCanvas(whiteBall.position, currentWhiteRadius);

    if (blackOutOfBounds || whiteOutOfBounds) {
      if (outOfBoundsStartTime === 0) {
        outOfBoundsStartTime = millis();
      } else if (millis() - outOfBoundsStartTime > RESET_TIME) {
        console.log("Resetting balls after 5 seconds out of bounds.");
        resetBalls();
      }
    } else {
      outOfBoundsStartTime = 0;
    }
  }

  // Display with SMOOTHED radius
  blackBall.display(currentBlackRadius);
  whiteBall.display(currentWhiteRadius);

  // Display repulsion count
  fill(0);
  noStroke(); // reset stroke from line
  textSize(16);
  text("Repulsions: " + repulsionCount + " / " + MAX_REPULSIONS, 10, 20);
  text("Separated: " + separated, 10, 40);
  if (separated && outOfBoundsStartTime > 0) {
    let timeLeft = max(0, ceil((RESET_TIME - (millis() - outOfBoundsStartTime)) / 1000));
    text("Reset in: " + timeLeft + "s", 10, 60);
  }
}

function isInsideCanvas(pos, radius) {
  return pos.x > -radius && pos.x < width + radius &&
    pos.y > -radius && pos.y < height + radius;
}