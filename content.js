var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite;

// create an engine
var engine = Engine.create();


// Create a render instance
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false,
    background: 'transparent'
  }
});

// Apply custom styles to the canvas
const canvas = render.canvas;
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.zIndex = '9999';
canvas.style.pointerEvents = 'none';


// Create physics-enabled cookie bodies
function createCookie(x, y) {
  console.log("Creating Cookie");
  var cookie = Bodies.circle(x, y, 50, {
    restitution: 0.7,
    render: {
      sprite: {
        texture: chrome.runtime.getURL('images/cookie.png'),
        xScale: 0.2,
        yScale: 0.2
      }
    }
  });
  Composite.add(engine.world, cookie);
}

function createBoundaries() {
  const thickness = 50; // Thickness of the boundary walls (large enough to ensure no leaks)

  // Bottom boundary
  var ground = Bodies.rectangle(
    window.innerWidth / 2, 
    window.innerHeight + thickness / 2, 
    window.innerWidth, 
    thickness, 
    { isStatic: true }
  );

  // Top boundary
  var ceiling = Bodies.rectangle(
    window.innerWidth / 2, 
    -thickness / 2, 
    window.innerWidth, 
    thickness, 
    { isStatic: true }
  );

  // Left boundary
  var leftWall = Bodies.rectangle(
    -thickness / 2, 
    window.innerHeight / 2, 
    thickness, 
    window.innerHeight, 
    { isStatic: true }
  );

  // Right boundary
  var rightWall = Bodies.rectangle(
    window.innerWidth + thickness / 2, 
    window.innerHeight / 2, 
    thickness, 
    window.innerHeight, 
    { isStatic: true }
  );

  // Add all boundaries to the world
  Composite.add(engine.world, [ground, ceiling, leftWall, rightWall]);
}

createBoundaries();

// Send a message to the background script to get cookies for the current domain
chrome.runtime.sendMessage(
  { action: "getCookiesForCurrentDomain" },
  (response) => {
    if (response && response.success) {
      console.log("Cookies for the current", response.domain, response.cookies);
      for (let i = 0; i < response.cookies.length; i++) {
        createCookie(Math.random() * window.innerWidth, Math.random() * window.innerHeight);
      }
    } else {
      console.error("Failed to retrieve cookies.");
    }
  }
);

createCookie(Math.random() * window.innerWidth, Math.random() * window.innerHeight);

// run the renderer
Render.run(render);

// create runner
var runner = Runner.create();

// run the engine
Runner.run(runner, engine);