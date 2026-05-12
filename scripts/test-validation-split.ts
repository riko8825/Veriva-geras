// scripts/test-validation-split.ts — verify P0-1 fix: AI-time vs post-inject validation
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { validateAIResponse, validatePostData, type BlogPostData } from '../lib/blog-template';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dryRunDir = path.join(__dirname, '..', '.dry-run');

async function main() {
  const samples = [
    'roi-dpo-output.json',
    'roadmap-nis2-output.json',
    'comparison-bdar-output.json',
    'industry-bdar-output.json',
    'workflow-bdar-output.json',
    'case_study-bdar-output.json',
    'mistakes-bdar-output.json',
    'technical_deep_dive-bdar-output.json',
  ];

  console.log('Test P0-1: validateAIResponse on raw AI output (must PASS — no post_date/author/hero_img required)\n');

  let aiPassCount = 0;
  let postInjectFailCount = 0;

  for (const f of samples) {
    const data = JSON.parse(await readFile(path.join(dryRunDir, f), 'utf-8')) as Partial<BlogPostData>;
    const aiErrors = validateAIResponse(data);
    const fullErrors = validatePostData(data);

    const aiOk = aiErrors.filter(e => !e.includes('post_description length')).length === 0;
    const fullFails = fullErrors.length > 0;

    console.log(`${f.padEnd(50)} AI: ${aiOk ? '✅' : '❌'} (${aiErrors.length} err${aiErrors.length === 1 ? '' : 's'})  POST-INJECT: ${fullFails ? '✅ catches missing inject fields' : '❌ should fail without post_date'}`);
    if (aiErrors.length > 0) console.log(`   AI errors: ${aiErrors.join(', ')}`);

    if (aiOk) aiPassCount++;
    if (fullFails) postInjectFailCount++;
  }

  console.log(`\nSummary:`);
  console.log(`  validateAIResponse PASS rate: ${aiPassCount}/${samples.length} (excluding desc length warnings)`);
  console.log(`  validatePostData FAIL on raw AI: ${postInjectFailCount}/${samples.length} (expected ALL — proves it catches missing inject fields)`);

  // Test 2: simulate post-inject merge
  const sample = JSON.parse(await readFile(path.join(dryRunDir, samples[0]), 'utf-8'));
  const merged = {
    ...sample,
    post_date: '2026-05-12',
    post_date_human: '2026 m. gegužės 12 d.',
    post_author: 'Marina',
    post_author_role: 'Teisės ekspertė, BDAR',
    post_author_initial: 'M',
    post_hero_img: 'https://images.pexels.com/test.jpg',
  };
  const mergedErrors = validatePostData(merged).filter(e => !e.includes('post_description length'));
  console.log(`\nTest 2: full merged data validation: ${mergedErrors.length === 0 ? '✅ pass' : '❌ ' + mergedErrors.join(', ')}`);

  const okExit = aiPassCount === samples.length && postInjectFailCount === samples.length && mergedErrors.length === 0;
  process.exit(okExit ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(2); });
