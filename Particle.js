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
    this.velocity.limit(6); // Limit speed to keep movement observable
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