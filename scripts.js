const images = document.querySelectorAll('.o1, .o2, .o3, .o4, .o5, .o6, .o7, .o8, .o9, .o10, .o11, .o12, .o13, .o14, .o15, .o16, .o17, .o18, .o19, .o20, .o21, .o22, .o23, .o24');
const defaultOpacity = '0';

// Use a single object to store image data
const imageData = {};
images.forEach(image => {
  imageData[image.className] = {
    opacity: localStorage.getItem(image.className) || defaultOpacity,
    src: null // Set initial src to null to avoid unnecessary lookups
  };
});

// Apply initial opacity directly
images.forEach(image => {
  image.style.opacity = imageData[image.className].opacity;
});

// Apply initial image source for o24 based on state (optimized for o24 only)
if (images[23].classList.contains('o24')) {
  switch (parseInt(localStorage.getItem('o24State')) || 0) {
    case 1:
      imageData[images[23].className].src = "242.png";
      break;
    case 2:
      imageData[images[23].className].src = "243.png";
      break;
    default:
      imageData[images[23].className].src = "241.png";
  }
}

// Use cached source and avoid redundant lookups
images.forEach(image => {
  image.addEventListener('click', () => {
    if (image.classList.contains('o24')) {
      switch (o24State) {
        case 0:
          imageData[image.className].src = "241.png";
          image.style.opacity = '1';
          o24State = 1;
          break;
        case 1:
          image.src = imageData[image.className].src || "242.png"; // Use cached source or default
          o24State = 2;
          break;
        case 2:
          image.src = imageData[image.className].src || "243.png"; // Use cached source or default
          o24State = 3;
          break;
        case 3:
          imageData[image.className].src = "241.png";
          image.style.opacity = '0';
          o24State = 0;
          break;
      }
    } else {
      image.style.opacity = image.style.opacity === '1' ? '0' : '1';
    }
    localStorage.setItem(image.className, image.style.opacity);
    localStorage.setItem('o24State', o24State);
  });
});
