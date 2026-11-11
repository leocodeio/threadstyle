import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

import { recommend } from "../lib/recommend";
import { judgeCase } from "./judge";
import { checkDeterministic, type Check, type GoldenRow } from "./checks";
import { judgeInput } from "./inputs";

type CaseRecord = {
  readonly id: string;
  readonly input: string;
  readonly expected: string;
  readonly state: string;
  readonly det: Check;
  readonly judge: { readonly pass: boolean; readonly reasons: readonly string[] };
  readonly latency_ms: number;
  readonly items: readonly string[];
};

function loadRows(): GoldenRow[] {
  const csvPath = path.resolve(process.cwd(), "references/golden_set_v0.csv");
  const csv = fs.readFileSync(csvPath, "utf8");
  const parsed = Papa.parse<GoldenRow>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];
    throw new Error(`Could not read golden set: ${first?.message ?? "unknown"}`);
  }

  return parsed.data;
}

async function main() {
  if (!process.env.OPENCODE_API_KEY) {
    console.error("OPENCODE_API_KEY is missing. Add it to .env.local.");
    process.exit(1);
  }

  const rows = loadRows();
  const logsDir = path.resolve(process.cwd(), "logs");
  fs.mkdirSync(logsDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logPath = path.join(logsDir, `eval-${timestamp}.jsonl`);

  const records: CaseRecord[] = [];

  for (const row of rows) {
    const started = Date.now();

    try {
      const result = await recommend(row.input, {
        sessionId: `ses_eval_${row.id}`,
      });
      const det = checkDeterministic(row, result);
      const judged = await judgeCase(
        judgeInput(row, result),
        `ses_eval_judge_${row.id}`,
      );

      const record: CaseRecord = {
        id: row.id,
        input: row.input,
        expected: row.expected_behavior,
        state: result.state,
        det,
        judge: judged,
        latency_ms: Date.now() - started,
        items: result.items.map((entry) => entry.item.item_id),
      };

      records.push(record);
      fs.appendFileSync(
        logPath,
        `${JSON.stringify({ ...record, message: result.message, raw: result })}\n`,
      );

      console.log(
        [
          row.id.padEnd(4),
          result.state.padEnd(10),
          det.ok ? "det:pass" : "det:FAIL",
          judged.pass ? "judge:pass" : "judge:FAIL",
          `${record.latency_ms}ms`,
          result.items.map((entry) => entry.item.item_id).join(","),
        ].join("  "),
      );

      if (!det.ok) {
        console.log(`     ${det.failures.join(" | ")}`);
      }
      if (!judged.pass) {
        console.log(`     ${judged.reasons.join(" | ")}`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "unknown evaluation error";
      const record: CaseRecord = {
        id: row.id,
        input: row.input,
        expected: row.expected_behavior,
        state: "error",
        det: { ok: false, failures: [message] },
        judge: { pass: false, reasons: ["not judged: request failed"] },
        latency_ms: Date.now() - started,
        items: [],
      };
      records.push(record);
      fs.appendFileSync(logPath, `${JSON.stringify(record)}\n`);
      console.log(`${row.id.padEnd(4)}  error  ${message}`);
    }
  }

  const detPass = records.filter((record) => record.det.ok).length;
  const judgePass = records.filter((record) => record.judge.pass).length;
  const meanLatency = Math.round(
    records.reduce((sum, record) => sum + record.latency_ms, 0) /
      Math.max(records.length, 1),
  );

  console.log("");
  console.log(`Deterministic: ${detPass}/${records.length}`);
  console.log(`Judge:         ${judgePass}/${records.length}`);
  console.log(`Mean latency:  ${meanLatency}ms`);
  console.log(`Log:           ${logPath}`);

  if (detPass < records.length) {
    process.exitCode = 1;
  }
  if (judgePass < 27) {
    process.exitCode = 1;
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "evaluation failed");
  process.exitCode = 1;
});
