import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { source } from "./data/permitData";
import { CommandPalette, TopBar } from "./components/shell";
import { ToastProvider, useToast } from "./components/ui";
import Chapter from "./pages/Chapter";
import Contacts from "./pages/Contacts";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Project from "./pages/Project";
import { ToolPage, ToolsIndex } from "./pages/Tools";
import { href, useRoute, useSharedStateImport, type Route } from "./state/router";

function View({ route }: { route: Route }) {
  switch (route.name) {
    case "home": return <Home />;
    case "chapter": return <Chapter id={route.id} />;
    case "tool": return <ToolPage id={route.id} />;
    case "tools": return <ToolsIndex />;
    case "contacts": return <Contacts />;
    case "project": return <Project />;
    default: return <NotFound />;
  }
}

function Shell() {
  const route = useRoute();
  const [searchOpen, setSearchOpen] = useState(false);
  const toast = useToast();
  const reduce = useReducedMotion();
  useSharedStateImport(useCallback(() => toast("נטען תיק בקשה מהקישור ששותף"), [toast]));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen((o) => !o); }
      if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const key = href(route);
  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (route.name === "home") document.title = "אוגדן הנחיות להיתר · עיריית אשדוד";
    if (route.name === "contacts") document.title = "ספר טלפונים · אוגדן הנחיות להיתר";
    if (route.name === "tools") document.title = "מחשבונים · אוגדן הנחיות להיתר";
  }, [key, route.name]);

  return (
    <>
      <a className="skip" href="#main">דילוג לתוכן</a>
      <TopBar route={route} onSearch={() => setSearchOpen(true)} />
      <div className="page">
        <main id="main" className="wrap" tabIndex={-1}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={key} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.22 }}>
              <View route={route} />
            </motion.div>
          </AnimatePresence>
          <footer className="foot">
            <span>מבוסס על {source.title}, {source.publisher}, נוסח {source.version}.</span>
            <span>כלי עזר לעורכי בקשה. אינו מחליף את בדיקת הרשות.</span>
          </footer>
        </main>
      </div>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  );
}
