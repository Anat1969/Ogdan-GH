import { href } from "../state/router";
import { PageHead } from "../components/ui";

export default function NotFound() {
  return (
    <div>
      <PageHead title="הדף לא נמצא" lead="הקישור שגוי או שהדף הועבר. אפשר לחזור לדף הבית או לחפש באוגדן." />
      <a className="btn primary" href={href({ name: "home" })}>לדף הבית</a>
    </div>
  );
}
