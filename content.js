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
canvas.style.zIndex = "999999";
canvas.style.pointerEvents = "none";

// Configuration for radius and image scale
const cookieConfig = {
  S: { radius: 50, scale: 0.3 },
  M: { radius: 60, scale: 0.5 },
  L: { radius: 70, scale: 0.8 },
  XL: { radius: 150, scale: 1 },
};

const cookieTextures = {
  full: "images/cookie.png",
  bite1: "images/cookiebite1.png",
  bite1Selected: "images/cookiebite1-selected.png",
  bite2: "images/cookiebite2.png",
  bite2Selected: "images/cookiebite2-selected.png",
};

function explodeCookie(cookie) {
  const forceMagnitude = 1.2; // Adjust force for explosion
  const randomAngle = Math.random() * 2 * Math.PI;

  // Apply force to the original cookie and remove it from the world
  Matter.Body.applyForce(cookie, cookie.position, {
    x: forceMagnitude * Math.cos(randomAngle),
    y: forceMagnitude * Math.sin(randomAngle),
  });

  // Remove the label div from the DOM
  if (cookie.labelId) {
    const labelElement = document.getElementById(cookie.labelId);
    if (labelElement) {
      document.body.removeChild(labelElement);
    }
  }

  Composite.remove(engine.world, cookie);

  setTimeout(() => {
    // Create crumbs
    for (let i = 0; i < 8; i++) {
      createCrumb(cookie.position.x, cookie.position.y, cookie.size);
    }

    // Transform the cookie to the next state
    if (
      cookie.render.sprite.texture ===
      chrome.runtime.getURL(cookieTextures.full)
    ) {
      createTransformedCookie(
        cookie.position.x,
        cookie.position.y,
        cookie.size,
        "bite1",
        cookie.cookieName
      );
    } else if (
      cookie.render.sprite.texture ===
      chrome.runtime.getURL(cookieTextures.bite1)
    ) {
      createTransformedCookie(
        cookie.position.x,
        cookie.position.y,
        cookie.size,
        "bite2",
        cookie.cookieName
      );
    } else if (
      cookie.render.sprite.texture ===
      chrome.runtime.getURL(cookieTextures.bite2)
    ) {
      for (let i = 0; i < 3; i++) {
        createCrumb(cookie.position.x, cookie.position.y, cookie.size);
      }
    }
  }, 200);
}
function createTransformedCookie(x, y, size, state, name) {
  const config = cookieConfig[size] || cookieConfig.M; // Default to M size if size is unknown

  // Define the maximum number of characters for the label
  const maxLabelCharacters = 10; // Adjust this value based on your design preferences
  const truncatedName =
    name.length > maxLabelCharacters
      ? name.substring(0, maxLabelCharacters) + "..."
      : name;

  // Create the transformed cookie
  var transformedCookie = Bodies.circle(x, y, config.radius, {
    restitution: 1,
    render: {
      sprite: {
        texture: chrome.runtime.getURL(cookieTextures[state]),
        xScale: config.scale,
        yScale: config.scale,
      },
    },
  });

  transformedCookie.size = size; // Store size in the cookie for future transformations
  transformedCookie.cookieName = name; // Assign the same name as the original cookie

  // Create a new label for the transformed cookie
  const label = document.createElement("div");
  label.innerText = truncatedName; // Use truncated name
  label.style.position = "absolute";
  label.style.color = "#fff";
  label.style.fontSize = "16px";
  label.style.fontWeight = "bold";
  label.style.textAlign = "center";
  label.style.pointerEvents = "none";
  label.style.transformOrigin = "center center";
  label.style.zIndex = zIndexCounter.toString(); // Set z-index for the label
  label.style.backgroundColor = "black"; // Black background
  label.style.borderRadius = "10px"; // Corner radius
  label.style.padding = "5px 10px"; // Padding inside the label
  label.style.maxWidth = "150px"; // Set a maximum width for the label
  label.style.whiteSpace = "nowrap"; // Prevent wrapping
  label.style.overflow = "hidden"; // Hide overflow text

  Matter.Events.on(engine, "afterUpdate", () => {
    const posX = cookie.position.x;
    const posY = cookie.position.y;

    // Set label's position relative to the canvas, compensating for its size
    label.style.left = `${posX}px`;
    label.style.top = `${posY}px`;
    label.style.transform = `translate(-50%, -50%) rotate(${cookie.angle}rad)`;
  });

  // Increment the global z-index counter for the next cookie
  zIndexCounter++;

  Composite.add(engine.world, transformedCookie);
}

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

// Global z-index counter to ensure each new cookie is on a different layer
let zIndexCounter = 1000000; // Starting z-index value

function createCookie(x, y, size, name) {
  console.log("Creating Cookie of size:", size);

  const config = cookieConfig[size] || cookieConfig.M; // Default to M size if size is unknown

  // Define the maximum number of characters for the label
  const maxLabelCharacters = 10; // Adjust this value based on your design preferences
  const truncatedName =
    name.length > maxLabelCharacters
      ? name.substring(0, maxLabelCharacters) + "..."
      : name;

  // Create the Matter.js body for the cookie
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

  cookie.size = size; // Store size in the cookie for future transformations
  cookie.cookieName = name; // Store the name for display

  // Create a label element for the cookie name
  const label = document.createElement("div");
  const state = "full"; // Initial state is "full"
  label.id = `cookie-label-${name}-${state}`; // Assign a unique id based on cookie name and state
  label.innerText = truncatedName; // Use truncated name
  label.style.position = "absolute";
  label.style.color = "#fff";
  label.style.fontSize = "16px";
  label.style.fontWeight = "bold";
  label.style.textAlign = "center";
  label.style.pointerEvents = "none";
  label.style.transformOrigin = "center center";
  label.style.zIndex = zIndexCounter.toString(); // Set z-index for the label
  label.style.backgroundColor = "black"; // Black background
  label.style.borderRadius = "10px"; // Corner radius
  label.style.padding = "5px 10px"; // Padding inside the label
  label.style.maxWidth = "150px"; // Set a maximum width for the label
  label.style.whiteSpace = "nowrap"; // Prevent wrapping
  label.style.overflow = "hidden"; // Hide overflow text

  Matter.Events.on(engine, "afterUpdate", () => {
    const posX = cookie.position.x;
    const posY = cookie.position.y;

    // Set label's position relative to the canvas, compensating for its size
    label.style.left = `${posX}px`;
    label.style.top = `${posY}px`;
    label.style.transform = `translate(-50%, -50%) rotate(${cookie.angle}rad)`;
  });

  // Store the label element ID in the cookie object for future reference
  cookie.labelId = label.id;

  // Increment the global z-index counter for the next cookie
  zIndexCounter++;

  Composite.add(engine.world, cookie);
}

function createCrumb(x, y, size) {
  console.log(`images/crumbs/crumb${Math.floor(Math.random() * 6) + 1}.png`);
  var crumb = Bodies.circle(x, y, 20, {
    restitution: 0.2,
    render: {
      sprite: {
        texture: chrome.runtime.getURL(
          `images/crumbs/crumb${Math.floor(Math.random() * 6) + 1}.png`
        ),
        xScale: 1.5,
        yScale: 1.5,
      },
    },
    // Add a custom property to mark this body as a crumb
    isCrumb: true,
  });

  // // Add click event to trigger explodeCookie when clicked
  // cookie.render.sprite.clickHandler = () => explodeCookie(cookie);

  Composite.add(engine.world, crumb);

  const forceMagnitude = 0.2; // Adjust force for explosion
  const randomAngle = Math.random() * 2 * Math.PI;

  Matter.Body.applyForce(crumb, crumb.position, {
    x: forceMagnitude * Math.cos(randomAngle),
    y: forceMagnitude * Math.sin(randomAngle),
  });
}

function preventClickThrough() {
  document.addEventListener(
    "click",
    (event) => {
      if (selectedCookie) {
        // Prevent default browser behaviour
        event.preventDefault();

        // Stop the event from propagating to other elements
        event.stopPropagation();

        console.log(
          "Click prevented due to selected rigid body:",
          selectedCookie
        );
      }
    },
    true
  ); // Use the capture phase to intercept clicks before they reach other elements
}

function createCursorBody() {
  const cursorBody = Bodies.circle(0, 0, 50, {
    isStatic: true,
    density: 100, // Adjust for desired mass
    restitution: 1, // Bounciness
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

  let selectedCookie = null;

  // Handle hover (collisionStart)
  Matter.Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach((pair) => {
      if (pair.bodyA === cursorBody || pair.bodyB === cursorBody) {
        const cookieBody = pair.bodyA === cursorBody ? pair.bodyB : pair.bodyA;

        // If the body is a crumb, do nothing
        if (cookieBody.isCrumb) return;

        // Change texture to selected on hover
        if (cookieBody.render && cookieBody.render.sprite) {
          if (
            cookieBody.render.sprite.texture ===
            chrome.runtime.getURL(cookieTextures.bite1)
          ) {
            cookieBody.render.sprite.texture = chrome.runtime.getURL(
              cookieTextures.bite1Selected
            );
          } else if (
            cookieBody.render.sprite.texture ===
            chrome.runtime.getURL(cookieTextures.bite2)
          ) {
            cookieBody.render.sprite.texture = chrome.runtime.getURL(
              cookieTextures.bite2Selected
            );
          } else {
            cookieBody.render.sprite.texture = chrome.runtime.getURL(
              "images/cookie-selected.png"
            );
          }
        }

        selectedCookie = cookieBody;
      }
    });
  });

  // Handle hover out (collisionEnd)
  Matter.Events.on(engine, "collisionEnd", (event) => {
    event.pairs.forEach((pair) => {
      if (pair.bodyA === cursorBody || pair.bodyB === cursorBody) {
        const cookieBody = pair.bodyA === cursorBody ? pair.bodyB : pair.bodyA;

        // If the body is a crumb, do nothing
        if (cookieBody.isCrumb) return;

        // Reset texture to default when hover ends
        if (cookieBody.render && cookieBody.render.sprite) {
          if (
            cookieBody.render.sprite.texture ===
            chrome.runtime.getURL(cookieTextures.bite1Selected)
          ) {
            cookieBody.render.sprite.texture = chrome.runtime.getURL(
              cookieTextures.bite1
            );
          } else if (
            cookieBody.render.sprite.texture ===
            chrome.runtime.getURL(cookieTextures.bite2Selected)
          ) {
            cookieBody.render.sprite.texture = chrome.runtime.getURL(
              cookieTextures.bite2
            );
          } else {
            cookieBody.render.sprite.texture =
              chrome.runtime.getURL("images/cookie.png");
          }
        }

        selectedCookie = null;
      }
    });
  });

  // Handle click to explode
  document.addEventListener("click", () => {
    if (selectedCookie) {
      // Explode the cookie if it's not a crumb
      if (!selectedCookie.isCrumb) {
        explodeCookie(selectedCookie);
      }

      selectedCookie = null; // Clear the selection
    }
  });
}

function createBoundaries() {
  const thickness = 50;

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
          sizeCategory,
          cookie.name
        );
      }
    } else {
      console.error("Failed to retrieve cookies.");
    }
  }
);

// Prevent click-through functionality
preventClickThrough();

createBoundaries();
createCursorBody();

// run the renderer
Render.run(render);

// create runner
var runner = Runner.create();

// run the engine
Runner.run(runner, engine);
