// מקרא סימנים אחיד לכל מסגרות ההמחשה
const ITEMS: Record<string, { label: string; sw: JSX.Element }> = {
  mass: { label: "בניין / מסה", sw: <rect x="2" y="3" width="16" height="10" fill="rgba(120,120,120,.12)" stroke="#555" strokeWidth="1" /> },
  plot: { label: "גבול מגרש", sw: <rect x="2" y="3" width="16" height="10" fill="none" stroke="#555" strokeWidth="1" strokeDasharray="3 2" /> },
  dim: { label: "מידה", sw: <g stroke="var(--bad)" strokeWidth="1"><line x1="2" y1="8" x2="18" y2="8" /><line x1="2" y1="4" x2="2" y2="12" /><line x1="18" y1="4" x2="18" y2="12" /></g> },
  green: { label: "שטח ירוק / מחלחל", sw: <rect x="2" y="3" width="16" height="10" fill="rgba(110,150,100,.22)" stroke="#6a8a60" strokeWidth="1" /> },
  water: { label: "מים / ניקוז", sw: <rect x="2" y="3" width="16" height="10" fill="rgba(90,140,170,.22)" stroke="#5a8aa8" strokeWidth="1" /> },
  tone: { label: "שטח נדרש", sw: <rect x="2" y="3" width="16" height="10" fill="rgba(160,150,120,.22)" stroke="#8a826a" strokeWidth="1" /> },
  callout: { label: "מספר דרישה ברשימה", sw: <g><circle cx="10" cy="8" r="6" fill="#fff" stroke="#555" strokeWidth="1" /><text x="10" y="11" fontSize="8" textAnchor="middle" fill="#222">1</text></g> },
  marker: { label: "מיקוד בריחוף", sw: <circle cx="10" cy="8" r="6" fill="rgba(242,211,79,.45)" stroke="#d9b62a" strokeWidth="1" /> },
  flow: { label: "זרימה", sw: <line x1="2" y1="8" x2="18" y2="8" stroke="#6d97ad" strokeWidth="2" strokeDasharray="4 2" /> },
};

export function Legend({ kinds }: { kinds: string[] }) {
  return (
    <dl className="legend" aria-label="מקרא">
      {kinds.filter((k) => ITEMS[k]).map((k) => (
        <div key={k}><dt><svg width="20" height="16" aria-hidden="true">{ITEMS[k].sw}</svg></dt><dd>{ITEMS[k].label}</dd></div>
      ))}
    </dl>
  );
}
