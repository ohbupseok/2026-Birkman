import { MemberData } from "../types";

/**
 * Calls the backend API to generate a Birkman report.
 * Moving the actual AI logic to the server improves security (hiding keys)
 * and performance (parallelizing section generation).
 */
export async function callAIService(
  provider: 'gemini' | 'openai' | 'anthropic',
  apiKey: string,
  model: string,
  memberData: MemberData
): Promise<string> {
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider,
        apiKey, // Passing this for flexibility if the user provides their own key in the UI
        model,
        memberData,
      }),
    });

    if (!response.ok) {
      let errorMessage = "분석 중 오류가 발생했습니다.";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {}
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.report;
  } catch (err: any) {
    console.error("AI Service Error:", err);
    throw new Error(err.message || "서버와 통신하는 중 오류가 발생했습니다.");
  }
}
