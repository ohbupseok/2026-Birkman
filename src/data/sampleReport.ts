/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MemberData } from '../types';

export interface BirkmanDetailedData extends MemberData {
  mapCoordinates: {
    interests: { x: number; y: number };
    usual: { x: number; y: number };
    need: { x: number; y: number };
    stress: { x: number; y: number };
  };
  interestScores: {
    name: string;
    score: number;
    description: string;
  }[];
}

export const OH_BEOM_SEOK_DATA: BirkmanDetailedData = {
  id: 'obs-001',
  name: '오범석',
  role: 'Senior Project Manager',
  primaryColor: 'blue',
  mapCoordinates: {
    interests: { x: 82, y: 35 }, // Blue Quadrant (Reflective, People)
    usual: { x: 75, y: 70 },    // Green Quadrant (Active, People)
    need: { x: 25, y: 20 },     // Yellow Quadrant (Reflective, Task)
    stress: { x: 30, y: 80 },   // Red Quadrant (Active, Task)
  },
  interestScores: [
    { name: 'Social Service', score: 92, description: 'Helping people, social welfare' },
    { name: 'Persuasive', score: 85, description: 'Debating, influencing, selling' },
    { name: 'Literary', score: 78, description: 'Writing, reading, language' },
    { name: 'Artistic', score: 65, description: 'Creative arts, aesthetic' },
    { name: 'Administrative', score: 45, description: 'Organizing, detail-oriented tasks' },
    { name: 'Numerical', score: 35, description: 'Working with numbers, math' },
    { name: 'Scientific', score: 25, description: 'Research, logic, discovery' },
    { name: 'Musical', score: 40, description: 'Performance, appreciation' },
    { name: 'Outdoor', score: 30, description: 'Physical activity outside' },
    { name: 'Technical', score: 15, description: 'Mechanics, engineering' },
  ],
  scores: {
    SE: { usual: 85, need: 20, stress: 90 }, // Social Energy
    PE: { usual: 40, need: 60, stress: 20 }, // Physical Energy
    EE: { usual: 75, need: 45, stress: 85 }, // Emotional Energy
    AS: { usual: 80, need: 30, stress: 95 }, // Assertiveness
    IN: { usual: 30, need: 85, stress: 15 }, // Insistence
    TH: { usual: 55, need: 92, stress: 25 }, // Thought
    RE: { usual: 70, need: 35, stress: 80 }, // Restlessness
    AU: { usual: 60, need: 15, stress: 75 }, // Authority
    IC: { usual: 45, need: 70, stress: 30 }, // Incentive
  }
};
