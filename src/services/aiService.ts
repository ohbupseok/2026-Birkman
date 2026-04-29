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
  const scoresText = Object.entries(memberData.scores)
    .map(([comp, score]) => `${comp}: Usual(${score.usual}), Need(${score.need}), Gap(${Math.abs(score.usual - score.need)})`)
    .join('\n');

  const baseContext = `
사용자: ${memberData.name} (${memberData.role || '사용자'})
색상: ${memberData.primaryColor}
데이터:
${scoresText}
당신은 버크만 전문가입니다. 전문적인 한국어 리포트를 작성하세요.
`;

  const sections = [
    {
      title: "## 1. 버크만 인사이트: 나의 핵심 강점 (Birkman Insight: Strengths)",
      prompt: "이 사용자의 높은 지표(Usual)와 선호도(Interests)를 바탕으로, 샘플 이미지에 있는 것과 유사한 스타일의 '강점 문장' 10가지를 작성하세요. 각 문장은 '-한다' 또는 '-이다'로 끝나야 하며, 한 문장씩 리스트 형태로 작성하세요. (예: '숫자를 가지고 일하거나, 숫자를 사용하고 처리하는 것이 포함된 업무를 즐긴다.')"
    },
    {
      title: "## 2. 버크만 맵 심층 분석 (Birkman Map Deep Analysis)",
      prompt: "버크만 맵의 4사분면(DOER, COMMUNICATOR, ANALYZER, THINKER) 위치를 바탕으로, Usual, Need, Stress 좌표의 의미를 통합적으로 설명하세요. 평소 행동과 내면의 욕구가 어떻게 조화를 이루거나 갈등을 빚는지 전문적으로 분석하세요."
    },
    {
      title: "## 3. 행동 스타일 및 커뮤니케이션 (Behavioral Style)",
      prompt: "9대 지표의 구체적인 점수를 언급하며, 타인과 협업할 때 나타나는 생산적인 스타일을 분석하세요."
    },
    {
      title: "## 4. 스트레스 관리 및 환경 제언 (Stress & Solution)",
      prompt: "욕구가 충족되지 않을 때의 구체적인 스트레스 행동과 이를 예방하기 위한 업무 환경 제언을 포함하세요."
    },
    {
      title: "## 5. 최종 실천 과제 (Action Plan)",
      prompt: "Stop, Keep, Start 모델로 3가지 실천 과제를 제안하고 마지막에 코칭 메시지로 마무리하세요."
    }
  ];

  let fullReport = "";

  try {
    for (const section of sections) {
      const sectionPrompt = `
당신은 버크만 성향 분석 전문가입니다. 다음 데이터를 바탕으로 리포트의 특정 섹션을 작성해 주세요.

[분석 데이터]
${baseContext}

[작성할 섹션 정보]
섹션 제목: ${section.title}
섹션 상세 내용: ${section.prompt}

[작성 가이드]
- 마크다운(Markdown) 형식을 사용하세요.
- 주요 키워드나 수치는 **굵게** 표시하세요.
- 전문적이고 따뜻한 어조를 유지하세요.
- 섹션 제목(${section.title})으로 시작하여 내용을 완결성 있게 작성하세요.
- 절대 중간에 끊기지 않도록 분량을 적절히 조절하세요.
`;

      const sectionContent = await callSingleAIStep(provider, apiKey, model, sectionPrompt);
      if (!sectionContent || sectionContent.length < 5) {
        throw new Error(`[${section.title}] 섹션 생성에 실패했습니다. API 할당량이나 연결 상태를 확인해 주세요.`);
      }
      fullReport += sectionContent.trim() + "\n\n";
    }
    return fullReport;
  } catch (err: any) {
    console.error("Sectioned Generation Error:", err);
    throw new Error(err.message || "리포트 생성 중 알 수 없는 오류가 발생했습니다.");
  }
}

async function callSingleAIStep(
  provider: string,
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
    if (provider === "gemini") {
      const normalizedModel = model.startsWith('models/') ? model.split('/')[1] : model;
      const url = `https://generativelanguage.googleapis.com/v1/models/${normalizedModel}:generateContent?key=${apiKey}`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2000, temperature: 0.7 },
        })
      });
      
      if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || `Gemini API Error: ${res.statusText}`;
          
          if (res.status === 404 || errorMessage.includes("not found")) {
              const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${normalizedModel}:generateContent?key=${apiKey}`;
              const fallbackRes = await fetch(fallbackUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      contents: [{ parts: [{ text: prompt }] }],
                      generationConfig: { maxOutputTokens: 2000 }
                  })
              });
              if (fallbackRes.ok) {
                  const fallbackData = await fallbackRes.json();
                  return fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || "";
              }
          }
          throw new Error(errorMessage);
      }
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
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
          max_tokens: 2000
        })
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message);
      }
      return data.choices?.[0]?.message?.content || "";
    }

  return "";
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
