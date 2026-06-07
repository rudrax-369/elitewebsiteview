import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// ==========================================
// STATE MANAGEMENT & CONSTANTS
// ==========================================
const TOTAL_FRAMES = 240;
const images = [];
let currentFrameIndex = 0;
let isLoaded = false;
let scrollSpeed = 0;
let targetScrollSpeed = 0;
let isWarping = false;

// Element Selectors
const preloaderEl = document.getElementById('preloader');
const percentEl = document.querySelector('.preloader-percent');
const progressBarEl = document.querySelector('.preloader-bar');
const statusEl = document.querySelector('.preloader-status');
const canvas = document.getElementById('image-canvas');
const context = canvas.getContext('2d');
const audioBtn = document.getElementById('audio-btn');
const restartBtn = document.getElementById('restart-btn');
const scrollPrompt = document.getElementById('scroll-prompt');

// HUD Selectors
const speedValEl = document.getElementById('speed-val');
const speedRing = document.querySelector('.speed-value-ring');
const tempValEl = document.getElementById('temp-val');
const gravValEl = document.getElementById('grav-val');
const velocityValEl = document.getElementById('velocity-val');
const coordLatEl = document.getElementById('coord-lat');
const coordLngEl = document.getElementById('coord-lng');
const coordDepthEl = document.getElementById('coord-depth');
const orbitNodeEl = document.getElementById('orbit-node');
const orbitLineEl = document.getElementById('orbit-line');
const orbitPhaseEl = document.getElementById('orbit-phase');
const sectorValEl = document.getElementById('sector-val');

// Phase details for HUD
const PHASES = [
  { name: 'EVENT HORIZON', sector: 'SECTOR: 8A-DELTA', baseLat: 23.4912, baseLng: 112.9803, baseG: 1.00, temp: 290 },
  { name: 'STELLAR CRUCIBLE', sector: 'SECTOR: 14F-NEBULA', baseLat: -45.1092, baseLng: 89.2312, baseG: 0.12, temp: 1240 },
  { name: 'THE VOID', sector: 'SECTOR: 00-VACUUM', baseLat: 0.0000, baseLng: 0.0000, baseG: 0.00, temp: 3 },
  { name: 'SINGULARITY', sector: 'SECTOR: BLACK-HOLE', baseLat: 89.9999, baseLng: -179.9999, baseG: 89.4, temp: 15 },
  { name: 'COSMIC DAWN', sector: 'SECTOR: 99-ORIGIN', baseLat: 12.8712, baseLng: -43.1902, baseG: 1.02, temp: 285 }
];

// Helper to pad numbers (e.g. 1 -> 001)
const padZero = (num, size = 3) => {
  let s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
};

// ==========================================
// LENIS SMOOTH SCROLL INITIALIZATION
// ==========================================
const lenis = new Lenis({
  duration: 1.5,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  gestureOrientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 1.0,
  touchMultiplier: 1.5,
  infinite: false,
});

// Stop scrolling initially during preload
lenis.stop();

// Sync ScrollTrigger with Lenis
lenis.on('scroll', (e) => {
  ScrollTrigger.update();

  // Track scroll speed (e.velocity represents scroll speed)
  targetScrollSpeed = Math.abs(e.velocity) || 0;
});

// Hide scroll prompt permanently the moment user starts scrolling
function hideScrollPromptOnce(e) {
  if (e.scroll > 5) {
    scrollPrompt.classList.add('hidden');
    lenis.off('scroll', hideScrollPromptOnce); // remove listener — never show again
  }
}
lenis.on('scroll', hideScrollPromptOnce);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// ==========================================
// PRELOADER & IMAGE LOADING MANAGER
// ==========================================
const preloadImages = () => {
  let loadedCount = 0;
  
  statusEl.textContent = "SYNCHRONIZING SPACETIME CORE...";
  
  // Create first frame image object to draw immediately
  const BASE = import.meta.env.BASE_URL;
  const firstFrameSrc = `${BASE}ezgif-696aee2f9bbf4735-png-split/ezgif-frame-001.png`;
  const firstImg = new Image();
  firstImg.src = firstFrameSrc;
  firstImg.onload = () => {
    images[0] = firstImg;
    resizeCanvas();
    renderFrame(0);
    loadRemaining();
  };
  
  firstImg.onerror = () => {
    console.error("Failed to load initial frame. Retrying...");
    loadRemaining();
  };

  function loadRemaining() {
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameNum = padZero(i);
      img.src = `${BASE}ezgif-696aee2f9bbf4735-png-split/ezgif-frame-${frameNum}.png`;
      
      img.onload = () => {
        images[i - 1] = img;
        loadedCount++;
        updateProgress(loadedCount);
      };
      
      img.onerror = () => {
        // Fallback or skip
        loadedCount++;
        updateProgress(loadedCount);
      };
    }
  }
};

const updateProgress = (loadedCount) => {
  const percent = Math.min(100, Math.floor((loadedCount / TOTAL_FRAMES) * 100));
  percentEl.textContent = `${padZero(percent, 2)}%`;
  progressBarEl.style.width = `${percent}%`;
  
  // Cyber status text updates based on percentage
  if (percent < 25) {
    statusEl.textContent = "CALIBRATING QUANTUM INERTIA...";
  } else if (percent < 50) {
    statusEl.textContent = "PRE-HEATING STELLAR SCANNER...";
  } else if (percent < 75) {
    statusEl.textContent = "WARPING COGNITIVE BUFFER...";
  } else if (percent < 99) {
    statusEl.textContent = "STABILIZING FORCE FIELD...";
  } else {
    statusEl.textContent = "NAVIGATION READY.";
    setTimeout(completePreload, 800);
  }
};

const completePreload = () => {
  if (isLoaded) return;
  isLoaded = true;
  
  preloaderEl.classList.add('fade-out');
  
  // Enable scrolling
  lenis.start();
  
  // Fade in HUD & Content elements
  gsap.to('.hud-container', { opacity: 1, duration: 1.5, delay: 0.5 });
  gsap.to('#scroll-prompt', { opacity: 1, duration: 1, delay: 1 });
  
  // Activate initial section content
  document.querySelector('#section-1 .section-content').classList.add('active');
  
  // Set up resize listener
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
};

// ==========================================
// CANVAS PLAYER & SCROLL SYNCHRONIZATION
// ==========================================
function renderFrame(index) {
  const img = images[index];
  if (!img) return;
  
  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight;
  const imgWidth = img.width || 1920;
  const imgHeight = img.height || 1080;
  
  const imgRatio = imgWidth / imgHeight;
  const canvasRatio = canvasWidth / canvasHeight;
  
  let drawWidth, drawHeight, drawX, drawY;
  
  if (canvasRatio > imgRatio) {
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgRatio;
    drawX = 0;
    drawY = (canvasHeight - drawHeight) / 2;
  } else {
    drawWidth = canvasHeight * imgRatio;
    drawHeight = canvasHeight;
    drawX = (canvasWidth - drawWidth) / 2;
    drawY = 0;
  }
  
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}

function resizeCanvas() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.scale(window.devicePixelRatio, window.devicePixelRatio);
  renderFrame(currentFrameIndex);
}

// Connect Frame Playback to Scroll Position via GSAP
const scrollObj = { frame: 0 };
gsap.to(scrollObj, {
  frame: TOTAL_FRAMES - 1,
  ease: 'none',
  scrollTrigger: {
    trigger: '.scroll-container',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.6,
    onUpdate: (self) => {
      currentFrameIndex = Math.floor(scrollObj.frame);
      renderFrame(currentFrameIndex);
      
      // Update HUD metrics based on scroll progress
      updateHUD(self.progress);
    }
  }
});

// ==========================================
// GSAP SECTION TELEPORTATION & TYPOGRAPHY REVEALS
// ==========================================
const sections = document.querySelectorAll('.scroll-section');
sections.forEach((sec, idx) => {
  const content = sec.querySelector('.section-content');
  
  ScrollTrigger.create({
    trigger: sec,
    start: 'top center',
    end: 'bottom center',
    onEnter: () => {
      content.classList.add('active');
      if (idx > 0) {
        // Hide previous scroll indicator once moving
        scrollPrompt.classList.add('hidden');
      }
    },
    onLeaveBack: () => {
      if (idx > 0) {
        content.classList.remove('active');
      }
      if (idx === 1) {
        // Re-show scroll indicator at top
        scrollPrompt.classList.remove('hidden');
      }
    },
    onEnterBack: () => {
      content.classList.add('active');
    },
    onLeave: () => {
      if (idx < sections.length - 1) {
        content.classList.remove('active');
      }
    }
  });
});

// ==========================================
// HUD DYNAMIC TELEMETRY MODULE
// ==========================================
function updateHUD(progress) {
  // Current depth
  const depth = progress * 100; // 0 to 100 MLY
  coordDepthEl.textContent = `${depth.toFixed(2)} MLY`;
  
  // Phase mapping (5 phases across progress 0.0 to 1.0)
  const phaseIndex = Math.min(PHASES.length - 1, Math.floor(progress * PHASES.length));
  const activePhase = PHASES[phaseIndex];
  
  orbitPhaseEl.textContent = `PHASE: ${activePhase.name}`;
  sectorValEl.textContent = activePhase.sector;
  
  // Dynamic coordinates based on progress + noise
  const phaseProgress = (progress * PHASES.length) % 1;
  const nextPhase = PHASES[Math.min(PHASES.length - 1, phaseIndex + 1)];
  
  const currentLat = activePhase.baseLat + (nextPhase.baseLat - activePhase.baseLat) * phaseProgress + Math.sin(Date.now() * 0.001) * 0.0002;
  const currentLng = activePhase.baseLng + (nextPhase.baseLng - activePhase.baseLng) * phaseProgress + Math.cos(Date.now() * 0.001) * 0.0002;
  
  coordLatEl.textContent = `${Math.abs(currentLat).toFixed(4)}°${currentLat >= 0 ? 'N' : 'S'}`;
  coordLngEl.textContent = `${Math.abs(currentLng).toFixed(4)}°${currentLng >= 0 ? 'E' : 'W'}`;
  
  // Temp and gravity indicator
  const currentTemp = Math.round(activePhase.temp + (nextPhase.temp - activePhase.temp) * phaseProgress);
  tempValEl.textContent = `${currentTemp} K`;
  
  const currentG = (activePhase.baseG + (nextPhase.baseG - activePhase.baseG) * phaseProgress).toFixed(2);
  gravValEl.textContent = `${currentG} G`;
  
  // SVG Orbit angle rotation (dot and needle line)
  const angle = progress * 360;
  const radius = 35; // orbit track radius
  const cx = 60;
  const cy = 60;
  const radians = (angle - 90) * (Math.PI / 180);
  
  const nx = cx + radius * Math.cos(radians);
  const ny = cy + radius * Math.sin(radians);
  
  orbitNodeEl.setAttribute('cx', nx);
  orbitNodeEl.setAttribute('cy', ny);
  orbitLineEl.setAttribute('x2', nx);
  orbitLineEl.setAttribute('y2', ny);
}

// ==========================================
// THREE.JS WEBGL INTERACTIVE STARFIELD
// ==========================================
const threeCanvas = document.getElementById('three-canvas');
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Renderer setup
const renderer = new THREE.WebGLRenderer({
  canvas: threeCanvas,
  alpha: true,
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Window resize for ThreeJS
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Interactive Line Starfield Creation
const MAX_STARS = 600;
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(MAX_STARS * 6); // 2 vertices per line (start + end) = 6 floats

// Star internal state
const stars = [];

for (let i = 0; i < MAX_STARS; i++) {
  const x = (Math.random() - 0.5) * 15;
  const y = (Math.random() - 0.5) * 15;
  const z = -Math.random() * 20; // depth placement
  
  const star = {
    x, y, z,
    speed: 0.05 + Math.random() * 0.05,
    length: 0.1 + Math.random() * 0.2
  };
  stars.push(star);
  
  // Set Line Segment points
  const idx = i * 6;
  starPositions[idx] = x;
  starPositions[idx + 1] = y;
  starPositions[idx + 2] = z;
  
  starPositions[idx + 3] = x;
  starPositions[idx + 4] = y;
  starPositions[idx + 5] = z - star.length;
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

// Material with subtle additive glowing color
const starMaterial = new THREE.LineBasicMaterial({
  color: 0xd8b4fe, // Indigo glow tint
  transparent: true,
  opacity: 0.6,
  blending: THREE.AdditiveBlending
});

const starField = new THREE.LineSegments(starGeometry, starMaterial);
scene.add(starField);

// Mouse interaction / Parallax target positions
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

window.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX - window.innerWidth / 2) / 100;
  mouseY = (e.clientY - window.innerHeight / 2) / 100;
});

// Three.js Render Loop
const animateThree = () => {
  requestAnimationFrame(animateThree);
  
  // Interpolate mouse coordinates (parallax inertia)
  targetX += (mouseX - targetX) * 0.05;
  targetY += (mouseY - targetY) * 0.05;
  
  // Tilt camera based on cursor
  camera.position.x = -targetX * 0.2;
  camera.position.y = targetY * 0.2;
  camera.lookAt(0, 0, -5);
  
  // Handle speed dynamics
  scrollSpeed += (targetScrollSpeed - scrollSpeed) * 0.1;
  // decay speed when scroll is idle
  targetScrollSpeed *= 0.95;
  if (targetScrollSpeed < 0.01) targetScrollSpeed = 0;
  
  // Map speed to speedometer gauge UI
  const maxSpeed = 15;
  const displaySpeed = Math.min(maxSpeed, scrollSpeed * 1.5);
  speedValEl.textContent = isWarping ? "99.9" : displaySpeed.toFixed(2);
  velocityValEl.textContent = isWarping ? "FTL ENGAGED" : `MACH ${Math.round(displaySpeed * 80)}`;
  
  // Update Speed Ring Dashboard SVGs
  const perimeter = 251.2;
  const dashOffset = perimeter - (Math.min(1, displaySpeed / maxSpeed) * perimeter);
  speedRing.setAttribute('stroke-dasharray', `${perimeter - dashOffset} ${dashOffset}`);
  
  // Star streaks update
  const positions = starField.geometry.attributes.position.array;
  
  for (let i = 0; i < MAX_STARS; i++) {
    const star = stars[i];
    
    // Scale velocity & length according to speed
    const currentSpeed = star.speed * (1 + scrollSpeed * 8);
    const starLength = star.length * (1 + scrollSpeed * 12);
    
    star.z += currentSpeed;
    
    // Reset star if it passes camera
    if (star.z > camera.position.z) {
      star.z = -20;
      star.x = (Math.random() - 0.5) * 15;
      star.y = (Math.random() - 0.5) * 15;
    }
    
    // Update buffer position array
    const idx = i * 6;
    
    // Start of line segment
    positions[idx] = star.x;
    positions[idx + 1] = star.y;
    positions[idx + 2] = star.z;
    
    // End of line segment (creates elongation streak)
    positions[idx + 3] = star.x;
    positions[idx + 4] = star.y;
    positions[idx + 5] = star.z - starLength;
  }
  
  starField.geometry.attributes.position.needsUpdate = true;
  
  // Custom rotation of star field
  starField.rotation.z += 0.0003 + (scrollSpeed * 0.001);
  
  renderer.render(scene, camera);
};

// Start the loop
animateThree();

// ==========================================
// SLOW MELODIC AMBIENT PAD (WEB AUDIO API)
// Am7 chord: A3-C4-E4-G4 — warm, dreamy, tech-ethereal
// ==========================================
let audioCtx = null;
let padOscillators = [];   // chord pad oscillators
let tremoloLFO = null;     // breathing amplitude LFO
let filterNode = null;
let gainNode = null;
let reverbDelay1 = null;
let reverbDelay2 = null;
let analyser = null;
let isAudioPlaying = false;

// Melodic chord notes — Am7 voicing (Hz)
const CHORD_NOTES = [
  220.00,  // A3  — root
  261.63,  // C4  — minor third
  329.63,  // E4  — fifth
  392.00,  // G4  — minor seventh
  440.00,  // A4  — octave (subtle shimmer)
];

// Slow note-drift: gently wander pitch for organic feel
const NOTE_DRIFT = [0, 0.8, -0.5, 1.2, -0.3];

function createPadOscillator(freq, drift) {
  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq + drift, audioCtx.currentTime);

  // Individual note volume — higher notes softer
  oscGain.gain.setValueAtTime(0.18, audioCtx.currentTime);

  osc.connect(oscGain);
  oscGain.connect(filterNode);

  // Slowly drift each note for a shimmer/chorus feel
  setInterval(() => {
    if (!audioCtx) return;
    const wobble = (Math.random() - 0.5) * 0.4;
    osc.frequency.setTargetAtTime(freq + drift + wobble, audioCtx.currentTime, 4.0);
  }, 6000 + Math.random() * 3000);

  osc.start(0);
  return osc;
}

function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // ── 1. Warm lowpass filter (cuts harsh highs, lets melody breathe)
  filterNode = audioCtx.createBiquadFilter();
  filterNode.type = 'lowpass';
  filterNode.frequency.setValueAtTime(1200, audioCtx.currentTime);
  filterNode.Q.setValueAtTime(0.8, audioCtx.currentTime);

  // ── 2. Hall reverb via two cross-fed delays (simulates long tail)
  reverbDelay1 = audioCtx.createDelay(4.0);
  reverbDelay1.delayTime.setValueAtTime(1.8, audioCtx.currentTime);

  reverbDelay2 = audioCtx.createDelay(4.0);
  reverbDelay2.delayTime.setValueAtTime(2.6, audioCtx.currentTime);

  const revGain1 = audioCtx.createGain();
  const revGain2 = audioCtx.createGain();
  revGain1.gain.setValueAtTime(0.35, audioCtx.currentTime);
  revGain2.gain.setValueAtTime(0.28, audioCtx.currentTime);

  // Cross-feedback loop for diffuse reverb tail
  reverbDelay1.connect(revGain1);
  revGain1.connect(reverbDelay2);
  reverbDelay2.connect(revGain2);
  revGain2.connect(reverbDelay1);

  // ── 3. Tremolo LFO (slow amplitude breathing — 0.08 Hz = ~12s cycle)
  tremoloLFO = audioCtx.createOscillator();
  tremoloLFO.type = 'sine';
  tremoloLFO.frequency.setValueAtTime(0.08, audioCtx.currentTime);

  const tremoloGain = audioCtx.createGain();
  tremoloGain.gain.setValueAtTime(0.07, audioCtx.currentTime); // subtle swell

  // ── 4. Master gain
  gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);

  // ── 5. Analyser for visualizer bars
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 32;

  // ── Signal routing
  // filter → gain → analyser → output
  filterNode.connect(gainNode);
  filterNode.connect(reverbDelay1); // send wet to reverb
  filterNode.connect(reverbDelay2);
  reverbDelay1.connect(gainNode);   // reverb tails → output
  reverbDelay2.connect(gainNode);

  gainNode.connect(analyser);
  analyser.connect(audioCtx.destination);

  // Tremolo modulates master gain
  tremoloLFO.connect(tremoloGain);
  tremoloGain.connect(gainNode.gain);

  // ── 6. Spawn chord oscillators
  CHORD_NOTES.forEach((freq, i) => {
    const osc = createPadOscillator(freq, NOTE_DRIFT[i]);
    padOscillators.push(osc);
  });

  tremoloLFO.start(0);

  // Slow melodic arpeggio — gently emphasise notes in sequence
  startMelodicArpeggio();

  animateAudioBars();
}

// Slow arpeggio: every ~3s softly swell one note for movement
let arpInterval = null;
function startMelodicArpeggio() {
  let arpStep = 0;
  const arpNotes = [0, 2, 4, 1, 3]; // index order through CHORD_NOTES

  arpInterval = setInterval(() => {
    if (!isAudioPlaying || !audioCtx) return;
    const noteIdx = arpNotes[arpStep % arpNotes.length];
    const targetFreq = CHORD_NOTES[noteIdx];

    // Gently bend the oscillator toward a slightly raised pitch and back
    if (padOscillators[noteIdx]) {
      padOscillators[noteIdx].frequency.setTargetAtTime(
        targetFreq * 1.005, audioCtx.currentTime, 0.6
      );
      padOscillators[noteIdx].frequency.setTargetAtTime(
        targetFreq, audioCtx.currentTime + 1.5, 1.2
      );
    }
    arpStep++;
  }, 3200);
}

function toggleAudio() {
  if (!audioCtx) {
    initAudio();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  if (isAudioPlaying) {
    // Soft fade-out over 2s
    gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
    gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2.0);
    audioBtn.classList.remove('playing');
    document.querySelector('.audio-text').textContent = 'SOUND OFF';
    isAudioPlaying = false;
  } else {
    // Slow fade-in over 3s for a dreamy entrance
    gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.30, audioCtx.currentTime + 3.0);
    audioBtn.classList.add('playing');
    document.querySelector('.audio-text').textContent = 'SOUND ON';
    isAudioPlaying = true;
  }
}

// Scroll modulation — gently open/close filter for mood shift
function modulateSynthOnScroll() {
  if (!isAudioPlaying || !audioCtx) return;
  const progress = lenis.scroll / (document.body.scrollHeight - window.innerHeight);
  // Filter opens warmly from 900 → 2400 Hz as you scroll
  const targetFreq = 900 + progress * 1500;
  filterNode.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 1.5);
}

lenis.on('scroll', modulateSynthOnScroll);

// Visualizer bars — gentle sine-driven animation when audio plays
const visualizerBars = document.querySelectorAll('.audio-visualizer .bar');
let barAnimTime = 0;
function animateAudioBars() {
  requestAnimationFrame(animateAudioBars);

  if (!isAudioPlaying) {
    visualizerBars.forEach(bar => { bar.style.height = '4px'; });
    return;
  }

  barAnimTime += 0.03;
  visualizerBars.forEach((bar, i) => {
    const wave = Math.sin(barAnimTime + i * 0.8) * 0.5 + 0.5;
    const height = 4 + wave * 13;
    bar.style.height = `${height}px`;
  });
}

audioBtn.addEventListener('click', toggleAudio);

// ==========================================
// Restart mission button scroll to top
restartBtn.addEventListener('click', () => {
  lenis.scrollTo(0, { duration: 2.5 });
  scrollPrompt.classList.remove('hidden');
});

// ==========================================
// KICKSTART PRELOADING PROCESS
// ==========================================
preloadImages();
