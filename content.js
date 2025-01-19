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
    // Increased radius from 80 to 120
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

  // Track the currently selected cookie and displayed keys
  let selectedCookie = null;
  const displayedKeysMap = new Map(); // Map to store displayed keys for each cookie

  Matter.Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach((pair) => {
      if (pair.bodyA === cursorBody || pair.bodyB === cursorBody) {
        const cookieBody = pair.bodyA === cursorBody ? pair.bodyB : pair.bodyA;
        if (!selectedCookie && cookieBody.render && cookieBody.render.sprite) {
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
          } else if (!cookieBody.isCrumb) {
            cookieBody.render.sprite.texture = chrome.runtime.getURL(
              "images/cookie-selected.png"
            );
          }
          selectedCookie = cookieBody;
        }
      }
    });
  });

  Matter.Events.on(engine, "collisionEnd", (event) => {
    event.pairs.forEach((pair) => {
      if (pair.bodyA === cursorBody || pair.bodyB === cursorBody) {
        const cookieBody = pair.bodyA === cursorBody ? pair.bodyB : pair.bodyA;
        if (cookieBody === selectedCookie) {
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
              if (!cookieBody.isCrumb) {
                cookieBody.render.sprite.texture =
                  chrome.runtime.getURL("images/cookie.png");
              }
            }
            selectedCookie = null;
          }
        }
      }
    });
  });

  // Add click event listener to display a popup
  document.addEventListener("click", () => {
    if (selectedCookie) {
      // Create and style the modal
      const popup = document.createElement("div");
      popup.style.position = "fixed"; // Fixed positioning for the popup
      popup.style.top = "10%"; // Vertical positioning
      popup.style.left = "10%"; // Horizontal positioning
      popup.style.right = "10%"; // Width adjustment
      popup.style.bottom = "10%"; // Height adjustment
      popup.style.backgroundColor = "#f8f9fa"; // Background colour
      popup.style.padding = "30px"; // Inner padding
      popup.style.borderRadius = "20px"; // Rounded corners
      popup.style.boxShadow = "0px 8px 16px rgba(0, 0, 0, 0.2)"; // Subtle shadow
      popup.style.zIndex = "100000000"; // Ensure it appears on top
      popup.style.textAlign = "center"; // Centre-align text
      popup.style.overflowY = "auto"; // Enable scrolling for overflow content

      // Store the selected cookie in the popup's metadata
      popup.selectedCookie = selectedCookie;

      const title = document.createElement("h2");
      title.innerText = "Bite-Sized Fun Facts about this Cookie";
      title.style.marginBottom = "20px";
      title.style.color = "#333";
      popup.appendChild(title);

      const awaitingText = document.createElement("p");
      awaitingText.innerText = "Hang tight, the cookie fun facts are baking!";
      awaitingText.style.marginBottom = "20px";
      awaitingText.style.color = "#555";
      awaitingText.style.fontStyle = "italic";
      popup.appendChild(awaitingText);

      document.body.appendChild(popup);

      // Fetch cookies for the current domain
      chrome.runtime.sendMessage(
        { action: "getCookiesForCurrentDomain" },
        async (response) => {
          if (response && response.success) {
            console.log("Cookies retrieved successfully:", response.cookies);
            const cookies = response.cookies;
            const previousKeys = displayedKeysMap.get(selectedCookie.id) || [];

            // Filter out previously displayed keys
            const availableCookies = cookies.filter(
              (cookie) => !previousKeys.includes(cookie.name)
            );

            if (availableCookies.length === 0) {
              awaitingText.innerText =
                "No new cookie data to display for this cookie.";
              return;
            }

            const selectedCookies = availableCookies
              .sort(() => 0.5 - Math.random())
              .slice(0, 5); // Take 3 random cookies

            console.log("Selected cookies for display:", selectedCookies);

            // Make a request to Gemini for bite-sized information
            const geminiApiKey = "AIzaSyCHDovzSf3Xc5PZKAyc9snN7TYCytHvp38"; // Replace with your actual API key
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

            try {
              console.log("Sending request to Gemini API...");
              // Prepare prompt with full cookie key-value pairs
              const cookieDetails = selectedCookies
                .map(({ name, value }) => `${name}: ${value}`)
                .join(", ");
              const geminiPrompt = `Provide fun and interesting facts about this cookie data: ${cookieDetails}. Answer in plaintext and do not use markdown. 2 concise paragraphs with 2 \\n between. Add a big number of <strong> to bold keypoints.`;

              // Make a request to Gemini for bite-sized information
              const geminiResponse = await fetch(geminiUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [{ text: geminiPrompt }],
                    },
                  ],
                }),
              });

              const geminiData = await geminiResponse.json();
              console.log("Gemini API response:", geminiData);

              // Extract and render content
              const geminiContent =
                geminiData.candidates[0]?.content?.parts[0]?.text ||
                "No insights available.";

              // Render response with HTML tags to enable <strong>
              awaitingText.innerHTML = geminiContent;

              // Add table of selected cookies
              const table = document.createElement("table");
              table.style.width = "100%";
              table.style.borderCollapse = "collapse";
              table.style.marginBottom = "20px";

              // Populate table rows
              selectedCookies.forEach(({ name, value }) => {
                const row = document.createElement("tr");

                const keyCell = document.createElement("td");
                keyCell.innerText = name;
                keyCell.style.border = "1px solid #ddd";
                keyCell.style.padding = "8px";
                keyCell.style.textAlign = "left";
                keyCell.style.color = "#555";
                keyCell.style.maxWidth = "150px"; // Set a maximum width for the cell
                keyCell.style.wordWrap = "break-word"; // Ensure long words wrap
                keyCell.style.overflow = "hidden"; // Prevent overflow

                const valueCell = document.createElement("td");
                valueCell.innerText = value;
                valueCell.style.border = "1px solid #ddd";
                valueCell.style.padding = "8px";
                valueCell.style.textAlign = "left";
                valueCell.style.color = "#555";
                valueCell.style.maxWidth = "300px"; // Set a maximum width for the cell
                valueCell.style.wordWrap = "break-word"; // Ensure long words wrap
                valueCell.style.overflow = "hidden"; // Prevent overflow

                row.appendChild(keyCell);
                row.appendChild(valueCell);
                table.appendChild(row);
              });

              // Append the table to the popup
              popup.appendChild(table);
            } catch (error) {
              console.error("Error interacting with Gemini API:", error);
              awaitingText.innerText =
                "Uh-oh, looks like someone bit into a cookie we can't fetch!";
            }
            // Style the Close button
            const closeButton = document.createElement("button");
            closeButton.innerText = "Close";
            closeButton.style.display = "block"; // Ensure it spans the width
            closeButton.style.margin = "20px auto 0"; // Centre it below the table
            closeButton.style.width = "200px"; // Pill button width
            closeButton.style.height = "50px"; // Pill button height
            closeButton.style.padding = "10px";
            closeButton.style.backgroundColor = "#007bff";
            closeButton.style.color = "white";
            closeButton.style.border = "none";
            closeButton.style.borderRadius = "25px"; // Make it a pill shape
            closeButton.style.cursor = "pointer";
            closeButton.style.fontSize = "16px";
            closeButton.style.textAlign = "center";
            closeButton.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.2)";

            closeButton.addEventListener("mouseenter", () => {
              closeButton.style.backgroundColor = "#0056b3";
            });

            closeButton.addEventListener("mouseleave", () => {
              closeButton.style.backgroundColor = "#007bff";
            });

            // Add click event listener to the button
            closeButton.addEventListener("click", () => {
              document.body.removeChild(popup);
              explodeCookie(popup.selectedCookie); // Explode the cookie stored in the popup's metadata
              selectedCookie = null; // Clear the selection
            });
            // Append the Close button to the popup after the table
            popup.appendChild(closeButton);
          } else {
            console.error("Failed to retrieve cookies.");
            awaitingText.innerText = "Failed to retrieve cookies.";
          }
        }
      );
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
