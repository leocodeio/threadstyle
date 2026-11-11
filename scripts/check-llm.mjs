const key = process.env.OPENCODE_API_KEY;
const base = (
  process.env.OPENCODE_BASE_URL ?? "https://opencode.ai/inference/go/openai/v1"
).replace(/\/+$/, "");

if (!key) {
  console.error("OPENCODE_API_KEY is missing. Add it to .env.local.");
  process.exit(1);
}

const started = Date.now();
const response = await fetch(`${base}/chat/completions`, {
  method: "POST",
  headers: {
    authorization: `Bearer ${key}`,
    "content-type": "application/json",
    "user-agent": "thread-mvp/1.0",
    "x-opencode-session": "ses_check_llm",
  },
  body: JSON.stringify({
    model: "deepseek-v4.1-flash",
    messages: [
      {
        role: "system",
        content: 'Return only JSON: {"ok": true}',
      },
      { role: "user", content: "Return the JSON now." },
    ],
    temperature: 0,
    max_tokens: 40,
    response_format: { type: "json_object" },
  }),
});

const body = await response.text();
console.log(`status ${response.status} in ${Date.now() - started}ms`);
console.log(body.slice(0, 500));

if (!response.ok) {
  process.exit(1);
}
