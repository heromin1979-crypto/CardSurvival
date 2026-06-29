import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('assets/images/ui/minimap-landmarks');
const PREVIEW_DIR = path.resolve('output/imagegen/minimap-landmark-icons');

const ICONS = [
  ['gangnam', 'lm_gangnam', '삼성서울병원', 'hospital'],
  ['gangdong', 'lm_gangdong', '올림픽공원', 'olympicPark'],
  ['gangbuk', 'lm_gangbuk', '북한산 국립공원', 'mountainFortress'],
  ['gangseo', 'lm_gangseo', '김포국제공항', 'airport'],
  ['gwanak', 'lm_gwanak', '서울대학교 연구소', 'campusMountain'],
  ['gwangjin', 'lm_gwangjin', '어린이대공원', 'parkGate'],
  ['guro', 'lm_guro', '구로디지털단지', 'digitalComplex'],
  ['geumcheon', 'lm_geumcheon', '시흥공단 기계창', 'machineShop'],
  ['nowon', 'lm_nowon', '태릉선수촌', 'sportsVillage'],
  ['dobong', 'lm_dobong', '도봉산 등산로', 'mountainTrail'],
  ['dongdaemun', 'lm_dongdaemun', '동대문 디자인 플라자', 'ddp'],
  ['dongjak', 'lm_boramae_hospital', '보라매병원', 'hospitalWide'],
  ['mapo', 'lm_mapo', '홍대 지하상가', 'musicUnderground'],
  ['seodaemun', 'lm_seodaemun', '세브란스병원', 'hospitalCross'],
  ['seocho', 'lm_seocho', '예술의전당', 'artsCenter'],
  ['seongdong', 'lm_seongdong', '성수 공방거리', 'workshopStreet'],
  ['seongbuk', 'lm_seongbuk', '고려대학교 캠퍼스', 'university'],
  ['songpa', 'lm_songpa', '롯데월드타워', 'lotteTower'],
  ['yangcheon', 'lm_yangcheon', '목동 종합운동장', 'stadium'],
  ['yeongdeungpo', 'lm_yeongdeungpo', 'KBS 방송국', 'broadcastStation'],
  ['yongsan', 'lm_yongsan', '용산 전자상가', 'electronicsMarket'],
  ['eunpyeong', 'lm_eunpyeong', '진관사', 'temple'],
  ['jongno', 'lm_jongno', '경복궁', 'palaceGate'],
  ['junggoo', 'lm_junggoo', '남대문시장', 'marketGate'],
  ['jungrang', 'lm_jungrang', '중랑천 습지', 'wetland'],
];

function lineArt(kind) {
  const templates = {
    airport: `
      <path d="M39 151 L218 99 L224 116 L143 148 L162 213 L145 220 L102 162 L54 180 L43 165 L86 149 Z"/>
      <path d="M33 204 H228"/>
      <path d="M48 126 V74 H82 V116 M52 74 H78 M65 58 V74"/>
      <path d="M104 128 H170 M116 119 H187"/>`,
    artsCenter: `
      <path d="M45 173 C68 109 114 82 207 94 C186 131 149 154 45 173 Z"/>
      <path d="M52 183 C105 155 161 148 212 164"/>
      <path d="M74 186 H198 M88 186 V211 M116 178 V211 M151 171 V211 M184 166 V211"/>
      <path d="M60 214 H209"/>`,
    broadcastStation: `
      <path d="M128 215 V70"/>
      <path d="M86 215 H170"/>
      <path d="M96 156 H160 M108 108 H148"/>
      <path d="M98 215 L128 99 L158 215"/>
      <circle cx="128" cy="60" r="13"/>
      <path d="M73 58 C90 31 166 31 183 58 M50 38 C81 0 175 0 206 38"/>
      <path d="M51 218 H215"/>`,
    campusMountain: `
      <path d="M31 214 L79 124 L106 161 L143 91 L225 214 Z"/>
      <path d="M90 139 L106 161 L122 145 M135 107 L151 128 L166 112"/>
      <path d="M75 214 V162 H183 V214"/>
      <path d="M86 162 L129 128 L172 162"/>
      <path d="M114 214 V183 H144 V214 M91 180 H108 M150 180 H167"/>`,
    ddp: `
      <path d="M40 174 C63 102 115 72 201 94 C221 145 175 188 77 190 C57 190 44 184 40 174 Z"/>
      <path d="M61 161 C93 145 139 137 196 142"/>
      <path d="M76 124 C112 116 151 115 190 123"/>
      <path d="M55 194 H208 M78 194 V215 M116 188 V215 M158 183 V215"/>
      <path d="M36 218 H220"/>`,
    digitalComplex: `
      <path d="M42 214 V82 H104 V214 M116 214 V58 H188 V214 M196 214 V108 H224 V214"/>
      <path d="M55 104 H90 M55 130 H90 M55 156 H90 M55 182 H90"/>
      <path d="M130 84 H174 M130 112 H174 M130 140 H174 M130 168 H174"/>
      <path d="M73 75 C95 43 136 43 158 75"/>
      <path d="M51 224 H229"/>`,
    electronicsMarket: `
      <path d="M44 214 V95 H211 V214"/>
      <path d="M65 123 H112 V163 H65 Z M135 123 H190 V163 H135 Z"/>
      <path d="M82 181 H178 M98 195 H162"/>
      <path d="M51 81 H203 L191 95 H62 Z"/>
      <path d="M124 95 V58 M112 58 H136 M116 47 H132"/>
      <path d="M35 224 H224"/>`,
    hospital: `
      <path d="M56 215 V76 H199 V215"/>
      <path d="M92 215 V167 H164 V215"/>
      <path d="M128 100 V145 M105 122 H151"/>
      <path d="M74 100 H96 M160 100 H182 M74 132 H96 M160 132 H182"/>
      <path d="M41 224 H215"/>`,
    hospitalCross: `
      <path d="M49 215 V88 H120 V215 M136 215 V62 H207 V215"/>
      <path d="M162 92 V138 M139 115 H185"/>
      <path d="M68 113 H99 M68 140 H99 M68 167 H99"/>
      <path d="M155 163 H188 M155 188 H188"/>
      <path d="M34 224 H224"/>`,
    hospitalWide: `
      <path d="M35 216 V112 H221 V216"/>
      <path d="M82 112 V75 H174 V112"/>
      <path d="M128 88 V132 M106 110 H150"/>
      <path d="M59 139 H88 M168 139 H197 M59 166 H88 M168 166 H197"/>
      <path d="M111 216 V172 H145 V216"/>
      <path d="M29 224 H228"/>`,
    lotteTower: `
      <path d="M128 20 L151 221 H105 Z"/>
      <path d="M128 7 V54"/>
      <path d="M91 221 H165"/>
      <path d="M114 82 H142 M111 116 H145 M108 151 H148 M106 186 H150"/>
      <path d="M86 222 C104 205 151 205 171 222"/>
      <path d="M64 226 H192"/>`,
    machineShop: `
      <path d="M41 215 V112 L89 137 V107 L136 137 V93 H211 V215"/>
      <path d="M159 93 V58 H210 V93"/>
      <path d="M62 165 H89 M111 165 H138 M162 165 H194"/>
      <path d="M67 192 H95 M117 192 H145 M167 192 H197"/>
      <path d="M32 224 H224"/>`,
    marketGate: `
      <path d="M45 216 V103 H211 V216"/>
      <path d="M32 103 H224 L198 74 H58 Z"/>
      <path d="M78 216 V154 H121 V216 M136 216 V154 H179 V216"/>
      <path d="M67 127 H95 M114 127 H142 M161 127 H190"/>
      <path d="M25 224 H231"/>`,
    mountainFortress: `
      <path d="M27 215 L78 113 L109 158 L143 86 L229 215 Z"/>
      <path d="M92 134 L109 158 L126 140 M137 101 L153 123 L168 108"/>
      <path d="M82 215 V176 H176 V215"/>
      <path d="M99 176 V142 H159 V176"/>
      <path d="M116 142 L129 107 L142 142"/>
      <path d="M35 224 H221"/>`,
    mountainTrail: `
      <path d="M26 216 L75 110 L106 151 L146 77 L230 216 Z"/>
      <path d="M74 211 C100 180 128 173 158 147 C176 132 194 116 216 99"/>
      <path d="M90 133 L106 151 L123 134 M139 92 L157 116 L171 101"/>
      <path d="M57 224 H222"/>`,
    musicUnderground: `
      <path d="M42 195 H213"/>
      <path d="M54 195 L83 138 L128 103 L173 138 L202 195"/>
      <path d="M83 138 H173 M104 118 H152"/>
      <path d="M99 195 V146 M128 195 V120 M157 195 V146"/>
      <path d="M167 92 V153 C154 145 144 149 144 160 C144 171 162 171 167 157"/>
      <path d="M167 92 H192 V106 H167"/>`,
    olympicPark: `
      <path d="M44 216 C66 153 105 111 128 84 C151 111 190 153 212 216"/>
      <path d="M70 216 C88 166 112 136 128 116 C144 136 168 166 186 216"/>
      <path d="M51 219 H206"/>
      <circle cx="82" cy="76" r="14"/><circle cx="112" cy="76" r="14"/><circle cx="142" cy="76" r="14"/>
      <circle cx="97" cy="98" r="14"/><circle cx="127" cy="98" r="14"/>`,
    palaceGate: `
      <path d="M38 109 H218 L188 74 H68 Z"/>
      <path d="M55 109 V215 M91 109 V215 M128 109 V215 M165 109 V215 M201 109 V215"/>
      <path d="M64 75 L128 34 L192 75"/>
      <path d="M73 151 H183 M68 184 H188"/>
      <path d="M31 224 H225"/>`,
    parkGate: `
      <path d="M44 213 V127 H214 V213"/>
      <path d="M58 127 L128 75 L200 127"/>
      <path d="M83 213 V154 H113 V213 M143 213 V154 H173 V213"/>
      <path d="M52 224 H220"/>
      <path d="M37 178 C54 154 74 154 91 178 M183 178 C200 154 220 154 237 178"/>`,
    sportsVillage: `
      <ellipse cx="128" cy="142" rx="82" ry="48"/>
      <ellipse cx="128" cy="142" rx="53" ry="29"/>
      <path d="M59 166 H197 M72 112 H184"/>
      <path d="M84 97 C109 69 151 69 174 97"/>
      <path d="M47 209 H209"/>`,
    stadium: `
      <ellipse cx="128" cy="143" rx="89" ry="51"/>
      <ellipse cx="128" cy="143" rx="59" ry="31"/>
      <path d="M49 161 C88 134 167 134 207 161"/>
      <path d="M58 181 H198 M74 100 H182"/>
      <path d="M40 215 H216"/>`,
    temple: `
      <path d="M38 121 H218 L195 92 H61 Z"/>
      <path d="M56 121 V214 H200 V121"/>
      <path d="M75 92 L128 55 L181 92"/>
      <path d="M84 214 V160 H116 V214 M140 214 V160 H172 V214"/>
      <path d="M70 143 H186"/>
      <path d="M31 224 H225"/>`,
    university: `
      <path d="M42 112 H214 L128 57 Z"/>
      <path d="M64 112 V215 M96 112 V215 M128 112 V215 M160 112 V215 M192 112 V215"/>
      <path d="M31 224 H225"/>
      <path d="M111 89 H145 M128 57 V31 M119 31 H137"/>`,
    wetland: `
      <path d="M41 184 C75 160 96 206 128 182 C161 158 182 205 215 182"/>
      <path d="M41 213 C75 189 96 232 128 208 C161 184 182 230 215 208"/>
      <path d="M75 176 C75 136 65 111 54 82 M102 174 C102 132 94 103 83 70 M178 177 C178 134 188 107 201 76"/>
      <path d="M54 82 C72 91 82 105 85 126 M83 70 C104 85 115 103 115 126 M201 76 C178 88 166 107 164 130"/>
      <path d="M38 224 H218"/>`,
    workshopStreet: `
      <path d="M35 215 V126 L79 149 V118 L122 149 V101 H205 V215"/>
      <path d="M144 101 V70 H202 V101"/>
      <path d="M50 173 H77 M96 173 H123 M148 173 H184"/>
      <path d="M64 215 V190 H94 V215 M151 215 V185 H184 V215"/>
      <path d="M29 224 H224"/>`,
  };
  return templates[kind] ?? templates.marketGate;
}

function svgIcon({ districtId, id, name, kind }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(name)}</title>
  <desc id="desc">${escapeXml(districtId)} landmark icon for Card Survival minimap.</desc>
  <defs>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-22)">
      <path d="M0 0V9" stroke="#d4c9a8" stroke-opacity=".13" stroke-width="1"/>
    </pattern>
  </defs>
  <g fill="none" stroke="#171512" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity=".78">
    ${lineArt(kind)}
  </g>
  <g fill="url(#hatch)" stroke="#d4c9a8" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round" filter="url(#softGlow)">
    ${lineArt(kind)}
  </g>
  <g fill="none" stroke="#f2ddb0" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" opacity=".72">
    ${lineArt(kind)}
  </g>
</svg>
`;
}

function contactSheet() {
  const cellW = 184;
  const cellH = 216;
  const cols = 5;
  const rows = Math.ceil(ICONS.length / cols);
  const items = ICONS.map(([districtId, id, name], index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = 24 + col * cellW;
    const y = 24 + row * cellH;
    return `
      <g transform="translate(${x} ${y})">
        <rect width="160" height="192" rx="8" fill="#101414" stroke="#3a3228"/>
        <image href="../../../../assets/images/ui/minimap-landmarks/${id}.svg" x="16" y="12" width="128" height="128"/>
        <text x="80" y="156" text-anchor="middle" fill="#d4c9a8" font-size="13" font-family="JetBrains Mono, monospace">${escapeXml(name)}</text>
        <text x="80" y="174" text-anchor="middle" fill="#8a8070" font-size="11" font-family="JetBrains Mono, monospace">${escapeXml(districtId)}</text>
      </g>
    `;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${cols * cellW + 48}" height="${rows * cellH + 48}" viewBox="0 0 ${cols * cellW + 48} ${rows * cellH + 48}">
  <rect width="100%" height="100%" fill="#050607"/>
  <text x="24" y="18" fill="#c8a060" font-size="14" font-family="JetBrains Mono, monospace">Card Survival minimap landmark icon sheet</text>
  ${items}
</svg>
`;
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  }[ch]));
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(PREVIEW_DIR, { recursive: true });

const manifest = {};
for (const [districtId, id, name, kind] of ICONS) {
  const out = path.join(OUT_DIR, `${id}.svg`);
  fs.writeFileSync(out, svgIcon({ districtId, id, name, kind }), 'utf8');
  manifest[id] = {
    districtId,
    name,
    kind,
    svg: `assets/images/ui/minimap-landmarks/${id}.svg`,
  };
}

fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(PREVIEW_DIR, 'landmark_icon_contact_sheet.svg'), contactSheet(), 'utf8');

console.log(`Generated ${ICONS.length} landmark SVG icons in ${path.relative(process.cwd(), OUT_DIR)}`);
console.log(`Generated preview ${path.relative(process.cwd(), path.join(PREVIEW_DIR, 'landmark_icon_contact_sheet.svg'))}`);
