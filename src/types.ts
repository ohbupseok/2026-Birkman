/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BirkmanScore {
  usual: number;
  need: number;
  stress?: number;
}

export interface BirkmanComponent {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface MemberData {
  id: string;
  name: string;
  role?: string;
  scores: {
    [key: string]: BirkmanScore;
  };
  primaryColor?: 'red' | 'green' | 'yellow' | 'blue';
  reliabilityScore?: number;
}

export type TeamData = MemberData[];

export interface SynergyReport {
  executiveSummary: string;
  individualDeepDive: string;
  synergyRoadmap: string;
  actionPlan: string;
}
