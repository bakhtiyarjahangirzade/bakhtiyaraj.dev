// Trace scanner: leftovers that AI tools, copy-paste and detector-evasion attempts leave in a file.
// Each finding has a strength: 'strong' (rarely innocent), 'medium', 'weak' (often innocent, never decisive alone).

const INVISIBLE = [
  [/​/g, 'zero-width space (U+200B)', 'weak'],
  [/‌|‍/g, 'zero-width joiner/non-joiner', 'weak'],
  [/⁠/g, 'word joiner (U+2060)', 'weak'],
  [/﻿/g, 'zero-width no-break space (U+FEFF)', 'weak'],
  [/ /g, 'narrow no-break space (U+202F)', 'weak'],
  [/[­]/g, 'soft hyphen (U+00AD)', 'weak'],
  [/[‪-‮⁦-⁩]/g, 'text-direction control characters', 'medium'],
  [/[\u{e0000}-\u{e007f}]/gu, 'invisible Unicode tag characters', 'strong'],
];

const PATTERNS = [
  // Copy-paste leftovers from chat assistants
  [/utm_source=chatgpt\.com/gi, 'Link copied from ChatGPT search (utm_source=chatgpt.com)', 'strong', 'leftover'],
  [/【\d+(?::\d+)?†[^】]{0,40}】/g, 'ChatGPT citation marker 【n†source】', 'strong', 'leftover'],
  [/\bturn\d+(?:search|news|view|fetch)\d+\b/g, 'ChatGPT internal source reference (turn0search0)', 'strong', 'leftover'],
  [/:?contentReference\[oaicite:\d+\]|oai_citation/g, 'ChatGPT citation placeholder (oaicite)', 'strong', 'leftover'],
  [/\bas an ai(?: language)? model\b/gi, '"As an AI language model…"', 'strong', 'leftover'],
  [/\bas of my (?:last )?(?:knowledge|training) (?:update|cut-?off)\b/gi, 'Knowledge-cutoff phrase', 'strong', 'leftover'],
  [/^(?:certainly|sure|absolutely)[!,.] here(?:'s| is| are)\b/gim, 'Chat reply opener ("Certainly! Here is…")', 'strong', 'leftover'],
  [/\bi hope this (?:helps|essay helps|meets your)\b/gi, '"I hope this helps"', 'medium', 'leftover'],
  [/\b(?:let me know|feel free to ask) if you (?:need|would like|want)\b/gi, 'Chat closing line ("Let me know if you need…")', 'medium', 'leftover'],
  [/\[(?:your name|insert [^\]]{1,40}|student name|date|name)\]/gi, 'Unfilled template placeholder ([Your Name])', 'medium', 'leftover'],
  [/^#{1,4} \S/gm, 'Markdown heading (###) left in the text', 'medium', 'leftover'],
  [/\*\*[^*\n]{2,80}\*\*/g, 'Markdown bold (**text**) left in the text', 'medium', 'leftover'],
  // Attempts to steer AI graders or detectors
  [/\bignore (?:all )?(?:previous|prior|above) instructions\b/gi, 'Prompt-injection phrase ("ignore previous instructions")', 'strong', 'evasion'],
  [/\bif you are (?:an? )?(?:ai|llm|language model|chatbot|grader)\b/gi, 'Instruction addressed to an AI reader', 'strong', 'evasion'],
  [/\b(?:this (?:text|essay|document) (?:is|was) (?:written by a human|human[- ]written|not ai[- ]generated))\b/gi, 'Claim aimed at AI detectors ("this text is human-written")', 'strong', 'evasion'],
  [/\b(?:ai|gpt)[ -]?(?:detector|detection|checker)s?\b/gi, 'Mentions AI detectors', 'weak', 'evasion'],
  [/\b(?:give|award|assign) (?:this|the) (?:essay|paper|assignment|student) (?:a )?(?:high|full|perfect|top) (?:grade|score|marks?)\b/gi, 'Asks a grader for a high score', 'strong', 'evasion'],
];

// Cyrillic/Greek look-alikes inside Latin words (used to break detectors)
const HOMOGLYPH = /[a-z][аеорсухіοα][a-z]|[аеорсухі][a-z]{2}/giu;

function snippet(text, idx, len) {
  const a = Math.max(0, idx - 40), b = Math.min(text.length, idx + len + 40);
  return (a > 0 ? '…' : '') + text.slice(a, b).replace(/\s+/g, ' ').trim() + (b < text.length ? '…' : '');
}

export function scanTraces(text, hidden = [], meta = {}, words = 0) {
  const out = [];
  for (const [re, label, strength] of INVISIBLE) {
    const n = (text.match(re) || []).length;
    if (n) out.push({ kind: 'invisible', label, count: n, strength, note: 'Can also come from Word, Mac keyboards, or copying from websites.' });
  }
  for (const [re, label, strength, kind] of PATTERNS) {
    const ms = [...text.matchAll(re)];
    if (ms.length) out.push({ kind, label, count: ms.length, strength, examples: ms.slice(0, 3).map((m) => snippet(text, m.index, m[0].length)) });
  }
  const hg = [...text.matchAll(HOMOGLYPH)];
  if (hg.length >= 2) out.push({ kind: 'evasion', label: 'Cyrillic/Greek look-alike letters inside English words', count: hg.length, strength: 'strong', examples: hg.slice(0, 3).map((m) => snippet(text, m.index, m[0].length)) });

  if (hidden.length) {
    const injected = hidden.filter((h) => PATTERNS.some(([re, , , kind]) => kind === 'evasion' && new RegExp(re.source, re.flags.replace('g', '')).test(h.text)));
    out.push({
      kind: 'hidden', label: injected.length ? 'Hidden text that addresses AI tools or graders' : 'Hidden, white or tiny text in the file',
      count: hidden.length, strength: injected.length ? 'strong' : 'medium',
      examples: hidden.slice(0, 5).map((h) => `${h.where}: “${h.text.slice(0, 160)}” (${h.reason})`),
    });
  }

  // Metadata: very short editing time for a long document
  const msOffice = /microsoft/i.test(meta.application || '');
  if (msOffice && meta.totalEditMinutes != null && words >= 400) {
    const wpm = words / Math.max(meta.totalEditMinutes, 1);
    if (meta.totalEditMinutes <= 5 || wpm > 60) {
      out.push({ kind: 'metadata', label: `${words} words with ${meta.totalEditMinutes} min of recorded editing time`, strength: 'weak', note: 'Typical typing is 20–40 words per minute. Pasting from another document also causes this.' });
    }
  }
  if (msOffice && meta.revision != null && meta.revision <= 2 && words >= 600) {
    out.push({ kind: 'metadata', label: `Saved only ${meta.revision} time(s) for a ${words}-word document`, strength: 'weak', note: 'Often means the text was written elsewhere and pasted in.' });
  }
  if (meta.producer && /chatgpt|openai|gemini|claude|copilot/i.test(meta.producer + ' ' + (meta.creatorTool || ''))) {
    out.push({ kind: 'metadata', label: `PDF produced by “${meta.producer}”`, strength: 'medium' });
  }
  const rank = { strong: 0, medium: 1, weak: 2 };
  return out.sort((a, b) => rank[a.strength] - rank[b.strength]);
}
