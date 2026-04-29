/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TeamData } from "../types";

export async function callAIService(
  provider: 'gemini' | 'openai' | 'anthropic',
  apiKey: string,
  model: string,
  teamData: TeamData
): Promise<string> {
  const prompt = buildPrompt(teamData);

  try {
    if (provider === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 4000 }
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.candidates[0].content.parts[0].text;
    }

    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 4000
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.choices[0].message.content;
    }

    if (provider === "anthropic") {
      // Note: Anthropic might have CORS issues in browser, typically handled via proxy
      // Providing standard fetch as fallback
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'dangerously-allow-browser': 'true' // Some SDK bypass
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 4000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.content[0].text;
    }
  } catch (err: any) {
    console.error(`AI Error (${provider}):`, err);
    throw new Error(err.message || "AI 분석 중 오류가 발생했습니다.");
  }

  throw new Error("지원하지 않는 AI 제공자입니다.");
}

function buildPrompt(teamData: TeamData): string {
  const teamContext = teamData.map(member => {
    let scoresText = Object.entries(member.scores)
      .map(([comp, score]) => `${comp}: Usual(${score.usual}), Need(${score.need}), Gap(${Math.abs(score.usual - score.need)})`)
      .join('\n');
    
    return `
멤버이름: ${member.name}
역할: ${member.role || 'N/A'}
주요색상: ${member.primaryColor || 'N/A'}
점수 상세:
${scoresText}
`;
  }).join('\n---\n');

  return `
당신은 버크만 자격 인증 코치(Birkman Certified Consultant)이자 팀 시너지 분석 전문가입니다.
제공된 팀원들의 Birkman Cloud V4 데이터를 바탕으로 전문적인 [팀 시너지 코칭 리포트]를 작성하십시오.

### 분석할 팀 데이터:
${teamContext}

### 데이터 해석 지침 (Automatic Expert Logic):
1. **U-N Gap 분석**: '평소 행동(U)'과 '내면의 욕구(N)'의 점수 차이가 25점 이상인 항목을 찾아 스트레스 위험 지점으로 식별하십시오.
2. **Stress behavior 추론**: 욕구가 충족되지 않았을 때 나타나는 행동을 예측하십시오.
3. **Synergy & Conflict**: 팀원 간 점수를 비교하여 최고의 협업 지점(Synergy)과 잠재적 갈등 지점(Conflict)을 도출하십시오.

### 출력 형식 (반드시 다음 구조를 따르세요):
1. **[Executive Summary]**: 팀 전체의 색깔과 역동성을 한 줄로 요약하십시오.
2. **[Individual Deep-Dive]**: 멤버별 핵심 강점, 필수 욕구, 스트레스 트리거를 심층 분석하십시오.
3. **[Synergy Roadmap]**: 협업 시 '해야 할 것(Do)'과 '하지 말아야 할 것(Don't)'을 구체적으로 제시하십시오.
4. **[Action Plan]**: 성과 극대화를 위한 리더의 맞춤형 코칭 멘트와 운영 전략 3가지를 제안하십시오.

언어: 한국어
톤앤매너: 전문적, 신뢰감, 실용적
`;
}
