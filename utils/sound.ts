// Simple synthesized sound effects using Web Audio API
// No external assets required

const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
const ctx = new AudioContext();

let isMuted = false;
let isHapticsEnabled = true;

export const toggleMute = () => {
  isMuted = !isMuted;
  return isMuted;
};

export const getMuteStatus = () => isMuted;

export const toggleHaptics = () => {
  isHapticsEnabled = !isHapticsEnabled;
  return isHapticsEnabled;
};

export const getHapticsStatus = () => isHapticsEnabled;

export const playHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error') => {
  if (!isHapticsEnabled || !navigator.vibrate) return;
  
  switch (type) {
    case 'light':
      navigator.vibrate(10);
      break;
    case 'medium':
      navigator.vibrate(30);
      break;
    case 'heavy':
      navigator.vibrate(50);
      break;
    case 'success':
      navigator.vibrate([10, 30, 20]);
      break;
    case 'error':
      navigator.vibrate([30, 40, 30]);
      break;
  }
};

const playTone = (freq: number, type: OscillatorType, duration: number, delay = 0) => {
  if (isMuted) return;
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
  
  gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + delay + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
};

export const playSound = (type: 'click' | 'success' | 'error' | 'start' | 'tick' | 'win') => {
  if (!isMuted) {
    switch (type) {
      case 'click':
        playTone(400, 'sine', 0.1);
        break;
      case 'success':
        playTone(600, 'sine', 0.1);
        playTone(800, 'sine', 0.2, 0.1);
        break;
      case 'error':
        playTone(300, 'sawtooth', 0.2);
        playTone(200, 'sawtooth', 0.3, 0.2);
        break;
      case 'start':
        playTone(400, 'sine', 0.2);
        playTone(500, 'sine', 0.2, 0.1);
        playTone(600, 'sine', 0.4, 0.2);
        break;
      case 'tick':
        playTone(800, 'square', 0.05);
        break;
      case 'win':
        playTone(500, 'sine', 0.2);
        playTone(700, 'sine', 0.2, 0.2);
        playTone(900, 'sine', 0.4, 0.4);
        break;
    }
  }

  // Trigger corresponding haptics
  switch (type) {
    case 'click':
      playHaptic('light');
      break;
    case 'success':
    case 'win':
      playHaptic('success');
      break;
    case 'error':
      playHaptic('error');
      break;
    case 'start':
      playHaptic('medium');
      break;
    case 'tick':
      playHaptic('light');
      break;
  }
};