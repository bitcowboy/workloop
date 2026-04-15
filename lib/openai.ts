import OpenAI from "openai";

const DEFAULT_BASE_URL =
  process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEFAULT_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export function getOpenAIClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing DEEPSEEK_API_KEY environment variable. You can also use OPENAI_API_KEY as a fallback.",
    );
  }

  return new OpenAI({
    apiKey,
    baseURL: DEFAULT_BASE_URL,
  });
}

export async function createJsonCompletion(
  systemPrompt: string,
  userPrompt: string,
) {
  const client = getOpenAIClient();

  const completion = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("DeepSeek returned an empty response.");
  }

  return JSON.parse(content) as Record<string, unknown>;
}
