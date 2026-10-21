/** Heuristic prompt-injection screening for untrusted uploaded text (mirrors services/ai/app/safety.py). */
const PATTERNS = [
  /ignore (all |any )?(the )?(previous|prior|above|earlier) (instructions|prompts?|rules)/i,
  /disregard (all |any )?(the )?(previous|prior|above|system) (instructions|prompts?)/i,
  /(reveal|print|show|output) (the |your )?(system|hidden|developer) prompt/i,
  /\bact as (an? )?(admin|administrator|developer|dan|jailbroken)/i,
  /(system|developer)\s*(prompt|message|instruction)s?\s*:/i,
  /new instructions?\s*:/i,
  /\bjailbreak\b/i,
  /(send|post|upload|exfiltrate) .{0,40}(to|at) https?:\/\//i,
  /<\s*\/?\s*(system|instructions?)\s*>/i,
  /पहिलेका (सबै )?निर्देशन(हरू)? (बेवास्ता|नमान)/,
];

export function looksLikeInjection(text: string): boolean {
  return PATTERNS.some((p) => p.test(text));
}
