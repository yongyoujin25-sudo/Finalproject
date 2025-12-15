class Obstacle {
    constructor(side, canvasWidth, canvasHeight) {
        this.side = side; // 'TOP', 'BOTTOM', 'LEFT', 'RIGHT'
        this.w = 0;
        this.h = 0;
        this.pos = createVector(0, 0);
        this.pos = createVector(0, 0);
        // Max depth: Canvas Dimension - 50 (Very deep extension)
        if (side === 'TOP' || side === 'BOTTOM') {
            this.maxDepth = canvasHeight - 50;
        } else {
            this.maxDepth = canvasWidth - 50;
        }

        this.speed = random(2, 6); // Slower speed
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        this.initPosition();
    }

    initPosition() {
        if (this.side === 'TOP') {
            this.w = this.canvasWidth; // Full width
            this.h = 0; // Starts retracted
            this.pos = createVector(0, 0);
        } else if (this.side === 'BOTTOM') {
            this.w = this.canvasWidth; // Full width
            this.h = 0;
            this.pos = createVector(0, this.canvasHeight);
        } else if (this.side === 'LEFT') {
            this.w = 0;
            this.h = this.canvasHeight; // Full height
            this.pos = createVector(0, 0);
        } else if (this.side === 'RIGHT') {
            this.w = 0;
            this.h = this.canvasHeight; // Full height
            this.pos = createVector(this.canvasWidth, 0);
        }
    }

    update(isActive) {
        if (isActive) {
            this.grow();
        } else {
            this.shrink();
            if (this.isFullyRetracted()) {
                this.resetProperties(); // Re-randomize when back at wall
            }
        }
    }

    grow() {
        if (this.isMaxDepth()) return;

        if (this.side === 'TOP') {
            this.h += this.speed;
            if (this.h > this.maxDepth) this.h = this.maxDepth;
        } else if (this.side === 'BOTTOM') {
            this.h += this.speed;
            if (this.h > this.maxDepth) this.h = this.maxDepth;
            this.pos.y = this.canvasHeight - this.h;
        } else if (this.side === 'LEFT') {
            this.w += this.speed;
            if (this.w > this.maxDepth) this.w = this.maxDepth;
        } else if (this.side === 'RIGHT') {
            this.w += this.speed;
            if (this.w > this.maxDepth) this.w = this.maxDepth;
            this.pos.x = this.canvasWidth - this.w;
        }
    }

    shrink() {
        if (this.side === 'TOP') {
            this.h -= this.speed;
        } else if (this.side === 'BOTTOM') {
            this.h -= this.speed;
            this.pos.y += this.speed;
        } else if (this.side === 'LEFT') {
            this.w -= this.speed;
        } else if (this.side === 'RIGHT') {
            this.w -= this.speed;
            this.pos.x += this.speed;
        }
    }

    isMaxDepth() {
        if (this.side === 'TOP' || this.side === 'BOTTOM') {
            return this.h >= this.maxDepth;
        } else {
            return this.w >= this.maxDepth;
        }
    }

    isFullyRetracted() {
        if (this.side === 'TOP' || this.side === 'BOTTOM') {
            return this.h <= 0;
        } else {
            return this.w <= 0;
        }
    }

    resetProperties() {
        this.maxDepth = random(50, 200);
        this.initPosition(); // Get new random x/y
    }

    display() {
        noStroke();
        fill(0); // Black obstacles
        rect(this.pos.x, this.pos.y, this.w, this.h);
    }

    checkCollision(particle, radius) {
        // AABB vs Circle
        // Rectangle: this.pos.x, this.pos.y, this.w, this.h
        // Circle: particle.position.x, particle.position.y, radius

        // Find closest point on rect to circle center
        let testX = particle.position.x;
        let testY = particle.position.y;

        if (particle.position.x < this.pos.x) testX = this.pos.x;
        else if (particle.position.x > this.pos.x + this.w) testX = this.pos.x + this.w;

        if (particle.position.y < this.pos.y) testY = this.pos.y;
        else if (particle.position.y > this.pos.y + this.h) testY = this.pos.y + this.h;

        let distX = particle.position.x - testX;
        let distY = particle.position.y - testY;
        let distance = sqrt((distX * distX) + (distY * distY));

        if (distance <= radius) {
            // Collision detected

            // Calculate normal
            let normal = createVector(distX, distY);
            // If center is inside logic (rare but possible), handle it
            if (distance === 0) {
                // Push out based on side
                if (this.side === 'TOP') normal = createVector(0, 1);
                else if (this.side === 'BOTTOM') normal = createVector(0, -1);
                else if (this.side === 'LEFT') normal = createVector(1, 0);
                else if (this.side === 'RIGHT') normal = createVector(-1, 0);
            } else {
                normal.normalize();
            }

            // Reflect velocity: v' = v - 2 * (v . n) * n
            let vDotN = p5.Vector.dot(particle.velocity, normal);
            let reflection = p5.Vector.mult(normal, 2 * vDotN);
            particle.velocity.sub(reflection);

            // Push out to avoid sticking
            let overlap = radius - distance;
            let correction = p5.Vector.mult(normal, overlap + 1); // +1 safety buffer
            particle.position.add(correction);

            return true;
        }
        return false;
    }
}
