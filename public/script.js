/**
 * ApplyBotX Frontend JavaScript
 * Handles form submission and user interactions
 */

// DOM Elements
const form = document.getElementById('applicationForm');
const submitBtn = document.getElementById('submitBtn');
const responseMessage = document.getElementById('responseMessage');
const fileInput = document.getElementById('resume');
const fileNameDisplay = document.getElementById('fileName');

// Update file name display when file is selected
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    fileNameDisplay.textContent = file.name;
  } else {
    fileNameDisplay.textContent = 'Choose PDF or DOC file (Max 10MB)';
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
        fileNameDisplay.textContent = 'Choose PDF or DOC file (Max 10MB)';
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
    btnText.style.display = 'inline';
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

// Store display time when showing success message
const originalShowMessage = showMessage;
showMessage = function(message, type) {
  originalShowMessage(message, type);
  if (type === 'success') {
    responseMessage.dataset.displayTime = Date.now();
  }
};
