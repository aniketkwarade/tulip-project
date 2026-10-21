import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { PUBLISHED_NODES } from '../src/data.js';
import { buildTulipAssessments } from './lib/build-tulip-assessments.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const report = await buildTulipAssessments(root);
const committed = JSON.parse(await readFile(resolve(root, 'public/tulip-assessments.json'), 'utf8'));
if (committed.revision !== report.revision) throw new Error('Regenerate assessment exports before reporting coverage.');
const output = resolve(root, 'artifacts/tulip-harm-migration-2026-09-22');
await mkdir(output, {recursive:true});
const rows = PUBLISHED_NODES.map(node => {
 const r=report.records[node.id], a=r.evidenceAudit;
 return {nodeId:node.id,name:node.name,kind:r.nodeKind,status:r.status,value:r.value,band:r.band,
  previousRoute:a.previousRoute,metric:a.metric,sourceAsOf:a.sourceAsOf,sourceDigest:r.sourceDigest,
  reasons:r.reasons,sourceReferences:r.evidenceReferences,existingEvidence:a.observations,reuse:a.reuse,
  missingRequirements:a.required,pilotFinding:a.pilotFinding,weightSensitivity:r.sensitivity,
  scenarioSensitivity:r.scenarioChecks,modelSensitivity:{status:'not_evaluable',reason:'No independently reviewed competing harm-model outputs have been admitted.'}};
});
const payload={version:report.version,revision:report.revision,coverage:report.coverage,
 scope:'Local inventory and compatibility review of existing evidence contracts; not an independent scientific validation of their source publications.',
 conclusion:'No numerical ratings are enabled. Existing observations and impact context do not supply two calibrated, compatible ten-year harm components.',
 rankingSensitivity:{status:'not_evaluable',reason:'There are no supported reference scores or alternative-model/scenario scores. Synthetic regression tests demonstrate weight-driven rank reversal and reject incompatible scenarios; they do not establish scientific robustness.'},nodes:rows};
await writeFile(resolve(output,'coverage.json'),JSON.stringify(payload,null,2)+'\n');
const fields=['nodeId','name','kind','status','value','band','previousRoute','metric','sourceAsOf','reasons','missingRequirements','reuse','sourceReferences'];
const csv=value=>'"'+String(value==null?'':typeof value==='object'?JSON.stringify(value):value).replaceAll('"','""')+'"';
await writeFile(resolve(output,'coverage.csv'),[fields.map(csv).join(','),...rows.map(r=>fields.map(f=>csv(r[f])).join(','))].join('\n')+'\n');
const reviewed=rows.filter(r=>r.pilotFinding);
await writeFile(resolve(output,'pilot-and-modeled-cases.md'),`# Regression cases\n\nAll cases are explicitly unscored. These historical pilot findings describe why the prior evidence cannot supply a calibrated ten-year score. They are not new scientific reviews.\n\n## Original 20\n\n`+reviewed.map(r=>`### ${r.name} (${r.nodeId})\n\n- Prior route: ${r.previousRoute}\n- Frozen pilot inputs unchanged: ${r.pilotFinding.inputsUnchanged}\n- Main limitation: ${r.pilotFinding.limitation}\n- Required next step: ${r.pilotFinding.nextStep}\n- Current assessment: ${r.status}; both calibrated harm components remain missing.\n`).join('\n')+`\n## Previously modeled routes\n\nAll ${rows.filter(r=>r.previousRoute==='modeled').length} modeled cases are excluded from numeric harm scoring. Peer scores, graph connectivity and hand-rated factors cannot establish projected harm.\n\n`+rows.filter(r=>r.previousRoute==='modeled').map(r=>`- ${r.name} (${r.nodeId}): ${r.status}`).join('\n')+'\n');
console.log(`${rows.length} records reported at ${output}; ${report.coverage.assessed} supported, ${report.coverage.unscored} unresolved, ${report.coverage.responses} responses.`);
