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
다음 멤버의 Birkman Cloud V4 데이터를 바탕으로 [개인 맞춤형 코칭 리포트]를 작성하십시오.
핵심 위주로 명확하고 실용적인 인사이트를 제공하십시오.

### 분석할 멤버 데이터:
성함: ${member.name}
역할: ${member.role || '팀원'}
주요색상: ${member.primaryColor}
지표별 점수:
${scoresText}

### 리포트 구성:
1. **[Core Profile]**: 이 멤버의 핵심 강점과 일하는 스타일을 2~3문장으로 정의하십시오.
2. **[Needs & Stress]**: 주요 욕구(Needs)와 이것이 충족되지 않았을 때의 스트레스 행동(Stress)을 분석하십시오. (특히 Gap이 25점 이상인 영역 집중)
3. **[Communication Tip]**: 동료들이 이 멤버와 원활하게 소통하기 위해 '반드시 해야 할 것'과 '피해야 할 것'을 하나씩 제시하십시오.
4. **[Growth Action]**: 이 멤버의 성장을 위한 단기 실행 과제 2가지를 제안하십시오.

언어: 한국어
톤앤매너: 전문적, 따뜻함, 실천적
마지막에 짧은 응원 메시지를 포함하십시오.
`;
}
