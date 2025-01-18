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
  const forceMagnitude = 2; // Adjust force for explosion
  const randomAngle = Math.random() * 2 * Math.PI;

  Matter.Body.applyForce(cookie, cookie.position, {
    x: forceMagnitude * Math.cos(randomAngle),
    y: forceMagnitude * Math.sin(randomAngle),
  });

  Composite.remove(engine.world, cookie);

  setTimeout(() => {
    for (let i = 0; i < 3; i++) {
      createCrumb(cookie.position.x, cookie.position.y, cookie.size);
    }

    // Logic for cookie transformation
    if (
      cookie.render.sprite.texture ===
      chrome.runtime.getURL(cookieTextures.full)
    ) {
      createTransformedCookie(cookie.position.x, cookie.position.y, "bite1");
    } else if (
      cookie.render.sprite.texture ===
      chrome.runtime.getURL(cookieTextures.bite1)
    ) {
      createTransformedCookie(cookie.position.x, cookie.position.y, "bite2");
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

function createTransformedCookie(x, y, state) {
  const config = cookieConfig.M; // Using M size for all transformed cookies

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

  // setTimeout(() => {
  //   explodeCookie(cookie);
  // }, 500);
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
      popup.style.position = "fixed";
      popup.style.top = "10%";
      popup.style.left = "10%";
      popup.style.right = "10%";
      popup.style.bottom = "10%";
      popup.style.backgroundColor = "#f8f9fa";
      popup.style.padding = "30px";
      popup.style.borderRadius = "20px";
      popup.style.boxShadow = "0px 8px 16px rgba(0, 0, 0, 0.2)";
      popup.style.zIndex = "1000000";
      popup.style.textAlign = "center";
      popup.style.overflowY = "auto";

      // Store the selected cookie in the popup's metadata
      popup.selectedCookie = selectedCookie;

      const title = document.createElement("h2");
      title.innerText = "Cookie Details";
      title.style.marginBottom = "20px";
      title.style.color = "#333";
      popup.appendChild(title);

      const awaitingText = document.createElement("p");
      awaitingText.innerText = "Awaiting response...";
      awaitingText.style.marginBottom = "20px";
      awaitingText.style.color = "#555";
      awaitingText.style.fontStyle = "italic";
      popup.appendChild(awaitingText);

      const closeButton = document.createElement("button");
      closeButton.innerText = "Close";
      closeButton.style.padding = "10px 20px";
      closeButton.style.backgroundColor = "#007bff";
      closeButton.style.color = "white";
      closeButton.style.border = "none";
      closeButton.style.borderRadius = "5px";
      closeButton.style.cursor = "pointer";
      closeButton.style.marginTop = "20px";

      closeButton.addEventListener("click", () => {
        document.body.removeChild(popup);
        explodeCookie(popup.selectedCookie); // Explode the cookie stored in the popup's metadata
        selectedCookie = null; // Clear the selection
      });

      popup.appendChild(closeButton);
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
              .slice(0, 3); // Take 3 random cookies

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
              const geminiPrompt = `Provide a concise and engaging 2-sentence summary of this cookie data: ${cookieDetails}. Answer in plaintext and do not use markdown.`;

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
              console.log(
                "Gemini API response:",
                geminiData.candidates[0].content.parts[0].text
              );
              const geminiContent = geminiData.candidates[0].content.parts[0]
                .text
                ? geminiData.candidates[0].content.parts[0].text
                : "No insights available.";

              awaitingText.innerText = geminiContent;

              // Add table of selected cookies
              const table = document.createElement("table");
              table.style.width = "100%";
              table.style.borderCollapse = "collapse";
              table.style.marginBottom = "20px";

              selectedCookies.forEach(({ name, value }) => {
                const row = document.createElement("tr");

                const keyCell = document.createElement("td");
                keyCell.innerText = name;
                keyCell.style.border = "1px solid #ddd";
                keyCell.style.padding = "8px";
                keyCell.style.textAlign = "left";
                keyCell.style.color = "#555";

                const valueCell = document.createElement("td");
                valueCell.innerText = value;
                valueCell.style.border = "1px solid #ddd";
                valueCell.style.padding = "8px";
                valueCell.style.textAlign = "left";
                valueCell.style.color = "#555";

                row.appendChild(keyCell);
                row.appendChild(valueCell);
                table.appendChild(row);
              });

              popup.appendChild(table);
            } catch (error) {
              console.error("Error interacting with Gemini API:", error);
              awaitingText.innerText =
                "Error fetching insights from Gemini API.";
            }
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
