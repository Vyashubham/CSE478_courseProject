// Parallax scrolling effect
document.addEventListener("scroll", () => {
    const scrollPosition = window.scrollY;
    const header = document.querySelector(".parallax-header");
  
    header.style.backgroundPositionY = `${scrollPosition * 0.5}px`;
  });
  
  // JavaScript for Scroll-based Animation
document.addEventListener("DOMContentLoaded", () => {
    const sections = document.querySelectorAll(".intro, .conclusion, .visual_section");
  
    const observerOptions = {
      root: null, // Observe relative to the viewport
      threshold: 0.1, // Trigger when 10% of the section is visible
    };
  
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fade-in");
          observer.unobserve(entry.target); // Stop observing once animated
        }
      });
    }, observerOptions);
  
    sections.forEach(section => {
      section.classList.add("hidden"); // Add initial hidden state
      observer.observe(section); // Observe the section
    });
  });
  