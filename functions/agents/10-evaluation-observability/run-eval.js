#!/usr/bin/env node
// Layer 10: the eval suite itself — runs fixtures.js's fixed set of
// prompts against the real pipeline (real DeepSeek calls, real templates)
// and checks the results against known-good shapes/checks.js's copy-tell
// patterns. Exists to catch a system-prompt regression (goalSetter.js,
// coder.js) before it ships, without a human having to eyeball every
// change by hand — see agents/README.md's layer 10 note and this folder's
// README.md.
//
// Two tiers, picked with --mode:
//   --mode=live (default)   Real DeepSeek calls, real (small) cost, needs
//                           DEEPSEEK_API_KEY + network. Catches model drift,
//                           not just code regressions. Run by hand before
//                           shipping a system-prompt change, or on a weekly/
//                           pre-release schedule — not on every commit.
//   --mode=record           Same real calls as live, PLUS snapshots every
//                           fixture's raw response to ./recordings/<key>.json
//                           (keyed off a hash of exactly what was sent — see
//                           01-model/provider.js's setEvalMode). Run this by
//                           hand once after any change to goalSetter.js or
//                           coder.js's prompt text, to refresh the fixtures
//                           the replay tier checks against.
//   --mode=replay           Free, no network, no API key needed — every
//                           callAgent/callAgentWithTools call is served from
//                           the recordings/ committed alongside this file
//                           instead of hitting DeepSeek. Catches a regression
//                           in the DOWNSTREAM parsing/classification code
//                           (goalSetter.js's own JSON handling, checks.js,
//                           shared.js's extractJson) using the exact same
//                           model output as the last recorded run — it
//                           cannot catch the model itself drifting, only
//                           this codebase breaking on a fixed input. Safe to
//                           wire into a pre-commit hook or CI: `npm run
//                           eval:replay`.
//
// Every mode also prints a diff against ./baseline.json (last run's
// PASS/FAIL per case) — "goalSetter recolor-classification: was PASS, now
// FAIL" instead of a flat pass count, so a regression is legible without
// re-reading raw output. live/record modes overwrite baseline.json after a
// full run; replay mode never touches it (a replay run is only ever as
// fresh as the last recording, so it shouldn't get to declare a new
// baseline).
const fs = require('fs');
const path = require('path');

function loadDotEnv() {
  const envPath = path.join(__dirname, '..', '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && !(key in process.env)) process.env[key] = value;
  }
}
loadDotEnv();

const MODE_ARG = process.argv.find((a) => a.startsWith('--mode='));
const mode = MODE_ARG ? MODE_ARG.split('=')[1] : 'live';
if (!['live', 'record', 'replay'].includes(mode)) {
  console.error(`Unknown --mode=${mode} — expected live, record, or replay.`);
  process.exit(1);
}

const apiKey = process.env.DEEPSEEK_API_KEY;
const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

if (mode !== 'replay' && !apiKey) {
  console.error('DEEPSEEK_API_KEY is not set — populate functions/.env (see functions/.env.example) or export it, then re-run. (Only --mode=replay works without it.)');
  process.exit(1);
}

const provider = require('../01-model/provider');
const RECORDINGS_DIR = path.join(__dirname, 'recordings');
const BASELINE_PATH = path.join(__dirname, 'baseline.json');
provider.setEvalMode(mode === 'live' ? null : mode, RECORDINGS_DIR);

const goalSetter = require('../05-agent-loop/goalSetter');
const { runCoder } = require('../05-agent-loop/coders/runCoder');
const { findCopyTells } = require('./checks');
const { GOAL_SETTER_CASES, COPY_CASES } = require('./fixtures');

const CODER_CONFIG = {
  nav: require('../05-agent-loop/coders/nav'),
  hero: require('../05-agent-loop/coders/hero'),
  about: require('../05-agent-loop/coders/about'),
  services: require('../05-agent-loop/coders/services'),
  testimonials: require('../05-agent-loop/coders/testimonials'),
  footer: require('../05-agent-loop/coders/footer'),
};

// results[caseName] = true (pass) | false (fail) — fed into the baseline
// diff report at the end, alongside the existing console PASS/FAIL/ERROR
// lines each case already prints as it runs.
const results = {};

async function runGoalSetterCases() {
  console.log('\n=== Goal Setter cases ===\n');
  let pass = 0;
  for (const c of GOAL_SETTER_CASES) {
    const caseName = `goalSetter: ${c.name}`;
    try {
      const result = await goalSetter.run(apiKey, model, {
        intent: c.intent,
        rawInput: c.rawInput,
        sectionManifest: c.sectionManifest,
      });
      const ok = c.expect(result);
      results[caseName] = ok;
      console.log(`${ok ? 'PASS' : 'FAIL'} — ${c.name}`);
      if (!ok) {
        console.log(`  affectedSections=${JSON.stringify(result.affectedSections)} recolor=${result.recolor} statusQuery=${result.statusQuery} fileFix=${result.fileFix} accentHue=${result.palette.accentHue}`);
      }
      if (ok) pass++;
    } catch (error) {
      results[caseName] = false;
      console.log(`ERROR — ${c.name}: ${error.message}`);
    }
  }
  console.log(`\n${pass}/${GOAL_SETTER_CASES.length} goal setter cases passed.`);
  return pass === GOAL_SETTER_CASES.length;
}

async function runCopyCases() {
  console.log('\n=== Coder copy-tell cases ===\n');
  let clean = 0;
  for (const c of COPY_CASES) {
    const caseName = `copy: ${c.section}`;
    try {
      const result = await runCoder(apiKey, model, {
        section: c.section,
        config: CODER_CONFIG[c.section],
        goal: c.goal,
        currentContent: 'none — new file',
        manifestContext: null,
        wireframeId: 1,
        isNewLayout: true,
        style: 'default',
      });
      const tells = findCopyTells(result.content);
      const ok = tells.length === 0;
      results[caseName] = ok;
      if (ok) {
        console.log(`CLEAN — ${c.section}`);
        clean++;
      } else {
        console.log(`TELLS — ${c.section}: ${tells.map((t) => t.label).join(', ')}`);
      }
    } catch (error) {
      results[caseName] = false;
      console.log(`ERROR — ${c.section}: ${error.message}`);
    }
  }
  console.log(`\n${clean}/${COPY_CASES.length} copy cases came back clean.`);
  return clean === COPY_CASES.length;
}

// Prints "was PASS, now FAIL" (or the reverse) for any case whose result
// changed since baseline.json was last written, plus new/removed cases.
// Overwrites baseline.json afterward for live/record (replay never gets to
// set a new baseline — see this file's header comment).
function reportAndUpdateBaseline() {
  const baseline = fs.existsSync(BASELINE_PATH) ? JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8')) : {};
  const allNames = new Set([...Object.keys(baseline), ...Object.keys(results)]);
  const changes = [];
  for (const name of allNames) {
    const was = name in baseline ? baseline[name] : null;
    const now = name in results ? results[name] : null;
    if (was === now) continue;
    const wasLabel = was === null ? '(new case)' : (was ? 'PASS' : 'FAIL');
    const nowLabel = now === null ? '(removed)' : (now ? 'PASS' : 'FAIL');
    changes.push(`  ${name}: was ${wasLabel}, now ${nowLabel}`);
  }

  console.log('\n=== Diff vs. last baseline ===');
  if (changes.length === 0) {
    console.log('No change from the last recorded baseline.');
  } else {
    console.log(changes.join('\n'));
  }

  if (mode !== 'replay') {
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(results, null, 2) + '\n');
    console.log(`\nBaseline updated: ${BASELINE_PATH}`);
  }
}

(async () => {
  console.log(`Running in --mode=${mode}${mode === 'replay' ? ' (no network, served from ./recordings)' : ''}`);
  const goalSetterOk = await runGoalSetterCases();
  const copyOk = await runCopyCases();
  const allOk = goalSetterOk && copyOk;
  reportAndUpdateBaseline();
  console.log(`\n${allOk ? '✅ all checks passed' : '❌ some checks failed — see above'}`);
  process.exit(allOk ? 0 : 1);
})();
