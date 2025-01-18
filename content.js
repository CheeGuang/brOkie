var Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite;
Mouse = Matter.MouseConstraint;
MouseConstraint = Matter.MouseConstraint;

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
    background: "transparent",
  },
});

// Apply custom styles to the canvas
const canvas = render.canvas;
canvas.style.position = "fixed";
canvas.style.top = "0";
canvas.style.left = "0";
canvas.style.zIndex = "9999";
canvas.style.pointerEvents = "none";

// Configuration for radius and image scale
const cookieConfig = {
  S: { radius: 50, scale: 0.3 },
  M: { radius: 60, scale: 0.5 },
  L: { radius: 70, scale: 0.8 },
  XL: { radius: 150, scale: 1 },
};

function getCookieSizeCategory(totalCharacters) {
  console.log(`Debug: Total characters = ${totalCharacters}`);

  if (totalCharacters < 100) {
    console.log("Debug: Size category = S");
    return "S";
  }
  if (totalCharacters < 300) {
    console.log("Debug: Size category = M");
    return "M";
  }
  if (totalCharacters < 500) {
    console.log("Debug: Size category = L");
    return "L";
  }

  console.log("Debug: Size category = XL");
  return "XL";
}

function createCookie(x, y, size) {
  console.log("Creating Cookie of size:", size);

  const config = cookieConfig[size] || cookieConfig.M; // Default to M size if size is unknown

  var cookie = Bodies.circle(x, y, config.radius, {
    restitution: 1,
    render: {
      sprite: {
        texture: chrome.runtime.getURL("images/cookie.png"),
        xScale: config.scale,
        yScale: config.scale,
      },
    },
  });

  Composite.add(engine.world, cookie);
}

function createCursorBody() {
  const cursorBody = Bodies.circle(0, 0, 20, {
    isStatic: true,
    density: 100, // Adjust for desired mass
    frictionAir: 0.05, // Simulates air drag for smoother control
    render: {
      fillStyle: "rgba(0, 0, 0, 0)", // Visual style (transparent)
    },
  });

  Composite.add(engine.world, cursorBody);

  document.addEventListener("mousemove", (event) => {
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    // Set cursor body position to mouse position
    Matter.Body.setPosition(cursorBody, { x: mouseX, y: mouseY });
  });

  // Track the currently selected cookie
  let selectedCookie = null;

  // Add collision start event listener
  Matter.Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach((pair) => {
      // Check if the cursor body is involved in the collision
      if (pair.bodyA === cursorBody || pair.bodyB === cursorBody) {
        const cookieBody = pair.bodyA === cursorBody ? pair.bodyB : pair.bodyA;

        // Only select the cookie if none is currently selected
        if (!selectedCookie) {
          if (cookieBody.render && cookieBody.render.sprite) {
            cookieBody.render.sprite.texture = chrome.runtime.getURL(
              "images/cookie-selected.png"
            );
            selectedCookie = cookieBody; // Set the selected cookie
          }

          // Log details of the selected cookie
          console.log("Cookie touched by cursor and texture updated:", {
            position: cookieBody.position,
            radius: cookieBody.circleRadius,
            id: cookieBody.id,
            render: cookieBody.render,
          });
        }
      }
    });
  });

  // Add collision end event listener
  Matter.Events.on(engine, "collisionEnd", (event) => {
    event.pairs.forEach((pair) => {
      // Check if the cursor body is involved in the collision
      if (pair.bodyA === cursorBody || pair.bodyB === cursorBody) {
        const cookieBody = pair.bodyA === cursorBody ? pair.bodyB : pair.bodyA;

        // Restore the texture of the cookie if it is the selected one
        if (cookieBody === selectedCookie) {
          if (cookieBody.render && cookieBody.render.sprite) {
            cookieBody.render.sprite.texture =
              chrome.runtime.getURL("images/cookie.png");
            selectedCookie = null; // Clear the selection
          }

          // Log details of the deselected cookie
          console.log(
            "Cookie no longer in contact with cursor, texture restored:",
            {
              position: cookieBody.position,
              radius: cookieBody.circleRadius,
              id: cookieBody.id,
              render: cookieBody.render,
            }
          );
        }
      }
    });
  });
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

chrome.runtime.sendMessage(
  { action: "getCookiesForCurrentDomain" },
  (response) => {
    if (response && response.success) {
      console.log(
        "Cookies for the current domain:",
        response.domain,
        response.cookies
      );
      for (let i = 0; i < response.cookies.length; i++) {
        const cookie = response.cookies[i];

        // Calculate total characters in all values of the cookie
        const totalCharacters = Object.values(cookie)
          .filter((value) => typeof value === "string") // Ensure values are strings
          .reduce((sum, value) => sum + value.length, 0);

        console.log("Debug: Total characters =", totalCharacters);

        // Categorise based on total characters
        const sizeCategory = getCookieSizeCategory(totalCharacters);
        console.log("Debug: Size category =", sizeCategory);

        // Create a cookie with the corresponding size
        createCookie(
          Math.random() * window.innerWidth,
          Math.random() * window.innerHeight,
          sizeCategory
        );
      }
    } else {
      console.error("Failed to retrieve cookies.");
    }
  }
);

createBoundaries();
createCursorBody();

// run the renderer
Render.run(render);

// create runner
var runner = Runner.create();

// run the engine
Runner.run(runner, engine);
