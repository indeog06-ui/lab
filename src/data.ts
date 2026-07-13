import { Scenario, Catalyst, SimulationResult, SimulationConfig } from './types';

export const SCENARIOS: Scenario[] = [
  {
    id: 'river',
    name: '실제 하천물',
    subtitle: 'Scenario A - 도심 근교 하천 시료',
    description: '도시 근교 하천에서 수거한 오염된 물입니다. 높은 부유 물질과 유기 화합물, 질소, 인 등 부영양화 원인 물질과 미생물이 다량 포함되어 있습니다.',
    tags: ['탁도 높음', '유기물 오염', '미생물 포함'],
    initialTurbidity: 85,
    initialOrganic: 70,
    initialHeavyMetal: 12,
    bgColor: 'from-blue-900/40 to-slate-900/60',
    textColor: 'text-sky-300',
    hazardousLevel: 'Medium',
    imageSrc: 'https://images.unsplash.com/photo-1534624467416-0a91693f18e3?q=80&w=600&auto=format&fit=crop', // fallback beautiful nature stream
    altText: 'murky river water containing organic particles'
  },
  {
    id: 'industrial',
    name: '일반 공장 폐수',
    subtitle: 'Scenario B - 중화학 제조 공정 배출수',
    description: '정밀 전기전자 및 화학 제조 공정에서 배출된 화학 폐수입니다. 납(Pb), 카드뮴(Cd) 등 유해 중금속이 고농도로 검출되며 pH가 비정상적인 강산성을 띱니다.',
    tags: ['중금속 검출', '독성 물질', '산성도(pH) 불균형'],
    initialTurbidity: 45,
    initialOrganic: 90,
    initialHeavyMetal: 88,
    bgColor: 'from-amber-950/40 to-zinc-900/60',
    textColor: 'text-amber-400',
    hazardousLevel: 'High',
    imageSrc: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?q=80&w=600&auto=format&fit=crop', // fallback chemical factory industrial
    altText: 'highly toxic industrial wastewater'
  }
];

export const CATALYSTS: Catalyst[] = [
  {
    id: 'carbon',
    name: '활성탄 필터',
    level: 'Level 1',
    subType: '물리적 흡착',
    description: '미세한 구멍이 조밀하게 발달한 다공성 탄소 소재를 활용하여 물속의 부유 물질과 냄새, 가스상 유기 화합물을 물리적으로 흡착하여 제거하는 가장 고전적이면서도 검증된 방식입니다.',
    pros: '탁도 및 유기 냄새 제거 능력이 우수하며 설비 비용이 매우 저렴합니다.',
    cons: '구멍보다 크기가 작은 고농도 이온 상태의 중금속이나 정밀 독성 화학 물질은 전혀 걸러내지 못합니다.',
    icon: 'filter_alt',
    imageSrc: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=600&auto=format&fit=crop',
    altText: 'activated charcoal granules'
  },
  {
    id: 'tio2',
    name: '이산화티타늄 광촉매',
    level: 'Level 2',
    subType: '화학적 광분해',
    description: '이산화티타늄(TiO₂)에 특정 파장의 자외선(UV) 빛을 조사하면 표면에서 강력한 산화력을 가진 활성산소(OH 라디칼)가 생성됩니다. 이 활성산소가 유입되는 유기 오염 물질과 세균을 물과 이산화탄소로 완벽히 분해합니다.',
    pros: '세균 및 난분해성 유기 화합물을 근본적으로 분해할 수 있으며, 광원만 유지되면 촉매 수명이 반영구적입니다.',
    cons: '자외선 조사 장치가 반드시 동반되어야 하며, 자외선 강도가 약하거나 물이 너무 탁하면 정화 효율이 급격히 저하됩니다. 중금속은 제거할 수 없습니다.',
    icon: 'flare',
    imageSrc: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=600&auto=format&fit=crop',
    altText: 'titanium dioxide crystals under light'
  },
  {
    id: 'cnt',
    name: '탄소나노튜브 나노 필터',
    level: 'Advanced',
    subType: '초정밀 나노 분리막',
    description: '나노미터(nm) 크기의 일정한 지름을 가진 탄소 구조체를 초고밀도로 적층한 하이테크 신소재 필터입니다. 중수뿐만 아니라 해수 담수화에도 쓰일 만큼 분자/이온 수준의 물질을 크기 및 전하 기반으로 완벽에 가깝게 차단합니다.',
    pros: '초미세 플라스틱, 각종 고농도 중금속 이온, 초미세 박테리아까지 단 한 단계의 여과로 99.9% 이상 완벽 분리합니다.',
    cons: '소재 생산 단가가 매우 높고 고압의 펌프 압력이 요구되며 오염물이 필터 표면에 누적되는 멤브레인 클로깅 현상이 발생할 수 있습니다.',
    icon: 'biotech',
    imageSrc: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop',
    altText: 'carbon nanotube advanced structure'
  }
];

// Helper to run the simulation based on physical and chemical rules
export function calculatePurification(config: SimulationConfig): SimulationResult {
  const { scenario, catalyst, uvLight, flowRate } = config;

  // Flow rate modifier: Optimal flow rate is around 3 L/min.
  // Lower flow rate means more contact time -> slightly better efficiency.
  // Higher flow rate (> 5 L/min) means water passes too quickly -> lower efficiency.
  let flowModifier = 1.0;
  if (flowRate <= 2) {
    flowModifier = 1.1; // Slow and thorough
  } else if (flowRate === 3 || flowRate === 4) {
    flowModifier = 1.0; // Optimal
  } else if (flowRate === 5 || flowRate === 6) {
    flowModifier = 0.85; // Slightly fast
  } else if (flowRate === 7 || flowRate === 8) {
    flowModifier = 0.7; // Fast
  } else {
    flowModifier = 0.55; // Too fast, brief contact
  }

  let finalTurbidity = scenario.initialTurbidity;
  let finalOrganic = scenario.initialOrganic;
  let finalHeavyMetal = scenario.initialHeavyMetal;

  const notes: string[] = [];

  if (scenario.id === 'river') {
    if (catalyst.id === 'carbon') {
      // Activated Carbon: Great for Turbidity, Decent for Organics, Poor for heavy metals (but they are low anyway)
      finalTurbidity = Math.max(2, scenario.initialTurbidity * (1 - 0.88 * flowModifier));
      finalOrganic = Math.max(5, scenario.initialOrganic * (1 - 0.65 * flowModifier));
      finalHeavyMetal = Math.max(1, scenario.initialHeavyMetal * (1 - 0.15 * flowModifier));

      notes.push('활성탄의 탁월한 물리적 기공 흡착 효과로 강물의 흙먼지와 부유물(탁도)을 대폭 개선하였습니다.');
      notes.push('냄새 원인 물질과 일반 유기물도 약 60% 이상 걸러졌으나 물속의 잔류 미생물과 미세 이온 물질은 다소 남아 있습니다.');
      notes.push('장기 음용을 위해서는 추가 염소 소독 또는 자외선(UV) 살균 과정이 필요합니다.');
    } 
    else if (catalyst.id === 'tio2') {
      if (uvLight) {
        // TiO2 + UV: Phenomenal organic decomposition, decent turbidity removal (light path is slightly blocked by turbidity, reducing efficiency slightly)
        const lightPenetrationModifier = scenario.initialTurbidity > 60 ? 0.8 : 1.0;
        finalTurbidity = Math.max(15, scenario.initialTurbidity * (1 - 0.45 * flowModifier * lightPenetrationModifier));
        finalOrganic = Math.max(1, scenario.initialOrganic * (1 - 0.95 * flowModifier * lightPenetrationModifier));
        finalHeavyMetal = Math.max(1, scenario.initialHeavyMetal * (1 - 0.20 * flowModifier));

        notes.push('자외선(UV) 램프 작동으로 활성화된 TiO₂ 광촉매가 유기 오염 물질과 세균을 근본적으로 95% 이상 분해 소멸시켰습니다.');
        notes.push('다만, 하천수 특유의 높은 초기 탁도로 인해 빛이 깊이 투과하지 못해 탁도 제거 효율은 약간 제한되었습니다.');
        notes.push('세균 감염 위험이 매우 적고 산화 분해된 안전한 청정 생태 용수로 정화되었습니다.');
      } else {
        // TiO2 WITHOUT UV: Barely works!
        finalTurbidity = Math.max(65, scenario.initialTurbidity * (1 - 0.10 * flowModifier));
        finalOrganic = Math.max(55, scenario.initialOrganic * (1 - 0.15 * flowModifier));
        finalHeavyMetal = Math.max(10, scenario.initialHeavyMetal * (1 - 0.05 * flowModifier));

        notes.push('주의: 자외선(UV) 에너지원이 부재하여 이산화티타늄의 촉매 반응이 거의 일어나지 않았습니다.');
        notes.push('물리적인 단순 침전 효과 외에는 오염물 분해가 진행되지 않아 부적합한 수질 상태를 보입니다.');
        notes.push('광촉매 활성화를 위해 상단 제어기에서 자외선(UV) 스위치를 작동시키십시오.');
      }
    } 
    else if (catalyst.id === 'cnt') {
      // Carbon Nanotube: Best filtration for everything
      finalTurbidity = Math.max(0.5, scenario.initialTurbidity * (1 - 0.99 * flowModifier));
      finalOrganic = Math.max(0.5, scenario.initialOrganic * (1 - 0.99 * flowModifier));
      finalHeavyMetal = Math.max(0.1, scenario.initialHeavyMetal * (1 - 0.98 * flowModifier));

      notes.push('나노미터 단위의 정밀 탄소 장벽이 미세 유기물, 박테리아, 이온까지 완벽한 물리적 크기 배제로 차단했습니다.');
      notes.push('탁도가 1% 미만으로 감소하여 매우 맑고 청정한 식수(Pure Water) 등급의 최고 수준 물로 거듭났습니다.');
      notes.push('고가의 공정이나, 하천 수질 정화 가상 실험 중 가장 완벽하고 이상적인 결과를 도출하였습니다.');
    }
  } 
  else if (scenario.id === 'industrial') {
    if (catalyst.id === 'carbon') {
      // Carbon Filter in heavy chemical: Pores are blocked instantly! Clogging
      finalTurbidity = Math.max(30, scenario.initialTurbidity * (1 - 0.25 * flowModifier));
      finalOrganic = Math.max(65, scenario.initialOrganic * (1 - 0.20 * flowModifier));
      finalHeavyMetal = Math.max(80, scenario.initialHeavyMetal * (1 - 0.05 * flowModifier));

      notes.push('심각: 유해 중금속(납, 카드뮴 등)은 이온 상태로 존재하므로 탄소 기공에 흡착되지 않고 그대로 유출되었습니다.');
      notes.push('고농도 산성 화학 물질의 자극과 슬러지 입자가 활성탄 기공을 빠르게 막아버려 여과 장치로서의 제 기능을 상실했습니다.');
      notes.push('공장 폐수의 복합 오염에는 단순히 물리적인 활성탄 여과법을 단독 적용해서는 안 된다는 사실을 증명합니다.');
    } 
    else if (catalyst.id === 'tio2') {
      if (uvLight) {
        finalTurbidity = Math.max(25, scenario.initialTurbidity * (1 - 0.35 * flowModifier));
        finalOrganic = Math.max(25, scenario.initialOrganic * (1 - 0.70 * flowModifier));
        finalHeavyMetal = Math.max(65, scenario.initialHeavyMetal * (1 - 0.15 * flowModifier));

        notes.push('UV 자외선 촉매 효과로 인해 고농도 유기 화학 결합은 상당수(70%) 파괴되어 독성이 일부 완화되었습니다.');
        notes.push('하지만, 광분해법 역시 금속 양이온 상태의 독성 중금속 물질을 걸러내거나 흡착시키는 데에는 구조적인 한계가 뚜렷합니다.');
        notes.push('방류 시 중금속으로 인한 심각한 토양 및 강 오염을 초래하므로 방류수 수질 기준에 절대 미달하는 상태입니다.');
      } else {
        finalTurbidity = Math.max(40, scenario.initialTurbidity * (1 - 0.05 * flowModifier));
        finalOrganic = Math.max(80, scenario.initialOrganic * (1 - 0.08 * flowModifier));
        finalHeavyMetal = Math.max(85, scenario.initialHeavyMetal * (1 - 0.01 * flowModifier));

        notes.push('주의: 자외선 미작동으로 광화학 분해 작용이 전혀 일어나지 않았습니다. 고농도 공장 폐수 상태가 그대로 보존되어 방류 시 생태계 파괴를 야기합니다.');
      }
    } 
    else if (catalyst.id === 'cnt') {
      // Carbon Nanotube: Handles heavy metals extremely well!
      finalTurbidity = Math.max(1.0, scenario.initialTurbidity * (1 - 0.98 * flowModifier));
      finalOrganic = Math.max(1.5, scenario.initialOrganic * (1 - 0.98 * flowModifier));
      finalHeavyMetal = Math.max(0.8, scenario.initialHeavyMetal * (1 - 0.99 * flowModifier));

      notes.push('성공: 고압의 나노 여과 공정으로 악성 중금속(납, 카드뮴) 양이온을 탄소 결합 장벽의 미세공을 통해 99% 완벽히 포집 분리하였습니다.');
      notes.push('화학 물질 분열 및 나노 정제가 동시에 수행되어 공장 폐수가 하천 방류 허용 수질 기준치를 여유롭게 통과했습니다.');
      notes.push('첨단 고밀도 탄소 구조체가 이온 분리막 역할을 완벽하게 수행한 탁월한 공정 조합입니다.');
    }
  }

  // Calculate overall efficiency based on reduction
  const initialSum = scenario.initialTurbidity + scenario.initialOrganic + scenario.initialHeavyMetal;
  const finalSum = finalTurbidity + finalOrganic + finalHeavyMetal;
  const efficiency = Math.round(((initialSum - finalSum) / initialSum) * 100);

  // Grade decision
  let statusMessage = '';
  let statusGrade: 'A+' | 'B' | 'F' = 'F';
  let badgeColor = 'text-error';
  let badgeBg = 'bg-error-container';

  if (efficiency >= 90) {
    statusGrade = 'A+';
    statusMessage = scenario.id === 'river' 
      ? '초미세 오염원 차단, 정수기 물 수준 달성 (최상)'
      : '악성 중금속 및 화학 물질 99% 차단 성공 (안전)';
    badgeColor = 'text-green-600';
    badgeBg = 'bg-emerald-500/10 border-emerald-500/20';
  } else if (efficiency >= 50) {
    statusGrade = 'B';
    statusMessage = '일반 하천물보다 개선되었으나 미세 오염 잔류 (주의)';
    badgeColor = 'text-amber-600';
    badgeBg = 'bg-amber-500/10 border-amber-500/20';
  } else {
    statusGrade = 'F';
    statusMessage = '최종 수질 상태: 정화 실패! 오염 물질 제거 불가능 (위험)';
    badgeColor = 'text-red-600';
    badgeBg = 'bg-red-500/10 border-red-500/20';
  }

  // Fine-tune values for decimal display
  return {
    finalTurbidity: parseFloat(finalTurbidity.toFixed(1)),
    finalOrganic: parseFloat(finalOrganic.toFixed(1)),
    finalHeavyMetal: parseFloat(finalHeavyMetal.toFixed(1)),
    efficiency,
    statusMessage,
    statusGrade,
    badgeColor,
    badgeBg,
    detailedNotes: notes
  };
}
