// === SYSTEM REGISTRY ===
// window.__ 전역 변수 대체: 순환 import 없이 시스템을 late-binding으로 등록·조회.
//
// 사용법:
//   등록 (main.js):  SystemRegistry.register('NPCSystem', NPCSystem);
//   조회 (consumer): const npc = SystemRegistry.get('NPCSystem');

const _registry = {};

const SystemRegistry = {
  register(name, system) {
    _registry[name] = system;
  },

  get(name) {
    return _registry[name] ?? null;
  },
};

export default SystemRegistry;
