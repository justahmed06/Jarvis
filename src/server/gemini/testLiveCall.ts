import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { GeminiService } from './client.js';

async function runLiveTest() {
  console.log('=== Jarvis Live Gemini Verification ===');
  console.log('Active model:', process.env.GEMINI_MODEL || 'gemini-3.8-flash');
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0;
  console.log('API Key configured:', hasKey ? `YES (length: ${process.env.GEMINI_API_KEY?.trim().length})` : 'NO');

  if (!hasKey) {
    console.error('ERROR: GEMINI_API_KEY is not set or empty in .env.');
    process.exit(1);
  }

  const gemini = new GeminiService();

  // Step 1: Health test
  console.log('\n[1/2] Testing live Gemini connectivity...');
  const connTest = await gemini.testConnection();
  if (!connTest.ok) {
    console.error('Connection failed:', connTest.error);
    process.exit(1);
  }
  console.log(`✓ Gemini API responded: Model ${connTest.model} is LIVE and READY.`);

  // Step 2: Multimodal screenshot reasoning & structured planning test
  console.log('\n[2/2] Testing multimodal screenshot understanding & structured bounded planning...');

  // Use test_screenshot.png if exists, otherwise generate a valid PNG buffer
  const pngPath = path.resolve(process.cwd(), 'test_screenshot.png');
  const pngBase64 = fs.readFileSync(pngPath).toString('base64');

  const goal = 'Identify what is on this screen, create an actionable task to investigate, and append a diagnostic note.';
  console.log(`Goal: "${goal}"`);

  const startTime = Date.now();
  const plan = await gemini.generatePlan({
    imageBase64: pngBase64,
    mimeType: 'image/png',
    goal,
  });
  const elapsed = Date.now() - startTime;

  console.log(`\n✓ Gemini successfully generated a validated plan in ${elapsed}ms:`);
  console.log('\n================ OBSERVATION ================');
  console.log(plan.observation);
  console.log('\n=========== GOAL INTERPRETATION =============');
  console.log(plan.goalInterpretation);
  console.log(`\n=========== BOUNDED STEPS (${plan.steps.length}) ============`);
  plan.steps.forEach((step, idx) => {
    console.log(`Step ${idx + 1} [${step.id}]: Tool -> ${step.tool}`);
    console.log(`  Rationale: ${step.rationale}`);
    console.log(`  Arguments:`, JSON.stringify(step.args));
  });

  console.log('\n=== Live End-to-End Gemini Verification PASSED ===');
}

runLiveTest().catch((err) => {
  console.error('\nVerification failed:', err.message || err);
  process.exit(1);
});
