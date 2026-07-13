export type ScenarioId = 'A' | 'B';

export type FilterId = 'activated_carbon' | 'tio2_photocatalyst' | 'carbon_nanotube';

export type SimulationState = 'select_scenario' | 'select_filter' | 'simulating' | 'result_report';

export type TabState = 'lab' | 'data' | 'safety';

export interface Scenario {
  id: ScenarioId;
  title: string;
  subtitle: string;
  tags: string[];
  description: string;
  beakerColor: string;
  liquidColor: string;
  beakerTitle: string;
  pollutionLevel: number;
  temperature: number;
  hazardLevel: 'Low' | 'Medium' | 'High';
  details: string;
  location: string;
}

export interface FilterOption {
  id: FilterId;
  title: string;
  subtitle: string;
  level: string;
  techTitle: string;
  description: string;
  pros: string[];
  cons: string[];
  icon: string;
}

export interface SimulationResult {
  efficiency: number;
  pollutionRemaining: number;
  heavyMetalRemoval: number;
  organicBreakdown: number;
  statusText: string;
  statusBadge: 'safe' | 'warning' | 'danger';
  summary: string;
  advice: string;
}

export interface ExperimentLog {
  id: string;
  timestamp: string;
  scenarioId: ScenarioId;
  scenarioTitle: string;
  filterId: FilterId;
  filterTitle: string;
  efficiency: number;
  pollutionRemaining: number;
  heavyMetalRemoval: number;
  organicBreakdown: number;
  statusBadge: 'safe' | 'warning' | 'danger';
  statusText: string;
}

export interface SafetyRule {
  id: number;
  title: string;
  desc: string;
  category: 'general' | 'chemical' | 'equipment';
}
