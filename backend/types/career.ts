/**
 * Career Guidance & Roadmap Type Definitions
 */

export interface RoadmapMilestone {
  id: string;
  title: string;
  tag?: string;
  link?: string;
  completed?: boolean;
}

export interface RoadmapWeek {
  weekNumber: number;
  title: string;
  description: string;
  milestones: RoadmapMilestone[];
}

export interface CareerDiagnostics {
  primaryGaps: string[];
  strengths: string[];
  recommendedFocus?: string;
}

export interface CareerRoadmap {
  targetRole: string;
  targetCompany: string;
  readinessScore: number;
  domainScores: {
    dsa: number;
    systemDesign: number;
    behavioral: number;
    domainKnowledge: number;
  };
  diagnostics: CareerDiagnostics;
  weeks: RoadmapWeek[];
}

