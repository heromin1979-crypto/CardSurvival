// === CRAFT TREE UI ===
// 크래프팅 체인을 트리 형태로 시각화

import GameState from '../core/GameState.js';
import GameData from '../data/GameData.js';
import I18n from '../core/I18n.js';
import EventBus from '../core/EventBus.js';

// Define crafting chains manually (the interesting multi-step ones)
const CRAFT_CHAINS = [
  {
    id: 'electronics',
    name: '전자부품',
    icon: '⚡',
    nodes: [
      { id: 'circuit_board', name: '회로기판', recipe: 'extract_copper_wire', tier: 0, children: ['copper_wire', 'microchip'] },
      { id: 'copper_wire', name: '구리선', recipe: 'wind_copper_coil', tier: 1, children: ['copper_coil'] },
      { id: 'microchip', name: '마이크로칩', recipe: 'assemble_circuit_module', tier: 1, children: ['circuit_module'] },
      { id: 'copper_coil', name: '구리 코일', recipe: 'build_electric_motor', tier: 2, children: ['electric_motor'] },
      { id: 'circuit_module', name: '회로 모듈', recipe: 'build_generator_core', tier: 2, children: ['electric_motor', 'generator_core', 'power_cell'] },
      { id: 'electric_motor', name: '전기 모터', recipe: null, tier: 3, children: ['generator_core'] },
      { id: 'generator_core', name: '발전기 코어', recipe: 'build_portable_generator', tier: 4, children: ['portable_generator'] },
      { id: 'power_cell', name: '파워 셀', recipe: null, tier: 3, children: ['powered_drill', 'spotlight', 'electric_fence'] },
      { id: 'portable_generator', name: '휴대용 발전기', recipe: null, tier: 5, children: [] },
      { id: 'solar_panel', name: '태양광 패널', recipe: null, tier: 4, children: ['solar_charger'] },
    ]
  },
  {
    id: 'masonry',
    name: '석조/건축',
    icon: '🧱',
    nodes: [
      { id: 'mortar_mix', name: '모르타르', recipe: 'make_mortar_mix', tier: 0, children: ['brick', 'concrete_block'] },
      { id: 'brick', name: '벽돌', recipe: 'make_brick', tier: 1, children: ['brick_furnace'] },
      { id: 'concrete_block', name: '콘크리트', recipe: 'make_concrete_block', tier: 1, children: ['reinforced_wall', 'watchtower'] },
      { id: 'brick_furnace', name: '벽돌 화로', recipe: 'build_brick_furnace', tier: 2, children: ['alloy_ingot'] },
      { id: 'reinforced_wall', name: '강화 벽', recipe: 'build_reinforced_wall', tier: 2, children: [] },
      { id: 'watchtower', name: '감시탑', recipe: 'build_watchtower', tier: 3, children: [] },
      { id: 'alloy_ingot', name: '합금 주괴', recipe: 'smelt_alloy_ingot', tier: 3, children: ['master_blade', 'alloy_armor_plate'] },
      { id: 'master_blade', name: '명검', recipe: 'forge_master_blade', tier: 4, children: ['katana'] },
      { id: 'katana', name: '카타나', recipe: 'forge_katana', tier: 5, children: [] },
    ]
  },
  {
    id: 'plumbing',
    name: '배관/수도',
    icon: '🔩',
    nodes: [
      { id: 'pipe_assembly', name: '배관 조립체', recipe: 'make_pipe_assembly', tier: 0, children: ['water_tower', 'plumbing_system'] },
      { id: 'water_tower', name: '급수탑', recipe: 'build_water_tower', tier: 1, children: [] },
      { id: 'plumbing_system', name: '배관 시스템', recipe: 'build_plumbing_system', tier: 1, children: ['water_recycler'] },
      { id: 'water_recycler', name: '물 재활용기', recipe: 'build_water_recycler', tier: 2, children: [] },
    ]
  },
  {
    id: 'medical',
    name: '의료',
    icon: '💊',
    nodes: [
      { id: 'herb_powder', name: '약초 가루', recipe: 'grind_herb_medical', tier: 0, children: ['crude_medicine', 'anesthetic', 'detox_potion'] },
      { id: 'crude_medicine', name: '조제약', recipe: 'make_crude_medicine', tier: 1, children: ['purified_medicine'] },
      { id: 'anesthetic', name: '마취제', recipe: 'make_anesthetic', tier: 1, children: ['surgical_anesthetic'] },
      { id: 'detox_potion', name: '해독제', recipe: 'make_detox', tier: 1, children: ['rad_flush'] },
      { id: 'purified_medicine', name: '정제약', recipe: 'purify_medicine', tier: 2, children: ['synthetic_antibiotics'] },
      { id: 'synthetic_antibiotics', name: '항생제', recipe: 'synthesize_antibiotics', tier: 3, children: ['universal_cure'] },
      { id: 'universal_cure', name: '만병통치약', recipe: 'brew_universal_cure', tier: 4, children: [] },
    ]
  },
  {
    id: 'cooking',
    name: '요리',
    icon: '🍳',
    nodes: [
      { id: 'wild_wheat', name: '야생 밀', recipe: 'grind_flour', tier: 0, children: ['flour'] },
      { id: 'flour', name: '밀가루', recipe: 'make_bread_dough', tier: 1, children: ['bread_dough'] },
      { id: 'bread_dough', name: '빵 반죽', recipe: 'bake_bread', tier: 2, children: ['baked_bread'] },
      { id: 'baked_bread', name: '구운 빵', recipe: 'make_sandwich', tier: 3, children: ['sandwich'] },
      { id: 'sandwich', name: '샌드위치', recipe: null, tier: 4, children: [] },
      { id: 'rice_wine', name: '막걸리', recipe: 'brew_rice_wine', tier: 1, children: ['vinegar'] },
      { id: 'vinegar', name: '식초', recipe: 'make_vinegar', tier: 2, children: ['pickled_food'] },
      { id: 'pickled_food', name: '절임 음식', recipe: null, tier: 3, children: [] },
    ]
  },
  {
    id: 'armor',
    name: '방어구',
    icon: '🛡️',
    nodes: [
      { id: 'woven_fabric', name: '직조 천', recipe: 'weave_fabric', tier: 0, children: ['reinforced_fabric'] },
      { id: 'reinforced_fabric', name: '강화 천', recipe: 'reinforce_fabric', tier: 1, children: ['plate_carrier', 'ballistic_weave'] },
      { id: 'plate_carrier', name: '플레이트 캐리어', recipe: 'make_plate_carrier', tier: 2, children: ['composite_armor'] },
      { id: 'ballistic_weave', name: '방탄직', recipe: 'make_ballistic_weave', tier: 2, children: [] },
      { id: 'composite_armor', name: '복합 장갑', recipe: 'make_composite_armor', tier: 3, children: ['powered_exosuit'] },
      { id: 'powered_exosuit', name: '엑소수트', recipe: 'build_powered_exosuit', tier: 4, children: [] },
    ]
  },
];

const CraftTreeUI = {
  _panel: null,
  _selectedChain: 'electronics',

  render(panel) {
    if (panel) this._panel = panel;
    if (!this._panel) return;

    // Tab buttons
    const tabsHtml = CRAFT_CHAINS.map(chain =>
      `<button class="tree-tab ${chain.id === this._selectedChain ? 'active' : ''}" data-chain="${chain.id}">${chain.icon} ${chain.name}</button>`
    ).join('');

    // Selected chain tree
    const chain = CRAFT_CHAINS.find(c => c.id === this._selectedChain);
    const treeHtml = chain ? this._renderChain(chain) : '';

    this._panel.innerHTML = `
      <div class="craft-tree">
        <div class="tree-tabs">${tabsHtml}</div>
        <div class="tree-content">${treeHtml}</div>
      </div>
    `;

    // Attach tab click handlers
    this._panel.querySelectorAll('.tree-tab').forEach(btn => {
      btn.onclick = () => {
        this._selectedChain = btn.dataset.chain;
        this.render();
      };
    });

    // Attach node click handlers — switch to recipe view
    this._panel.querySelectorAll('.tree-node[data-recipe]').forEach(el => {
      el.onclick = (e) => {
        e.stopPropagation();
        const recipeId = el.dataset.recipe;
        EventBus.emit('craftTreeSelectRecipe', { recipeId });
      };
    });
  },

  _renderChain(chain) {
    // Group nodes by tier
    const tiers = {};
    for (const node of chain.nodes) {
      if (!tiers[node.tier]) tiers[node.tier] = [];
      tiers[node.tier].push(node);
    }

    const maxTier = Math.max(...Object.keys(tiers).map(Number));
    let html = '';

    for (let t = 0; t <= maxTier; t++) {
      const nodes = tiers[t] || [];
      const nodesHtml = nodes.map(node => this._renderNode(node)).join('');
      const skillInfo = nodes.map(node => {
        if (!node.recipe) return null;
        const bp = GameData.blueprints?.[node.recipe];
        if (!bp?.requiredSkills) return null;
        return Object.entries(bp.requiredSkills).map(([s, l]) => `${s} Lv${l}`).join(', ');
      }).filter(Boolean);

      const tierLabel = skillInfo.length > 0
        ? `${[...new Set(skillInfo)].join(' / ')}`
        : `기초 재료`;

      html += `<div class="tree-tier"><div class="tier-label">${tierLabel}</div><div class="tier-nodes">${nodesHtml}</div></div>`;
    }

    return html;
  },

  _renderNode(node) {
    const def = GameData.items[node.id];
    const icon = def?.icon ?? '📦';
    const name = node.name;

    // Check if player can craft this (has the skill level)
    let status = 'locked'; // locked, available, crafted

    // Check if player has this item or has ever crafted it
    const hasItem = Object.values(GameState.cards || {}).some(
      c => c.definitionId === node.id
    );
    if (hasItem) status = 'crafted';

    // Check if recipe is available (skill check)
    if (status === 'locked' && node.recipe) {
      const allBp = { ...GameData.blueprints };
      const bp = allBp[node.recipe];
      if (bp?.requiredSkills) {
        const canCraft = Object.entries(bp.requiredSkills).every(([skill, lvl]) => {
          return (GameState.player.skills?.[skill]?.level ?? 0) >= lvl;
        });
        if (canCraft) status = 'available';
      }
    }

    // If no recipe (raw material), check if obtainable
    if (!node.recipe) {
      if (hasItem) status = 'crafted';
      else status = 'available'; // raw materials are always "available" via exploration
    }

    // Check if has children with arrows
    const hasChildren = node.children.length > 0;
    const arrowHtml = hasChildren ? '<span class="tree-arrow">\u2192</span>' : '';

    let tooltip = def?.description ?? '';
    if (status === 'locked' && node.recipe) {
      const bp = GameData.blueprints?.[node.recipe];
      if (bp?.requiredSkills) {
        const reqs = Object.entries(bp.requiredSkills).map(([s, l]) => `${s} Lv${l}`).join(', ');
        tooltip = `🔒 필요: ${reqs}`;
      }
    }

    return `
      <div class="tree-node tree-node--${status}"
           title="${tooltip}"
           ${node.recipe ? `data-recipe="${node.recipe}" style="cursor:pointer"` : ''}>
        <span class="tree-node-icon">${icon}</span>
        <span class="tree-node-name">${name}</span>
        ${arrowHtml}
      </div>
    `;
  },
};

export default CraftTreeUI;
