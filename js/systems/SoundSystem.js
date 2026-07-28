// === SOUND SYSTEM ===
// Web Audio API를 사용한 프로시저럴 효과음 시스템
// 외부 사운드 파일 없이 합성음으로 피드백 제공

import EventBus        from '../core/EventBus.js';
import SettingsManager from '../core/SettingsManager.js';

let audioCtx = null;
let enabled = true;
let volume = 0.3;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(freq, duration, type = 'sine', vol = volume) {
  if (!enabled) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch { /* 오디오 에러 무시 */ }
}

function playNoise(duration, vol = volume * 0.5) {
  if (!enabled) return;
  try {
    const ctx = getCtx();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch { /* 오디오 에러 무시 */ }
}

const SoundSystem = {
  init() {
    // SettingsManager에서 초기값 로드
    enabled = SettingsManager.get('sound.enabled') ?? true;
    volume  = SettingsManager.get('sound.volume')  ?? 0.3;

    // 설정 변경 시 실시간 반영
    EventBus.on('settingsChanged', ({ key, value }) => {
      if (key === 'sound.enabled') enabled = !!value;
      if (key === 'sound.volume')  volume = Math.max(0, Math.min(1, value));
    });

    // 전투 타격 단위 효과음 — CombatFxPlayer._playFx가 발행하는 combatSfx 구독
    EventBus.on('combatSfx', (fx) => this._playCombatSfx(fx));

    // 전투 효과음
    EventBus.on('combatEnd', ({ outcome }) => {
      if (outcome === 'victory') {
        playTone(523, 0.15, 'square'); // C5
        setTimeout(() => playTone(659, 0.15, 'square'), 100); // E5
        setTimeout(() => playTone(784, 0.25, 'square'), 200); // G5
      } else if (outcome === 'defeat') {
        playTone(294, 0.3, 'sawtooth');
        setTimeout(() => playTone(220, 0.5, 'sawtooth'), 200);
      }
    });

    // 제작 완료
    EventBus.on('craftComplete', () => {
      playTone(880, 0.1, 'sine');
      setTimeout(() => playTone(1047, 0.15, 'sine'), 80);
    });

    // 제작 실패
    EventBus.on('craftFailed', () => {
      playTone(330, 0.2, 'sawtooth');
      setTimeout(() => playTone(220, 0.3, 'sawtooth'), 150);
    });

    // 알림 효과음 (타입별)
    EventBus.on('notify', ({ type }) => {
      switch (type) {
        case 'danger':
          playTone(440, 0.08, 'square', volume * 0.4);
          setTimeout(() => playTone(440, 0.08, 'square', volume * 0.4), 120);
          break;
        case 'good':
          playTone(660, 0.1, 'sine', volume * 0.3);
          break;
        case 'warn':
          playTone(370, 0.12, 'triangle', volume * 0.3);
          break;
      }
    });

    // 카드 배치
    EventBus.on('cardPlaced', () => {
      playTone(600, 0.05, 'sine', volume * 0.2);
    });

    // 카드 제거
    EventBus.on('cardRemoved', () => {
      playTone(300, 0.08, 'triangle', volume * 0.2);
    });

    // 소음 인플럭스
    EventBus.on('noiseInflux', () => {
      playNoise(0.4, volume * 0.6);
      setTimeout(() => playTone(220, 0.3, 'sawtooth', volume * 0.5), 200);
    });

    // 위험 스탯 경고
    EventBus.on('statCritical', () => {
      playTone(880, 0.06, 'square', volume * 0.2);
    });

    // 첫 클릭으로 AudioContext 활성화 (브라우저 정책)
    const resumeCtx = () => {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    };
    document.addEventListener('click', resumeCtx, { once: true });
    document.addEventListener('touchstart', resumeCtx, { once: true });
  },

  // 전투 연출 kind → 합성음. 승리/패배/사망은 combatEnd 징글이 담당하므로 제외.
  _playCombatSfx(fx) {
    if (!fx?.kind) return;
    const ATTACK_KINDS = new Set([
      'playerAttack', 'enemyAttack', 'companionAttack', 'enemyAttackCompanion', 'companionSkill',
    ]);

    if (ATTACK_KINDS.has(fx.kind)) {
      if (fx.miss) {
        playTone(220, 0.09, 'sine', volume * 0.25);
        return;
      }
      if (fx.killed) {
        playNoise(0.16, volume * 0.55);
        setTimeout(() => playTone(110, 0.28, 'sawtooth', volume * 0.5), 40);
        return;
      }
      if (fx.crit) {
        playTone(170, 0.12, 'square', volume * 0.55);
        playNoise(0.08, volume * 0.4);
        return;
      }
      if (fx.fx === 'shot') {
        playNoise(0.05, volume * 0.5);
        playTone(140, 0.06, 'square', volume * 0.35);
      } else {
        playTone(160, 0.08, 'triangle', volume * 0.4);
      }
      return;
    }

    switch (fx.kind) {
      case 'explode':
        playNoise(0.5, volume * 0.7);
        playTone(80, 0.5, 'sawtooth', volume * 0.6);
        break;
      case 'status':
        playTone(520, 0.07, 'triangle', volume * 0.25);
        setTimeout(() => playTone(392, 0.1, 'triangle', volume * 0.2), 70);
        break;
      case 'guard':
        playTone(300, 0.06, 'square', volume * 0.25);
        break;
      case 'companionHeal':
      case 'useItem':
      case 'companionBuff':
      case 'playerSkill':
        playTone(660, 0.08, 'sine', volume * 0.25);
        setTimeout(() => playTone(880, 0.1, 'sine', volume * 0.2), 70);
        break;
      case 'move':
      case 'rankSwap':
      case 'advance':
        playNoise(0.05, volume * 0.2);
        break;
      case 'summon':
        playTone(196, 0.2, 'sawtooth', volume * 0.35);
        setTimeout(() => playTone(262, 0.15, 'sawtooth', volume * 0.3), 140);
        break;
    }
  },

  setEnabled(val) { enabled = !!val; },
  isEnabled() { return enabled; },
  setVolume(v) { volume = Math.max(0, Math.min(1, v)); },
  getVolume() { return volume; },
};

export default SoundSystem;
