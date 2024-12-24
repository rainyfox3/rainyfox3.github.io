/* Place your JavaScript in this file */

/*const images = document.querySelectorAll('.o1, .o2');

images.forEach(image => {
  image.addEventListener('click', () => {
    image.style.opacity = image.style.opacity === '1' ? '0' : '1';
  });
});

// Reset opacity on page load
window.addEventListener('load', () => {
  images.forEach(image => {
    image.style.opacity = '0';
  });
});*/

const images = document.querySelectorAll('.o1, .o2, .o3, .o4, .o5, .o6, .o7, .o8, .o9, .o10, .o11, .o12, .o13, .o14, .o15, .o16, .o17, .o18, .o19, .o20, .o21, .o22, .o23, .o24');

const defaultOpacity = '0'; // Set the default opacity
let o24State = parseInt(localStorage.getItem('o24State')) || 0; // Retrieve o24State from local storage

images.forEach(image => {
  const className = image.className;
  localStorage.setItem(className, localStorage.getItem(className) || defaultOpacity);
});

// Apply initial opacity based on local storage
images.forEach(image => {
  const className = image.className;
  const storedOpacity = localStorage.getItem(className);
  image.style.opacity = storedOpacity;
});

// Apply initial image source for o24 based on state
if (o24State === 1) {
  images[23].src = "242.png"; // Assuming o24 is the 24th image in the array
} else if (o24State === 2) {
  images[23].src = "243.png"; // Assuming o24 is the 24th image in the array
}

// Add click event listeners
images.forEach(image => {
  image.addEventListener('click', () => {
    if (image.classList.contains('o24')) {
      switch (o24State) {
        case 0:
          image.style.opacity = '1';
          o24State = 1;
          break;
        case 1:
          image.src = "242.png";
          o24State = 2;
          break;
        case 2:
          image.src = "243.png";
          o24State = 3;
          break;
        case 3:
          image.style.opacity = '0';
          o24State = 0;
          break;
      }
    } else {
      image.style.opacity = image.style.opacity === '1' ? '0' : '1';
    }
    localStorage.setItem(image.className, image.style.opacity);
    localStorage.setItem('o24State', o24State); // Store o24State in local storage
  });
});

/*const images = document.querySelectorAll('.o1, .o2, .o3, .o4, .o5, .o6, .o7, .o8, .o9, .o10, .o11, .o12, .o13, .o14, .o15, .o16, .o17, .o18, .o19, .o20, .o21, .o22, .o23');

const defaultOpacity = '0'; // Set the default opacity

images.forEach(image => {
  const className = image.className;
  localStorage.setItem(className, localStorage.getItem(className) || defaultOpacity); 
});

// Apply initial opacity based on local storage
images.forEach(image => {
  const className = image.className;
  const storedOpacity = localStorage.getItem(className);
  image.style.opacity = storedOpacity; 
});

// Add click event listeners
images.forEach(image => {
  image.addEventListener('click', () => {
    image.style.opacity = image.style.opacity === '1' ? '0' : '1';
  });
});

// Update local storage on opacity change
images.forEach(image => {
  image.addEventListener('click', () => {
    const className = image.className;
    localStorage.setItem(className, image.style.opacity);
  });
});*/

/*const images = document.querySelectorAll('.o1, .o2, .o3, .o4, .o5, .o6, .o7, .o8, .o9, .o10, .o11, .o12, .o13, .o14, .o15, .o16, .o17, .o18, .o19, .o20, .o21');

const defaultOpacity = '0'; // Set the default opacity

images.forEach(image => {
  const className = image.className;
  localStorage.setItem(className, localStorage.getItem(className) || defaultOpacity); 
});

images.forEach(image => {
  image.addEventListener('click', () => {
    image.style.opacity = image.style.opacity === '1' ? '0' : '1';
  });
});

images.forEach(image => {
  const className = image.className;
  const storedOpacity = localStorage.getItem(className);
  image.style.opacity = storedOpacity; 
});

images.forEach(image => {
  image.addEventListener('click', () => {
    const className = image.className;
    localStorage.setItem(className, image.style.opacity);
  });
});
*/
/*const images = document.querySelectorAll('.o1, .o2, .o3, .o4, .o5, .o6, .o7, .o8, .o9, .o10, .o11, .o12, .o13, .o14, .o15, .o16, .o17, .o18, .o19, .o20, .o21');

images.forEach(image => {
  image.addEventListener('click', () => {
    image.style.opacity = image.style.opacity === '1' ? '0' : '1';
  });
});

// Store the opacity state in local storage
images.forEach(image => {
  const className = image.className;
  const storedOpacity = localStorage.getItem(className);
  if (storedOpacity) {
    image.style.opacity = storedOpacity;
  }
});

// Update local storage on opacity change
images.forEach(image => {
  image.addEventListener('click', () => {
    const className = image.className;
    localStorage.setItem(className, image.style.opacity);
  });
});*/
