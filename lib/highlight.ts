/**
 * Tiny, dependency-free syntax highlighter for Kotlin/Java snippets (server-side).
 * Produces token spans; colours come from CSS classes in CodeBlock.
 */
export type Token = { type: "kw" | "str" | "com" | "num" | "ann" | "fn" | "type" | "plain"; text: string };

const KEYWORDS = new Set(
  "fun val var class object interface override abstract private public internal protected return if else when for while in is as by suspend data sealed enum companion import package this super null true false try catch finally throw new void static final extends implements with".split(
    " ",
  ),
);

const RE =
  /(\/\/.*$|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|`[^`]*`)|(@[A-Za-z_]\w*)|(\b\d+(?:\.\d+)?[fLd]?\b)|([A-Za-z_]\w*)(?=\s*[({<])|([A-Za-z_]\w*)/gm;

export function highlight(code: string): Token[][] {
  return code.split("\n").map((line) => {
    const tokens: Token[] = [];
    let last = 0;
    for (const m of line.matchAll(RE)) {
      if (m.index! > last) tokens.push({ type: "plain", text: line.slice(last, m.index) });
      const [text, com, str, ann, num, fn, word] = m;
      let type: Token["type"] = "plain";
      if (com) type = "com";
      else if (str) type = "str";
      else if (ann) type = "ann";
      else if (num) type = "num";
      else if (fn) type = KEYWORDS.has(fn) ? "kw" : /^[A-Z]/.test(fn) ? "type" : "fn";
      else if (word) type = KEYWORDS.has(word) ? "kw" : /^[A-Z]/.test(word) ? "type" : "plain";
      tokens.push({ type, text });
      last = m.index! + text.length;
    }
    if (last < line.length) tokens.push({ type: "plain", text: line.slice(last) });
    return tokens;
  });
}
