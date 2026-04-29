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
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
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
              generationConfig: { maxOutputTokens: 4000 },
              safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
              ]
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
        // Handle finish reason if blocked
        const finishReason = data.candidates?.[0]?.finishReason;
        if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
          throw new Error(`AI 분석이 안전 정책 또는 기술적 이유로 중단되었습니다. (${finishReason})`);
        }
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
          messages: [
            { role: "system", content: "당신은 버크만 성향 분석 전문가입니다. 주어진 수치 데이터를 바탕으로 심층적이고 통찰력 있는 리포트를 작성하며, 절대 중간에 끊기지 않도록 완결성 있게 작성해야 합니다." },
            { role: "user", content: prompt }
          ],
          max_tokens: 3500
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

1. **[전문 분석 요약]**: ${member.name}님의 버크만 지표를 관통하는 통합적 통찰력을 한 문단으로 명쾌하게 제시하십시오.
2. **[강점 및 성과 동력 (Usual Behavior)]**: 사회적 환경에서 발휘되는 핵심 역량 3가지를 도출하십시오.
3. **[성과의 토대: 욕구 및 동기 (Interests & Needs)]**: 어떤 환경에서 에너지가 충전되는지, 타인에게 기대하는 핵심 지원이 무엇인지 분석하십시오.
4. **[성장의 열쇠: 스트레스 관리 (Stress)]**: 간극(Gap)이 큰 지표를 중심으로 '보상 행동'을 설명하고, 이를 예방하기 위한 구체적 솔루션을 제안하십시오.
5. **[집중 실천 과제 (Action Plan)]**: 내일부터 즉시 시작할 '중단할 것(Stop)', '계속할 것(Keep)', '시작할 것(Start)' 모델로 3가지를 제안하십시오.

### 서식 규정:
- 마크다운(Markdown) 형식을 사용하며, 가독성을 위해 불필요하게 긴 문장은 피하십시오.
- 주요 키워드는 **굵게** 표시하십시오.
- 절대로 중간에 리포트가 끊기지 않도록 분량을 적절히 조절하되, 전문성은 유지하십시오.
- 분석 대상의 이름을 '님'과 함께 자주 언급하여 맞춤형 느낌을 주십시오.

언어: 한국어
톤앤매너: 신중함, 통찰력, 분석적, 격려함
`;
}
