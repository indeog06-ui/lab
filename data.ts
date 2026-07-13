import { Scenario, FilterOption, SimulationResult, SafetyRule, ScenarioId, FilterId } from './types';

export const SCENARIOS: Scenario[] = [
  {
    id: 'A',
    title: '실제 하천물',
    subtitle: 'River Water',
    tags: ['탁도 높음', '유기물 오염', '미생물 포함'],
    description: '도시 근교 하천에서 수거한 오염된 물입니다. 높은 부유 물질과 질소, 인 등 부영양화 원인 물질이 포함되어 있습니다. 물리적/생물학적 정화가 핵심입니다.',
    beakerColor: '#8B7355', // turbid brown
    liquidColor: 'rgba(139, 115, 85, 0.4)',
    beakerTitle: '실제 하천물',
    pollutionLevel: 100,
    temperature: 18,
    hazardLevel: 'Medium',
    location: '도심 인근 하천 (Urban River)',
    details: '질소 및 인 고농도 부영양화 유발 물질 검출, 대장균 및 일반 미생물 지수 기준치 상회.'
  },
  {
    id: 'B',
    title: '일반 공장 폐수',
    subtitle: 'Industrial Wastewater',
    tags: ['중금속 검출', '독성 물질', '산성도(pH) 불균형'],
    description: '정밀 제조 공정에서 배출된 화학 폐수입니다. 납, 카드뮴 등 유해 중금속이 고농도로 검출되며 pH 조절과 화학적 침전법이 정화의 핵심 과정입니다.',
    beakerColor: '#2C3E50', // dark metallic toxic slate
    liquidColor: 'rgba(44, 62, 80, 0.55)',
    beakerTitle: '공장 화학 폐수',
    pollutionLevel: 100,
    temperature: 24,
    hazardLevel: 'High',
    location: '첨단 부품 제조 공단지구 (Industrial Zone)',
    details: '납(Pb) 및 카드뮴(Cd) 등 독성 무기 이온 기준치 15배 초과, pH 3.5 내외의 강산성 상태.'
  }
];

export const FILTERS: FilterOption[] = [
  {
    id: 'activated_carbon',
    title: '활성탄 필터',
    subtitle: '(Charcoal Filter)',
    level: 'Level 1',
    techTitle: '물리적 흡착 / 탁도 및 냄새 제거',
    description: '기공이 많은 탄소 소재를 활용하여 물속의 부유물과 유기물, 냄새를 물리적으로 끌어당겨 제거하는 가장 보편적인 방식입니다.',
    pros: ['저비용 고효율 일반 정화', '뛰어난 탈취 및 부유 물질 제거'],
    cons: ['고농도 유독 화학 물질 분해 불가', '중금속 이온 제거 능력 전무'],
    icon: 'Filter'
  },
  {
    id: 'tio2_photocatalyst',
    title: '이산화티타늄 광촉매',
    subtitle: '(TiO₂ Photocatalyst)',
    level: 'Level 2',
    techTitle: '화학적 분해 / 자외선(UV) 조건 필수',
    description: '자외선(UV)을 받으면 강력한 산화력을 가진 활성 산소(OH Radical)를 생성하여 액체 내 유기 화합물과 세균 등의 난분해성 오염 물질을 이산화탄소와 물로 분해합니다.',
    pros: ['유기 오염 물질 완벽 분해', '영구적이고 반영구적인 재사용성'],
    cons: ['무기 중금속 제거 성능 매우 제한됨', '자외선(UV) 광원 부재 시 효과 전무'],
    icon: 'Sun'
  },
  {
    id: 'carbon_nanotube',
    title: '탄소나노튜브 나노 필터',
    subtitle: '(CNT Nano Filter)',
    level: 'Advanced',
    techTitle: '최첨단 신소재 / 초미세 오염물 차단',
    description: '나노미터(nm) 단위의 균일한 기공을 가진 고강도 탄소 신소재 필터로, 정밀 여과 시스템을 구축해 미세플라스틱, 중금속 이온, 바이러스까지 완벽 차단합니다.',
    pros: ['나노 단위 오염원 완벽 차단', '미세 플라스틱 및 무기 중금속 차단'],
    cons: ['초고가의 필터 제작 비용', '주기적인 역세척 및 장비 유지 보수 필요'],
    icon: 'Zap'
  }
];

export const SAFETY_RULES: SafetyRule[] = [
  {
    id: 1,
    title: '개인 보호구(PPE) 의무 착용',
    desc: '실험실 입장 시 보안경, 보호 장갑, 흰색 실험복을 필수 착용하며 시료 누출 시 신체 접촉을 금지합니다.',
    category: 'general'
  },
  {
    id: 2,
    title: '독성 공장 폐수(시나리오 B) 특별 취급 지침',
    desc: '중금속(납, 카드뮴) 및 강산성 폐수는 흄 후드 내부에서 제한적으로 보관 및 조작해야 하며 전용 폐수 수거 용기에만 폐기해야 합니다.',
    category: 'chemical'
  },
  {
    id: 3,
    title: '광원 조사기(UV) 취급 시 자외선 주의',
    desc: 'TiO₂ 광촉매 반응 실험을 위한 고출력 자외선(UV) 램프 작동 중에는 안구와 피부에 직접 조사되지 않도록 반드시 UV 차단 패널을 닫고 실험해야 합니다.',
    category: 'equipment'
  },
  {
    id: 4,
    title: '탄소나노튜브 고압 한계 주의',
    desc: 'CNT 필터 여과 시 설계 압력(1.5 MPa)을 준수해야 하며, 압력계 게이지가 폭주 영역에 도달할 경우 시뮬레이터 비상 정지(EMS) 버튼을 즉시 누르십시오.',
    category: 'equipment'
  },
  {
    id: 5,
    title: '비상 샤워기 및 세안기 위치 확인',
    desc: '강산 유출 및 시료 접촉 등의 위험 상황 시 실험대 우측의 비상 샤워기와 세안 벨브를 당겨 최소 15분 이상 충분히 세척해 응급조치하십시오.',
    category: 'general'
  }
];

export const getSimulationResult = (
  scenarioId: ScenarioId,
  filterId: FilterId,
  uvEnabled: boolean
): SimulationResult => {
  if (scenarioId === 'A') {
    // Scenario A: 실제 하천물
    if (filterId === 'activated_carbon') {
      return {
        efficiency: 60,
        pollutionRemaining: 40,
        heavyMetalRemoval: 15,
        organicBreakdown: 80,
        statusBadge: 'warning',
        statusText: '일반 하천물보다 개선되었으나 미세 오염 잔류 (주의)',
        summary: '활성탄 필터는 뛰어난 다공성 구조를 통해 물 속의 거친 유기 오염 물질과 냄새 분자, 탁도를 80% 가량 효과적으로 포집 및 정화하였습니다.',
        advice: '하지만 물리적 흡착 한계로 인해 시료 속에 미량 녹아있는 용존 중금속 이온 및 미세 플라스틱 화학 성분을 완벽히 격리하는 데는 실패하였습니다.'
      };
    } else if (filterId === 'tio2_photocatalyst') {
      if (uvEnabled) {
        return {
          efficiency: 90,
          pollutionRemaining: 10,
          heavyMetalRemoval: 30,
          organicBreakdown: 95,
          statusBadge: 'safe',
          statusText: '유기물 및 세균 화학적 분해 완료 (안전)',
          summary: '자외선(UV) 조건 하에서 이산화티타늄(TiO₂) 광촉매의 에너지 준위가 활성화되어 강력한 OH 라디칼을 대량 생성하였습니다. 부영양화의 핵심 원인인 세균과 질화 화합물 유기 오염원을 95% 이상 분해 및 중화하였습니다.',
          advice: '하천물의 오염 특성에 가장 추천하는 과학 정화 시나리오 중 하나입니다. 중금속 제거 성능은 다소 떨어지지만 하천 보건 지표상 생명체 생존에 안전한 수준을 보장합니다.'
        };
      } else {
        return {
          efficiency: 25,
          pollutionRemaining: 75,
          heavyMetalRemoval: 10,
          organicBreakdown: 20,
          statusBadge: 'danger',
          statusText: '자외선(UV) 부재로 광촉매 비활성화 (위험)',
          summary: '이산화티타늄 광촉매는 자외선 조사 반응이 없을 시 에너지를 방출하지 못해 OH 라디칼의 산화환원 연쇄 반응이 일어나지 않습니다. 시료는 거의 정화되지 못했습니다.',
          advice: '광촉매는 단순 가루 장벽에 불과하므로, 자외선(UV) 조사기를 가동하여 OH 라디칼 활성화 에너지를 인가하십시오.'
        };
      }
    } else {
      // carbon_nanotube
      return {
        efficiency: 98,
        pollutionRemaining: 2,
        heavyMetalRemoval: 99.9,
        organicBreakdown: 99,
        statusBadge: 'safe',
        statusText: '초미세 오염원 차단, 정수기 물 수준 달성 (최상)',
        summary: '탄소나노튜브(CNT)의 초미세 나노 격자 필터를 강한 삼투압으로 가압 여과한 결과, 질소, 인 부영양화 입자뿐만 아니라 미생물, 중금속, 미세플라스틱을 99% 이상 물리적으로 포집하였습니다.',
        advice: '완벽한 음용수 수준의 깨끗한 복원이 가능하지만, 산업 스케일에서 실시간 유압 유량을 커버하기에는 펌프 가압 동력 전력 및 필터 소모 단가가 극단적으로 높다는 한계가 존재합니다.'
      };
    }
  } else {
    // Scenario B: 일반 공장 폐수
    if (filterId === 'activated_carbon') {
      return {
        efficiency: 30,
        pollutionRemaining: 70,
        heavyMetalRemoval: 5,
        organicBreakdown: 25,
        statusBadge: 'danger',
        statusText: '정화 실패! 중금속 및 악성 폐수 제거 불가능 (위험)',
        summary: '공장 폐수의 강한 납, 카드뮴 등 무기 유해 중금속 이온과 pH 3.5의 강산성 액체로 인해 활성탄 기공 내부가 순식간에 피독(Poisoning) 현상으로 포화하여 필터링 능력을 완전히 상실했습니다.',
        advice: '활성탄 단일 필터로는 강한 오염 부하와 강산 및 무기 중금속 화합물을 걸러낼 수 없습니다. 침전식 화학 중화나 정밀 나노 분리막(CNT) 조합을 시도하십시오.'
      };
    } else if (filterId === 'tio2_photocatalyst') {
      if (uvEnabled) {
        return {
          efficiency: 40,
          pollutionRemaining: 60,
          heavyMetalRemoval: 20,
          organicBreakdown: 60,
          statusBadge: 'warning',
          statusText: '일부 유기 독성 물질은 분해되었으나 중금속 잔류 (주의)',
          summary: '강한 자외선을 통한 TiO₂ 광촉매 활성 반응으로 수중 난분해성 세척 유기 용매는 일부 CO₂와 물로 분해하는 데 성공하였습니다. 하지만 물속에 완벽하게 분산된 고독성 납과 카드뮴 등 무기 이온은 산화분해를 거치지 않으므로 잔류 농도 감소율이 미미합니다.',
          advice: '환경 기준상 폐수 방류 시 중금속 수치가 한계값을 초과하여 불합격 처분을 받게 됩니다. 반드시 중금속 제거 전용 필터링이나 화학적 중화 침전 방식을 복합 사용해야 합니다.'
        };
      } else {
        return {
          efficiency: 15,
          pollutionRemaining: 85,
          heavyMetalRemoval: 8,
          organicBreakdown: 12,
          statusBadge: 'danger',
          statusText: '자외선 조사 부재 및 광촉매 활성 실패 (위험)',
          summary: '강한 유독 물질을 함유한 공장 화학 폐수에 광촉매 필터만 단순 침지되었으며, 자외선(UV) 촉진 에너지가 전달되지 않아 독성 정화 반응이 개시조차 되지 않았습니다.',
          advice: '광촉매 시뮬레이션 시 반드시 우측 상단의 자외선 전원 공급 장치를 켜서 자외선 에너지를 시료 beaker 내부로 입사해 시도해 보십시오.'
        };
      }
    } else {
      // carbon_nanotube
      return {
        efficiency: 96,
        pollutionRemaining: 4,
        heavyMetalRemoval: 99.5,
        organicBreakdown: 97,
        statusBadge: 'safe',
        statusText: '악성 중금속 및 화학 물질 99% 차단 성공 (안전)',
        summary: '최첨단 신소재 분리막 기술(Carbon Nanotubes)로 악성 공장 폐수를 정밀 통과시켜, 유해 물질인 납(Pb)과 카드뮴(Cd) 이온을 99.5% 여과하였습니다. 또한, 유해 화학 물질의 97% 차단을 완수하였습니다.',
        advice: '화학 유해 중금속이 환경부 법적 방류수 수질 기준치 이하로 떨어져, 완벽하게 합격(Safe to Release) 등급을 획득하였습니다. 탄소 구조의 견고한 고내구성으로 강산성 부식 조건에서도 필터가 안정적으로 거동했습니다.'
      };
    }
  }
};
