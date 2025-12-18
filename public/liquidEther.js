// Liquid Ether - Full WebGL Fluid Simulation
// Based on Navier-Stokes equations with Three.js
// Uses global THREE from CDN

(function() {
  'use strict';

  if (typeof THREE === 'undefined') {
    console.error('THREE.js is not loaded. Please load Three.js before liquidEther.js');
    return;
  }

class LiquidEther {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('LiquidEther: Container not found');
      return;
    }

    // Configuration
    this.config = {
      mouseForce: options.mouseForce || 20,
      cursorSize: options.cursorSize || 100,
      isViscous: options.isViscous !== undefined ? options.isViscous : false,
      viscous: options.viscous || 30,
      iterationsViscous: options.iterationsViscous || 32,
      iterationsPoisson: options.iterationsPoisson || 32,
      dt: options.dt || 0.014,
      BFECC: options.BFECC !== undefined ? options.BFECC : true,
      resolution: options.resolution || 0.5,
      isBounce: options.isBounce !== undefined ? options.isBounce : false,
      colors: options.colors || ['#5227FF', '#FF9FFC', '#B19EEF'],
      autoDemo: options.autoDemo !== undefined ? options.autoDemo : true,
      autoSpeed: options.autoSpeed || 0.5,
      autoIntensity: options.autoIntensity || 2.2,
      takeoverDuration: options.takeoverDuration || 0.25,
      autoResumeDelay: options.autoResumeDelay || 3000,
      autoRampDuration: options.autoRampDuration || 0.6
    };

    this.isRunning = false;
    this.animationId = null;
    this.paletteTex = null;
    this.common = null;
    this.mouse = null;
    this.autoDriver = null;
    this.output = null;
    
    this.init();
  }

  init() {
    this.container.style.position = this.container.style.position || 'relative';
    this.container.style.overflow = 'hidden';
    this.container.style.width = '100%';
    this.container.style.height = '100%';

    this.createPaletteTexture();
    this.initCommon();
    this.initMouse();
    this.initAutoDriver();
    this.initOutput();

    window.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.start();
      }
    });

    this.start();
  }

  createPaletteTexture() {
    const colors = this.config.colors;
    const w = colors.length;
    const data = new Uint8Array(w * 4);
    
    for (let i = 0; i < w; i++) {
      const c = new THREE.Color(colors[i]);
      data[i * 4 + 0] = Math.round(c.r * 255);
      data[i * 4 + 1] = Math.round(c.g * 255);
      data[i * 4 + 2] = Math.round(c.b * 255);
      data[i * 4 + 3] = 255;
    }
    
    this.paletteTex = new THREE.DataTexture(data, w, 1, THREE.RGBAFormat);
    this.paletteTex.magFilter = THREE.LinearFilter;
    this.paletteTex.minFilter = THREE.LinearFilter;
    this.paletteTex.wrapS = THREE.ClampToEdgeWrapping;
    this.paletteTex.wrapT = THREE.ClampToEdgeWrapping;
    this.paletteTex.needsUpdate = true;
  }

  initCommon() {
    const rect = this.container.getBoundingClientRect();
    this.common = {
      width: Math.max(1, Math.floor(rect.width)),
      height: Math.max(1, Math.floor(rect.height)),
      aspect: rect.width / rect.height,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      time: 0,
      delta: 0,
      clock: new THREE.Clock()
    };

    this.common.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.common.renderer.autoClear = false;
    this.common.renderer.setClearColor(new THREE.Color(0x000000), 0);
    this.common.renderer.setPixelRatio(this.common.pixelRatio);
    this.common.renderer.setSize(this.common.width, this.common.height);
    this.common.renderer.domElement.style.width = '100%';
    this.common.renderer.domElement.style.height = '100%';
    this.common.renderer.domElement.style.display = 'block';
    
    this.container.prepend(this.common.renderer.domElement);
    this.common.clock.start();
  }

  initMouse() {
    this.mouse = {
      coords: new THREE.Vector2(0, 0),
      coords_old: new THREE.Vector2(0, 0),
      diff: new THREE.Vector2(0, 0),
      isHoverInside: false,
      hasUserControl: false,
      isAutoActive: false,
      takeoverActive: false,
      takeoverStartTime: 0,
      takeoverFrom: new THREE.Vector2(0, 0),
      takeoverTo: new THREE.Vector2(0, 0)
    };

    this.lastUserInteraction = performance.now();

    const onMouseMove = (e) => {
      if (!this.isPointInside(e.clientX, e.clientY)) return;
      
      this.mouse.isHoverInside = true;
      const rect = this.container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      if (this.mouse.isAutoActive && !this.mouse.hasUserControl && !this.mouse.takeoverActive) {
        this.mouse.takeoverFrom.copy(this.mouse.coords);
        this.mouse.takeoverTo.set(nx, ny);
        this.mouse.takeoverStartTime = performance.now();
        this.mouse.takeoverActive = true;
        this.mouse.hasUserControl = true;
        this.mouse.isAutoActive = false;
        this.lastUserInteraction = performance.now();
        return;
      }

      this.mouse.coords.set(nx, ny);
      this.mouse.hasUserControl = true;
      this.lastUserInteraction = performance.now();
    };

    const onMouseLeave = () => {
      this.mouse.isHoverInside = false;
    };

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      if (!this.isPointInside(t.clientX, t.clientY)) return;
      
      this.mouse.isHoverInside = true;
      const rect = this.container.getBoundingClientRect();
      const nx = ((t.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((t.clientY - rect.top) / rect.height) * 2 - 1);
      this.mouse.coords.set(nx, ny);
      this.mouse.hasUserControl = true;
      this.lastUserInteraction = performance.now();
    };

    const onTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      if (!this.isPointInside(t.clientX, t.clientY)) return;
      
      const rect = this.container.getBoundingClientRect();
      const nx = ((t.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((t.clientY - rect.top) / rect.height) * 2 - 1);
      this.mouse.coords.set(nx, ny);
      this.lastUserInteraction = performance.now();
    };

    const onTouchEnd = () => {
      this.mouse.isHoverInside = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    this._mouseCleanup = () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }

  isPointInside(clientX, clientY) {
    if (!this.container) return false;
    const rect = this.container.getBoundingClientRect();
    return clientX >= rect.left && clientX <= rect.right && 
           clientY >= rect.top && clientY <= rect.bottom;
  }

  initAutoDriver() {
    this.autoDriver = {
      active: false,
      current: new THREE.Vector2(0, 0),
      target: new THREE.Vector2(),
      lastTime: performance.now(),
      activationTime: 0,
      margin: 0.2
    };
    this.pickNewAutoTarget();
  }

  pickNewAutoTarget() {
    const r = Math.random;
    const m = this.autoDriver.margin;
    this.autoDriver.target.set(
      (r() * 2 - 1) * (1 - m),
      (r() * 2 - 1) * (1 - m)
    );
  }

  updateAutoDriver() {
    if (!this.config.autoDemo) return;

    const now = performance.now();
    const idle = now - this.lastUserInteraction;

    if (idle < this.config.autoResumeDelay || this.mouse.isHoverInside) {
      if (this.autoDriver.active) {
        this.autoDriver.active = false;
        this.mouse.isAutoActive = false;
      }
      return;
    }

    if (!this.autoDriver.active) {
      this.autoDriver.active = true;
      this.autoDriver.current.copy(this.mouse.coords);
      this.autoDriver.lastTime = now;
      this.autoDriver.activationTime = now;
    }

    this.mouse.isAutoActive = true;

    let dtSec = (now - this.autoDriver.lastTime) / 1000;
    this.autoDriver.lastTime = now;
    if (dtSec > 0.2) dtSec = 0.016;

    const dir = this.autoDriver.target.clone().sub(this.autoDriver.current);
    const dist = dir.length();

    if (dist < 0.01) {
      this.pickNewAutoTarget();
      return;
    }

    dir.normalize();
    let ramp = 1;
    if (this.config.autoRampDuration > 0) {
      const t = Math.min(1, (now - this.autoDriver.activationTime) / (this.config.autoRampDuration * 1000));
      ramp = t * t * (3 - 2 * t);
    }

    const step = this.config.autoSpeed * dtSec * ramp;
    const move = Math.min(step, dist);
    this.autoDriver.current.addScaledVector(dir, move);
    this.mouse.coords.copy(this.autoDriver.current);
  }

  updateMouse() {
    if (this.mouse.takeoverActive) {
      const elapsed = performance.now() - this.mouse.takeoverStartTime;
      const t = Math.min(1, elapsed / (this.config.takeoverDuration * 1000));
      
      if (t >= 1) {
        this.mouse.takeoverActive = false;
        this.mouse.coords.copy(this.mouse.takeoverTo);
        this.mouse.coords_old.copy(this.mouse.coords);
        this.mouse.diff.set(0, 0);
        return;
      }
      
      const k = t * t * (3 - 2 * t);
      this.mouse.coords.lerpVectors(this.mouse.takeoverFrom, this.mouse.takeoverTo, k);
    }

    this.mouse.diff.subVectors(this.mouse.coords, this.mouse.coords_old);
    this.mouse.coords_old.copy(this.mouse.coords);
    
    if (this.mouse.coords_old.x === 0 && this.mouse.coords_old.y === 0) {
      this.mouse.diff.set(0, 0);
    }
    
    if (this.mouse.isAutoActive && !this.mouse.takeoverActive) {
      this.mouse.diff.multiplyScalar(this.config.autoIntensity);
    }
  }

  initOutput() {
    this.output = new Output(this);
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.common.width = Math.max(1, Math.floor(rect.width));
    this.common.height = Math.max(1, Math.floor(rect.height));
    this.common.aspect = this.common.width / this.common.height;
    
    if (this.common.renderer) {
      this.common.renderer.setSize(this.common.width, this.common.height, false);
    }
    
    if (this.output && this.output.simulation) {
      this.output.simulation.resize();
    }
  }

  render() {
    this.updateAutoDriver();
    this.updateMouse();
    
    this.common.delta = this.common.clock.getDelta();
    this.common.time += this.common.delta;
    
    if (this.output) {
      this.output.update();
    }
  }

  animate() {
    if (!this.isRunning) return;
    this.render();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  pause() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  destroy() {
    this.pause();
    
    if (this._mouseCleanup) {
      this._mouseCleanup();
    }
    
    if (this.common && this.common.renderer) {
      const canvas = this.common.renderer.domElement;
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      this.common.renderer.dispose();
    }
  }
}

// Shader code
const SHADERS = {
  face_vert: `
    attribute vec3 position;
    uniform vec2 px;
    uniform vec2 boundarySpace;
    varying vec2 uv;
    precision highp float;
    void main(){
      vec3 pos = position;
      vec2 scale = 1.0 - boundarySpace * 2.0;
      pos.xy = pos.xy * scale;
      uv = vec2(0.5)+(pos.xy)*0.5;
      gl_Position = vec4(pos, 1.0);
    }
  `,
  
  line_vert: `
    attribute vec3 position;
    uniform vec2 px;
    precision highp float;
    varying vec2 uv;
    void main(){
      vec3 pos = position;
      uv = 0.5 + pos.xy * 0.5;
      vec2 n = sign(pos.xy);
      pos.xy = abs(pos.xy) - px * 1.0;
      pos.xy *= n;
      gl_Position = vec4(pos, 1.0);
    }
  `,
  
  mouse_vert: `
    precision highp float;
    attribute vec3 position;
    attribute vec2 uv;
    uniform vec2 center;
    uniform vec2 scale;
    uniform vec2 px;
    varying vec2 vUv;
    void main(){
      vec2 pos = position.xy * scale * 2.0 * px + center;
      vUv = uv;
      gl_Position = vec4(pos, 0.0, 1.0);
    }
  `,
  
  advection_frag: `
    precision highp float;
    uniform sampler2D velocity;
    uniform float dt;
    uniform bool isBFECC;
    uniform vec2 fboSize;
    uniform vec2 px;
    varying vec2 uv;
    void main(){
      vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
      if(isBFECC == false){
        vec2 vel = texture2D(velocity, uv).xy;
        vec2 uv2 = uv - vel * dt * ratio;
        vec2 newVel = texture2D(velocity, uv2).xy;
        gl_FragColor = vec4(newVel, 0.0, 0.0);
      } else {
        vec2 spot_new = uv;
        vec2 vel_old = texture2D(velocity, uv).xy;
        vec2 spot_old = spot_new - vel_old * dt * ratio;
        vec2 vel_new1 = texture2D(velocity, spot_old).xy;
        vec2 spot_new2 = spot_old + vel_new1 * dt * ratio;
        vec2 error = spot_new2 - spot_new;
        vec2 spot_new3 = spot_new - error / 2.0;
        vec2 vel_2 = texture2D(velocity, spot_new3).xy;
        vec2 spot_old2 = spot_new3 - vel_2 * dt * ratio;
        vec2 newVel2 = texture2D(velocity, spot_old2).xy; 
        gl_FragColor = vec4(newVel2, 0.0, 0.0);
      }
    }
  `,
  
  color_frag: `
    precision highp float;
    uniform sampler2D velocity;
    uniform sampler2D palette;
    uniform vec4 bgColor;
    varying vec2 uv;
    void main(){
      vec2 vel = texture2D(velocity, uv).xy;
      float lenv = clamp(length(vel), 0.0, 1.0);
      vec3 c = texture2D(palette, vec2(lenv, 0.5)).rgb;
      vec3 outRGB = mix(bgColor.rgb, c, lenv);
      float outA = mix(bgColor.a, 1.0, lenv);
      gl_FragColor = vec4(outRGB, outA);
    }
  `,
  
  divergence_frag: `
    precision highp float;
    uniform sampler2D velocity;
    uniform float dt;
    uniform vec2 px;
    varying vec2 uv;
    void main(){
      float x0 = texture2D(velocity, uv-vec2(px.x, 0.0)).x;
      float x1 = texture2D(velocity, uv+vec2(px.x, 0.0)).x;
      float y0 = texture2D(velocity, uv-vec2(0.0, px.y)).y;
      float y1 = texture2D(velocity, uv+vec2(0.0, px.y)).y;
      float divergence = (x1 - x0 + y1 - y0) / 2.0;
      gl_FragColor = vec4(divergence / dt);
    }
  `,
  
  externalForce_frag: `
    precision highp float;
    uniform vec2 force;
    uniform vec2 center;
    uniform vec2 scale;
    uniform vec2 px;
    varying vec2 vUv;
    void main(){
      vec2 circle = (vUv - 0.5) * 2.0;
      float d = 1.0 - min(length(circle), 1.0);
      d *= d;
      gl_FragColor = vec4(force * d, 0.0, 1.0);
    }
  `,
  
  poisson_frag: `
    precision highp float;
    uniform sampler2D pressure;
    uniform sampler2D divergence;
    uniform vec2 px;
    varying vec2 uv;
    void main(){
      float p0 = texture2D(pressure, uv + vec2(px.x * 2.0, 0.0)).r;
      float p1 = texture2D(pressure, uv - vec2(px.x * 2.0, 0.0)).r;
      float p2 = texture2D(pressure, uv + vec2(0.0, px.y * 2.0)).r;
      float p3 = texture2D(pressure, uv - vec2(0.0, px.y * 2.0)).r;
      float div = texture2D(divergence, uv).r;
      float newP = (p0 + p1 + p2 + p3) / 4.0 - div;
      gl_FragColor = vec4(newP);
    }
  `,
  
  pressure_frag: `
    precision highp float;
    uniform sampler2D pressure;
    uniform sampler2D velocity;
    uniform vec2 px;
    uniform float dt;
    varying vec2 uv;
    void main(){
      float step = 1.0;
      float p0 = texture2D(pressure, uv + vec2(px.x * step, 0.0)).r;
      float p1 = texture2D(pressure, uv - vec2(px.x * step, 0.0)).r;
      float p2 = texture2D(pressure, uv + vec2(0.0, px.y * step)).r;
      float p3 = texture2D(pressure, uv - vec2(0.0, px.y * step)).r;
      vec2 v = texture2D(velocity, uv).xy;
      vec2 gradP = vec2(p0 - p1, p2 - p3) * 0.5;
      v = v - gradP * dt;
      gl_FragColor = vec4(v, 0.0, 1.0);
    }
  `,
  
  viscous_frag: `
    precision highp float;
    uniform sampler2D velocity;
    uniform sampler2D velocity_new;
    uniform float v;
    uniform vec2 px;
    uniform float dt;
    varying vec2 uv;
    void main(){
      vec2 old = texture2D(velocity, uv).xy;
      vec2 new0 = texture2D(velocity_new, uv + vec2(px.x * 2.0, 0.0)).xy;
      vec2 new1 = texture2D(velocity_new, uv - vec2(px.x * 2.0, 0.0)).xy;
      vec2 new2 = texture2D(velocity_new, uv + vec2(0.0, px.y * 2.0)).xy;
      vec2 new3 = texture2D(velocity_new, uv - vec2(0.0, px.y * 2.0)).xy;
      vec2 newv = 4.0 * old + v * dt * (new0 + new1 + new2 + new3);
      newv /= 4.0 * (1.0 + v * dt);
      gl_FragColor = vec4(newv, 0.0, 0.0);
    }
  `
};

// Shader Pass
class ShaderPass {
  constructor(liquidEther, props) {
    this.liquidEther = liquidEther;
    this.props = props || {};
    this.uniforms = this.props.material?.uniforms;
    this.scene = null;
    this.camera = null;
    this.material = null;
    this.geometry = null;
    this.plane = null;
    this.init();
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();
    if (this.uniforms) {
      this.material = new THREE.RawShaderMaterial(this.props.material);
      this.geometry = new THREE.PlaneGeometry(2.0, 2.0);
      this.plane = new THREE.Mesh(this.geometry, this.material);
      this.scene.add(this.plane);
    }
  }

  update() {
    this.liquidEther.common.renderer.setRenderTarget(this.props.output || null);
    this.liquidEther.common.renderer.render(this.scene, this.camera);
    this.liquidEther.common.renderer.setRenderTarget(null);
  }
}

// Advection Pass
class Advection extends ShaderPass {
  constructor(liquidEther, simProps) {
    super(liquidEther, {
      material: {
        vertexShader: SHADERS.face_vert,
        fragmentShader: SHADERS.advection_frag,
        uniforms: {
          boundarySpace: { value: simProps.cellScale },
          px: { value: simProps.cellScale },
          fboSize: { value: simProps.fboSize },
          velocity: { value: simProps.src.texture },
          dt: { value: simProps.dt },
          isBFECC: { value: true }
        }
      },
      output: simProps.dst
    });
    this.createBoundary();
  }

  createBoundary() {
    const boundaryG = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -1, -1, 0, -1, 1, 0, -1, 1, 0, 1, 1, 0, 
      1, 1, 0, 1, -1, 0, 1, -1, 0, -1, -1, 0
    ]);
    boundaryG.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const boundaryM = new THREE.RawShaderMaterial({
      vertexShader: SHADERS.line_vert,
      fragmentShader: SHADERS.advection_frag,
      uniforms: this.uniforms
    });
    this.line = new THREE.LineSegments(boundaryG, boundaryM);
    this.scene.add(this.line);
  }

  update({ dt, isBounce, BFECC }) {
    this.uniforms.dt.value = dt;
    this.line.visible = isBounce;
    this.uniforms.isBFECC.value = BFECC;
    super.update();
  }
}

// External Force Pass
class ExternalForce extends ShaderPass {
  constructor(liquidEther, simProps) {
    super(liquidEther, { output: simProps.dst });
    const mouseG = new THREE.PlaneGeometry(1, 1);
    const mouseM = new THREE.RawShaderMaterial({
      vertexShader: SHADERS.mouse_vert,
      fragmentShader: SHADERS.externalForce_frag,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        px: { value: simProps.cellScale },
        force: { value: new THREE.Vector2(0.0, 0.0) },
        center: { value: new THREE.Vector2(0.0, 0.0) },
        scale: { value: new THREE.Vector2(simProps.cursor_size, simProps.cursor_size) }
      }
    });
    this.mouse = new THREE.Mesh(mouseG, mouseM);
    this.scene.add(this.mouse);
  }

  update(props) {
    const forceX = (props.mouse.diff.x / 2) * props.mouse_force;
    const forceY = (props.mouse.diff.y / 2) * props.mouse_force;
    const cursorSizeX = props.cursor_size * props.cellScale.x;
    const cursorSizeY = props.cursor_size * props.cellScale.y;
    const centerX = Math.min(
      Math.max(props.mouse.coords.x, -1 + cursorSizeX + props.cellScale.x * 2),
      1 - cursorSizeX - props.cellScale.x * 2
    );
    const centerY = Math.min(
      Math.max(props.mouse.coords.y, -1 + cursorSizeY + props.cellScale.y * 2),
      1 - cursorSizeY - props.cellScale.y * 2
    );
    
    const uniforms = this.mouse.material.uniforms;
    uniforms.force.value.set(forceX, forceY);
    uniforms.center.value.set(centerX, centerY);
    uniforms.scale.value.set(props.cursor_size, props.cursor_size);
    super.update();
  }
}

// Viscous Pass
class Viscous extends ShaderPass {
  constructor(liquidEther, simProps) {
    super(liquidEther, {
      material: {
        vertexShader: SHADERS.face_vert,
        fragmentShader: SHADERS.viscous_frag,
        uniforms: {
          boundarySpace: { value: simProps.boundarySpace },
          velocity: { value: simProps.src.texture },
          velocity_new: { value: simProps.dst_.texture },
          v: { value: simProps.viscous },
          px: { value: simProps.cellScale },
          dt: { value: simProps.dt }
        }
      },
      output: simProps.dst,
      output0: simProps.dst_,
      output1: simProps.dst
    });
  }

  update({ viscous, iterations, dt }) {
    let fbo_in, fbo_out;
    this.uniforms.v.value = viscous;
    for (let i = 0; i < iterations; i++) {
      if (i % 2 === 0) {
        fbo_in = this.props.output0;
        fbo_out = this.props.output1;
      } else {
        fbo_in = this.props.output1;
        fbo_out = this.props.output0;
      }
      this.uniforms.velocity_new.value = fbo_in.texture;
      this.props.output = fbo_out;
      this.uniforms.dt.value = dt;
      super.update();
    }
    return fbo_out;
  }
}

// Divergence Pass
class Divergence extends ShaderPass {
  constructor(liquidEther, simProps) {
    super(liquidEther, {
      material: {
        vertexShader: SHADERS.face_vert,
        fragmentShader: SHADERS.divergence_frag,
        uniforms: {
          boundarySpace: { value: simProps.boundarySpace },
          velocity: { value: simProps.src.texture },
          px: { value: simProps.cellScale },
          dt: { value: simProps.dt }
        }
      },
      output: simProps.dst
    });
  }

  update({ vel }) {
    this.uniforms.velocity.value = vel.texture;
    super.update();
  }
}

// Poisson Pass
class Poisson extends ShaderPass {
  constructor(liquidEther, simProps) {
    super(liquidEther, {
      material: {
        vertexShader: SHADERS.face_vert,
        fragmentShader: SHADERS.poisson_frag,
        uniforms: {
          boundarySpace: { value: simProps.boundarySpace },
          pressure: { value: simProps.dst_.texture },
          divergence: { value: simProps.src.texture },
          px: { value: simProps.cellScale }
        }
      },
      output: simProps.dst,
      output0: simProps.dst_,
      output1: simProps.dst
    });
  }

  update({ iterations }) {
    let p_in, p_out;
    for (let i = 0; i < iterations; i++) {
      if (i % 2 === 0) {
        p_in = this.props.output0;
        p_out = this.props.output1;
      } else {
        p_in = this.props.output1;
        p_out = this.props.output0;
      }
      this.uniforms.pressure.value = p_in.texture;
      this.props.output = p_out;
      super.update();
    }
    return p_out;
  }
}

// Pressure Pass
class Pressure extends ShaderPass {
  constructor(liquidEther, simProps) {
    super(liquidEther, {
      material: {
        vertexShader: SHADERS.face_vert,
        fragmentShader: SHADERS.pressure_frag,
        uniforms: {
          boundarySpace: { value: simProps.boundarySpace },
          pressure: { value: simProps.src_p.texture },
          velocity: { value: simProps.src_v.texture },
          px: { value: simProps.cellScale },
          dt: { value: simProps.dt }
        }
      },
      output: simProps.dst
    });
  }

  update({ vel, pressure }) {
    this.uniforms.velocity.value = vel.texture;
    this.uniforms.pressure.value = pressure.texture;
    super.update();
  }
}

// Simulation
class Simulation {
  constructor(liquidEther, options) {
    this.liquidEther = liquidEther;
    this.options = {
      iterations_poisson: 32,
      iterations_viscous: 32,
      mouse_force: 20,
      resolution: 0.5,
      cursor_size: 100,
      viscous: 30,
      isBounce: false,
      dt: 0.014,
      isViscous: false,
      BFECC: true,
      ...options
    };
    
    this.fbos = {
      vel_0: null,
      vel_1: null,
      vel_viscous0: null,
      vel_viscous1: null,
      div: null,
      pressure_0: null,
      pressure_1: null
    };
    
    this.fboSize = new THREE.Vector2();
    this.cellScale = new THREE.Vector2();
    this.boundarySpace = new THREE.Vector2();
    
    this.init();
  }

  init() {
    this.calcSize();
    this.createAllFBO();
    this.createShaderPass();
  }

  getFloatType() {
    const isIOS = /(iPad|iPhone|iPod)/i.test(navigator.userAgent);
    return isIOS ? THREE.HalfFloatType : THREE.FloatType;
  }

  createAllFBO() {
    const type = this.getFloatType();
    const opts = {
      type,
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping
    };
    
    for (let key in this.fbos) {
      this.fbos[key] = new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, opts);
    }
  }

  createShaderPass() {
    this.advection = new Advection(this.liquidEther, {
      cellScale: this.cellScale,
      fboSize: this.fboSize,
      dt: this.options.dt,
      src: this.fbos.vel_0,
      dst: this.fbos.vel_1
    });
    
    this.externalForce = new ExternalForce(this.liquidEther, {
      cellScale: this.cellScale,
      cursor_size: this.options.cursor_size,
      dst: this.fbos.vel_1
    });
    
    this.viscous = new Viscous(this.liquidEther, {
      cellScale: this.cellScale,
      boundarySpace: this.boundarySpace,
      viscous: this.options.viscous,
      src: this.fbos.vel_1,
      dst: this.fbos.vel_viscous1,
      dst_: this.fbos.vel_viscous0,
      dt: this.options.dt
    });
    
    this.divergence = new Divergence(this.liquidEther, {
      cellScale: this.cellScale,
      boundarySpace: this.boundarySpace,
      src: this.fbos.vel_viscous0,
      dst: this.fbos.div,
      dt: this.options.dt
    });
    
    this.poisson = new Poisson(this.liquidEther, {
      cellScale: this.cellScale,
      boundarySpace: this.boundarySpace,
      src: this.fbos.div,
      dst: this.fbos.pressure_1,
      dst_: this.fbos.pressure_0
    });
    
    this.pressure = new Pressure(this.liquidEther, {
      cellScale: this.cellScale,
      boundarySpace: this.boundarySpace,
      src_p: this.fbos.pressure_0,
      src_v: this.fbos.vel_viscous0,
      dst: this.fbos.vel_0,
      dt: this.options.dt
    });
  }

  calcSize() {
    const width = Math.max(1, Math.round(this.options.resolution * this.liquidEther.common.width));
    const height = Math.max(1, Math.round(this.options.resolution * this.liquidEther.common.height));
    const px_x = 1.0 / width;
    const px_y = 1.0 / height;
    this.cellScale.set(px_x, px_y);
    this.fboSize.set(width, height);
  }

  resize() {
    this.calcSize();
    for (let key in this.fbos) {
      this.fbos[key].setSize(this.fboSize.x, this.fboSize.y);
    }
  }

  update() {
    if (this.options.isBounce) {
      this.boundarySpace.set(0, 0);
    } else {
      this.boundarySpace.copy(this.cellScale);
    }
    
    this.advection.update({
      dt: this.options.dt,
      isBounce: this.options.isBounce,
      BFECC: this.options.BFECC
    });
    
    this.externalForce.update({
      cursor_size: this.options.cursor_size,
      mouse_force: this.options.mouse_force,
      cellScale: this.cellScale,
      mouse: this.liquidEther.mouse
    });
    
    let vel = this.fbos.vel_1;
    if (this.options.isViscous) {
      vel = this.viscous.update({
        viscous: this.options.viscous,
        iterations: this.options.iterations_viscous,
        dt: this.options.dt
      });
    }
    
    this.divergence.update({ vel });
    const pressure = this.poisson.update({
      iterations: this.options.iterations_poisson
    });
    this.pressure.update({ vel, pressure });
  }
}

// Output
class Output {
  constructor(liquidEther) {
    this.liquidEther = liquidEther;
    this.init();
  }

  init() {
    this.simulation = new Simulation(this.liquidEther, {
      iterations_poisson: this.liquidEther.config.iterationsPoisson,
      iterations_viscous: this.liquidEther.config.iterationsViscous,
      mouse_force: this.liquidEther.config.mouseForce,
      resolution: this.liquidEther.config.resolution,
      cursor_size: this.liquidEther.config.cursorSize,
      viscous: this.liquidEther.config.viscous,
      isBounce: this.liquidEther.config.isBounce,
      dt: this.liquidEther.config.dt,
      isViscous: this.liquidEther.config.isViscous,
      BFECC: this.liquidEther.config.BFECC
    });
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();
    
    this.output = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.RawShaderMaterial({
        vertexShader: SHADERS.face_vert,
        fragmentShader: SHADERS.color_frag,
        transparent: true,
        depthWrite: false,
        uniforms: {
          velocity: { value: this.simulation.fbos.vel_0.texture },
          boundarySpace: { value: new THREE.Vector2() },
          palette: { value: this.liquidEther.paletteTex },
          bgColor: { value: new THREE.Vector4(0, 0, 0, 0) }
        }
      })
    );
    this.scene.add(this.output);
  }

  resize() {
    this.simulation.resize();
  }

  render() {
    this.liquidEther.common.renderer.setRenderTarget(null);
    this.liquidEther.common.renderer.render(this.scene, this.camera);
  }

  update() {
    this.simulation.update();
    this.render();
  }
}

// Export to global scope
window.LiquidEther = LiquidEther;
console.log('✅ LiquidEther loaded successfully');

})(); // End of IIFE
