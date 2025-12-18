/**
 * ApplyBotX Frontend JavaScript
 * Handles form submission, tabs, navigation, and user interactions
 */

// Initialize Liquid Ether Background Effect
let liquidEther;

// Wait for DOM to be ready before initializing
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM ready, initializing fluid background...');
  
  if (typeof THREE === 'undefined') {
    console.error('❌ THREE.js not loaded');
    return;
  }
  
  if (typeof LiquidEther === 'undefined') {
    console.error('❌ LiquidEther not loaded');
    return;
  }
  
  try {
    console.log('✅ Creating LiquidEther instance...');
    liquidEther = new LiquidEther('liquid-ether-bg', {
      colors: ['#5227FF', '#FF9FFC', '#B19EEF', '#8B5CF6', '#EC4899'],
      mouseForce: 35,
      cursorSize: 150,
      isViscous: false,
      viscous: 30,
      iterationsViscous: 32,
      iterationsPoisson: 32,
      dt: 0.016,
      BFECC: true,
      resolution: 0.5,
      isBounce: false,
      autoDemo: true,
      autoSpeed: 0.3,
      autoIntensity: 1.8,
      takeoverDuration: 0.25,
      autoResumeDelay: 3000,
      autoRampDuration: 0.6
    });
    console.log('✅ Fluid background initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing fluid background:', error);
  }
});

// DOM Elements
const form = document.getElementById('applicationForm');
const submitBtn = document.getElementById('submitBtn');
const responseMessage = document.getElementById('responseMessage');
const fileInput = document.getElementById('resume');
const fileNameDisplay = document.getElementById('fileName');

// Platform Tab Functionality
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const tabName = button.getAttribute('data-tab');
    
    // Remove active class from all buttons and contents
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to clicked button and corresponding content
    button.classList.add('active');
    document.getElementById(tabName).classList.add('active');
  });
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Active navigation link highlighting
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (window.pageYOffset >= sectionTop - 100) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#' + current) {
      link.classList.add('active');
    }
  });
});

// Update file name display when file is selected
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    fileNameDisplay.textContent = file.name;
  } else {
    fileNameDisplay.textContent = 'Choose PDF, DOC, or DOCX file';
  }
});

// Form submission handler
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Disable submit button and show loader
  setLoading(true);
  hideMessage();
  
  try {
    // Validate form
    const userName = document.getElementById('userName').value.trim();
    const userEmail = document.getElementById('userEmail').value.trim();
    const resume = fileInput.files[0];
    const jobPost = document.getElementById('jobPost').value.trim();
    
    // Basic validation
    if (!userName || !userEmail || !resume) {
      showMessage('Please fill in all required fields', 'error');
      setLoading(false);
      return;
    }
    
    // Validate file size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (resume.size > maxSize) {
      showMessage('File size too large. Maximum size is 10MB', 'error');
      setLoading(false);
      return;
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(resume.type)) {
      showMessage('Invalid file type. Please upload PDF or DOC file', 'error');
      setLoading(false);
      return;
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append('userName', userName);
    formData.append('userEmail', userEmail);
    formData.append('resume', resume);
    formData.append('jobPost', jobPost);
    
    // Send request to backend
    const response = await fetch('/api/process', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Success response
      if (data.data && data.data.recruiterEmail) {
        // Email automation path
        showMessage(
          `✅ ${data.message}<br><br>
          <strong>Sent to:</strong> ${data.data.recruiterEmail}<br>
          <strong>Subject:</strong> ${data.data.subject}`,
          'success'
        );
      } else {
        // Resume update path
        let message = `✅ ${data.message}`;
        
        if (data.data && data.data.skills && data.data.skills.length > 0) {
          message += `<br><br><strong>Extracted Skills:</strong><br>${data.data.skills.join(', ')}`;
        }
        
        if (data.data && data.data.experience && data.data.experience.length > 0) {
          message += `<br><br><strong>Experience:</strong><br>${data.data.experience.join('<br>')}`;
        }
        
        showMessage(message, 'success');
      }
      
      // Reset form after successful submission
      setTimeout(() => {
        form.reset();
        fileNameDisplay.textContent = 'Choose PDF, DOC, or DOCX file';
      }, 2000);
      
    } else {
      // Error response
      showMessage(`❌ ${data.message}`, 'error');
    }
    
  } catch (error) {
    console.error('Error:', error);
    showMessage('❌ Network error. Please check your connection and try again.', 'error');
  } finally {
    setLoading(false);
  }
});

/**
 * Show loading state on submit button
 * @param {Boolean} isLoading - Loading state
 */
function setLoading(isLoading) {
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');
  
  if (isLoading) {
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-flex';
  } else {
    submitBtn.disabled = false;
    btnText.style.display = 'inline-flex';
    btnLoader.style.display = 'none';
  }
}

/**
 * Show message to user
 * @param {String} message - Message text
 * @param {String} type - Message type (success/error)
 */
function showMessage(message, type) {
  responseMessage.innerHTML = message;
  responseMessage.className = `response-message ${type}`;
  responseMessage.style.display = 'block';
  
  // Scroll to message
  responseMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  if (type === 'success') {
    responseMessage.dataset.displayTime = Date.now();
  }
}

/**
 * Hide message
 */
function hideMessage() {
  responseMessage.style.display = 'none';
}

// Auto-hide success messages after 10 seconds
setInterval(() => {
  if (responseMessage.classList.contains('success') && responseMessage.style.display === 'block') {
    const displayTime = responseMessage.dataset.displayTime || 0;
    if (Date.now() - displayTime > 10000) {
      hideMessage();
    }
  }
}, 1000);

/**
 * Scroll to Top Button Functionality
 */
const scrollTopBtn = document.getElementById('scrollTopBtn');

// Show/hide scroll button based on scroll position
window.addEventListener('scroll', () => {
  if (window.pageYOffset > 300) {
    scrollTopBtn.classList.add('show');
  } else {
    scrollTopBtn.classList.remove('show');
  }
});

// Scroll to top when button is clicked
scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

// Add entrance animations on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe feature cards and timeline items
document.querySelectorAll('.feature-card, .timeline-item, .tg-feature').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});
