import { useEffect } from "react";
import { chapters, tools } from "../data/permitData";
import { href } from "../state/router";
import { toolComponents } from "../components/tools";
import { PageHead } from "../components/ui";
import { Icon, toolIcon } from "../components/icons";
import NotFound from "./NotFound";
import { ParamViewer } from "../components/illus/ParamViewer";

export function ToolsIndex() {
  const pad = (n: number) => String(n).padStart(2, "0");
  const list = [...tools].sort((x, y) => chapters.findIndex((c) => c.id === x.chapter) - chapters.findIndex((c) => c.id === y.chapter));
  return (
    <div className="ws page-tools">
      <PageHead crumbs={[{ label: "בית", route: { name: "home" } }, { label: "כלים" }]} title="מחשבונים" icon="calc" lead={`${tools.length} מחשבונים שקוראים מתיק בקשה אחד. שדה משותף, כמו שטח מגרש, מתעדכן בכולם ובדוח בבת אחת.`} />
      <div className="ws-scroll ws-full">
        <ol className="tool-index">
          {list.map((t, i) => {
            const ci = chapters.findIndex((x) => x.id === t.chapter);
            return (
              <li key={t.id}>
                <a href={href({ name: "tool", id: t.id })} data-testid={`tool-card-${t.id}`}>
                  <span className="mono n">{i + 1}</span>
                  <Icon name={toolIcon[t.id]} size={18} />
                  <span className="tt"><b>{t.title}</b><span>{t.purpose}</span></span>
                  <span className="mono ch">{pad(ci + 1)} {chapters[ci].short}</span>
                </a>
              </li>
            );
          })}
        </ol>
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
    <div className={`ws page-tool tone-${c.tone}`}>
      <PageHead tone={c.tone} crumbs={[{ label: "בית", route: { name: "home" } }, { label: "כלים", route: { name: "tools" } }, { label: meta.title }]} title={meta.title} lead={meta.purpose} icon={toolIcon[meta.id]}>
        <a className="btn sm" href={href({ name: "chapter", id: c.id })}><Icon name="arrow" size={14} />לדרישות ולאנשי הקשר: {c.short}</a>
      </PageHead>
      <div className="ws-split tool-split">
        <div className="ws-scroll"><T /></div>
        <ParamViewer tool={meta.id} />
      </div>
    </div>
  );
}
