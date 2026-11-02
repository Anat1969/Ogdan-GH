// סט אייקונים קווי ומינימלי: קנבס 24, קו 1.5, קצוות מרובעים, currentColor.
// משמש בתכנים בלבד (פרקים, כלים, פעולות, סטטוס). הניווט העליון נשאר טקסטואלי.
import type { SVGProps } from "react";

const paths: Record<string, string> = {
  licensing: "M6 3h9l3 3v15H6z M15 3v3h3 M9 11h6 M9 14h6 M9 17h4",
  supervision: "M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  roads: "M8 3 4 21 M16 3l4 18 M12 4v3 M12 10v3 M12 16v4",
  drainage: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z",
  planting: "M12 21v-7 M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M9 21h6",
  electricity: "M13 2 5 13h6l-1 9 8-11h-6z",
  sanitation: "M4 6h16 M9 6V3h6v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7",
  water: "M2 8c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0 M2 13c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0 M2 18c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0",
  environment: "M5 19c0-8 5-14 15-15-1 10-7 15-15 15z M5 19l7-7",
  calc: "M5 3h14v18H5z M8 6h8v4H8z M8 13h2 M14 13h2 M8 17h2 M14 17h2",
  phone: "M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z",
  mail: "M3 5h18v14H3z M3 6l9 7 9-7",
  search: "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z M15.5 15.5 21 21",
  check: "M4 12.5 9.5 18 20 6",
  alert: "M12 3 2 21h20z M12 10v5 M12 18v.5",
  x: "M6 6l12 12 M18 6 6 18",
  arrow: "M20 12H4 M10 6l-6 6 6 6",
  print: "M6 9V3h12v6 M6 18H3v-9h18v9h-3 M6 14h12v7H6z",
  plot: "M3 3h18v18H3z M7 7h6v6H7z",
  people: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M2 20c0-3.5 3-6 7-6s7 2.5 7 6 M16 4a3.5 3.5 0 0 1 0 7 M18 14c2.5.5 4 2.8 4 6",
  folder: "M3 6h7l2 2h9v12H3z",
  copy: "M8 8h12v12H8z M16 8V4H4v12h4",
  car: "M5 11l2-5h10l2 5 M3 11h18v6H3z M7 17v2 M17 17v2 M7 14h.5 M16.5 14h.5",
  bin: "M4 6h16 M6 6l1 15h10l1-15",
  tree: "M12 21v-7 M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
  coin: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M9 9h4.5a2 2 0 0 1 0 4H9v-4z M9 13h5",
};

export const chapterIcon: Record<string, string> = {
  licensing: "licensing", supervision: "supervision", roads: "roads", drainage: "drainage", planting: "planting",
  electricity: "electricity", sanitation: "sanitation", water: "water", environment: "environment",
};
export const toolIcon: Record<string, string> = { parking: "car", drainage: "drainage", green: "tree", waste: "bin", water: "water", fee: "coin" };

export function Icon({ name, size = 20, ...rest }: { name: string; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" {...rest}>
      <path d={paths[name] ?? paths.plot} />
    </svg>
  );
}

/** מסגרת אייקון: ריבוע עם קו דק, לשימוש בכותרות ובכרטיסים */
export function IconBox({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <span className="iconbox" aria-hidden="true">
      <Icon name={name} size={size} />
    </span>
  );
}
