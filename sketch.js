let blackBall;
let whiteBall;
let attractorForce = 0.2;
let repulsionCount = 0;
const MAX_REPULSIONS = 10;
const BASE_RADIUS = 25;
const SEPARATION_DISTANCE = 10;

let separated = false;
let outOfBoundsStartTime = 0;
let separationStartTime = 0;
const RESET_TIME = 5000;

let dominantType = 'black';
let dominanceSwitched = false;

// ★ Text Logic
const phrases = [
    "이제 그만해",
    "너는 항상 그래",
    "나도 지쳤어",
    "왜 나만 탓해?",
    "버리지 마",
    "그게 그렇게 잘못이야?",
    "노력할게"
];

let currentBlackRadius = BASE_RADIUS;
let currentWhiteRadius = BASE_RADIUS;

// ★ 흔들림 관련 변수
let shake = 0;
const SHAKE_THRESHOLD_DISTANCE = 150;  // 멀어짐 판정 기준
let prevDist = 0;

// ★ Obstacles
let obstacles = [];
let statsDiv;



function setup() {
    createCanvas(800, 600);
    resetBalls();

    // UI setup
    statsDiv = createDiv('');
    statsDiv.style('color', 'white');
    statsDiv.style('font-size', '16px');
    statsDiv.style('margin-top', '10px');

    // Initialize Obstacles
    // 1 per side (Full Wall)
    for (let i = 0; i < 1; i++) obstacles.push(new Obstacle('TOP', width, height));
    for (let i = 0; i < 1; i++) obstacles.push(new Obstacle('BOTTOM', width, height));
    for (let i = 0; i < 1; i++) obstacles.push(new Obstacle('LEFT', width, height));
    for (let i = 0; i < 1; i++) obstacles.push(new Obstacle('RIGHT', width, height));
}

function resetBalls() {
    blackBall = new Particle(random(width), random(height), 10, color(255));
    whiteBall = new Particle(random(width), random(height), 10, color(255));

    repulsionCount = 0;
    repulsionCount = 0;
    separated = false;
    outOfBoundsStartTime = 0;
    separationStartTime = 0;

    dominantType = random(1) < 0.5 ? 'black' : 'white';
    dominanceSwitched = false;

    currentBlackRadius = BASE_RADIUS;
    currentWhiteRadius = BASE_RADIUS;

    prevDist = p5.Vector.dist(blackBall.position, whiteBall.position);
    shake = 0;


}

function draw() {
    if (separated) {
        // Fade from 220 to 0 over 2 seconds
        let elapsed = millis() - separationStartTime;
        let t = constrain(elapsed / 2000, 0, 1);
        let bgVal = lerp(220, 0, t);
        background(bgVal);
    } else {
        background(220);
    }


    // Update and Draw Obstacles with Keyboard Control
    for (let obs of obstacles) {
        let isActive = false;



        // Map Keys to Opposite Sides
        if (obs.side === 'RIGHT' && keyIsDown(LEFT_ARROW)) isActive = true;
        else if (obs.side === 'LEFT' && keyIsDown(RIGHT_ARROW)) isActive = true;
        else if (obs.side === 'BOTTOM' && keyIsDown(UP_ARROW)) isActive = true;
        else if (obs.side === 'TOP' && keyIsDown(DOWN_ARROW)) isActive = true;

        obs.update(isActive);
        obs.display();

        if (!separated) {
            obs.checkCollision(blackBall, currentBlackRadius);
            obs.checkCollision(whiteBall, currentWhiteRadius);
        }
    }

    let distance = p5.Vector.dist(blackBall.position, whiteBall.position);
    let targetBlackRadius = BASE_RADIUS;
    let targetWhiteRadius = BASE_RADIUS;

    if (!separated) {
        // ... (standard logic) ...

        // Stabilize balls if Space is held (reduce shake influence)
        // We will apply this when shake is calculated later
    }

    // ... (rest of standard logic) ... (omitted for brevity, assume next chunk covers it if needed, but here we just replace up to shake logic)
    // Wait, the ReplacementContent must match the chunk. I will provide context up to the shake logic.

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
        let isRepelling = distance < SEPARATION_DISTANCE + (currentBlackRadius + currentWhiteRadius) / 4;

        if (isRepelling) {
            repulsionCount++;

            let rep = p5.Vector.sub(whiteBall.position, blackBall.position).normalize().mult(50);
            whiteBall.applyForce(rep);
            blackBall.applyForce(p5.Vector.mult(rep, -1));

            if (repulsionCount >= MAX_REPULSIONS) {
                separated = true;
                separationStartTime = millis();
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
            showRandomText();
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
        stroke(255);
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

    // Update UI
    let statusHTML = "Repulsions: " + repulsionCount + " / " + MAX_REPULSIONS + " | Separated: " + separated;

    if (separated && outOfBoundsStartTime > 0) {
        let timeLeft = max(0, ceil((RESET_TIME - (millis() - outOfBoundsStartTime)) / 1000));
        statusHTML += "<br>Reset in: " + timeLeft + "s";
    }

    statsDiv.html(statusHTML);

    prevDist = distance;
}

function isInsideCanvas(pos, radius) {
    return pos.x > -radius && pos.x < width + radius &&
        pos.y > -radius && pos.y < height + radius;
}

function showRandomText() {
    // Pick two distinct random indices
    let idx1 = floor(random(phrases.length));
    let idx2 = floor(random(phrases.length));

    // Ensure they are different
    while (idx2 === idx1) {
        idx2 = floor(random(phrases.length));
    }

    createFloatingText(phrases[idx1], 'left');
    createFloatingText(phrases[idx2], 'right');
}

function createFloatingText(content, side) {
    let div = createDiv(content);
    div.style('position', 'fixed');
    div.style('color', 'white');
    div.style('font-size', '24px');
    div.style('font-weight', 'bold');
    div.style('top', '50%');
    div.style('transform', 'translateY(-50%)');
    div.style('opacity', '1');
    div.style('transition', 'opacity 2s');
    div.style('pointer-events', 'none');

    if (side === 'left') {
        div.style('left', '10%');
    } else {
        div.style('right', '10%');
    }

    // Trigger fade out
    setTimeout(() => {
        div.style('opacity', '0');
    }, 100);

    // Remove from DOM
    setTimeout(() => {
        div.remove();
    }, 2100);
}