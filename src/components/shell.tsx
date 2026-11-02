import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chapters, source } from "../data/permitData";
import { search } from "../logic/search";
import { href, navigate, type Route } from "../state/router";
import { emptyProject, encodeState, exampleProject, checksStore, projectStore, useSavedAt } from "../state/store";
import { copyText, useToast } from "./ui";
import { Icon } from "./icons";

/* אייקון האפליקציה: גיליון שרטוט מקופל עם תכנית קומה. החריג היחיד לכלל "בלי אייקונים". */
export function AppIcon({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="4" y="4" width="56" height="56" fill="#0b0b0b" />
      <path d="M4 4h56v56H4z" fill="none" stroke="#0b0b0b" strokeWidth="2" />
      <g stroke="#e9e4d6" strokeWidth="1.6" fill="none">
        <path d="M14 48V20l12-6 12 6v28" />
        <path d="M38 48V28l12-4v24" />
        <path d="M10 48h44" />
        <path d="M20 26h12M20 32h12M20 38h12M42 33h4M42 39h4" opacity=".75" />
      </g>
      <path d="M44 4h16v16z" fill="#ffffff" opacity=".9" />
    </svg>
  );
}

/* ---------- כפתור הלוגו A&I ---------- */
interface MenuItem { label: string; hint?: string; disabled?: boolean; onSelect: () => unknown }
interface MenuElement extends HTMLElement { items: MenuItem[]; status: string }

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "ai-menu": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { chat?: string; research?: string };
    }
  }
}

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function useInstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  useEffect(() => {
    const on = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); };
    window.addEventListener("beforeinstallprompt", on);
    const done = () => setEvt(null);
    window.addEventListener("appinstalled", done);
    return () => { window.removeEventListener("beforeinstallprompt", on); window.removeEventListener("appinstalled", done); };
  }, []);
  return evt;
}

function useMenuItems(): MenuItem[] {
  const toast = useToast();
  const install = useInstallPrompt();
  return useMemo(() => [
    {
      label: "העתקת קישור",
      hint: "כולל תיק הבקשה והסימונים, לשיתוף עם עמית",
      onSelect: async () => {
        const base = window.location.href.split("#")[0];
        const route = (window.location.hash || "#/").split("?")[0];
        const ok = await copyText(`${base}${route}?s=${encodeState()}`);
        toast(ok ? "הקישור הועתק, כולל המצב הנוכחי" : "ההעתקה נכשלה. אפשר להעתיק מסרגל הכתובת");
      },
    },
    {
      label: "התקנת האפליקציה",
      hint: install ? "התקנה כאפליקציה עצמאית, עובדת גם בלי רשת" : "Chrome עדיין לא הציע התקנה בדפדפן הזה",
      disabled: !install,
      onSelect: async () => { if (install) { await install.prompt(); await install.userChoice; } },
    },
    {
      label: "טעינת פרויקט לדוגמה",
      hint: "בניין מגורים, 40 יח״ד ומסחר בקומת קרקע",
      onSelect: () => { projectStore.set(exampleProject()); toast("נטען פרויקט לדוגמה. כל המחשבונים התעדכנו"); },
    },
    {
      label: "הדפסת דוח תיק הבקשה",
      onSelect: () => { navigate({ name: "project" }); setTimeout(() => window.print(), 400); },
    },
    {
      label: "מצב תצוגה בהיר או כהה",
      onSelect: () => {
        const root = document.documentElement;
        const dark = root.dataset.theme === "dark" || (!root.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
        root.dataset.theme = dark ? "light" : "dark";
        try { localStorage.setItem("ogdan.v2.theme", root.dataset.theme); } catch { /* */ }
      },
    },
    {
      label: "איפוס תיק הבקשה",
      hint: "מוחק את הנתונים והסימונים מהדפדפן הזה",
      onSelect: () => {
        if (!confirm("למחוק את נתוני תיק הבקשה ואת כל הסימונים?")) return;
        projectStore.set(emptyProject());
        checksStore.set({});
        toast("תיק הבקשה אופס");
      },
    },
  ], [install, toast]);
}

export function AIMenu() {
  const items = useMenuItems();
  const ref = useRef<MenuElement>(null);
  const [defined, setDefined] = useState(() => typeof customElements !== "undefined" && !!customElements.get("ai-menu"));
  useEffect(() => {
    if (defined) return;
    let alive = true;
    customElements.whenDefined("ai-menu").then(() => alive && setDefined(true));
    return () => { alive = false; };
  }, [defined]);
  useEffect(() => {
    if (ref.current) ref.current.items = items;
  }, [items, defined]);
  if (defined) return <ai-menu ref={ref} />;
  return <FallbackMenu items={items} />;
}

/** תחליף מקומי זהה בהתנהגות, כשהסקריפט החיצוני לא נטען (רשת חסומה, מצב לא מקוון). */
function FallbackMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const route = window.location.hash;
  useEffect(() => setOpen(false), [route]);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div ref={box} style={{ position: "relative" }}>
      <button type="button" className="btn sm" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)} data-testid="ai-logo" style={{ gap: 8 }}>
        <span className="mono" style={{ background: "var(--ink)", color: "var(--sheet)", padding: "2px 6px", fontWeight: 600 }}>A&amp;I</span>
        <span className="hide-sm">אד' ענת שטיבלמן</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div role="menu" className="sheet" style={{ position: "absolute", insetInlineEnd: 0, top: "calc(100% + 8px)", width: 300, padding: 6, zIndex: 60 }} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            {items.map((it) => (
              <button key={it.label} role="menuitem" type="button" disabled={it.disabled} className="btn ghost" style={{ width: "100%", justifyContent: "flex-start", flexDirection: "column", alignItems: "flex-start", gap: 0, whiteSpace: "normal", textAlign: "start" }}
                onClick={() => { setOpen(false); it.onSelect(); }}>
                <span>{it.label}</span>
                {it.hint && <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>{it.hint}</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- סרגל עליון ---------- */
function SavedIndicator() {
  const at = useSavedAt();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!at) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 1800);
    return () => clearTimeout(t);
  }, [at]);
  if (at === -1) return <span className="saved err" role="status">השמירה נכשלה</span>;
  return <span className="saved" role="status" aria-live="polite" style={{ opacity: show ? 1 : 0 }} data-testid="saved">נשמר</span>;
}

const navItems: { label: string; route: Route; tone?: string }[] = [
  ...chapters.map((c, i) => ({ label: `${String(i + 1).padStart(2, "0")} ${c.short}`, route: { name: "chapter", id: c.id } as Route, tone: c.tone })),
  { label: "כלים", route: { name: "tools" } },
  { label: "טלפונים", route: { name: "contacts" } },
  { label: "תיק הבקשה", route: { name: "project" } },
  { label: "בדיקת תכנית", route: { name: "check" } },
];

const isCurrent = (cur: Route, r: Route) => cur.name === r.name && ("id" in r ? "id" in cur && cur.id === r.id : true);

export function TopBar({ route, onSearch }: { route: Route; onSearch: () => void }) {
  return (
    <>
      <header className="topbar">
        <a className="brand" href="#/" aria-label="אוגדן הנחיות להיתר, לדף הבית">
          <AppIcon />
          <span>
            <b>אוגדן הנחיות להיתר</b>
            <small>ASHDOD · {source.version}</small>
          </span>
        </a>
        <nav className="navrow" aria-label="ניווט ראשי">
          {navItems.map((n) => (
            <a key={href(n.route)} className={`navlink ${n.tone ? `tone-${n.tone}` : ""}`} href={href(n.route)} aria-current={isCurrent(route, n.route) ? "page" : undefined}>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="bar-actions">
          <SavedIndicator />
          <button type="button" className="btn sm" onClick={onSearch} aria-label="חיפוש באוגדן" data-testid="search-open">
            <Icon name="search" size={16} /><span className="hide-sm">חיפוש</span> <span className="kbd hide-sm">Ctrl K</span>
          </button>
          <AIMenu />
        </div>
      </header>
      <nav className="mobile-nav" aria-label="ניווט נייד">
        <a href="#/" aria-current={route.name === "home" ? "page" : undefined}>בית</a>
        {navItems.map((n) => (
          <a key={href(n.route)} className={n.tone ? `tone-${n.tone}` : ""} href={href(n.route)} aria-current={isCurrent(route, n.route) ? "page" : undefined}>{n.label}</a>
        ))}
      </nav>
    </>
  );
}

/* ---------- פלטת חיפוש ---------- */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const hits = useMemo(() => search(q), [q]);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) { setQ(""); setSel(0); setTimeout(() => input.current?.focus(), 30); } }, [open]);
  useEffect(() => setSel(0), [q]);
  const go = useCallback((i: number) => { const h = hits[i]; if (!h) return; navigate(h.route); onClose(); }, [hits, onClose]);
  const suggestions = ["חניה", "אסבסט", "בור חלחול", "גנרטור", "טופס 2", "תעודת גמר", "IBAN"];
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <motion.div className="palette" role="dialog" aria-modal="true" aria-label="חיפוש באוגדן" initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }}>
            <input
              ref={input}
              className="input"
              placeholder="חיפוש דרישה, איש קשר, כלי או מונח..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              role="combobox"
              aria-expanded={hits.length > 0}
              aria-controls="search-results"
              data-testid="search-input"
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, hits.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
                if (e.key === "Enter") go(sel);
                if (e.key === "Escape") onClose();
              }}
            />
            <ul id="search-results" role="listbox">
              {!q && (
                <li style={{ padding: 12 }}>
                  <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>החיפוש עובר על כל 9 הפרקים, הדרישות, הדגשים, אנשי הקשר והכלים.</p>
                  <div className="row">{suggestions.map((s) => <button key={s} type="button" className="btn sm" onClick={() => setQ(s)}>{s}</button>)}</div>
                </li>
              )}
              {q && hits.length === 0 && <li style={{ padding: 16 }} className="muted">לא נמצאו תוצאות ל"{q}". נסו מילה קצרה יותר או שם של פרק.</li>}
              {hits.map((h, i) => (
                <li key={i} role="option" aria-selected={i === sel} className="hit" onMouseEnter={() => setSel(i)} onClick={() => go(i)} data-testid="search-hit">
                  <span className="kind">{h.kind}</span>
                  <span style={{ minWidth: 0 }}>
                    <span className="ht">{h.title}</span>
                    <span className="hc" style={{ display: "block" }}>{h.context}</span>
                  </span>
                </li>
              ))}
            </ul>
            <footer><span><span className="kbd">↑↓</span> מעבר</span><span><span className="kbd">Enter</span> פתיחה</span><span><span className="kbd">Esc</span> סגירה</span></footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
