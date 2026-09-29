// 게임용 환자 사례는 실제 처치 절차 대신 물품·설비 선택을 정의한다.
const action = (id, label, items = [], facilities = [], tools = []) => ({ id, label, items, facilities, tools, tpCost: 1 });
const diagnose = { id: 'diagnosis', label: '진단', actions: [action('diagnose', '증상 진단')] };
const recovery = { id: 'recovery', label: '회복', actions: [action('recover', '회복 확인', [], ['medical_station', 'medical_bed', 'field_surgery_station'])] };
const TREATMENT_PROFILES = {
  dehydration: {
    name: '탈수·영양 부족', minDay: 14,
    stages: [diagnose,
      { id: 'stabilization', label: '안정화', actions: [action('hydrate', '수분 공급', [{ definitionId: 'boiled_water', qty: 1 }])] },
      { id: 'treatment', label: '처치', actions: [action('nutrition', '회복식 공급', [{ definitionId: 'rice_porridge', qty: 1 }]), action('saline', '수액 공급', [{ definitionId: 'iv_saline', qty: 1 }], ['medical_station', 'medical_bed'])] }, recovery],
  },
  complex_trauma: {
    name: '복합 외상', minDay: 21,
    stages: [diagnose,
      { id: 'stabilization', label: '안정화', actions: [action('stabilize', '응급 안정화', [{ definitionId: 'bandage', qty: 2 }])] },
      { id: 'treatment', label: '처치', actions: [
        action('surgery', '수술대 처치', [{ definitionId: 'surgical_anesthetic', qty: 1 }, { definitionId: 'gauze', qty: 1 }], ['field_surgery_station']),
        action('field_surgery', '현장 처치', [{ definitionId: 'anesthetic', qty: 1 }, { definitionId: 'antiseptic', qty: 1 }], ['medical_station'], ['sterile_kit']),
        action('emergency_surgery', '응급 키트 처치', [{ definitionId: 'anesthetic', qty: 1 }, { definitionId: 'antiseptic', qty: 2 }], ['medical_station'], ['surgery_kit']),
      ] }, recovery],
  },
  infection_risk: {
    name: '감염 위험', minDay: 14,
    stages: [diagnose,
      { id: 'stabilization', label: '안정화', actions: [action('clean', '위생 안정화', [{ definitionId: 'antiseptic', qty: 1 }])] },
      { id: 'treatment', label: '처치', actions: [
        action('antibiotic', '회수 약품으로 처치', [{ definitionId: 'antibiotics', qty: 1 }, { definitionId: 'gauze', qty: 1 }], ['medical_station', 'medical_bed']),
        action('broad_antibiotic', '합성 제제로 처치', [{ definitionId: 'broad_antibiotic', qty: 1 }], ['medical_station', 'medical_bed']),
        action('purified_medicine', '정제약으로 처치', [{ definitionId: 'purified_medicine', qty: 1 }, { definitionId: 'gauze', qty: 1 }], ['medical_station', 'medical_bed']),
      ] }, recovery],
  },
};
export default TREATMENT_PROFILES;
