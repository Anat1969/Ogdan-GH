import { useEffect, useState, type ReactNode } from "react";
import { allChecklistKeys, bankAccounts, chapters, itemKey, paymentNote, permitTracks, tools, type Block, type Chapter as Ch } from "../data/permitData";
import { blockMeta } from "../data/explain";
import { href } from "../state/router";
import { setChecks, toggleCheck, updateProject, useChecks, useProject } from "../state/store";
import { toolComponents } from "../components/tools";
import { CheckMark, Progress, Stamp, copyText, useToast } from "../components/ui";
import NotFound from "./NotFound";
import { Icon, chapterIcon } from "../components/icons";
import { Viewer } from "../components/illus/Viewer";
import { Light } from "../components/viz";
import { landUse, landUseSource } from "../data/landuse";

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
    case "sources":
      return (
        <ol className="numlist">
          {block.items.map((s, i) => (
            <li key={s.title} onMouseEnter={() => setActive(i + 1)} onMouseLeave={() => setActive(null)}>
              <span className="num-badge mono">{i + 1}</span>
              <span>
                {s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title}
                <span style={{ display: "block", fontSize: 12 }}><Light status={s.verified ? "ok" : "idle"}>{s.verified ? "מאומת" : "לאימות"}</Light>{s.note && <span className="muted"> · {s.note}</span>}</span>
              </span>
            </li>
          ))}
        </ol>
      );
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

/** סעיף פעיל: מסגרת טקסט + מסגרת המחשה, באותו מקום תמיד */
function BlockView2({ chapter, block, index, chNo }: { chapter: Ch; block: Block; index: number; chNo: number }) {
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
      <div className="ws-split" data-testid={`row-${chapter.id}-${index}`}>
        <div className="ws-scroll">{frame}</div>
        <Viewer id={meta.illus} active={active} tone={chapter.tone} />
      </div>
    );
  }
  return <div className="ws-scroll ws-full" data-testid={`row-${chapter.id}-${index}`}>{frame}</div>;
}

/** כרטיסי ביקור של העובדים */
export function BusinessCards({ chapter }: { chapter: Ch }) {
  const toast = useToast();
  if (!chapter.contacts.length) {
    return (
      <aside className="ws-cards" aria-label="אנשי קשר">
        <header className="ws-cards-head"><b>אנשי קשר</b><span className="muted">{chapter.department}</span></header>
        <p className="muted" style={{ fontSize: 13 }}>באוגדן לא צוינו אנשי קשר לאגף זה. לבירורים: מחלקת הרישוי.</p>
      </aside>
    );
  }
  return (
    <aside className="ws-cards" aria-label="כרטיסי ביקור">
      <header className="ws-cards-head"><b>כרטיסי ביקור</b><span className="muted">{chapter.department}</span>{chapter.hours && <span className="muted" style={{ fontSize: 11.5 }}>{chapter.hours}</span>}</header>
      <div className="bcards">
        {chapter.contacts.map((p, i) => (
          <article key={p.name + p.phone} className="bcard" data-testid="person">
            <span className="num-badge mono">{i + 1}</span>
            <div className="bcard-who"><b>{p.name}</b><span>{p.role}</span></div>
            <div className="bcard-acts">
              <a className="bcard-line mono" href={`tel:${p.phone.replace(/-/g, "")}`}><Icon name="phone" size={13} /><span className="ltr">{p.phone}</span></a>
              {p.email && <button type="button" className="bcard-line" onClick={async () => toast((await copyText(p.email)) ? `הועתק: ${p.email}` : "ההעתקה נכשלה")}><Icon name="mail" size={13} /><span className="ltr">{p.email}</span></button>}
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}

export default function Chapter({ id }: { id: string }) {
  const chapter = chapters.find((c) => c.id === id);
  const checks = useChecks();
  const [tab, setTab] = useState(0);
  useEffect(() => { setTab(0); if (chapter) document.title = `${chapter.title} · אוגדן הנחיות להיתר`; }, [chapter]);
  if (!chapter) return <NotFound />;
  const idx = chapters.indexOf(chapter);
  const chNo = idx + 1;
  const prev = chapters[idx - 1];
  const next = chapters[idx + 1];
  const keys = allChecklistKeys(chapter);
  const done = keys.filter((k) => checks[k]).length;
  const cur = Math.min(tab, chapter.blocks.length - 1);
  const lu = landUse(chapter.tone);

  const blockProgress = (b: Block) => {
    if (b.kind !== "checklist") return null;
    const ks = b.items.map((_, i) => itemKey(chapter.id, b.id, i));
    return ks.filter((k) => checks[k]).length / ks.length;
  };

  return (
    <div className={`ws tone-${chapter.tone}`}>
      <header className="ws-head">
        <span className="iconbox ws-icon" aria-hidden="true"><Icon name={chapterIcon[chapter.id]} size={24} /></span>
        <div className="ws-title">
          <nav className="crumbs" aria-label="פירורי לחם"><a href={href({ name: "home" })}>בית</a><span aria-hidden="true">/</span><span>אגף {pad(chNo)} מתוך {chapters.length}</span></nav>
          <h1><span className="mono ws-no">{pad(chNo)}</span> {chapter.title}</h1>
          <p className="muted">{chapter.description}</p>
        </div>
        <div className="ws-meta">
          <span className="lu-chip" title={`${landUseSource.label}. ${landUseSource.status}`}>
            <i style={{ background: "var(--tone)" }} className={lu.hatched ? "hatched" : ""} />
            {lu.name}{lu.code ? ` · ${lu.code}` : ""}
          </span>
          {keys.length > 0 && (
            <div className="ws-progress">
              <div className="spread" style={{ fontSize: 12 }}><span className="muted">דרישות שסומנו</span><span className="mono" data-testid="chapter-progress">{done}/{keys.length}</span></div>
              <Progress value={done / keys.length} label="התקדמות באגף" />
            </div>
          )}
        </div>
      </header>

      <nav className="ws-tabs" role="tablist" aria-label="סעיפי האגף"
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setTab((t) => Math.min(chapter.blocks.length - 1, t + 1));
          if (e.key === "ArrowRight") setTab((t) => Math.max(0, t - 1));
        }}>
        {chapter.blocks.map((b, i) => {
          const pr = blockProgress(b);
          return (
            <button key={i} type="button" role="tab" aria-selected={i === cur} aria-pressed={i === cur} className="ws-tab" onClick={() => setTab(i)} data-testid={`tab-${i}`}>
              <span className="mono ws-tab-no">{pad(chNo)}.{i + 1}</span>
              <span className="ws-tab-t">{titleOf(b)}</span>
              {pr !== null && <i className={`ws-tab-st st-${pr >= 1 ? "ok" : pr > 0 ? "warn" : "idle"}`} aria-label={`${Math.round(pr * 100)}% סומן`} />}
            </button>
          );
        })}
      </nav>

      <div className="ws-body">
        <div className="ws-main" role="tabpanel" aria-label={titleOf(chapter.blocks[cur])}>
          <BlockView2 key={`${chapter.id}-${cur}`} chapter={chapter} block={chapter.blocks[cur]} index={cur} chNo={chNo} />
        </div>
        <BusinessCards chapter={chapter} />
      </div>

      <footer className="ws-foot">
        {prev ? <a className="btn sm" href={href({ name: "chapter", id: prev.id })}><Icon name="arrow" size={14} style={{ transform: "scaleX(-1)" }} />{pad(idx)} {prev.short}</a> : <span />}
        <span className="muted mono" style={{ fontSize: 12 }}>סעיף {cur + 1} מתוך {chapter.blocks.length}</span>
        {next ? <a className="btn sm" href={href({ name: "chapter", id: next.id })}>{pad(idx + 2)} {next.short}<Icon name="arrow" size={14} /></a> : <a className="btn sm primary" href={href({ name: "check" })}>לבדיקת תכנית<Icon name="arrow" size={14} /></a>}
      </footer>
    </div>
  );
}
