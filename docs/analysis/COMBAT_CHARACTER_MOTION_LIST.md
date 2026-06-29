# Combat Character Motion List

## Scope

This list covers the motions needed for the current side-view combat screen.
The current implementation uses single character images plus CSS animation
classes. Future sprite-sheet work can replace the CSS motion classes without
changing combat event names.

## Shared 2D Combat Motion Contract

| Motion | Trigger | Current implementation |
| --- | --- | --- |
| Stay / idle | Actor is visible outside combat emphasis | `.motion-idle` |
| Combat ready | Actor is active in the combat lineup | `.motion-combat-ready` |
| Move forward | Advance, approach, future rank move | `.motion-move-forward` |
| Move back | Flee, retreat, future rank move | `.motion-move-back` |
| Rank swap | Future front/back position exchange | `.motion-rank-swap` |
| Dodge | Missed incoming attack or failed flee beat | `.motion-dodge` |
| Light damage | Normal hit reaction | `.motion-hit-light` |
| Heavy damage | Crit, shock, explosion, high damage | `.motion-hit-heavy` |
| Knockback | Explosion or large impact | `.motion-knockback` |
| Buff | Companion support or non-heal item | `.motion-buff-pulse` |
| Debuff | Generic harmful status trigger | `.motion-debuff-pulse` |
| Stun loop | Stun status persists | `.motion-status-stun` |
| Bleed loop | Bleed/laceration persists | `.motion-status-bleed` |
| Infection loop | Infection, poison, burn, acid-like status persists | `.motion-status-infected` |
| Panic loop | Panic, fear, stress persists | `.motion-status-panic` |

## Female Player Motions

| Motion | Trigger | Current implementation |
| --- | --- | --- |
| Idle breathing | Always visible in combat | `.motion-idle` |
| Combat stance | Combat lineup render | `.motion-combat-ready` |
| Melee strike | Unarmed/blunt/basic hit | `.motion-melee-strike` |
| Knife slash | Blade/knife hit | `.motion-knife-slash` |
| Blunt strike | Wrench, bat, pipe, blunt weapon hit | `.motion-blunt-strike` |
| Firearm shot | Ranged weapon hit | `.motion-firearm-shot` |
| Whiff/recover | Player attack miss | `.motion-whiff` |
| Hit react | Enemy hits player | `.motion-player-hit` + `.motion-hit-light` / `.motion-hit-heavy` |
| Guard brace | Guard action | `.motion-guard-brace` |
| Heal/support | Self heal or companion heal received | `.motion-heal-pulse` |
| Downed | Future incapacitated state | `.motion-downed` |
| Death/downed | Player defeat state | `.motion-player-death` |
| Victory | Combat win | `.motion-victory` |
| Defeat | Combat loss | `.motion-defeat` |

## Zombie Motions

| Motion | Trigger | Current implementation |
| --- | --- | --- |
| Idle sway | Always visible in combat | `.motion-zombie-idle` |
| Combat stance | Combat lineup render | `.motion-combat-ready` |
| Lunge/bite | Enemy melee attack | `.motion-zombie-lunge` |
| Heavy slam | Brute/charger style impact | `.motion-zombie-heavy` |
| Ranged spit/shot | Ranged or acid hit | `.motion-zombie-spit` |
| Hit react | Player/companion hits enemy | `.motion-zombie-hit` + `.motion-hit-light` / `.motion-hit-heavy` |
| Stagger/advance | Back-row melee enemy advances | `.motion-zombie-advance` + `.motion-move-forward` |
| Scream/summon | Screamer summon threat | `.motion-zombie-scream` |
| Death collapse | Enemy reaches 0 HP | `.motion-zombie-death` / existing `.just-died` |

## Notes For Future Generated Sprite Sheets

- Keep the actor facing horizontally toward the opponent.
- Use a transparent background and bottom-center anchor.
- Recommended minimum frame counts:
  - idle: 6 frames
  - attack/shot/hit: 5 frames
  - death: 8 frames
  - scream/special: 6 frames
- The CSS class names above should remain the contract between combat events
  and visual assets.
