// Send a message to the background script to get cookies for the current domain
chrome.runtime.sendMessage({ action: "getCookiesForCurrentDomain" }, (response) => {
    if (response && response.success) {
      console.log("Cookies for the current", response.domain , response.cookies);
    } else {
      console.error("Failed to retrieve cookies.");
    }
  });
  
function displayCookie() {
    console.log("Displaying Cookie");
    const cookie = document.createElement('img');
    cookie.src = chrome.runtime.getURL('images/cookie.png');
    cookie.style.position = 'absolute';
    cookie.style.width = '100px';
    cookie.style.height = '100px';
    cookie.style.zIndex = '9999';
    cookie.style.top = `${Math.random() * window.innerHeight}px`;
    cookie.style.left = `${Math.random() * window.innerWidth}px`;
    document.body.appendChild(cookie);
    applyPhysics(cookie);
}

function checkCollision(element1, element2) {
  const rect1 = element1.getBoundingClientRect();
  const rect2 = element2.getBoundingClientRect();

  // Check if the bounding boxes overlap
  return !(rect1.right < rect2.left || 
           rect1.left > rect2.right || 
           rect1.bottom < rect2.top || 
           rect1.top > rect2.bottom);
}

// Apply physics to cookie
function applyPhysics(element) {
  let velocityY = Math.random() * 2 + 1; // Random downward speed
  let velocityX = (Math.random() - 0.5) * 4; // Random side speed
  const gravity = 0.1;

  // Get the bounding box of the viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Store the cookie in a global array for collision checks
  window.cookies = window.cookies || [];
  window.cookies.push(element);

  function animate() {
    const rect = element.getBoundingClientRect();
    let top = rect.top + velocityY;
    let left = rect.left + velocityX;

    // Viewport Boundaries

    if (top + element.clientHeight >= viewportHeight) {
      velocityY *= -0.7;
      top = viewportHeight - element.clientHeight;
    } else if (top <= 0) {
      velocityY *= -0.7;
      top = 0;
    } else {
      velocityY += gravity;
    }

    if (left + element.clientWidth >= viewportWidth) {
      velocityX *= -0.7;
      left = viewportWidth - element.clientWidth;
    } else if (left <= 0) {
      velocityX *= -0.7;
      left = 0;
    }

    // Check for collisions with other cookies (comment out for performance)
    for (let i = 0; i < window.cookies.length; i++) {
      const otherCookie = window.cookies[i];
      if (otherCookie !== element && checkCollision(element, otherCookie)) {
        // Apply elastic collision response
        const otherRect = otherCookie.getBoundingClientRect();
        
        const deltaX = (rect.left + rect.width / 2) - (otherRect.left + otherRect.width / 2);
        const deltaY = (rect.top + rect.height / 2) - (otherRect.top + otherRect.height / 2);
        
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance < element.clientWidth / 2 + otherCookie.clientWidth / 2) {
          // Normalize the collision direction
          const normalX = deltaX / distance;
          const normalY = deltaY / distance;

          const tempVelX = velocityX;
          const tempVelY = velocityY;

          velocityX = normalX * (velocityX * normalX + velocityY * normalY);
          velocityY = normalY * (velocityX * normalX + velocityY * normalY);

          otherCookie.style.left = `${otherCookie.offsetLeft + velocityX}px`;
          otherCookie.style.top = `${otherCookie.offsetTop + velocityY}px`;

          velocityX = tempVelX;
          velocityY = tempVelY;
        }
      }
    }

    element.style.top = `${top}px`;
    element.style.left = `${left}px`;
    requestAnimationFrame(animate);
  }

  animate();
}

for (let i = 0; i < 10; i++) {
  displayCookie();
}
