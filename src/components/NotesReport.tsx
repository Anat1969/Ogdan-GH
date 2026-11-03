import { chapters } from "../data/permitData";
import { useProject } from "../state/store";

const pad = (n: number) => String(n).padStart(2, "0");

/** ריכוז הערות האגפים לדוח: הערות הגורם העירוני והערות יועץ היזם */
export function NotesReport({ compact }: { compact?: boolean }) {
  const p = useProject();
  const rows = chapters
    .map((c, i) => ({ c, i, n: p.notes?.[c.id] }))
    .filter((x) => x.n && (x.n.authority.trim() || x.n.consultant.trim()));
  if (!rows.length) return null;
  return (
    <section className={`notes-report ${compact ? "compact" : ""}`} data-testid="notes-report">
      <b>הערות האגפים</b>
      <table>
        <thead><tr><th>אגף</th><th>הערות הגורם</th><th>הערות יועץ היזם</th></tr></thead>
        <tbody>
          {rows.map(({ c, i, n }) => (
            <tr key={c.id}><td className="mono">{pad(i + 1)} {c.short}</td><td>{n!.authority || "—"}</td><td>{n!.consultant || "—"}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
