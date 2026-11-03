import { useMemo, useState } from "react";
import { chapters, directory, type ContactPerson } from "../data/permitData";
import { href } from "../state/router";
import { PageHead, copyText, useToast } from "../components/ui";
import { Icon } from "../components/icons";

export function ContactList({ people, compact, numbered = true }: { people: (ContactPerson & { department?: string; chapterId?: string })[]; compact?: boolean; numbered?: boolean }) {
  const toast = useToast();
  return (
    <div className="person-grid">
      {people.map((p, i) => (
        <div className="person" key={`${p.name}-${p.phone}-${p.email}`} data-testid="person">
          <div style={{ minWidth: 0, display: "flex", gap: 10, alignItems: "baseline" }}>
            {numbered && <span className="num-badge mono">{i + 1}</span>}
            <div style={{ minWidth: 0 }}>
            <b>{p.name}</b>
            <div className="role">{p.role}{p.department && !compact ? ` · ${p.department}` : ""}</div>
            </div>
          </div>
          <div className="acts">
            <a className="btn sm" href={`tel:${p.phone.replace(/-/g, "")}`} aria-label={`חיוג ל${p.name}`}><Icon name="phone" size={15} /><span className="ltr mono">{p.phone}</span></a>
            {p.email && (
              <button type="button" className="btn sm ghost" onClick={async () => toast((await copyText(p.email)) ? `הועתק: ${p.email}` : "ההעתקה נכשלה")} aria-label={`העתקת הדוא"ל של ${p.name}`}>
                <Icon name="mail" size={15} /><span className="mail-t">דוא"ל</span>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Contacts() {
  const [q, setQ] = useState("");
  const [dep, setDep] = useState<string>("all");
  const list = useMemo(() => {
    const t = q.trim();
    return directory.filter((c) => (dep === "all" || c.chapterId === dep) && (!t || `${c.name} ${c.role} ${c.department} ${c.phone} ${c.email}`.includes(t)));
  }, [q, dep]);
  const withContacts = chapters.filter((c) => c.contacts.length);
  return (
    <div className="ws page-contacts">
      <PageHead crumbs={[{ label: "בית", route: { name: "home" } }, { label: "ספר טלפונים" }]} title="ספר טלפונים" icon="people" lead={`${directory.length} אנשי קשר מכל פרקי האוגדן. לחיצה על מספר מחייגת, לחיצה על דוא״ל מעתיקה.`}>
        <input className="input text sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש: שם, תפקיד, מחלקה, מספר" aria-label="חיפוש לפי שם, תפקיד, מחלקה או מספר" data-testid="contacts-search" />
      </PageHead>
      <nav className="ws-tabs ws-tabs-quiet" aria-label="סינון לפי מחלקה">
        <button type="button" className="ws-tab" aria-pressed={dep === "all"} aria-selected={dep === "all"} onClick={() => setDep("all")}><span className="ws-tab-t">הכול</span><span className="mono muted">{directory.length}</span></button>
        {withContacts.map((c) => (
          <button key={c.id} type="button" className="ws-tab" aria-pressed={dep === c.id} aria-selected={dep === c.id} onClick={() => setDep(c.id)}><span className="mono ws-tab-no">{String(chapters.indexOf(c) + 1).padStart(2, "0")}</span><span className="ws-tab-t">{c.short}</span><span className="mono muted">{c.contacts.length}</span></button>
        ))}
      </nav>
      <div className="ws-scroll ws-full">
        <div className="spread" style={{ marginBottom: 8 }}>
          <b>{dep === "all" ? "כל המחלקות" : chapters.find((c) => c.id === dep)!.department}</b>
          <span className="muted mono" style={{ fontSize: 12 }}>{list.length} תוצאות{dep !== "all" && <> · <a href={href({ name: "chapter", id: dep })}>לפרק {chapters.find((c) => c.id === dep)!.short}</a></>}</span>
        </div>
        {list.length ? <ContactList people={list} /> : <p className="muted">לא נמצאו אנשי קשר. נסו לנקות את הסינון או לחפש מילה אחרת.</p>}
      </div>
    </div>
  );
}
