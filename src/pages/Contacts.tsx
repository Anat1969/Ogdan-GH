import { useMemo, useState } from "react";
import { chapters, directory, type ContactPerson } from "../data/permitData";
import { href } from "../state/router";
import { PageHead, Sheet, copyText, useToast } from "../components/ui";

export function ContactList({ people, compact }: { people: (ContactPerson & { department?: string; chapterId?: string })[]; compact?: boolean }) {
  const toast = useToast();
  return (
    <div>
      {people.map((p) => (
        <div className="person" key={`${p.name}-${p.phone}-${p.email}`} data-testid="person">
          <div style={{ minWidth: 0 }}>
            <b>{p.name}</b>
            <div className="role">{p.role}{p.department && !compact ? ` · ${p.department}` : ""}</div>
          </div>
          <div className="acts">
            <a className="btn sm" href={`tel:${p.phone.replace(/-/g, "")}`} aria-label={`חיוג ל${p.name}`}><span className="ltr mono">{p.phone}</span></a>
            {p.email && (
              <button type="button" className="btn sm ghost" onClick={async () => toast((await copyText(p.email)) ? `הועתק: ${p.email}` : "ההעתקה נכשלה")} aria-label={`העתקת הדוא"ל של ${p.name}`}>
                דוא"ל
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
    <div>
      <PageHead crumbs={[{ label: "בית", route: { name: "home" } }, { label: "ספר טלפונים" }]} label={`${directory.length} אנשי קשר`} title="ספר טלפונים" lead="כל אנשי הקשר מכל פרקי האוגדן. לחיצה על מספר מחייגת, לחיצה על דוא״ל מעתיקה את הכתובת." />
      <div className="stack">
        <div className="grid g2" style={{ alignItems: "end" }}>
          <label className="field">
            <span>חיפוש לפי שם, תפקיד, מחלקה או מספר</span>
            <input className="input text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="לדוגמה: פיקוח, ניקוז, 8545320" data-testid="contacts-search" />
          </label>
          <div className="row">
            <button type="button" className="btn sm" aria-pressed={dep === "all"} onClick={() => setDep("all")}>הכול</button>
            {withContacts.map((c) => (
              <button key={c.id} type="button" className="btn sm" aria-pressed={dep === c.id} onClick={() => setDep(c.id)}>{c.short}</button>
            ))}
          </div>
        </div>
        <Sheet title={dep === "all" ? "כל המחלקות" : chapters.find((c) => c.id === dep)!.department} label={`${list.length} תוצאות`}>
          {list.length ? <ContactList people={list} /> : <p className="muted">לא נמצאו אנשי קשר. נסו לנקות את הסינון או לחפש מילה אחרת.</p>}
          {dep !== "all" && <p style={{ marginTop: 12 }}><a href={href({ name: "chapter", id: dep })}>למעבר לפרק {chapters.find((c) => c.id === dep)!.short}</a></p>}
        </Sheet>
      </div>
    </div>
  );
}
