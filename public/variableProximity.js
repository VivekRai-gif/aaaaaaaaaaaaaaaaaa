/**
 * Variable Proximity Effect - Vanilla JS
 * Creates font weight variation based on mouse proximity to text
 */

class VariableProximityEffect {
  constructor(element, options = {}) {
    this.element = element;
    this.radius = options.radius || 120;
    this.fromWeight = options.fromWeight || 400;
    this.toWeight = options.toWeight || 900;
    this.falloff = options.falloff || 'linear';
    
    this.letters = [];
    this.mousePos = { x: 0, y: 0 };
    this.isActive = false;
    
    this.init();
  }
  
  init() {
    // Split text into individual letter spans
    const text = this.element.textContent;
    this.element.innerHTML = '';
    
    // Split by words to preserve spacing
    const words = text.split(' ');
    
    words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement('span');
      wordSpan.style.display = 'inline-block';
      wordSpan.style.whiteSpace = 'nowrap';
      
      word.split('').forEach(letter => {
        const letterSpan = document.createElement('span');
        letterSpan.textContent = letter;
        letterSpan.style.display = 'inline-block';
        letterSpan.style.fontVariationSettings = `'wght' ${this.fromWeight}`;
        letterSpan.style.transition = 'font-variation-settings 0.1s ease-out';
        
        this.letters.push(letterSpan);
        wordSpan.appendChild(letterSpan);
      });
      
      this.element.appendChild(wordSpan);
      
      // Add space between words
      if (wordIndex < words.length - 1) {
        const space = document.createElement('span');
        space.innerHTML = '&nbsp;';
        space.style.display = 'inline-block';
        this.element.appendChild(space);
      }
    });
    
    // Bind events
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.updateLetters = this.updateLetters.bind(this);
    
    window.addEventListener('mousemove', this.handleMouseMove);
    
    // Start animation loop
    this.startAnimationLoop();
  }
  
  handleMouseMove(e) {
    this.mousePos.x = e.clientX;
    this.mousePos.y = e.clientY;
    this.isActive = true;
  }
  
  calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }
  
  calculateFalloff(distance) {
    const norm = Math.min(Math.max(1 - distance / this.radius, 0), 1);
    
    switch (this.falloff) {
      case 'exponential':
        return norm ** 2;
      case 'gaussian':
        return Math.exp(-((distance / (this.radius / 2)) ** 2) / 2);
      case 'linear':
      default:
        return norm;
    }
  }
  
  updateLetters() {
    if (!this.isActive) return;
    
    this.letters.forEach(letterSpan => {
      const rect = letterSpan.getBoundingClientRect();
      const letterCenterX = rect.left + rect.width / 2;
      const letterCenterY = rect.top + rect.height / 2;
      
      const distance = this.calculateDistance(
        this.mousePos.x,
        this.mousePos.y,
        letterCenterX,
        letterCenterY
      );
      
      if (distance >= this.radius) {
        letterSpan.style.fontVariationSettings = `'wght' ${this.fromWeight}`;
        return;
      }
      
      const falloffValue = this.calculateFalloff(distance);
      const interpolatedWeight = this.fromWeight + (this.toWeight - this.fromWeight) * falloffValue;
      
      letterSpan.style.fontVariationSettings = `'wght' ${Math.round(interpolatedWeight)}`;
    });
  }
  
  startAnimationLoop() {
    const loop = () => {
      this.updateLetters();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  
  destroy() {
    window.removeEventListener('mousemove', this.handleMouseMove);
  }
}

// Auto-initialize on elements with data-variable-proximity attribute
document.addEventListener('DOMContentLoaded', () => {
  const elements = document.querySelectorAll('[data-variable-proximity]');
  
  elements.forEach(element => {
    const radius = parseInt(element.dataset.radius) || 120;
    const fromWeight = parseInt(element.dataset.fromWeight) || 400;
    const toWeight = parseInt(element.dataset.toWeight) || 900;
    const falloff = element.dataset.falloff || 'linear';
    
    new VariableProximityEffect(element, {
      radius,
      fromWeight,
      toWeight,
      falloff
    });
  });
});
