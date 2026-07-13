export interface Scenario {
  id: 'river' | 'industrial';
  name: string;
  subtitle: string;
  description: string;
  tags: string[];
  initialTurbidity: number; // 0 - 100
  initialOrganic: number;   // 0 - 100
  initialHeavyMetal: number; // 0 - 100
  bgColor: string;
  textColor: string;
  hazardousLevel: 'Low' | 'Medium' | 'High';
  imageSrc: string;
  altText: string;
}

export interface Catalyst {
  id: 'carbon' | 'tio2' | 'cnt';
  name: string;
  level: 'Level 1' | 'Level 2' | 'Advanced';
  subType: string;
  description: string;
  pros: string;
  cons: string;
  icon: string;
  imageSrc: string;
  altText: string;
}

export interface SimulationConfig {
  scenario: Scenario;
  catalyst: Catalyst;
  uvLight: boolean;
  flowRate: number; // 1 to 10 L/min (optimal: 3-5 L/min for most, 1-2 L/min for deep filtration)
}

export interface SimulationResult {
  finalTurbidity: number;
  finalOrganic: number;
  finalHeavyMetal: number;
  efficiency: number; // overall percentage
  statusMessage: string;
  statusGrade: 'A+' | 'B' | 'F';
  badgeColor: string;
  badgeBg: string;
  detailedNotes: string[];
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  scenarioName: string;
  catalystName: string;
  uvLight: boolean;
  flowRate: number;
  efficiency: number;
  statusGrade: 'A+' | 'B' | 'F';
}
