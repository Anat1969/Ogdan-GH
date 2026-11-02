import { useEffect, useState, type ReactNode } from "react";
import { allChecklistKeys, bankAccounts, chapters, itemKey, paymentNote, permitTracks, tools, type Block, type Chapter as Ch } from "../data/permitData";
import { blockMeta } from "../data/explain";
import { href } from "../state/router";
import { setChecks, toggleCheck, updateProject, useChecks, useProject } from "../state/store";
import { toolComponents } from "../components/tools";
import { CheckMark, PageHead, Progress, Stamp, copyText, useToast } from "../components/ui";
import { ContactList } from "./Contacts";
import NotFound from "./NotFound";
import { Icon, chapterIcon } from "../components/icons";
import { Viewer } from "../components/illus/Viewer";

const pad = (n: number) => String(n).padStart(2, "0");

type SetActive = (n: number | null) => void;

/* ---------- מסגרת סעיף: מספר, כותרת, הסבר ---------- */
function Frame({ num, title, explain, label, children, wide }: { num: string; title: ReactNode; explain?: string; label?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <section className={`frame ${wide ? "wide" : ""}`}>
      <header className="frame-head">
        <span className="frame-num mono">{num}</span>
        <div style={{ minWidth: 0 }}>
          <h3>{title}</h3>
          {explain && <p className="frame-explain">{explain}</p>}
        </div>
        {label && <span className="label frame-label">{label}</span>}
      </header>
      <div className="frame-body">{children}</div>
    </section>
  );
}

function Checklist({ chapter, block, setActive }: { chapter: Ch; block: Extract<Block, { kind: "checklist" }>; setActive: SetActive }) {
  const checks = useChecks();
  const keys = block.items.map((_, i) => itemKey(chapter.id, block.id, i));
  const done = keys.filter((k) => checks[k]).length;
  return (
    <>
      <div className="spread" style={{ marginBottom: 8 }}>
        <div style={{ flex: "1 1 160px" }}><Progress value={done / keys.length} label={block.title} /></div>
        <span className="mono" style={{ fontSize: 13 }}>{done}/{keys.length}</span>
        <button type="button" className="btn sm" onClick={() => setChecks(keys, done < keys.length)}>{done < keys.length ? "סימון הכול" : "ניקוי"}</button>
      </div>
      <ol className="checklist">
        {block.items.map((it, i) => {
          const k = keys[i];
          return (
            <li key={k} onMouseEnter={() => setActive(i + 1)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(i + 1)} onBlur={() => setActive(null)}>
              <label className="check" data-testid={`check-${k}`}>
                <span className="num-badge mono">{i + 1}</span>
                <input type="checkbox" checked={!!checks[k]} onChange={() => toggleCheck(k)} />
                <span className="box"><CheckMark /></span>
                <span className="t">{it}</span>
              </label>
            </li>
          );
        })}
      </ol>
    </>
  );
}

function NumberedList({ items, setActive }: { items: string[]; setActive: SetActive }) {
  return (
    <ol className="numlist">
      {items.map((n, i) => (
        <li key={n} onMouseEnter={() => setActive(i + 1)} onMouseLeave={() => setActive(null)}>
          <span className="num-badge mono">{i + 1}</span>
          <span>{n}</span>
        </li>
      ))}
    </ol>
  );
}

function Tracks() {
  const p = useProject();
  return (
    <div className="grid g3">
      {permitTracks.map((t, i) => (
        <button key={t.id} type="button" className={`btn choice ${p.track === t.id ? "is-active" : ""}`} aria-pressed={p.track === t.id} onClick={() => updateProject({ track: t.id as typeof p.track })}>
          <span className="num-badge mono">{i + 1}</span>
          <span className="mono" style={{ fontSize: 30, lineHeight: 1 }}>{t.days}<span style={{ fontSize: 13 }}> ימים</span></span>
          <span style={{ fontWeight: 600 }}>{t.name}</span>
          <span style={{ fontSize: 13, opacity: 0.8, fontWeight: 400 }}>{t.description}</span>
        </button>
      ))}
    </div>
  );
}

function Bank() {
  const toast = useToast();
  return (
    <>
      <div className="table-wrap">
        <table>
          <thead><tr><th>#</th><th>בנק</th><th>מס' בנק</th><th>סניף</th><th>חשבון</th><th>IBAN, לחיצה מעתיקה</th></tr></thead>
          <tbody>
            {bankAccounts.map((b, i) => (
              <tr key={b.iban}>
                <td className="num">{i + 1}</td><td>{b.bank}</td><td className="num">{b.bankNum}</td><td className="num">{b.branch}</td><td className="num">{b.account}</td>
                <td><button type="button" className="btn sm ghost mono" onClick={async () => toast((await copyText(b.iban)) ? `הועתק: ${b.iban}` : "ההעתקה נכשלה")}><Icon name="copy" size={14} /><span className="ltr">{b.iban}</span></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>{paymentNote}</p>
    </>
  );
}

function Body({ chapter, block, setActive }: { chapter: Ch; block: Block; setActive: SetActive }) {
  switch (block.kind) {
    case "text": return <p className="lead-text">{block.body}</p>;
    case "checklist": return <Checklist chapter={chapter} block={block} setActive={setActive} />;
    case "notes": return <NumberedList items={block.items} setActive={setActive} />;
    case "cards":
      return (
        <ol className="cards-grid">
          {block.cards.map((c, i) => (
            <li key={c.title} className="mini-card" onMouseEnter={() => setActive(i + 1)} onMouseLeave={() => setActive(null)}>
              <span className="num-badge mono">{i + 1}</span>
              <b>{c.title}</b>
              <p>{c.body}</p>
            </li>
          ))}
        </ol>
      );
    case "stages":
      return (
        <ol className="stages">
          {block.items.map((s, i) => (
            <li key={s}><span className="mono">{pad(i + 1)}</span><b>{s}</b>{i < block.items.length - 1 && <i aria-hidden="true" />}</li>
          ))}
        </ol>
      );
    case "alert": return <Stamp kind="no" seal="חובה" title={block.body} />;
    case "contactInfo":
      return (
        <>
          <NumberedList items={block.lines} setActive={setActive} />
          {block.alert && <div style={{ marginTop: 12 }}><Stamp kind="warn" seal="שימו לב" title={block.alert} /></div>}
        </>
      );
    case "tracks": return <Tracks />;
    case "bank": return <Bank />;
    case "tool": {
      const T = toolComponents[block.tool];
      return <T />;
    }
  }
}

const titleOf = (b: Block) => {
  switch (b.kind) {
    case "tracks": return "מסלולי הגשה";
    case "bank": return "חשבונות לתשלום אגרות ופיקדון";
    case "alert": return "תנאי לתחילת עבודות";
    case "tool": return tools.find((t) => t.id === b.tool)!.title;
    default: return b.title;
  }
};

/** סעיף עם המחשה: מסגרת טקסט + מסגרת המחשה */
function BlockRow({ chapter, block, index, chNo }: { chapter: Ch; block: Block; index: number; chNo: number }) {
  const [active, setActive] = useState<number | null>(null);
  const meta = blockMeta[`${chapter.id}.${index}`];
  const num = `${pad(chNo)}.${index + 1}`;
  const frame = (
    <Frame num={num} title={titleOf(block)} explain={meta?.explain} wide={block.kind === "tool"} label={block.kind === "tool" ? "מחובר לתיק הבקשה" : undefined}>
      <Body chapter={chapter} block={block} setActive={setActive} />
    </Frame>
  );
  if (meta?.illus) {
    return (
      <div className="split" data-testid={`row-${chapter.id}-${index}`}>
        {frame}
        <Viewer id={meta.illus} active={active} tone={chapter.tone} />
      </div>
    );
  }
  return frame;
}

export default function Chapter({ id }: { id: string }) {
  const chapter = chapters.find((c) => c.id === id);
  const checks = useChecks();
  useEffect(() => { if (chapter) document.title = `${chapter.title} · אוגדן הנחיות להיתר`; }, [chapter]);
  if (!chapter) return <NotFound />;
  const idx = chapters.indexOf(chapter);
  const chNo = idx + 1;
  const prev = chapters[idx - 1];
  const next = chapters[idx + 1];
  const keys = allChecklistKeys(chapter);
  const done = keys.filter((k) => checks[k]).length;

  // סעיפים עם המחשה או כלי תופסים שורה מלאה; סעיפים קצרים מסודרים בזוגות כדי לנצל את רוחב המסך
  const rows: ReactNode[] = [];
  let pair: ReactNode[] = [];
  const flush = () => { if (pair.length) { rows.push(<div className="duo" key={`d${rows.length}`}>{pair}</div>); pair = []; } };
  chapter.blocks.forEach((b, i) => {
    const el = <BlockRow key={i} chapter={chapter} block={b} index={i} chNo={chNo} />;
    if (blockMeta[`${chapter.id}.${i}`]?.illus || b.kind === "tool" || b.kind === "bank" || b.kind === "tracks") { flush(); rows.push(el); }
    else { pair.push(el); if (pair.length === 2) flush(); }
  });
  flush();

  return (
    <div className={`tone-${chapter.tone}`}>
      <PageHead
        tone={chapter.tone}
        crumbs={[{ label: "בית", route: { name: "home" } }, { label: "פרקי האוגדן", route: { name: "home" } }, { label: `${pad(chNo)} ${chapter.short}` }]}
        label={`אגף ${pad(chNo)} מתוך ${chapters.length} · ${chapter.department}`}
        title={`${pad(chNo)}  ${chapter.title}`}
        lead={chapter.description}
        icon={chapterIcon[chapter.id]}
      >
        <div className="head-meta">
          {keys.length > 0 && (
            <div style={{ display: "grid", gap: 6, minWidth: 220, flex: "1 1 220px", maxWidth: 420 }}>
              <div className="spread" style={{ fontSize: 13 }}><span className="muted">דרישות שסומנו באגף</span><span className="mono" data-testid="chapter-progress">{done}/{keys.length}</span></div>
              <Progress value={done / keys.length} label="התקדמות באגף" />
            </div>
          )}
          <nav className="toc" aria-label="סעיפי האגף">
            {chapter.blocks.map((b, i) => <span key={i} className="toc-i"><span className="mono">{pad(chNo)}.{i + 1}</span> {titleOf(b)}</span>)}
          </nav>
        </div>
      </PageHead>

      {chapter.contacts.length > 0 && (
        <section className="frame contacts-strip">
          <header className="frame-head">
            <span className="frame-num mono">{pad(chNo)}.0</span>
            <div><h3>אנשי קשר, {chapter.department}</h3>{chapter.hours && <p className="frame-explain">{chapter.hours}</p>}</div>
          </header>
          <div className="contacts-grid"><ContactList people={chapter.contacts} compact numbered /></div>
        </section>
      )}

      <div className="rows">{rows}</div>

      <nav className="grid g2" style={{ marginTop: 40 }} aria-label="מעבר בין אגפים">
        {prev ? (
          <a className={`card-link tone-${prev.tone} tick`} href={href({ name: "chapter", id: prev.id })}><span className="label">האגף הקודם</span><h3>{pad(idx)} {prev.title}</h3></a>
        ) : <span />}
        {next ? (
          <a className={`card-link tone-${next.tone} tick`} href={href({ name: "chapter", id: next.id })} style={{ textAlign: "end" }}><span className="label">האגף הבא</span><h3>{pad(idx + 2)} {next.title}</h3></a>
        ) : (
          <a className="card-link" href={href({ name: "check" })} style={{ textAlign: "end" }}><span className="label">סיימתם לעבור על האוגדן</span><h3>לבדיקת התכנית מול האוגדן</h3></a>
        )}
      </nav>
    </div>
  );
}
