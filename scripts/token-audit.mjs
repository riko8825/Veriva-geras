import fs from 'node:fs';
import path from 'node:path';

const t = (chars) => Math.ceil(chars / 4);

console.log('=== KIEKVIENO TURN BAZINIS CONTEXT ===\n');

const items = [
  ['Global CLAUDE.md', 'C:/Users/pinig/.claude/CLAUDE.md'],
  ['Project CLAUDE.md', 'c:/Users/pinig/Veriva-geras/CLAUDE.md'],
  ['MEMORY.md (index)', 'C:/Users/pinig/.claude/projects/c--Users-pinig-Veriva-geras/memory/MEMORY.md'],
];

let baseTotal = 0;
items.forEach(([label, p]) => {
  const c = fs.statSync(p).size;
  baseTotal += c;
  console.log('  ' + label.padEnd(28) + c.toString().padStart(6) + ' chars (~' + t(c) + ' tokens)');
});
console.log('  ' + 'system prompt (built-in)'.padEnd(28) + '~10000 chars (~2500 tokens)');
console.log('  ' + 'tool definitions (~80)'.padEnd(28) + '~50000 chars (~12500 tokens)');
console.log('  ' + '-'.repeat(55));
console.log('  ' + 'BAZINIS LOAD per turn'.padEnd(28) + (baseTotal + 60000).toString().padStart(6) + ' chars (~' + t(baseTotal + 60000) + ' tokens)');

console.log('\n=== KAS LOAD INASI start-task metu ===\n');
const memDir = 'C:/Users/pinig/.claude/projects/c--Users-pinig-Veriva-geras/memory/';
const memFiles = fs.readdirSync(memDir).filter(f => f.endsWith('.md') && f !== 'MEMORY.md');
let memTotal = 0;
memFiles.forEach(f => {
  const c = fs.statSync(memDir + f).size;
  memTotal += c;
  console.log('  ' + f.padEnd(35) + c.toString().padStart(6) + ' chars (~' + t(c) + ' tokens)');
});
console.log('  ' + '-'.repeat(55));
console.log('  ' + 'MEMORY total'.padEnd(35) + memTotal.toString().padStart(6) + ' chars (~' + t(memTotal) + ' tokens)');

console.log('\n=== DOCS files (read kai start-task arba prireikia) ===\n');
const docs = [
  'SESSION_STATUS.md',
  'PROJECT_STATUS.md',
  'DECISION_LOG.md',
  'INCIDENT_LOG.md',
  'KNOWN_ISSUES.md',
];
let docTotal = 0;
docs.forEach(d => {
  const c = fs.statSync('c:/Users/pinig/Veriva-geras/' + d).size;
  docTotal += c;
  console.log('  ' + d.padEnd(28) + c.toString().padStart(6) + ' chars (~' + t(c) + ' tokens)');
});
console.log('  ' + 'docs total'.padEnd(28) + docTotal.toString().padStart(6) + ' chars (~' + t(docTotal) + ' tokens)');

console.log('\n=== Skills + agents (load ON DEMAND) ===\n');
function walkDir(d) {
  let total = 0;
  if (!fs.existsSync(d)) return 0;
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) total += walkDir(p);
    else if (f.endsWith('.md')) total += fs.statSync(p).size;
  }
  return total;
}
const skillsTotal = walkDir('C:/Users/pinig/.claude/skills/');
const agentsTotal = walkDir('C:/Users/pinig/.claude/agents/');
console.log('  skills/ (17 skills)'.padEnd(28) + skillsTotal.toString().padStart(6) + ' chars (~' + t(skillsTotal) + ' tokens)');
console.log('  agents/ (11 agents)'.padEnd(28) + agentsTotal.toString().padStart(6) + ' chars (~' + t(agentsTotal) + ' tokens)');

console.log('\n=== ŠIOS SESIJOS REAL USAGE ===');
console.log('Baseline turn: ' + t(baseTotal + 60000) + ' tokens');
console.log('Po start-task + MEMORY full read: ' + t(baseTotal + 60000 + memTotal) + ' tokens');
console.log('Po session_status full read (memory stale path): ' + t(baseTotal + 60000 + memTotal + docTotal) + ' tokens');
