/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Radar,
  RadarChart as ReRadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { BIRKMAN_COMPONENTS } from '../constants';
import { MemberData } from '../types';

interface Props {
  members: MemberData[];
  mode: 'usual' | 'need';
}

export const TeamRadarChart: React.FC<Props> = ({ members, mode }) => {
  const data = BIRKMAN_COMPONENTS.map(comp => {
    const entry: any = { component: comp.name, fullId: comp.id };
    members.forEach(m => {
      entry[m.name] = m.scores[comp.id][mode];
    });
    return entry;
  });

  const colors = ['#E85D26', '#059669', '#7C3AED', '#2563EB', '#D97706'];

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <ReRadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="fullId" tick={{ fill: '#6b7280', fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          {members.map((m, i) => (
            <Radar
              key={m.id}
              name={m.name}
              dataKey={m.name}
              stroke={m.primaryColor ? (members.length > 1 ? colors[i % colors.length] : '#E85D26') : colors[i % colors.length]}
              fill={m.primaryColor ? (members.length > 1 ? colors[i % colors.length] : '#E85D26') : colors[i % colors.length]}
              fillOpacity={0.3}
            />
          ))}
          <Legend />
        </ReRadarChart>
      </ResponsiveContainer>
    </div>
  );
};
