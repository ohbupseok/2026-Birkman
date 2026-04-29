/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BirkmanComponent } from './types';

export const BIRKMAN_COMPONENTS: BirkmanComponent[] = [
  { id: 'SE', name: '사교성 (Social Energy)', description: '타인과 어울리고 관계를 맺는 정도', color: '#E85D26' },
  { id: 'PE', name: '활동성 (Physical Energy)', description: '신체적 에너지를 발산하고 움직이는 정도', color: '#059669' },
  { id: 'EE', name: '감수성 (Emotional Energy)', description: '타인의 감정에 공감하고 정서적으로 반응하는 정도', color: '#7C3AED' },
  { id: 'AS', name: '주도성 (Assertiveness)', description: '자신의 의견을 피력하고 리드하려는 정도', color: '#DC2626' },
  { id: 'IN', name: '치밀함 (Insistence)', description: '절차를 따르고 세부 사항에 집중하는 정도', color: '#2563EB' },
  { id: 'TH', name: '신중함 (Thought)', description: '결정 전 정보를 분석하고 심사숙고하는 정도', color: '#0891B2' },
  { id: 'RE', name: '변화적응 (Restlessness)', description: '동시다발적 업무와 새로운 변화를 선호하는 정도', color: '#D97706' },
  { id: 'AU', name: '영향력 (Authority)', description: '사회적 위계와 권위를 중시하는 정도', color: '#9D174D' },
  { id: 'IC', name: '보상욕구 (Incentive)', description: '가시적인 보상과 경쟁을 중요시하는 정도', color: '#92400E' },
];

export const BIRKMAN_COLORS = {
  red: { name: '레드', hex: '#E85D26', bg: '#FFF0EB', text: '행동 주도형' },
  green: { name: '그린', hex: '#059669', bg: '#ECFDF5', text: '소통 창의형' },
  yellow: { name: '옐로우', hex: '#D97706', bg: '#FFFBEB', text: '분석 체계형' },
  blue: { name: '블루', hex: '#2563EB', bg: '#EFF6FF', text: '관계 공감형' },
};

export const EXAMPLE_TEAM_DATA = [
  {
    id: '1',
    name: '김철수 (팀장)',
    role: 'Team Leader',
    scores: {
      SE: { usual: 80, need: 75 },
      PE: { usual: 60, need: 50 },
      EE: { usual: 40, need: 85 },
      AS: { usual: 90, need: 70 },
      IN: { usual: 30, need: 20 },
      TH: { usual: 50, need: 60 },
      RE: { usual: 85, need: 90 },
      AU: { usual: 75, need: 80 },
      IC: { usual: 80, need: 70 },
    },
    primaryColor: 'red' as const
  },
  {
    id: '2',
    name: '이영희',
    role: 'Developer',
    scores: {
      SE: { usual: 30, need: 20 },
      PE: { usual: 40, need: 30 },
      EE: { usual: 70, need: 40 },
      AS: { usual: 20, need: 30 },
      IN: { usual: 90, need: 85 },
      TH: { usual: 95, need: 90 },
      RE: { usual: 20, need: 15 },
      AU: { usual: 30, need: 25 },
      IC: { usual: 40, need: 50 },
    },
    primaryColor: 'yellow' as const
  },
  {
    id: '3',
    name: '박지민',
    role: 'Designer',
    scores: {
      SE: { usual: 60, need: 85 },
      PE: { usual: 70, need: 60 },
      EE: { usual: 85, need: 70 },
      AS: { usual: 40, need: 65 },
      IN: { usual: 50, need: 40 },
      TH: { usual: 40, need: 30 },
      RE: { usual: 70, need: 85 },
      AU: { usual: 45, need: 50 },
      IC: { usual: 60, need: 75 },
    },
    primaryColor: 'green' as const
  }
];
