let blackBall;
let whiteBall;
let attractorForce = 0.2;
let repulsionCount = 0;
const MAX_REPULSIONS = 10;
const BASE_RADIUS = 25;
const SEPARATION_DISTANCE = 10;

let separated = false;
let outOfBoundsStartTime = 0;
const RESET_TIME = 5000;

let dominantType = 'black';
let dominanceSwitched = false;

let currentBlackRadius = BASE_RADIUS;
let currentWhiteRadius = BASE_RADIUS;

// ★ 흔들림 관련 변수
let shake = 0;
const SHAKE_THRESHOLD_DISTANCE = 150;  // 멀어짐 판정 기준
let prevDist = 0;

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

    dominantType = random(1) < 0.5 ? 'black' : 'white';
    dominanceSwitched = false;

    currentBlackRadius = BASE_RADIUS;
    currentWhiteRadius = BASE_RADIUS;

    prevDist = p5.Vector.dist(blackBall.position, whiteBall.position);
    shake = 0;
}

function draw() {
    background(220);

    let distance = p5.Vector.dist(blackBall.position, whiteBall.position);
    let targetBlackRadius = BASE_RADIUS;
    let targetWhiteRadius = BASE_RADIUS;

    if (!separated) {
        // Dominance switching
        let switchThreshold = BASE_RADIUS * 4;
        let switchBuffer = 50;

        if (distance < switchThreshold) {
            if (!dominanceSwitched) {
                dominantType = random(1) < 0.5 ? 'black' : 'white';
                dominanceSwitched = true;
            }
        } else if (distance > switchThreshold + switchBuffer) {
            dominanceSwitched = false;
        }

        // Map distance to radius
        let maxDist = sqrt(width * width + height * height) / 1.5;
        let factor = constrain(map(distance, 0, maxDist, 0, 1), 0, 1);

        if (dominantType === 'black') {
            targetBlackRadius = BASE_RADIUS * (1 + factor * 1.5);
            targetWhiteRadius = BASE_RADIUS * (1 - factor * 0.6);
        } else {
            targetWhiteRadius = BASE_RADIUS * (1 + factor * 1.5);
            targetBlackRadius = BASE_RADIUS * (1 - factor * 0.6);
        }
    }

    // Smooth transition
    currentBlackRadius = lerp(currentBlackRadius, targetBlackRadius, 0.1);
    currentWhiteRadius = lerp(currentWhiteRadius, targetWhiteRadius, 0.1);

    if (!separated) {
        // Attraction
        let magnitude = attractorForce * max((blackBall.mass / 10) * (whiteBall.mass / 10), 0.1);
        let forceTowardW = p5.Vector.sub(whiteBall.position, blackBall.position).normalize().mult(magnitude);
        let forceTowardB = p5.Vector.sub(blackBall.position, whiteBall.position).normalize().mult(magnitude);

        blackBall.applyForce(forceTowardW);
        whiteBall.applyForce(forceTowardB);

        // Repulsion
        if (distance < SEPARATION_DISTANCE + (currentBlackRadius + currentWhiteRadius) / 4 && random(1) < 0.5) {
            repulsionCount++;

            let rep = p5.Vector.sub(whiteBall.position, blackBall.position).normalize().mult(50);
            whiteBall.applyForce(rep);
            blackBall.applyForce(p5.Vector.mult(rep, -1));

            if (repulsionCount >= MAX_REPULSIONS) {
                separated = true;
            }
        }

        blackBall.update();
        whiteBall.update();

        blackBall.bounceOffWalls(0, 0, width, height, currentBlackRadius);
        whiteBall.bounceOffWalls(0, 0, width, height, currentWhiteRadius);

        // -----------------------------------------------------------
        // ★ 변경된 흔들림 로직: "멀어지는 순간"에만 shake 강하게 증가
        // -----------------------------------------------------------
        if (distance > SHAKE_THRESHOLD_DISTANCE && prevDist <= SHAKE_THRESHOLD_DISTANCE) {
            shake = 20;    // 멀어짐 순간 큰 흔들림 발생
        }

        // 흔들림 감쇠
        shake *= 0.9;

        // 선 좌표 흔들림 적용
        let x1 = blackBall.position.x + random(-shake, shake);
        let y1 = blackBall.position.y + random(-shake, shake);
        let x2 = whiteBall.position.x + random(-shake, shake);
        let y2 = whiteBall.position.y + random(-shake, shake);

        // Draw line
        let weight = map(distance, 0, width, 3, 0.1);
        strokeWeight(constrain(weight, 0.1, 3));
        stroke(0);
        line(x1, y1, x2, y2);

    } else {
        // Separated behavior
        blackBall.mass = 10;
        whiteBall.mass = 10;

        let fw = p5.Vector.sub(whiteBall.position, blackBall.position).normalize().mult(attractorForce * 0.1);
        let fb = p5.Vector.sub(blackBall.position, whiteBall.position).normalize().mult(attractorForce * 0.1);

        blackBall.applyForce(fw);
        whiteBall.applyForce(fb);

        blackBall.update();
        whiteBall.update();

        let blackOut = !isInsideCanvas(blackBall.position, currentBlackRadius);
        let whiteOut = !isInsideCanvas(whiteBall.position, currentWhiteRadius);

        if (blackOut || whiteOut) {
            if (outOfBoundsStartTime === 0) {
                outOfBoundsStartTime = millis();
            } else if (millis() - outOfBoundsStartTime > RESET_TIME) {
                resetBalls();
            }
        } else {
            outOfBoundsStartTime = 0;
        }
    }

    // Draw balls
    blackBall.display(currentBlackRadius);
    whiteBall.display(currentWhiteRadius);

    fill(0);
    noStroke();
    textSize(16);
    text("Repulsions: " + repulsionCount + " / " + MAX_REPULSIONS, 10, 20);
    text("Separated: " + separated, 10, 40);

    if (separated && outOfBoundsStartTime > 0) {
        let timeLeft = max(0, ceil((RESET_TIME - (millis() - outOfBoundsStartTime)) / 1000));
        text("Reset in: " + timeLeft + "s", 10, 60);
    }

    prevDist = distance;
}

function isInsideCanvas(pos, radius) {
    return pos.x > -radius && pos.x < width + radius &&
           pos.y > -radius && pos.y < height + radius;
}