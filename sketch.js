let walls = [];
let particle;
let rayCount = 1; // Ray angle increment
let wallCount = 5; // Number of walls
let ball; // Green ball object
let ballMoving = true; // Flag to control ball movement

function setup() {
  createCanvas(windowWidth, windowHeight); // Fullscreen canvas

  // Create random walls
  for (let i = 0; i < wallCount; i++) {
    let x1 = random(width);
    let x2 = random(width);
    let y1 = random(height);
    let y2 = random(height);
    walls.push(new Boundary(x1, y1, x2, y2));
  }

  // Add canvas boundaries
  walls.push(new Boundary(-1, -1, width, -1));
  walls.push(new Boundary(width, -1, width, height));
  walls.push(new Boundary(width, height, -1, height));
  walls.push(new Boundary(-1, height, -1, -1));

  particle = new Particle();
  noCursor();

  // Create a random position for the ball inside the canvas
  let ballX = random(200, width - 200);
  let ballY = random(200, height - 200);
  ball = new Ball(ballX, ballY);
}

function draw() {
  background(0);

  // Calculate the distance of the mouse from the center
  const mouseDistFromCenter = dist(mouseX, mouseY, width / 2, height / 2);

  // Define a threshold for the mouse's proximity to the edges
  const edgeThreshold = width / 4;

  // Trigger wall movement if the mouse is near the edges or far from the center
  let mouseNearEdges = mouseDistFromCenter > edgeThreshold;

  // Update and show walls
  for (let wall of walls) {
    wall.update(mouseNearEdges); // Pass the mouse status
    wall.show();
  }

  // Update and show particle
  particle.update(mouseX, mouseY);
  particle.show();
  particle.look(walls);

  // Show the hidden ball if any ray intersects with it
  ball.show(particle.rays); // Pass the rays to the ball to check for intersections

  // Move the ball continuously if it's not stopped
  if (ballMoving) {
    ball.move();
  }
}

function mousePressed() {
  // Check if the mouse clicked on the ball
  if (dist(mouseX, mouseY, ball.pos.x, ball.pos.y) < ball.radius) {
    ballMoving = false; // Stop the ball's movement when clicked
    window.open("https://www.example.com", "_blank"); // Replace with your desired URL
  }
}

// Adjust canvas size when the window is resized
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Recreate canvas boundaries
  walls = walls.filter(wall => wall.a.x !== -1 && wall.b.x !== -1); // Remove old boundaries
  walls.push(new Boundary(-1, -1, width, -1));
  walls.push(new Boundary(width, -1, width, height));
  walls.push(new Boundary(width, height, -1, height));
  walls.push(new Boundary(-1, height, -1, -1));
}

/////////////////////////////////////////////// Walls
class Boundary {
  constructor(x1, y1, x2, y2) {
    this.a = createVector(x1, y1);
    this.b = createVector(x2, y2);
    this.offsetA = random(1000);
    this.offsetB = random(1000);
    this.speedA = random(0.01, 0.03);
    this.speedB = random(0.01, 0.03);
  }

  update(activate) {
    if (activate) {
      // Move walls using sine wave oscillations
      this.a.x += sin(this.offsetA) * 2;
      this.a.y += cos(this.offsetA) * 2;
      this.b.x += sin(this.offsetB) * 2;
      this.b.y += cos(this.offsetB) * 2;

      this.offsetA += this.speedA;
      this.offsetB += this.speedB;

      // Keep wall endpoints within bounds
      this.a.x = constrain(this.a.x, 0, width);
      this.a.y = constrain(this.a.y, 0, height);
      this.b.x = constrain(this.b.x, 0, width);
      this.b.y = constrain(this.b.y, 0, height);
    }
  }

  show() {
    stroke(255);
    line(this.a.x, this.a.y, this.b.x, this.b.y);
  }
}

//////////////////////////////////////////////////// Particles
class Particle {
  constructor() {
    this.pos = createVector(width / 2, height / 2);
    this.rays = [];
    for (let a = 0; a < 360; a += rayCount) {
      this.rays.push(new Ray(this.pos, radians(a)));
    }
  }

  update(x, y) {
    this.pos.set(x, y);
  }

 look(walls) {
    let intersections = [];

    // Check for wall intersections
    for (let ray of this.rays) {
      let closest = null;
      let record = Infinity;

      for (let wall of walls) {
        const pt = ray.cast(wall);
        if (pt) {
          const d = p5.Vector.dist(this.pos, pt);
          if (d < record) {
            record = d;
            closest = pt;
          }
        }
      }

      if (closest) {
        intersections.push(closest);
        stroke(200, 0, 150, 200); // Purple with transparency
        line(this.pos.x, this.pos.y, closest.x, closest.y);
      }
    }

    // Draw shapes from intersections
    if (intersections.length > 2) {
      noFill();
      stroke(0, 255, 0, 100); // Keep the shape outline green
      beginShape();
      for (let pt of intersections) {
        vertex(pt.x, pt.y);
      }
      endShape(CLOSE);
    }
}


  show() {
    fill(255);
    noStroke();
    ellipse(this.pos.x, this.pos.y, 4);
  }
}

/////////////////////////////////////////// Rays
class Ray {
  constructor(pos, angle) {
    this.pos = pos;
    this.dir = p5.Vector.fromAngle(angle);
  }

  cast(wall) {
    const x1 = wall.a.x;
    const y1 = wall.a.y;
    const x2 = wall.b.x;
    const y2 = wall.b.y;

    const x3 = this.pos.x;
    const y3 = this.pos.y;
    const x4 = this.pos.x + this.dir.x;
    const y4 = this.pos.y + this.dir.y;

    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den == 0) {
      return;
    }

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
    if (t > 0 && t < 1 && u > 0) {
      const pt = createVector();
      pt.x = x1 + t * (x2 - x1);
      pt.y = y1 + t * (y2 - y1);
      return pt;
    } else {
      return;
    }
  }
}

/////////////////////////////////////////// Hidden Ball
class Ball {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.target = this.pos.copy();
    this.radius = 45; // Radius of the ball
    this.speed = 2; // Speed factor for smooth movement
  }

  move() {
    // Smoothly move the ball towards a new target
    if (p5.Vector.dist(this.pos, this.target) < 1) {
      this.target.x = random(this.radius, width - this.radius);
      this.target.y = random(this.radius, height - this.radius);
    } else {
      this.pos.lerp(this.target, 0.05); // Smooth interpolation
    }
  }

  show(rays) {
    let visible = 0;

    // Check if any ray intersects with the ball
    for (let ray of rays) {
      const pt = ray.cast(new Boundary(this.pos.x - this.radius, this.pos.y - this.radius, this.pos.x + this.radius, this.pos.y + this.radius));
      if (pt) {
        visible++;
      }
    }

    // If at least 3 rays hit the ball, make it visible
    if (visible >= 15) {
      fill(0, 255, 0); // Green color
      noStroke();
      ellipse(this.pos.x, this.pos.y, this.radius * 2);
    }
  }
}
