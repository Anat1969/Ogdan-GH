import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./design/app.css";
import { toneCss as buildToneCss } from "./design/tone";

// צבעי האגפים נגזרים ממקרא ייעודי הקרקע (מקור אחד), בגוון מושקט
const toneCss = buildToneCss();
const style = document.createElement("style");
style.dataset.source = "landuse";
style.textContent = toneCss;
document.head.appendChild(style);

try {
  const t = localStorage.getItem("ogdan.v2.theme");
  if (t) document.documentElement.dataset.theme = t;
} catch { /* מצב פרטי */ }

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
