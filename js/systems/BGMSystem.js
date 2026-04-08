// === BGM SYSTEM ===
// Web Audio API 프로시저럴 앰비언트 BGM.
// 외부 파일 없이 합성음으로 포스트아포칼립스 분위기 생성.
// 게임 상태(화면, 계절, 시간대, 날씨)에 따라 적응형 변화.

import EventBus        from '../core/EventBus.js';
import GameState       from '../core/GameState.js';
import SettingsManager from '../core/SettingsManager.js';
import GameData       from '../data/GameData.js';

// ── 음계 주파수 ──────────────────────────────────────────────
const NOTE = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.0, B2: 123.5,
  C3: 130.8, D3: 146.8, Eb3: 155.6, E3: 164.8, F3: 174.6, G3: 196.0, Ab3: 207.7, A3: 220.0, Bb3: 233.1, B3: 246.9,
  C4: 261.6, D4: 293.7, Eb4: 311.1, E4: 329.6, F4: 349.2, G4: 392.0, Ab4: 415.3, A4: 440.0, Bb4: 466.2, B4: 493.9,
  C5: 523.3, D5: 587.3, E5: 659.3, F5: 698.5, G5: 784.0,
};

// ── 분위기별 음계 (마이너/감소 스케일 중심 — 포스트아포칼립스) ──
const SCALES = {
  // 기본: D 마이너 (어둡고 불안)
  basecamp:  [NOTE.D3, NOTE.F3, NOTE.A3, NOTE.D4, NOTE.F4, NOTE.A3, NOTE.E3, NOTE.G3],
  // 탐색: A 마이너 (긴장)
  explore:   [NOTE.A2, NOTE.C3, NOTE.E3, NOTE.A3, NOTE.C4, NOTE.E3, NOTE.B2, NOTE.D3],
  // 전투: E 프리지안 (공격적, 긴박)
  combat:    [NOTE.E3, NOTE.F3, NOTE.Ab3, NOTE.B3, NOTE.C4, NOTE.E3, NOTE.F3, NOTE.E3],
  // 밤: Bb 마이너 (쓸쓸)
  night:     [NOTE.Bb3, NOTE.D4, NOTE.F3, NOTE.Bb3, NOTE.Ab3, NOTE.F3, NOTE.Eb3, NOTE.Bb3],
  // 겨울: C 마이너 (차갑고 고요)
  winter:    [NOTE.C3, NOTE.Eb3, NOTE.G3, NOTE.C4, NOTE.Eb4, NOTE.G3, NOTE.D3, NOTE.F3],
  // 여름: G 도리안 (무겁고 습한)
  summer:    [NOTE.G3, NOTE.Bb3, NOTE.C4, NOTE.D4, NOTE.F4, NOTE.D4, NOTE.Bb3, NOTE.A3],
  // 위험: 반음계적 (불협)
  danger:    [NOTE.E3, NOTE.F3, NOTE.E3, NOTE.Eb3, NOTE.D3, NOTE.Eb3, NOTE.E3, NOTE.F3],
  // 메뉴: D 서스펜디드 (몽환적)
  menu:      [NOTE.D4, NOTE.G4, NOTE.A4, NOTE.D5, NOTE.G4, NOTE.A4, NOTE.E4, NOTE.D4],
};

// ── BGM System ───────────────────────────────────────────────

const BGMSystem = {
  _ctx: null,
  _masterGain: null,
  _enabled: true,
  _bgmVolume: 0.15,
  _playing: false,
  _currentMood: 'basecamp',
  _intervalId: null,
  _stepIndex: 0,
  _activeSources: [],

  // 드론 노드들
  _droneOsc1: null,
  _droneOsc2: null,
  _droneGain: null,
  _padGain: null,

  init() {
    const bgmEnabled = SettingsManager.get('bgm.enabled') ?? true;
    const soundEnabled = SettingsManager.get('sound.enabled') ?? true;
    this._enabled = bgmEnabled && soundEnabled;
    this._bgmVolume = (SettingsManager.get('sound.volume') ?? 0.3) * 0.5; // BGM은 SFX의 50%

    EventBus.on('settingsChanged', ({ key, value }) => {
      if (key === 'sound.enabled' || key === 'bgm.enabled') {
        const bgm = SettingsManager.get('bgm.enabled') ?? true;
        const snd = SettingsManager.get('sound.enabled') ?? true;
        this._enabled = bgm && snd;
        if (!this._enabled) this.stop(); else this._tryStart();
      }
      if (key === 'sound.volume') {
        this._bgmVolume = Math.max(0, Math.min(1, value)) * 0.5;
        if (this._masterGain) {
          this._masterGain.gain.setTargetAtTime(this._bgmVolume, this._ctx.currentTime, 0.3);
        }
      }
    });

    // 화면 전환에 따른 분위기 변경
    EventBus.on('stateTransition', ({ to }) => {
      if (to === 'combat' || to === 'encounter') this._setMood('combat');
      else if (to === 'main_menu') this._setMood('menu');
      else if (to === 'basecamp') this._updateBasecampMood();
      else if (to === 'game_over') this.stop();
    });

    // TP 진행에 따른 시간대 분위기 변화
    EventBus.on('tpAdvance', () => {
      if (this._currentMood !== 'combat' && this._currentMood !== 'menu') {
        this._updateBasecampMood();
      }
    });

    // 첫 유저 인터랙션으로 시작
    const starter = () => {
      this._tryStart();
      document.removeEventListener('click', starter);
      document.removeEventListener('touchstart', starter);
    };
    document.addEventListener('click', starter);
    document.addEventListener('touchstart', starter);
  },

  // ── 외부 API ─────────────────────────────────────────────

  stop() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    this._stopDrone();
    this._playing = false;
  },

  // ── 분위기 결정 ──────────────────────────────────────────

  _updateBasecampMood() {
    const gs = GameState;
    const hour = gs.time?.hour ?? 12;
    const season = gs.season?.current ?? 'spring';
    const danger = this._getCurrentDanger();

    let mood = 'basecamp';

    // 위험 우선
    if (danger >= 4) mood = 'danger';
    // 야간
    else if (hour >= 22 || hour < 5) mood = 'night';
    // 계절
    else if (season === 'winter') mood = 'winter';
    else if (season === 'summer') mood = 'summer';

    this._setMood(mood);
  },

  _getCurrentDanger() {
    const distId = GameState.location?.currentDistrict;
    if (!distId) return 1;
    const dist = GameData?.districts?.[distId];
    return dist?.dangerLevel ?? 1;
  },

  _setMood(mood) {
    if (mood === this._currentMood && this._playing) return;
    this._currentMood = mood;
    if (this._playing) {
      this._transitionDrone(mood);
      this._stepIndex = 0;
    }
  },

  // ── 시작 ─────────────────────────────────────────────────

  _tryStart() {
    if (!this._enabled || this._playing) return;

    try {
      if (!this._ctx) {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this._ctx.state === 'suspended') {
        this._ctx.resume();
      }

      // 마스터 게인
      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.value = this._bgmVolume;
      this._masterGain.connect(this._ctx.destination);

      this._playing = true;
      this._startDrone(this._currentMood);
      this._startMelody();
    } catch { /* AudioContext 실패 무시 */ }
  },

  // ── 드론 (지속적 배경음) ─────────────────────────────────

  _startDrone(mood) {
    if (!this._ctx || !this._masterGain) return;
    const ctx = this._ctx;
    const scale = SCALES[mood] ?? SCALES.basecamp;
    const root = scale[0];

    // 드론 게인
    this._droneGain = ctx.createGain();
    this._droneGain.gain.value = 0.12;
    this._droneGain.connect(this._masterGain);

    // 오실레이터 1: 루트 드론
    this._droneOsc1 = ctx.createOscillator();
    this._droneOsc1.type = 'sine';
    this._droneOsc1.frequency.value = root * 0.5; // 1옥타브 아래
    this._droneOsc1.connect(this._droneGain);
    this._droneOsc1.start();

    // 오실레이터 2: 5도 위 (음산한 하모닉)
    this._droneOsc2 = ctx.createOscillator();
    this._droneOsc2.type = 'triangle';
    this._droneOsc2.frequency.value = root * 0.75; // 5도
    const drone2Gain = ctx.createGain();
    drone2Gain.gain.value = 0.06;
    this._droneOsc2.connect(drone2Gain);
    drone2Gain.connect(this._masterGain);
    this._droneOsc2.start();

    // 패드: 필터링된 노이즈 (바람 소리)
    this._padGain = ctx.createGain();
    this._padGain.gain.value = this._getWindVolume(mood);
    this._padGain.connect(this._masterGain);

    const bufSize = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);

    this._noiseSource = ctx.createBufferSource();
    this._noiseSource.buffer = buf;
    this._noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = mood === 'combat' ? 400 : mood === 'winter' ? 600 : 250;
    filter.Q.value = 1;

    this._noiseSource.connect(filter);
    filter.connect(this._padGain);
    this._noiseSource.start();
  },

  _stopDrone() {
    try { this._droneOsc1?.stop(); } catch {}
    try { this._droneOsc2?.stop(); } catch {}
    try { this._noiseSource?.stop(); } catch {}
    this._droneOsc1 = null;
    this._droneOsc2 = null;
    this._noiseSource = null;
    this._droneGain = null;
    this._padGain = null;
  },

  _transitionDrone(mood) {
    const ctx = this._ctx;
    if (!ctx) return;
    const scale = SCALES[mood] ?? SCALES.basecamp;
    const root = scale[0];
    const now = ctx.currentTime;

    // 부드럽게 주파수 전환 (2초)
    if (this._droneOsc1) {
      this._droneOsc1.frequency.setTargetAtTime(root * 0.5, now, 2);
    }
    if (this._droneOsc2) {
      this._droneOsc2.frequency.setTargetAtTime(root * 0.75, now, 2);
    }
    // 바람 볼륨 조정
    if (this._padGain) {
      this._padGain.gain.setTargetAtTime(this._getWindVolume(mood), now, 1.5);
    }
  },

  _getWindVolume(mood) {
    if (mood === 'winter') return 0.08;
    if (mood === 'night') return 0.05;
    if (mood === 'combat') return 0.03;
    if (mood === 'danger') return 0.06;
    return 0.04;
  },

  // ── 멜로디 (간헐적 음표) ─────────────────────────────────

  _startMelody() {
    if (this._intervalId) clearInterval(this._intervalId);
    this._stepIndex = 0;

    // 3~6초마다 한 음표씩 재생 (포스트아포칼립스 = 느리고 희소)
    this._intervalId = setInterval(() => {
      if (!this._playing || !this._enabled) return;
      this._playNote();
    }, 3500 + Math.random() * 2500);
  },

  _playNote() {
    const ctx = this._ctx;
    if (!ctx || !this._masterGain) return;

    const scale = SCALES[this._currentMood] ?? SCALES.basecamp;
    const freq = scale[this._stepIndex % scale.length];
    this._stepIndex++;

    // 전투 중에는 더 빠르고 날카로운 음
    const isCombat = this._currentMood === 'combat' || this._currentMood === 'danger';
    const isDark = this._currentMood === 'night' || this._currentMood === 'winter';

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    // 음색 결정
    if (isCombat) {
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.frequency.setValueAtTime(freq, now);
    } else if (isDark) {
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.8);  // 느린 페이드인
      gain.gain.exponentialRampToValueAtTime(0.001, now + 4); // 긴 페이드아웃
      osc.frequency.setValueAtTime(freq, now);
    } else if (this._currentMood === 'menu') {
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 5);
      osc.frequency.setValueAtTime(freq, now);
      // 약간의 비브라토
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 3;
      lfoGain.gain.value = 2;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);
      lfo.stop(now + 5);
    } else {
      // 베이스캠프: 깨끗한 사인파, 중간 지속
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3);
      osc.frequency.setValueAtTime(freq, now);
    }

    osc.connect(gain);
    gain.connect(this._masterGain);

    const duration = isCombat ? 1.5 : isDark ? 4.5 : this._currentMood === 'menu' ? 5.5 : 3.5;
    osc.start(now);
    osc.stop(now + duration);

    // 간헐적으로 리버브 효과 (에코)
    if (Math.random() < 0.3 && !isCombat) {
      const delay = ctx.createDelay(1);
      delay.delayTime.value = 0.4 + Math.random() * 0.3;
      const echoGain = ctx.createGain();
      echoGain.gain.value = 0.02;

      const echoOsc = ctx.createOscillator();
      echoOsc.type = 'sine';
      echoOsc.frequency.value = freq * (isDark ? 0.5 : 1);
      const echoEnv = ctx.createGain();
      echoEnv.gain.setValueAtTime(0, now + delay.delayTime.value);
      echoEnv.gain.linearRampToValueAtTime(0.025, now + delay.delayTime.value + 0.3);
      echoEnv.gain.exponentialRampToValueAtTime(0.001, now + delay.delayTime.value + 3);

      echoOsc.connect(echoEnv);
      echoEnv.connect(this._masterGain);
      echoOsc.start(now + delay.delayTime.value);
      echoOsc.stop(now + delay.delayTime.value + 3.5);
    }

    // 전투: 간헐적 퍼커션 노이즈
    if (isCombat && Math.random() < 0.4) {
      const bufSize = ctx.sampleRate * 0.08;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
      const ns = ctx.createBufferSource();
      ns.buffer = buf;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.06, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      ns.connect(ng);
      ng.connect(this._masterGain);
      ns.start(now + 0.05);
    }
  },
};

export default BGMSystem;
