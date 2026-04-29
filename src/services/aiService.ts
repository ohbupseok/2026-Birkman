/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MemberData } from "../types";

export async function callAIService(
  provider: 'gemini' | 'openai' | 'anthropic',
  apiKey: string,
  model: string,
  memberData: MemberData
): Promise<string> {
  const prompt = buildIndividualPrompt(memberData);

  try {
    if (provider === "gemini") {
      const normalizedModel = model.startsWith('models/') ? model.split('/')[1] : model;
      const url = `https://generativelanguage.googleapis.com/v1/models/${normalizedModel}:generateContent?key=${apiKey}`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            maxOutputTokens: 4000,
            temperature: 0.7
          }
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage = errorData.error?.message || `Gemini API Error: ${res.statusText}`;
        
        if (res.status === 404 || errorMessage.includes("not found")) {
          const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${normalizedModel}:generateContent?key=${apiKey}`;
          const fallbackRes = await fetch(fallbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 4000 }
            })
          });
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            return fallbackData.candidates[0].content.parts[0].text;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("AI로부터 유효한 응답을 받지 못했습니다. API 키와 모델명을 확인해주세요.");
      }
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

function buildIndividualPrompt(member: MemberData): string {
  const scoresText = Object.entries(member.scores)
    .map(([comp, score]) => `${comp}: Usual(${score.usual}), Need(${score.need}), Gap(${Math.abs(score.usual - score.need)})`)
    .join('\n');

  return `
당신은 버크만 자격 인증 코치(Birkman Certified Consultant)입니다.
다음 사용자의 Birkman Cloud V4 데이터를 바탕으로 [개인 심층 성향 분석 리포트]를 작성하십시오.
특히 '평소 행동(Usual)'과 '내면의 욕구(Needs)'의 상관관계를 통해 개인의 역동성을 분석하십시오.

### 분석할 개인 데이터:
성함: ${member.name}
역할: ${member.role || '사용자'}
주요색상: ${member.primaryColor}
9대 지표 점수:
${scoresText}

### 리포트 구성 가이드:
1. **[행동 성향 분석 (Usual)]**: 이 사람이 사회적으로 보여주는 건강한 업무 스타일과 생산적인 행동 특성을 상세히 설명하십시오.
2. **[내면 욕구 및 동기 (Needs)]**: 이 사람이 에너지를 얻고 편안함을 느끼기 위해 타인에게 기대하는 '내면의 욕구'를 분석하십시오.
3. **[심리적 스트레스 (Stress)]**: 평소 행동(Usual)과 욕구(Needs) 사이의 Gap(25점 이상인 영역)을 분석하여, 욕구가 충족되지 않았을 때 나타날 수 있는 Stress Behavior를 경고하고 완화책을 제시하십시오.
4. **[Self-Coaching Action]**: 스스로를 더 효과적으로 관리하고 생산성을 높이기 위한 맞춤형 실행 과제 3가지를 제안하십시오.

언어: 한국어
톤앤매너: 전문적, 통찰력 있는, 동기부여적
마지막에 이 사람의 성장을 응원하는 짧고 강렬한 코칭 메시지를 포함하십시오.
`;
}
