const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/+$/, "");

const prompts = [
  "Smart shirt for a presentation tomorrow, under ₹1,500",
  "College ke liye kuch simple aur comfortable, 2000 tak",
  "I need a tee",
  "Tee under ₹100",
];

let failed = false;

for (const [index, message] of prompts.entries()) {
  const started = Date.now();
  const response = await fetch(`${base}/api/recommend`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message,
      session_id: `ses_smoke_${index}_${Date.now()}`,
    }),
  });

  const payload = await response.json();
  const ms = Date.now() - started;
  const state = typeof payload.state === "string" ? payload.state : "unknown";
  const items = Array.isArray(payload.items) ? payload.items.length : 0;
  const first = Array.isArray(payload.items) ? payload.items[0] : null;
  const price =
    first && typeof first.item?.price_inr === "number"
      ? `₹${first.item.price_inr}`
      : "—";

  console.log(
    `${response.status}  ${state.padEnd(10)}  ${items} item(s)  ${price}  ${ms}ms  ${message}`,
  );

  if (!response.ok) {
    failed = true;
    console.log(`  ${typeof payload.message === "string" ? payload.message : ""}`);
  }
}

if (failed) {
  process.exit(1);
}
