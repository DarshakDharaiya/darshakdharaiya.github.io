import { PDFDocument, StandardFonts, rgb, type PDFFont, type RGB } from "pdf-lib";
import { resume } from "@/data/resume";

/**
 * /resume.pdf — generated at build time from data/resume.ts,
 * so the downloadable résumé and the on-site preview can never disagree.
 * Single column, real text, standard fonts: parses cleanly in applicant-tracking systems.
 */
export const dynamic = "force-static";

const A4 = { w: 595.28, h: 841.89 };
const MX = 50;
const MY = 46;
const W = A4.w - MX * 2;
const INK = rgb(0.11, 0.11, 0.12);
const BODY = rgb(0.22, 0.22, 0.24);
const MUTED = rgb(0.43, 0.43, 0.45);
const RULE = rgb(0.75, 0.75, 0.77);

// Standard PDF fonts are WinAnsi-only: normalise typographic characters
const clean = (s: string) =>
  s
    .replace(/★/g, "*")
    .replace(/[—–]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/~/g, "~")
    .replace(/[^\x20-\x7E·•]/g, "")
    .replace(/·/g, "|");

export async function GET() {
  const doc = await PDFDocument.create();
  doc.setTitle(`${resume.name} - Resume`);
  doc.setAuthor(resume.name);
  doc.setSubject(resume.title);
  doc.setKeywords(resume.skills.flatMap((s) => s.items));
  const R = await doc.embedFont(StandardFonts.Helvetica);
  const B = await doc.embedFont(StandardFonts.HelveticaBold);
  const I = await doc.embedFont(StandardFonts.HelveticaOblique);
  const BI = await doc.embedFont(StandardFonts.HelveticaBoldOblique);

  let page = doc.addPage([A4.w, A4.h]);
  let y = A4.h - MY;

  const ensure = (h: number) => {
    if (y - h < MY) {
      page = doc.addPage([A4.w, A4.h]);
      y = A4.h - MY;
    }
  };

  const wrap = (text: string, font: PDFFont, size: number, width: number) => {
    const out: string[] = [];
    let line = "";
    for (const word of clean(text).split(" ")) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > width && line) {
        out.push(line);
        line = word;
      } else line = test;
    }
    if (line) out.push(line);
    return out;
  };

  const center = (s: string, font: PDFFont, size: number, color: RGB, gap = 1.35) => {
    const t = clean(s);
    y -= size * gap;
    page.drawText(t, { x: (A4.w - font.widthOfTextAtSize(t, size)) / 2, y, size, font, color });
  };

  const para = (s: string, o: { font?: PDFFont; size?: number; color?: RGB; x?: number; width?: number; lh?: number } = {}) => {
    const { font = R, size = 9.6, color = BODY, x = MX, width = W - (x - MX), lh = 1.42 } = o;
    for (const l of wrap(s, font, size, width)) {
      ensure(size * lh);
      y -= size * lh;
      page.drawText(l, { x, y, size, font, color });
    }
  };

  const bullet = (s: string) => {
    const size = 9.6;
    const lines = wrap(s, R, size, W - 12);
    ensure(size * 1.42 * Math.min(lines.length, 2));
    lines.forEach((l, i) => {
      ensure(size * 1.42);
      y -= size * 1.42;
      if (i === 0) page.drawText("•", { x: MX + 1, y, size, font: R, color: BODY });
      page.drawText(l, { x: MX + 12, y, size, font: R, color: BODY });
    });
  };

  /** Left text + right-aligned text on one line */
  const row = (left: string, right: string, lf: PDFFont, rf: PDFFont, size: number, lc: RGB = INK, rc: RGB = MUTED) => {
    ensure(size * 1.5);
    y -= size * 1.5;
    const r = clean(right);
    page.drawText(clean(left), { x: MX, y, size, font: lf, color: lc });
    if (r) page.drawText(r, { x: A4.w - MX - rf.widthOfTextAtSize(r, size), y, size, font: rf, color: rc });
  };

  const heading = (s: string) => {
    ensure(46); // keep heading with at least two lines of content
    y -= 18;
    page.drawText(clean(s).toUpperCase(), { x: MX, y, size: 10, font: B, color: INK });
    y -= 5;
    page.drawLine({ start: { x: MX, y }, end: { x: A4.w - MX, y }, thickness: 0.7, color: RULE });
    y -= 2;
  };

  /* ── Header ── */
  center(resume.name.toUpperCase(), B, 21, INK, 1);
  center(resume.title, R, 11, INK, 1.7);
  center(resume.headline, R, 9.5, MUTED, 1.5);
  const contact = [resume.contact.location, resume.contact.phone, resume.contact.email, resume.contact.linkedin]
    .filter(Boolean)
    .join("  |  ");
  center(contact, R, 9, MUTED, 1.7);
  y -= 4;

  /* ── Summary ── */
  heading("Professional summary");
  para(resume.summary);

  /* ── Experience ── */
  heading("Professional experience");
  resume.experience.forEach((e, idx) => {
    if (idx) y -= 6;
    ensure(60);
    row(e.formerly ? `${e.company} (formerly ${e.formerly})` : e.company, e.location, B, R, 10.5);
    row(e.role, `${e.start} - ${e.end}`, BI, I, 9.8, INK);
    for (const r of e.earlierRoles ?? []) row(r.role, `${r.start} - ${r.end}`, BI, I, 9.8, INK);
    y -= 1;
    for (const b of [...e.responsibilities.slice(0, idx === 0 ? 2 : 1), ...e.achievements]) bullet(b);
  });

  /* ── Projects ── */
  heading("Key projects");
  for (const p of resume.projects) {
    ensure(30);
    y -= 2;
    row(p.title, p.meta, B, R, 10);
    para(p.line);
  }

  /* ── Skills ── */
  heading("Key skills");
  for (const s of resume.skills) {
    const label = `${s.group}: `;
    const lw = B.widthOfTextAtSize(label, 9.6) + 2;
    const lines = wrap(s.items.join(", "), R, 9.6, W - lw);
    lines.forEach((l, i) => {
      ensure(13.6);
      y -= 13.6;
      if (i === 0) page.drawText(clean(label), { x: MX, y, size: 9.6, font: B, color: INK });
      page.drawText(l, { x: MX + lw, y, size: 9.6, font: R, color: BODY });
    });
  }

  /* ── Education ── */
  heading("Education");
  for (const e of resume.education) {
    row(e.degree, e.period, B, R, 10);
    para(`${e.school}, ${e.place}`, { font: I, color: MUTED });
    para(e.detail);
  }

  /* ── Languages ── */
  heading("Languages");
  para(resume.languages.join(", "));

  const bytes = await doc.save();
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="Darshak-Dharaiya-Resume.pdf"',
    },
  });
}
