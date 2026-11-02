import { useEffect } from "react";
import { chapters, tools } from "../data/permitData";
import { href } from "../state/router";
import { toolComponents } from "../components/tools";
import { PageHead, Sheet } from "../components/ui";
import { Icon, IconBox, toolIcon } from "../components/icons";
import NotFound from "./NotFound";

export function ToolsIndex() {
  return (
    <div>
      <PageHead crumbs={[{ label: "בית", route: { name: "home" } }, { label: "כלים" }]} label="6 מחשבונים" title="מחשבונים" lead="כל המחשבונים קוראים מתיק בקשה אחד. שדה שמסומן כמשותף, כמו שטח מגרש, מתעדכן בכל המחשבונים ובדוח בבת אחת." />
      <div className="grid g3">
        {tools.map((t) => {
          const c = chapters.find((x) => x.id === t.chapter)!;
          return (
            <a key={t.id} className={`card-link tone-${c.tone} tick`} href={href({ name: "tool", id: t.id })} data-testid={`tool-card-${t.id}`}>
              <IconBox name={toolIcon[t.id]} />
              <span className="label" style={{ display: "block" }}>{c.short}</span>
              <span className="go" aria-hidden="true">←</span>
              <h3>{t.title}</h3>
              <p>{t.purpose}</p>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export function ToolPage({ id }: { id: string }) {
  const meta = tools.find((t) => t.id === id);
  useEffect(() => { if (meta) document.title = `${meta.title} · אוגדן הנחיות להיתר`; }, [meta]);
  if (!meta) return <NotFound />;
  const c = chapters.find((x) => x.id === meta.chapter)!;
  const T = toolComponents[meta.id];
  return (
    <div className={`tone-${c.tone}`}>
      <PageHead tone={c.tone} crumbs={[{ label: "בית", route: { name: "home" } }, { label: "כלים", route: { name: "tools" } }, { label: meta.title }]} label={`פרק ${c.short}`} title={meta.title} lead={meta.purpose} icon={toolIcon[meta.id]} />
      <Sheet tone={c.tone} label="מחובר לתיק הבקשה">
        <T />
      </Sheet>
      <p style={{ marginTop: 24 }}><a className="ic-row" href={href({ name: "chapter", id: c.id })}><Icon name="arrow" size={16} />לדרישות ולאנשי הקשר בפרק {c.title}</a></p>
    </div>
  );
}
