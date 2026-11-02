import { useEffect } from "react";
import { allChecklistKeys, bankAccounts, chapters, itemKey, paymentNote, permitTracks, tools, type Block, type Chapter as Ch } from "../data/permitData";
import { href } from "../state/router";
import { setChecks, toggleCheck, updateProject, useChecks, useProject } from "../state/store";
import { toolComponents } from "../components/tools";
import { CheckMark, PageHead, Progress, Sheet, Stamp, copyText, useToast } from "../components/ui";
import { ContactList } from "./Contacts";
import NotFound from "./NotFound";
import { chapterIcon } from "../components/icons";

function Checklist({ chapter, block }: { chapter: Ch; block: Extract<Block, { kind: "checklist" }> }) {
  const checks = useChecks();
  const keys = block.items.map((_, i) => itemKey(chapter.id, block.id, i));
  const done = keys.filter((k) => checks[k]).length;
  return (
    <Sheet title={block.title} label={`${done} מתוך ${keys.length}`} tone={chapter.tone}>
      <div className="spread" style={{ marginBottom: 10 }}>
        <div style={{ flex: "1 1 200px" }}><Progress value={done / keys.length} label={block.title} /></div>
        <button type="button" className="btn sm ghost" onClick={() => setChecks(keys, done < keys.length)}>
          {done < keys.length ? "סימון הכול" : "ניקוי הסימונים"}
        </button>
      </div>
      <ul className="checklist">
        {block.items.map((it, i) => {
          const k = keys[i];
          return (
            <li key={k}>
              <label className="check" data-testid={`check-${k}`}>
                <input type="checkbox" checked={!!checks[k]} onChange={() => toggleCheck(k)} />
                <span className="box"><CheckMark /></span>
                <span className="t">{it}</span>
                <span className="idx">{String(i + 1).padStart(2, "0")}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

function Tracks() {
  const p = useProject();
  return (
    <Sheet title="מסלולי הגשה" label="בחרו את מסלול הבקשה">
      <div className="grid g3">
        {permitTracks.map((t) => (
          <button key={t.id} type="button" className={`btn ${p.track === t.id ? "is-active" : ""}`} aria-pressed={p.track === t.id} onClick={() => updateProject({ track: t.id as typeof p.track })}
            style={{ flexDirection: "column", alignItems: "flex-start", whiteSpace: "normal", textAlign: "start", padding: 16, minHeight: 110 }}>
            <span className="mono" style={{ fontSize: 30, lineHeight: 1 }}>{t.days}<span style={{ fontSize: 13 }}> ימים</span></span>
            <span style={{ fontWeight: 600 }}>{t.name}</span>
            <span style={{ fontSize: 13, opacity: 0.8, fontWeight: 400 }}>{t.description}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function Bank() {
  const toast = useToast();
  return (
    <Sheet title="חשבונות בנק לתשלום אגרות ופיקדון" label="לחיצה על IBAN מעתיקה">
      <div className="table-wrap">
        <table>
          <thead><tr><th>בנק</th><th>מס' בנק</th><th>סניף</th><th>חשבון</th><th>IBAN</th></tr></thead>
          <tbody>
            {bankAccounts.map((b) => (
              <tr key={b.iban}>
                <td>{b.bank}</td><td className="num">{b.bankNum}</td><td className="num">{b.branch}</td><td className="num">{b.account}</td>
                <td><button type="button" className="btn sm ghost mono" onClick={async () => toast((await copyText(b.iban)) ? `הועתק: ${b.iban}` : "ההעתקה נכשלה")}><span className="ltr">{b.iban}</span></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>{paymentNote}</p>
    </Sheet>
  );
}

function BlockView({ chapter, block }: { chapter: Ch; block: Block }) {
  switch (block.kind) {
    case "text":
      return <Sheet title={block.title}><p style={{ fontSize: 16, color: "var(--graphite)", maxWidth: "70ch" }}>{block.body}</p></Sheet>;
    case "checklist":
      return <Checklist chapter={chapter} block={block} />;
    case "notes":
      return <Sheet title={block.title} tone={chapter.tone}><ul className="notes">{block.items.map((n) => <li key={n}>{n}</li>)}</ul></Sheet>;
    case "cards":
      return (
        <Sheet title={block.title} tone={chapter.tone}>
          <div className="grid g2">
            {block.cards.map((c) => (
              <div key={c.title} className="metric" style={{ display: "grid", gap: 6 }}>
                <b style={{ fontWeight: 600 }}>{c.title}</b>
                <p style={{ fontSize: 14, color: "var(--graphite)" }}>{c.body}</p>
              </div>
            ))}
          </div>
        </Sheet>
      );
    case "stages":
      return (
        <Sheet title={block.title} tone={chapter.tone}>
          <ol className="grid g4" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {block.items.map((s, i) => (
              <li key={s} className={`metric tone-${chapter.tone}`}>
                <div className="v">{String(i + 1).padStart(2, "0")}</div>
                <div className="k">{s}</div>
              </li>
            ))}
          </ol>
        </Sheet>
      );
    case "alert":
      return <Stamp kind="no" seal="חובה" title={block.body} />;
    case "contactInfo":
      return (
        <Sheet title={block.title}>
          <ul className="notes">{block.lines.map((l) => <li key={l}>{l}</li>)}</ul>
          {block.alert && <div style={{ marginTop: 12 }}><Stamp kind="warn" seal="שימו לב" title={block.alert} /></div>}
        </Sheet>
      );
    case "tracks":
      return <Tracks />;
    case "bank":
      return <Bank />;
    case "tool": {
      const T = toolComponents[block.tool];
      const meta = tools.find((t) => t.id === block.tool)!;
      return (
        <Sheet title={meta.title} label="מחובר לתיק הבקשה" tone={chapter.tone} id={`tool-${block.tool}`}>
          <T />
        </Sheet>
      );
    }
  }
}

export default function Chapter({ id }: { id: string }) {
  const chapter = chapters.find((c) => c.id === id);
  const checks = useChecks();
  useEffect(() => { if (chapter) document.title = `${chapter.title} · אוגדן הנחיות להיתר`; }, [chapter]);
  if (!chapter) return <NotFound />;
  const idx = chapters.indexOf(chapter);
  const prev = chapters[idx - 1];
  const next = chapters[idx + 1];
  const keys = allChecklistKeys(chapter);
  const done = keys.filter((k) => checks[k]).length;
  return (
    <div className={`tone-${chapter.tone}`}>
      <PageHead
        tone={chapter.tone}
        crumbs={[{ label: "בית", route: { name: "home" } }, { label: "פרקי האוגדן", route: { name: "home" } }, { label: chapter.short }]}
        label={`פרק ${String(idx + 1).padStart(2, "0")} מתוך ${chapters.length}`}
        title={chapter.title}
        lead={chapter.description}
        icon={chapterIcon[chapter.id]}
      >
        {keys.length > 0 && (
          <div style={{ maxWidth: 420, display: "grid", gap: 6, marginTop: 8 }}>
            <div className="spread" style={{ fontSize: 13 }}><span className="muted">דרישות שסומנו בפרק</span><span className="mono" data-testid="chapter-progress">{done}/{keys.length}</span></div>
            <Progress value={done / keys.length} label="התקדמות בפרק" />
          </div>
        )}
      </PageHead>

      <div className="chapter-layout">
        <div className="stack">
          {chapter.blocks.map((b, i) => <BlockView key={i} chapter={chapter} block={b} />)}
        </div>
        <aside className="stack chapter-aside">
          {chapter.contacts.length > 0 ? (
            <Sheet title="אנשי קשר" label={chapter.department}>
              {chapter.hours && <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>{chapter.hours}</p>}
              <ContactList people={chapter.contacts} compact />
            </Sheet>
          ) : (
            <Sheet title="אנשי קשר"><p className="muted" style={{ fontSize: 14 }}>לפרק זה לא צוינו אנשי קשר באוגדן. לבירורים: מחלקת הרישוי.</p></Sheet>
          )}
        </aside>
      </div>

      <nav className="grid g2" style={{ marginTop: 48 }} aria-label="מעבר בין פרקים">
        {prev ? (
          <a className={`card-link tone-${prev.tone}`} href={href({ name: "chapter", id: prev.id })}><span className="label">הפרק הקודם</span><h3>{prev.title}</h3></a>
        ) : <span />}
        {next ? (
          <a className={`card-link tone-${next.tone}`} href={href({ name: "chapter", id: next.id })} style={{ textAlign: "end" }}><span className="label">הפרק הבא</span><h3>{next.title}</h3></a>
        ) : (
          <a className="card-link" href={href({ name: "project" })} style={{ textAlign: "end" }}><span className="label">סיימתם לעבור על האוגדן</span><h3>לדוח תיק הבקשה</h3></a>
        )}
      </nav>
    </div>
  );
}
