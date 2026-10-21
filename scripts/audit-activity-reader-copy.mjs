import fs from 'node:fs';
const copy=JSON.parse(fs.readFileSync(new URL('../src/reader-copy/activities.json',import.meta.url)));
const flags=[];let fields=0;
function inspect(value,path) {
 if(Array.isArray(value))return value.forEach((v,i)=>inspect(v,`${path}[${i}]`));
 if(value&&typeof value==='object')return Object.entries(value).forEach(([k,v])=>inspect(v,`${path}.${k}`));
 if(typeof value!=='string')return;
 const words=value.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)||[];
 if(words.length<8)return;
 fields++;
 const sentences=value.match(/[^.!?]+(?:[.!?]+|$)/g)||[value];
 const syllables=w=>Math.max(1,(w.toLowerCase().replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/,'').match(/[aeiouy]{1,2}/g)||[]).length);
 const grade=.39*words.length/sentences.length+11.8*words.reduce((n,w)=>n+syllables(w),0)/words.length-15.59;
 const longestSentence=Math.max(...sentences.map(s=>(s.match(/\S+/g)||[]).length));
 if(longestSentence>32||grade>10)flags.push({path,approximateGrade:+grade.toFixed(1),longestSentence,text:value});
}
inspect(copy,'activities');
const report={categories:16,comparisonRows:95,actions:144,fields,flagCount:flags.length,note:'Editorial prompts, not reading-age certification. Scientific names and short metric labels can inflate the estimate. No automatic truncation or word limit.',flags};
const out=new URL('../artifacts/plain-english-activity-2026-09-22/readability.json',import.meta.url);
fs.mkdirSync(new URL('.',out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({fields,flags:flags.length,longSentences:flags.filter(f=>f.longestSentence>32).map(f=>({path:f.path,words:f.longestSentence})),highGrade:flags.filter(f=>f.approximateGrade>16).map(f=>({path:f.path,grade:f.approximateGrade,text:f.text}))},null,2));
