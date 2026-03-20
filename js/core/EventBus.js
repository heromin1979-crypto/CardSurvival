// === EVENT BUS (pub/sub) ===
const EventBus = {
  _listeners: {},

  on(event, cb) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(cb);
    return () => this.off(event, cb); // returns unsubscribe fn
  },

  off(event, cb) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(fn => fn !== cb);
  },

  emit(event, data) {
    if (!this._listeners[event]) return;
    this._listeners[event].forEach(fn => {
      try { fn(data); }
      catch (e) { console.error(`[EventBus] Error in "${event}" handler:`, e); }
    });
  },

  once(event, cb) {
    const wrapper = (data) => { cb(data); this.off(event, wrapper); };
    this.on(event, wrapper);
  },
};

// Known event channels:
// tpAdvance       { totalTP }
// miniTick        { totalTP }
// statChanged     { stat, oldVal, newVal }
// statCritical    { stat, value }
// stateTransition { from, to, data }
// cardPlaced      { instanceId, row, slot }
// cardMoved       { instanceId, fromRow, toRow }
// cardRemoved     { instanceId }
// craftComplete   { blueprintId, outputInstanceIds }
// combatEnd       { outcome, rewards }
// noiseInflux     {}
// saved           { slot }
// loaded          { slot }
// notify          { message, type }  // 'info'|'warn'|'danger'|'good'
// hiddenLocationDiscovered { locationId, location }
// bossKilled               { bossId, boss }
// secretEventTriggered     { event }
// recipeUnlocked           { recipeId, recipe }
// structureDamage          { damagePercent }
// npcSpawned               { npcId }
// npcTrustChanged          { npcId, oldTrust, newTrust }
// npcRecruited             { npcId }
// npcDismissed             { npcId }
// openNPCDialogue          { npcId }
// hintUnlocked             { comboId }

export default EventBus;
