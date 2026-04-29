import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Generate Report
  app.post("/api/generate", async (req, res) => {
    try {
      const { provider, apiKey, model, memberData } = req.body;

      if (!provider || !model) {
        return res.status(400).json({ error: "Provider and model are required" });
      }

      // Use API key from request if provided (for flexibility), otherwise from env
      const effectiveKey = apiKey || (provider === 'gemini' ? process.env.GEMINI_API_KEY : process.env.OPENAI_API_KEY);

      if (!effectiveKey) {
        return res.status(401).json({ error: "Missing API Key. Please provide it in settings or environment." });
      }

      const report = await generateBirkmanReport(provider, effectiveKey, model, memberData);
      res.json({ report });
    } catch (err: any) {
      console.error("Server API Error:", err);
      res.status(500).json({ error: err.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

// --- Cache & Rate Limit Utilities ---
const reportCache = new Map<string, { content: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

async function fetchWithRetry(url: string, options: any, maxRetries = 3): Promise<Response> {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(url, options);
    if (res.ok) return res;
    if (res.status !== 429) throw new Error(`API Error: ${res.statusText}`);
    
    lastError = new Error("Rate limit exceeded. Retrying...");
    const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
    console.log(`[Rate Limit] Retrying in ${Math.round(delay)}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw lastError;
}

// --- AI Generation Logic (Moved to Server for Performance & Security) ---

async function generateBirkmanReport(
  provider: string,
  apiKey: string,
  model: string,
  memberData: any
): Promise<string> {
  // 1. Check Cache
  const cacheKey = `${memberData.id}-${model}-${JSON.stringify(memberData.scores)}`;
  const cached = reportCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Cache Hit] Serving report for ${memberData.name}`);
    return cached.content;
  }

  const scoresText = Object.entries(memberData.scores)
    .map(([comp, score]: [string, any]) => `${comp}: U${score.usual}/N${score.need}`)
    .join(', ');

  const baseContext = `Name:${memberData.name}, Role:${memberData.role}, Color:${memberData.primaryColor}, Data:[${scoresText}]`;

  const sections = [
    {
      id: 1,
      title: "## 1. 버크만 인사이트: 나의 핵심 강점 (Birkman Insight: Strengths)",
      prompt: "높은 Usual 지표 바탕 강점 문장 10가지를 리스트 형태로 작성. 전문적 한국어."
    },
    {
      id: 2,
      title: "## 2. 버크만 맵 심층 분석 (Birkman Map Deep Analysis)",
      prompt: "Usual, Need, Stress 좌표 통합 분석. 내면 욕구와 행동의 조화/갈등을 전문적으로 설명."
    },
    {
      id: 3,
      title: "## 3. 행동 스타일 및 커뮤니케이션 (Behavioral Style)",
      prompt: "9대 지표 상호작용 및 협업 스타일 분석."
    },
    {
      id: 4,
      title: "## 4. 스트레스 관리 및 환경 제언 (Stress & Solution)",
      prompt: "스트레스 행동 예측 및 업무 환경 솔루션 제시."
    },
    {
      id: 5,
      title: "## 5. 최종 실천 과제 (Action Plan)",
      prompt: "Stop, Keep, Start 모델로 실천 과제 제안 및 코칭 메시지 마무리."
    }
  ];

  // Parallelize with individual item error handling
  const sectionPromises = sections.map(async (section, index) => {
    // Add jitter to stagger requests and avoid initial burst rate limit
    await new Promise(r => setTimeout(r, index * 100));

    const fullPrompt = `전문가로서 다음 데이터를 바탕으로 섹션 작성.
Data: ${baseContext}
섹션: ${section.title}
상세 가이드: ${section.prompt}
마크다운 형식 사용. 굵게 강조 필수.`;

    return callSingleAIStep(provider, apiKey, model, fullPrompt)
      .then(content => ({ id: section.id, content: content.trim() }));
  });

  const results = await Promise.all(sectionPromises);
  const finalReport = results
    .sort((a, b) => a.id - b.id)
    .map(r => r.content)
    .join("\n\n");

  // 2. Save to Cache
  reportCache.set(cacheKey, { content: finalReport, timestamp: Date.now() });
  
  return finalReport;
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
    
    const res = await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1500, temperature: 0.6 },
      }),
    });

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Safety filter triggered or empty response.");
    return text;
  }

  if (provider === "openai") {
    const res = await fetchWithRetry("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
        temperature: 0.6,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

startServer();
