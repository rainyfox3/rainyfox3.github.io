// e5!
// elephant4
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
  images[23].src = "241.png"; 
} else if (o24State === 2) {
  images[23].src = "242.png"; 
} else if (o24State === 3) { 
  images[23].src = "243.png"; 
} else if (o24State === 0) { 
  images[23].src = "241.png";
  images[23].style.opacity = '0'; 
}

// Add click event listeners
images.forEach(image => {
  image.addEventListener('click', () => {
    if (image.classList.contains('o24')) {
      switch (o24State) {
        case 0:
          image.src = "241.png"; 
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
          image.src = "241.png"; 
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
