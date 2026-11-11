import { z } from "zod";

import { chatCompletion, requestJson, type ChatFn } from "../lib/llm";
import { JUDGE_SYSTEM, judgeUser, type JudgeInput } from "../prompts/judge";

const judgeSchema = z.object({
  pass: z.boolean(),
  reasons: z.array(z.string()).max(4),
});

export type JudgeResult = z.infer<typeof judgeSchema>;

export async function judgeCase(
  input: JudgeInput,
  sessionId: string,
  chat: ChatFn = chatCompletion,
): Promise<JudgeResult> {
  const result = await requestJson(
    {
      agent: "judge",
      system: JUDGE_SYSTEM,
      user: judgeUser(input),
      schema: judgeSchema,
      sessionId,
      maxTokens: 1_500,
      timeoutMs: 15_000,
      temperature: 0,
    },
    chat,
  );

  return result.data;
}
