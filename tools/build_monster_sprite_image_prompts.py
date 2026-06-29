from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "tmp" / "imagegen" / "monster_sprites_missing14.jsonl"

CHROMA = "#ff00ff"

MONSTERS = {
    "boss_patient_zero": {
        "type": "zombie",
        "subject": "the first infected patient zero, a gaunt Seoul hospital patient-zombie in torn medical gown, exposed dark veins, viral pustules, fever glow around the eyes",
        "row1": "viral burst attack, coughing a visible infection wave forward, aggressive lunge frames",
        "row2": "hit reaction with viral fluid splatter and hunched stagger",
        "row3": "collapsing into an infected heap, twitching final frames",
    },
    "boss_radiation_colossus": {
        "type": "zombie",
        "subject": "a towering irradiated zombie colossus, huge asymmetrical body, cracked glowing radioactive skin, scraps of hazmat suit and concrete dust",
        "row1": "heavy ground slam attack, massive arms raised then smashing down",
        "row2": "hit reaction with radioactive sparks and heavy stagger",
        "row3": "slow colossal collapse, knees buckling then body falling",
    },
    "boss_acid_queen": {
        "type": "zombie",
        "subject": "an acid queen mutant zombie, lean regal silhouette, swollen acid glands, corroded dress-like rags, neon yellow-green acid veins",
        "row1": "acid spray and acid pool attack, arm sweeping forward and corrosive splash",
        "row2": "hit reaction with acid droplets and recoiling torso",
        "row3": "melting death collapse, body dissolving downward",
    },
    "boss_frozen_giant": {
        "type": "zombie",
        "subject": "a frozen giant zombie, broad hulking silhouette, ice armor plates, frost-covered ruined winter coat, pale blue dead skin",
        "row1": "frost breath and ice armor attack, icy exhale then braced armored pose",
        "row2": "hit reaction with ice chips breaking off",
        "row3": "heavy frozen collapse, cracking ice as it falls",
    },
    "boss_phantom_sniper": {
        "type": "human",
        "subject": "a phantom urban sniper, thin human silhouette in torn gray ghillie cloak, scoped rifle, masked face, ruined rooftop survivor style",
        "row1": "headshot and camouflage attack, rifle aim, muzzle flash, cloak blur",
        "row2": "hit reaction while keeping rifle close, cloak snapping back",
        "row3": "death collapse dropping the rifle, cloak folding onto the ground",
    },
    "boss_cult_leader": {
        "type": "human",
        "subject": "a ruined-city cult leader, ragged long coat, cracked gas mask, talisman scraps, improvised explosive satchel, commanding preacher stance",
        "row1": "fanatic bomb and sermon attack, one hand raised in sermon then explosive throw",
        "row2": "hit reaction with coat flaring and mask tilted",
        "row3": "death collapse, knees dropping then body slumping forward",
    },
    "boss_mutant_alpha_tiger": {
        "type": "animal",
        "subject": "a mutant alpha tiger, large infected tiger with torn fur, bone spurs, glowing infected wounds, predatory low stance",
        "row1": "pounce and roar attack, crouch, leap, claw swipe, roar frame",
        "row2": "hit reaction with recoiling shoulders and bared teeth",
        "row3": "animal death collapse, legs folding and head dropping",
    },
    "boss_sewer_king": {
        "type": "animal",
        "subject": "the sewer king, a giant mutated sewer crocodile-rat hybrid, armored wet scales, long jaws, sewage grime, low heavy body",
        "row1": "death roll and submerge attack, jaw snap, rolling twist, wet splash pose",
        "row2": "hit reaction with scale chips and recoil",
        "row3": "death collapse, heavy body sinking low and going still",
    },
    "boss_swarm_queen_bee": {
        "type": "animal",
        "subject": "a mutant swarm queen bee, oversized diseased queen insect, ragged wings, swollen abdomen, stinger, small swarm silhouettes close to body",
        "row1": "swarm cloud and royal jelly heal, wings vibrating, stinger thrust, toxic swarm burst",
        "row2": "hit reaction with wings crumpling and swarm scattering",
        "row3": "death collapse, wings folding and abdomen dropping",
    },
    "boss_escaped_experiment": {
        "type": "zombie",
        "subject": "an escaped laboratory experiment, massive stitched infected humanoid, broken restraints, IV tubes, toxic blood sacs, unstable mutation",
        "row1": "resistance shift and toxic blood attack, body mutating, toxic splash forward",
        "row2": "hit reaction with mutation plates shifting and toxic blood spray",
        "row3": "death collapse, restraints snapping as the body falls apart",
    },
    "boss_blizzard_wraith": {
        "type": "zombie",
        "subject": "a blizzard wraith zombie, frostbitten thin body, tattered winter coat, ghostly icy vapor, pale blue-white silhouette",
        "row1": "frost touch and blizzard cloak attack, icy hand swipe, cloak of snow wrapping around body",
        "row2": "hit reaction with snow vapor burst and flickering body",
        "row3": "death collapse, body dissolving into snow and rags",
    },
    "boss_firefighter_nemesis": {
        "type": "zombie",
        "subject": "an infected firefighter nemesis, burned Seoul firefighter bunker gear, cracked helmet, heavy fire axe, ember scars, zombie posture",
        "row1": "fire axe and burning charge attack, axe windup, forward charge, ember trail",
        "row2": "hit reaction with sparks and stagger under the axe weight",
        "row3": "death collapse, helmet falling and axe dropping",
    },
    "boss_chef_nemesis": {
        "type": "zombie",
        "subject": "an infected chef nemesis, stained chef coat, apron, cleaver, boiling pot splash motif, bloated infected face",
        "row1": "cleaver slash and boiling splash attack, cleaver swing then scalding liquid throw",
        "row2": "hit reaction with apron whipping and cleaver arm recoiling",
        "row3": "death collapse, cleaver slipping from hand and body folding down",
    },
    "boss_doctor_nemesis": {
        "type": "zombie",
        "subject": "an infected doctor nemesis, ruined white coat, surgical mask torn open, scalpel and syringe, clinical horror silhouette",
        "row1": "surgical strike and virus injection attack, scalpel slash then syringe thrust",
        "row2": "hit reaction with coat flaring and syringe arm recoiling",
        "row3": "death collapse, medical tools falling as body crumples",
    },
}


def prompt_for(enemy_id: str, data: dict) -> str:
    return f"""Use case: game asset sprite sheet
Asset type: CardSurvival side-view enemy combat sprite sheet
Primary request: Create one complete 6 columns x 4 rows sprite sheet for {enemy_id}.
Canvas and layout: exactly one wide sprite atlas image, 1536x1024 pixels, arranged as 24 equal frames. Each frame is 256x256. Six columns per row, four rows. No gutters, no labels, no grid lines.
Character subject: {data['subject']}.
Style/medium: gritty 2D game sprite sheet, painterly pixel-sprite hybrid, ruined Seoul survival horror, dark industrial palette, readable at game scale, consistent with tactical survival card game combat.
Facing and anchor: full body side-view facing left toward the player, bottom-center anchored in every frame, consistent scale and silhouette across all frames, generous padding inside each 256x256 cell.
Row 0: idle and combat-ready loop, subtle breathing or stance shift across six frames.
Row 1: {data['row1']} across six sequential frames.
Row 2: {data['row2']} across six sequential frames.
Row 3: {data['row3']} across six sequential frames.
Background: perfectly flat solid {CHROMA} chroma-key background in every frame. The background must be one uniform color with no shadows, gradients, texture, floor plane, scenery, lighting variation, or checkerboard.
Constraints: same character identity in all 24 frames, no text, no UI, no watermark, no extra characters, no cropped body, no poster composition, no perspective camera changes.
Avoid: using {CHROMA} anywhere inside the character body, costume, weapon, effects, liquids, or outlines."""


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8") as f:
        for enemy_id, data in MONSTERS.items():
            job = {
                "prompt": prompt_for(enemy_id, data),
                "model": "gpt-image-2",
                "size": "1536x1024",
                "quality": "medium",
                "output_format": "png",
                "out": f"{enemy_id}_sheet_src.png",
                "use_case": "stylized-concept",
                "style": "gritty 2D survival horror game sprite sheet",
                "composition": "single 6x4 sprite atlas, side-view frames, bottom-centered character",
                "constraints": f"flat {CHROMA} chroma-key background, no text, no UI, no watermark",
            }
            f.write(json.dumps(job, ensure_ascii=False) + "\n")
    print(OUT.relative_to(ROOT).as_posix())


if __name__ == "__main__":
    main()
