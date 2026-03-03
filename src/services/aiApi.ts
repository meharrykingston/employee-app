import { apiPost } from "./api";

type ChatRole = "system" | "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type AiChatResult = {
  reply: string;
  provider: string;
  model: string;
  phase: "clarify" | "recommend";
  quickReplies: string[];
  suggestedTests: Array<{
    name: string;
    reason?: string;
    category?: string;
  }>;
};

export type ReadinessQuestion = {
  id: string;
  question: string;
  options: Array<{ value: "yes" | "no"; label: string }>;
};

export async function askAiChat(input: {
  message: string;
  history: ChatMessage[];
}): Promise<AiChatResult> {
  const apiKey = import.meta.env.VITE_GROK_API_KEY?.trim();
  return apiPost<
    AiChatResult,
    { message: string; history: ChatMessage[]; apiKey?: string }
  >("/ai/chat", {
    message: input.message,
    history: input.history,
    apiKey: apiKey || undefined,
  });
}

export async function getAiLabReadinessQuestions(input: {
  testName: string;
  fastingInfo?: string;
}): Promise<{ questions: ReadinessQuestion[]; model: string }> {
  const apiKey = import.meta.env.VITE_GROK_API_KEY?.trim();
  return apiPost<
    { questions: ReadinessQuestion[]; model: string },
    { testName: string; fastingInfo?: string; apiKey?: string }
  >("/ai/lab-readiness", {
    testName: input.testName,
    fastingInfo: input.fastingInfo,
    apiKey: apiKey || undefined,
  });
}
