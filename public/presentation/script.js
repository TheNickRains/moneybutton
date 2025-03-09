document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const slides = document.querySelectorAll('.slide');
  const totalSlides = slides.length;
  const prevBtn = document.getElementById('prevSlide');
  const nextBtn = document.getElementById('nextSlide');
  const currentSlideDisplay = document.getElementById('currentSlide');
  const totalSlidesDisplay = document.getElementById('totalSlides');
  const progressBar = document.getElementById('progressBar');
  
  // Set initial state
  let currentSlide = 0;
  totalSlidesDisplay.textContent = totalSlides;
  
  // Update progress bar width
  const updateProgressBar = () => {
    const progressWidth = ((currentSlide + 1) / totalSlides) * 100;
    progressBar.style.width = `${progressWidth}%`;
  };
  
  // Update slide counter
  const updateSlideCounter = () => {
    currentSlideDisplay.textContent = currentSlide + 1;
  };
  
  // Go to specific slide
  const goToSlide = (slideIndex) => {
    // Remove active class from current slide
    slides[currentSlide].classList.remove('active');
    
    // Set new current slide
    currentSlide = slideIndex;
    
    // Handle wraparound
    if (currentSlide < 0) {
      currentSlide = totalSlides - 1;
    } else if (currentSlide >= totalSlides) {
      currentSlide = 0;
    }
    
    // Add active class to new current slide
    slides[currentSlide].classList.add('active');
    
    // Update UI
    updateProgressBar();
    updateSlideCounter();
  };
  
  // Event listeners for navigation buttons
  prevBtn.addEventListener('click', () => {
    goToSlide(currentSlide - 1);
  });
  
  nextBtn.addEventListener('click', () => {
    goToSlide(currentSlide + 1);
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowLeft':
        goToSlide(currentSlide - 1);
        break;
      case 'ArrowRight':
      case 'Space':
        goToSlide(currentSlide + 1);
        break;
    }
  });
  
  // Touch/swipe support
  let touchStartX = 0;
  let touchEndX = 0;
  
  const handleTouchStart = (e) => {
    touchStartX = e.changedTouches[0].screenX;
  };
  
  const handleTouchEnd = (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  };
  
  const handleSwipe = () => {
    // Minimum swipe distance (px)
    const minSwipeDistance = 50;
    
    // Calculate swipe distance
    const swipeDistance = touchEndX - touchStartX;
    
    // Detect swipe direction if minimum distance is met
    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swipe right, go to previous slide
        goToSlide(currentSlide - 1);
      } else {
        // Swipe left, go to next slide
        goToSlide(currentSlide + 1);
      }
    }
  };
  
  // Add touch event listeners
  document.addEventListener('touchstart', handleTouchStart, false);
  document.addEventListener('touchend', handleTouchEnd, false);
  
  // Initialize first slide
  goToSlide(0);
  
  // Automatic background animation
  const createStars = () => {
    const container = document.body;
    const starCount = 100;
    
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.classList.add('star');
      
      // Random positioning
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      
      // Random size (1-3px)
      const size = Math.random() * 2 + 1;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      
      // Random opacity and animation delay
      star.style.opacity = Math.random() * 0.8 + 0.2;
      star.style.animationDelay = `${Math.random() * 10}s`;
      
      container.appendChild(star);
    }
  };
  
  // Add dynamic stars to background
  const addStarStyles = () => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .star {
        position: fixed;
        background-color: white;
        border-radius: 50%;
        z-index: -1;
        animation: twinkle 5s infinite ease-in-out;
      }
      
      @keyframes twinkle {
        0%, 100% { opacity: 0.2; }
        50% { opacity: 0.8; }
      }
    `;
    document.head.appendChild(styleElement);
    
    createStars();
  };
  
  // Add background stars
  addStarStyles();
  
  // Optional: Preload images to avoid flicker
  const preloadImages = () => {
    const imageUrl = './images/money-button-interface.png';
    const img = new Image();
    img.src = imageUrl;
  };
  
  preloadImages();
  
  // Create directory for images if it doesn't exist
  const checkAndCreateImagesDir = async () => {
    try {
      const response = await fetch('./images/');
      if (!response.ok) {
        console.warn('Images directory might not exist. Make sure to create it and add your product screenshot.');
      }
    } catch (error) {
      console.warn('Could not check for images directory. This is expected in local development.');
    }
  };
  
  checkAndCreateImagesDir();
}); 