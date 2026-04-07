// === CHARACTER REACTION DIALOGUES ===
// 캐릭터별 상황 반응 대사. 탐색·전투·아이템 사용·계절 등 상황에서 직업 개성을 드러낸다.
// 사용: CharDialogue.get(characterId, context, subContext?)

export const CHAR_DIALOGUES = {
  doctor: {
    // 아이템 사용
    useBandage:    '지수가 능숙하게 상처를 감쌌다. "이 정도면 괜찮아."',
    useAntiseptic: '"소독부터." 지수는 감염 확산을 막는 절차를 빠짐없이 따랐다.',
    useMedicine:   '"투약량 체크." 지수가 조용히 중얼거리며 약을 삼켰다.',
    useFirstAid:   '응급실 11년 경력이 손끝에서 살아났다.',
    // 탐색
    exploreHospital: '"여기라면 약이 남아있을 수 있어." 지수의 눈이 빛났다.',
    exploreLab:      '"감염 패턴 데이터가 있을지도." 지수가 조심스럽게 진입했다.',
    exploreEmpty:    '"아무것도 없군. 다음 구역."',
    // 전투
    combatStart:   '"피해를 최소화해야 해." 지수는 약점을 먼저 계산했다.',
    combatCrit:    '정확히 급소를 노렸다. 역시 해부학 지식이 통한다.',
    combatFlee:    '"살아남는 게 최우선." 지수는 퇴로를 찾아 달렸다.',
    combatWin:     '"상처 확인." 지수는 전투가 끝나자마자 자신의 몸을 점검했다.',
    combatLow:     '"이 이상은 안 돼." 지수는 HP를 확인하며 물러섰다.',
    // 계절
    seasonWinter:  '"저체온증 대비 필수." 지수는 체온 유지 목록을 머릿속으로 점검했다.',
    seasonSummer:  '"탈수 진행 빠르게 온다. 수분 섭취 늘려야 해."',
    // 특수
    highInfection: '"감염 수치가 위험하다. 항생제가 필요해." 지수가 긴장했다.',
    lowMorale:     '"번아웃은 면역력을 낮춘다." 지수는 쉬어야 한다는 걸 알고 있었다.',
    craftMedical:  '"약제 배합 비율 정확하게." 지수가 눈금을 세심히 맞췄다.',
  },

  soldier: {
    useBandage:    '민준은 빠르게 야전 처치를 마쳤다. 3분도 안 걸렸다.',
    useAntiseptic: '"야전에서 감염은 죽음이다." 민준이 빠르게 소독했다.',
    useMedicine:   '전투식량 먹듯 약을 털어넣었다. 감정 없이.',
    useFirstAid:   '"기본 처치 완료." 민준이 사방을 확인하며 일어섰다.',
    exploreBuilding: '민준은 진입 전 창문 각도와 출구를 먼저 확인했다.',
    exploreDangerous: '"교전 가능성 있다. 조용히." 민준이 손짓으로 경고했다.',
    exploreEmpty:   '훑어봤다. 위협 없음. 계속 이동.',
    combatStart:   '전투 훈련이 반사적으로 작동했다. 민준의 자세가 낮아졌다.',
    combatCrit:    '급소 타격. 군 훈련 3000시간의 결과다.',
    combatFlee:    '"전술적 후퇴다." 민준은 후퇴를 패배라 생각하지 않는다.',
    combatWin:     '"교전 종료." 민준이 탄약을 점검했다.',
    combatLow:     '"체력 임계치 도달. 교전 지속 불가."',
    seasonWinter:  '"동상 예방 절차 숙지." 군 동계 훈련 기억이 떠올랐다.',
    seasonSummer:  '"열사병은 전장에서도 사람을 죽인다." 민준이 물을 챙겼다.',
    highInfection: '"부상 악화 감지. 후송 또는 치료 필요."',
    lowMorale:     '"흔들리지 마라. 임무 완수가 먼저다." 민준이 스스로에게 말했다.',
    craftWeapon:   '"가공 정밀도가 화력을 결정한다." 민준이 집중했다.',
  },

  firefighter: {
    useBandage:    '"현장 응급처치." 영철의 손이 능숙하게 움직였다.',
    useAntiseptic: '10년 현장 경험. 소독 순서는 몸에 배어있다.',
    useMedicine:   '"이재훈도 이 약 쓴 적 있었는데." 영철이 잠시 멈췄다.',
    useFirstAid:   '"아직 괜찮다." 영철은 가족을 떠올리며 다시 일어섰다.',
    exploreBuilding: '진입 전 구조 파악. 소방관의 본능이었다.',
    exploreFire:    '불길이 아직 있다. 영철은 연기 방향을 본능적으로 읽었다.',
    exploreEmpty:   '"가족이 먼저다." 영철이 은평구 방향을 한 번 더 확인했다.',
    combatStart:   '"막아야 한다." 영철의 체구가 방패처럼 앞으로 나섰다.',
    combatCrit:    '구조 현장 단련된 근력이 폭발했다.',
    combatFlee:    '"아직 살아있어야 한다. 은평구 가야 해." 영철이 달렸다.',
    combatWin:     '숨을 고르고, 은평구 방향을 다시 바라봤다.',
    combatLow:     '"기다려, 영주야. 아빠 꼭 간다." 영철이 이를 악물었다.',
    seasonWinter:  '"이 추위에 애들이 괜찮을지." 영철의 걱정이 깊어졌다.',
    seasonSummer:  '"여름에 화재 위험도 올라간다. 조심해야 해."',
    highInfection: '"이래서는 은평구까지 못 간다." 영철이 서둘러 처치했다.',
    lowMorale:     '"가족 생각해. 영철아, 포기하면 안 돼."',
    craftStructure: '현장 경험이 있다. 어떻게 지어야 버티는지 안다.',
  },

  homeless: {
    useBandage:    '형식은 군소리 없이 상처를 묶었다. 아픔보다 더한 것도 버텨봤다.',
    useAntiseptic: '"다리 밑에서도 이것만 있으면 괜찮았어." 형식이 담담히 소독했다.',
    useMedicine:   '먹을 게 있다. 그것만으로도 감사하다.',
    useFirstAid:   '한 번 다 잃어본 사람은 몸 하나는 아낀다.',
    exploreAlley:   '골목 구석구석을 안다. 2년을 이렇게 살았으니까.',
    exploreBuilding: '"뭔가 있을 거야." 형식의 눈이 틈새를 파고들었다.',
    exploreEmpty:   '"없어도 괜찮아. 다음엔 있겠지." 형식은 낙담하지 않았다.',
    combatStart:   '"싸우는 건 싫지만, 살아야지." 형식이 주위를 둘러봤다.',
    combatCrit:    '거리 생활이 가르쳐준 생존 본능. 급소는 어디에나 있다.',
    combatFlee:    '"도망도 생존이다." 형식은 부끄럽지 않았다.',
    combatWin:     '"이겼네." 형식은 특별한 감흥 없이 짐을 챙겼다.',
    combatLow:     '"아직 안 죽었다." 형식이 이를 앙다물었다.',
    seasonWinter:  '"또 겨울이네." 다리 밑 겨울을 세 번 버텼던 기억이 떠올랐다.',
    seasonSummer:  '"여름은 좀 낫지." 형식은 실제로 조금 편했다.',
    highInfection: '"몸이 이상하다. 전에도 이런 적 있었는데…"',
    lowMorale:     '"이미 다 잃어봤어. 더 잃을 것도 없잖아." 형식이 자신을 다독였다.',
    findRare:       '"어?" 형식의 눈이 커졌다. 평생 이런 운은 없었는데.',
  },

  pharmacist: {
    useBandage:    '"압박 지혈 정확하게." 소희가 각도를 조정했다.',
    useAntiseptic: '"성분 확인." 소희는 라벨을 먼저 읽는 습관이 있었다.',
    useMedicine:   '"용량 적정." 소희가 정확한 양을 맞췄다.',
    useFirstAid:   '약사의 눈으로 처치 순서를 검토하며 치료했다.',
    exploreLab:    '"데이터가 있을 수 있어." 소희가 숨을 참고 진입했다.',
    explorePharmacy: '"내 것처럼 생겼네." 소희가 선반을 빠르게 훑었다.',
    exploreEmpty:  '"관찰은 계속해야 해." 소희가 빈손이어도 메모를 남겼다.',
    combatStart:   '"피해야 한다. 데이터가 더 중요해." 소희가 뒷걸음쳤다.',
    combatCrit:    '약해 보여도 급소는 정확히 안다. 해부학 전공이니까.',
    combatFlee:    '"살아서 합성을 완성해야 해." 소희가 달렸다.',
    combatWin:     '"다쳤는지 확인부터." 소희가 상처를 꼼꼼히 살폈다.',
    combatLow:     '"여기서 죽으면 항바이러스제는 영원히 완성 못 해."',
    seasonWinter:  '"저온에서 약효가 달라질 수 있어." 소희가 메모를 꺼냈다.',
    seasonSummer:  '"고온 보관 약물 관리 주의." 소희가 배낭을 점검했다.',
    highInfection: '"감염 진행 속도 기록." 소희는 자신의 몸도 데이터로 봤다.',
    lowMorale:     '"감정 상태가 면역계에 영향을 준다." 소희가 의도적으로 숨을 골랐다.',
    craftMedical:  '"배합 비율이 핵심이야." 소희가 눈금을 세 번 확인했다.',
  },

  engineer: {
    useBandage:    '공구 다루듯 붕대를 감았다. 빠르고 효율적으로.',
    useAntiseptic: '"산화 방지 원리랑 비슷해." 대한이 소독약을 발랐다.',
    useMedicine:   '"섭취 완료." 대한은 몸을 기계처럼 관리했다.',
    useFirstAid:   '시스템 점검 완료. 작동 재개.',
    exploreFactory:  '"부품이 있을 수 있어." 대한의 눈이 빛났다.',
    exploreWorkshop: '"여기라면 뭔가 만들 수 있겠는데." 대한이 설계를 시작했다.',
    exploreEmpty:   '"사용 가능한 자재 없음. 다음 구역."',
    combatStart:   '"효율적으로 끝내자." 대한이 동선을 계산했다.',
    combatCrit:    '금속 가공 정밀도가 전투에서도 통했다.',
    combatFlee:    '"비효율적 교전은 철수가 최선." 대한이 합리적으로 후퇴했다.',
    combatWin:     '"소요 자원 대비 성과 확인." 대한이 탄약을 점검했다.',
    combatLow:     '"내구도 임계치 도달. 유지보수 필요."',
    seasonWinter:  '"발전기 효율 저하 예상. 연료 비축 필요."',
    seasonSummer:  '"과부하 방지 장치 점검." 대한이 발전기를 확인했다.',
    highInfection: '"시스템 이상 감지. 즉시 수리 필요."',
    lowMorale:     '"생산성 저하 원인 파악 필요." 대한은 문제를 분석하려 했다.',
    craftStructure: '"설계도대로." 대한이 치수를 재며 구조물을 세웠다.',
    craftSuccess:   '"제작 완료. 설계 오차 0%." 대한이 만족스럽게 고개를 끄덕였다.',
  },
};

// 상황별 우선 컨텍스트 키 매핑
const CONTEXT_MAP = {
  use_bandage:       'useBandage',
  use_antiseptic:    'useAntiseptic',
  use_medicine:      'useMedicine',
  use_first_aid_kit: 'useFirstAid',
  explore_hospital:  'exploreHospital',
  explore_lab:       'exploreLab',
  explore_building:  'exploreBuilding',
  explore_empty:     'exploreEmpty',
  combat_start:      'combatStart',
  combat_crit:       'combatCrit',
  combat_flee:       'combatFlee',
  combat_win:        'combatWin',
  combat_low_hp:     'combatLow',
  season_winter:     'seasonWinter',
  season_summer:     'seasonSummer',
  high_infection:    'highInfection',
  low_morale:        'lowMorale',
  craft_medical:     'craftMedical',
  craft_structure:   'craftStructure',
  craft_weapon:      'craftWeapon',
  craft_success:     'craftSuccess',
  find_rare:         'findRare',
};

const CharDialogue = {
  /**
   * 캐릭터 ID와 컨텍스트로 대사를 반환한다.
   * @param {string} characterId - 'doctor' | 'soldier' | etc.
   * @param {string} context     - CONTEXT_MAP의 키
   * @returns {string|null}      - 대사 문자열 또는 null (없으면 조용히 실패)
   */
  get(characterId, context) {
    const charLines = CHAR_DIALOGUES[characterId];
    if (!charLines) return null;
    const key = CONTEXT_MAP[context] ?? context;
    return charLines[key] ?? null;
  },

  /**
   * 대사를 알림으로 표시한다. 대사가 없으면 아무것도 하지 않는다.
   * @param {string} characterId
   * @param {string} context
   */
  emit(characterId, context) {
    const line = this.get(characterId, context);
    if (!line) return;
    if (typeof EventBus !== 'undefined') {
      EventBus.emit('charDialogue', { characterId, context, line });
    }
  },
};

export default CharDialogue;
