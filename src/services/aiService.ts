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
이 리포트는 전문적인 비즈니스 컨설팅 리포트 형식이어야 하며, 독자가 자신의 강점과 성찰 지점을 명확히 이해하도록 도와야 합니다.

### 분석 대상 정보:
- 성함: ${member.name}
- 역할: ${member.role || '사용자'}
- 주요 생활양식 색상: ${member.primaryColor} (이 색상의 특성을 서론에 녹여내세요)

### 9대 지표 원점수:
${scoresText}

### 리포트 작성 가이드라인 (반드시 다음 구조를 따를 것):

1. **[인사말 및 분석 개요]**: 사용자의 이름을 언급하며 버크만 데이터 분석의 목적과 리포트가 가져다줄 가치를 따뜻하지만 전문적인 어조로 서술하십시오.

2. **1. [행동 성향 분석 (Usual Behavior)]**: 
   - 사용자가 사회적/업무적 환경에서 보여주는 가장 효과적이고 생산적인 행동 패턴을 분석하십시오.
   - 주요 지표(예: AS, SE, PE 등)의 점수가 높은지 낮은지에 따른 구체적인 스타일을 설명하십시오.
   - 이 사람이 가진 '강력한 리더십', '체계적인 관리 능력', '창의적 접근' 등 핵심 역량을 제목과 함께 강조하십시오.

3. **2. [내면 욕구 및 동기 (Interests & Needs)]**: 
   - 사용자가 최고의 성과를 내기 위해 주변 환경이나 타인에게 기대하는 '지원 체계'를 분석하십시오.
   - 어떤 환경에서 에너지를 얻고, 어떤 소통 방식을 선호하는지 구체적으로 서술하십시오.

4. **3. [심리적 스트레스 및 리스크 관리 (Stress)]**: 
   - Usual과 Need 사이의 간극(Gap 25점 이상)이 있는 지표를 찾아 집중 분석하십시오.
   - 욕구가 좌절되었을 때 나타날 수 있는 구체적인 스트레스 행동(예: 철회, 공격성, 과도한 통제 등)을 경고하십시오.
   - 이를 극복하기 위한 심리적/환경적 솔루션을 제안하십시오.

5. **4. [성과 향상을 위한 Self-Coaching Action Plan]**: 
   - 내일부터 즉시 실천할 수 있는 구체적인 행동 제안 3가지를 리스트 형태로 제공하십시오.
   - 타인과의 협업 시 유의사항을 포함하십시오.

6. **[마치는 글]**: 분석 대상의 미래와 성장을 응원하는 고무적인 메시지로 마무리하십시오.

### 서식 규정:
- 마크다운(Markdown) 형식을 사용하십시오.
- 주요 수치나 키워드는 **굵게** 표시하십시오.
- '김천수 팀장님'과 같이 존칭을 사용하십시오.
- 분석 일자는 오늘 날짜를 기준으로 언급하십시오.
- 절대로 중간에 끊기지 않도록 전체 내용을 완결성 있게 작성하십시오. 만약 내용이 길어질 것 같으면 핵심 위주로 깊이 있게 작성하십시오.

언어: 한국어
톤앤매너: 신중함, 통찰력, 분석적, 격려함
`;
}
