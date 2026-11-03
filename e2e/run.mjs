// בדיקות קצה לקצה מול vite preview. הרצה: npm run build && npm run e2e
// הסקריפט החיצוני של כפתור A&I נחסם בכוונה, כדי לבדוק את התחליף המקומי (הסביבה לא מגיעה ל-vercel.app).
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = "http://localhost:4173";
const SHOTS = new URL("./shots/", import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

const server = spawn("npx", ["vite", "preview", "--port", "4173", "--strictPort"], { stdio: "pipe" });
await new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error("preview did not start")), 20000);
  server.stdout.on("data", (d) => { if (String(d).includes("4173")) { clearTimeout(t); res(); } });
});

let failures = 0;
const results = [];
async function test(name, fn) {
  try { await fn(); results.push(`PASS  ${name}`); }
  catch (e) { failures++; results.push(`FAIL  ${name}\n      ${String(e.message || e).split("\n")[0]}`); }
}
const assert = (c, m) => { if (!c) throw new Error(m); };

const browser = await chromium.launch();
async function newPage(opts = {}) {
  const ctx = await browser.newContext({ locale: "he-IL", ...opts });
  await ctx.route(/appofapp-gh\.vercel\.app|fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/net::ERR_FAILED|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  return { ctx, page, errors };
}
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

await test("דף הבית נטען, בלי שגיאות, עם מודל ומקרא", async () => {
  const { page, errors, ctx } = await newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + "/#/");
  await page.getByRole("heading", { name: /מהאוגדן/ }).waitFor();
  assert(await page.locator(".slab").count() === 12, "expected 12 floors");
  assert(await page.locator(".legend a").count() === 12, "expected 12 legend entries");
  await page.waitForTimeout(1400);
  await page.screenshot({ path: SHOTS + "home-desktop.png", fullPage: true });
  assert(await noHScroll(page), "horizontal scroll on desktop");
  assert(errors.length === 0, "console errors: " + errors.join(" | "));
  await ctx.close();
});

await test("כל קישורי הסרגל העליון נפתחים, הסרגל קבוע וכותרת הדף בולטת", async () => {
  const { page, errors, ctx } = await newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + "/#/");
  const links = await page.locator(".navrow a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  assert(links.length === 16, `expected 16 nav links, got ${links.length}`);
  for (const h of links) {
    await page.locator(`.navrow a[href="${h}"]`).click();
    await page.waitForFunction((h) => location.hash === h, h);
    await page.locator("main h1").first().waitFor();
    await page.locator(`.navrow a[href="${h}"][aria-current="page"]`).waitFor({ timeout: 3000 });
    const top = await page.locator(".topbar").evaluate((el) => getComputedStyle(el).position);
    assert(top === "fixed", "topbar not fixed");
  }
  await page.locator(".brand").click();
  await page.waitForFunction(() => location.hash === "#/");
  assert(errors.length === 0, "console errors: " + errors.join(" | "));
  await ctx.close();
});

await test("סימון דרישה מעדכן התקדמות ונשמר אחרי רענון", async () => {
  const { page, ctx } = await newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE + "/#/chapter/licensing");
  await page.getByTestId("tab-2").click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: SHOTS + "chapter-before.png" });
  await page.getByTestId("check-licensing.graphic.0").click();
  await page.getByTestId("check-licensing.graphic.1").click();
  await page.getByTestId("saved").waitFor();
  assert((await page.getByTestId("chapter-progress").textContent()) === "2/9", "progress not 2/9");
  await page.reload();
  assert((await page.getByTestId("chapter-progress").textContent()) === "2/9", "progress not persisted");
  await page.getByTestId("tab-2").click();
  await page.screenshot({ path: SHOTS + "chapter-licensing.png", fullPage: true });
  await ctx.close();
});

await test("שדה משותף: שטח מגרש שהוזן בניקוז מופיע בשטח ירוק ובמים", async () => {
  const { page, ctx } = await newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE + "/#/tool/drainage");
  await page.getByTestId("plot").first().fill("1000");
  await page.getByTestId("footprint").first().fill("400");
  await page.getByTestId("green").first().fill("100");
  await page.getByText("לא עומד בדרישת 15% שטח חלחול").waitFor();
  assert(await page.locator(".siteplan svg").count() === 1, "site plan missing");
  assert(await page.locator(".sb-seg.st-bad").count() === 1, "green segment not red when below 15%");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: SHOTS + "tool-drainage.png", fullPage: true });
  await page.goto(BASE + "/#/tool/green");
  assert((await page.getByTestId("plot").first().inputValue()) === "1000", "plot not shared to green tool");
  await page.goto(BASE + "/#/tool/water");
  assert((await page.getByTestId("plot").first().inputValue()) === "1000", "plot not shared to water tool");
  await ctx.close();
});

await test("מחשבון חניה: 40 יח\"ד בתקן אשדוד נותנות 48 חניות, ומעבר לתקן ארצי נותן 40", async () => {
  const { page, ctx } = await newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE + "/#/tool/parking");
  await page.getByTestId("parking-units-0").fill("40");
  await page.locator('[aria-label="חניות נדרשות"] .v').getByText("48").waitFor();
  await page.getByRole("button", { name: "תקן ארצי" }).click();
  await page.locator('[aria-label="חניות נדרשות"] .v').getByText("40").waitFor();
  assert(await page.locator(".waffle .wf").count() === 42, "waffle should show 40 + 2 operational squares");
  await page.getByTestId("parking-add").click();
  assert(await page.getByTestId("parking-units-1").count() === 1, "second use not added");
  await page.locator("summary", { hasText: "שלבי החישוב" }).click();
  await page.screenshot({ path: SHOTS + "tool-parking.png", fullPage: true });
  await ctx.close();
});

await test("תיק בקשה: פרויקט לדוגמה ממלא את הדוח ואת הבדיקות האוטומטיות", async () => {
  const { page, ctx } = await newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE + "/#/project");
  await page.getByTestId("load-example").click();
  const report = page.getByTestId("report");
  await report.getByText("בניין מגורים לדוגמה").waitFor();
  await report.getByText("עומד").first().waitFor();
  assert(await report.locator(".ring").count() === 10, "expected 10 readiness rings");
  assert(await report.locator(".gantt-row.mine").count() === 1, "selected track not marked");
  assert(await report.locator("tr", { hasText: "חניה" }).first().isHidden(), "quantities should be in their own tab");
  await page.getByTestId("rtab-1").click();
  await report.locator("tr", { hasText: "חניה" }).first().waitFor();
  const parkingRow = await report.locator("tr", { hasText: "חניה" }).first().textContent();
  assert(/\d+ חניות/.test(parkingRow), "parking row missing value");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: SHOTS + "project-report.png", fullPage: true });
  await page.emulateMedia({ media: "print" });
  assert(await page.locator(".topbar").isHidden(), "topbar visible in print");
  await page.screenshot({ path: SHOTS + "project-print.png", fullPage: true });
  await ctx.close();
});

await test("חיפוש: Ctrl+K, 'אסבסט', Enter מוביל לפרק הסביבה", async () => {
  const { page, ctx } = await newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE + "/#/");
  await page.getByRole("heading", { name: /מהאוגדן/ }).waitFor();
  await page.keyboard.press("Control+k");
  await page.getByTestId("search-input").fill("אסבסט");
  assert(await page.getByTestId("search-hit").count() > 0, "no hits");
  await page.screenshot({ path: SHOTS + "search.png" });
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => location.hash === "#/chapter/environment");
  await ctx.close();
});

await test("כפתור A&I: נפתח, נסגר ב-Escape ובלחיצה בחוץ, ומעתיק קישור עם מצב שנטען בדפדפן אחר", async () => {
  const { page, ctx } = await newPage({ viewport: { width: 1280, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
  await page.goto(BASE + "/#/project");
  await page.getByTestId("project-name").fill("מגדל בדיקה");
  const logo = page.getByTestId("ai-logo");
  await logo.click();
  assert(await page.getByRole("menu").isVisible(), "menu not open");
  await page.keyboard.press("Escape");
  await page.getByRole("menu").waitFor({ state: "detached", timeout: 2000 });
  await logo.click();
  await page.mouse.click(10, 500);
  await page.getByRole("menu").waitFor({ state: "detached", timeout: 2000 });
  await logo.click();
  await page.screenshot({ path: SHOTS + "ai-menu.png" });
  await page.getByRole("menuitem", { name: /העתקת קישור/ }).click();
  await page.getByTestId("toast").waitFor();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  assert(link.includes("#/project?s="), "link lacks state: " + link);
  const other = await newPage({ viewport: { width: 1280, height: 900 } });
  await other.page.goto(link);
  await other.page.getByTestId("report").getByText("מגדל בדיקה").waitFor();
  assert(!other.page.url().includes("?s="), "state param not cleaned from URL");
  await other.ctx.close();
  await ctx.close();
});

await test("ספר טלפונים: חיפוש וסינון לפי מחלקה", async () => {
  const { page, ctx } = await newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE + "/#/contacts");
  const all = await page.getByTestId("person").count();
  assert(all === 30, `expected 30 contacts, got ${all}`);
  await page.getByTestId("contacts-search").fill("פיקוח");
  const f = await page.getByTestId("person").count();
  assert(f > 0 && f < all, "search did not filter");
  await page.getByTestId("contacts-search").fill("");
  await page.getByRole("button", { name: "ניקוז", exact: true }).click();
  assert(await page.getByTestId("person").count() === 2, "department filter wrong");
  await ctx.close();
});

await test("נייד 390px: בלי גלילה אופקית בכל הדפים", async () => {
  const { page, ctx } = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const routes = ["#/", "#/chapter/licensing", "#/chapter/roads", "#/chapter/environment", "#/tool/parking", "#/tool/water", "#/tools", "#/contacts", "#/project", "#/check", "#/chapter/fire", "#/tool/program", "#/tool/levies", "#/tool/mamad"];
  for (const r of routes) {
    await page.goto(BASE + "/" + r);
    await page.locator("main h1").first().waitFor();
    await page.waitForTimeout(300);
    assert(await noHScroll(page), `horizontal scroll on ${r}`);
  }
  await page.goto(BASE + "/#/");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: SHOTS + "home-mobile.png", fullPage: true });
  await page.goto(BASE + "/#/tool/parking");
  await page.getByTestId("parking-units-0").fill("12");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: SHOTS + "parking-mobile.png", fullPage: true });
  await ctx.close();
});

await test("תנועה מופחתת ומצב כהה: הדף מציג את כל המידע", async () => {
  const { page, ctx } = await newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce", colorScheme: "dark" });
  await page.goto(BASE + "/#/");
  assert(await page.locator(".legend a").count() === 12, "legend missing under reduced motion");
  assert(await page.locator('.legend a[href="#/chapter/water"]').isVisible(), "chapter legend missing");
  assert(await page.getByTestId("home-tool-drainage").isVisible(), "tools summary missing");
  await page.screenshot({ path: SHOTS + "home-dark-reduced.png" });
  await ctx.close();
});

await test("התקנה מ-Chrome: manifest תקין ו-getInstallabilityErrors ריק", async () => {
  const { page, ctx } = await newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE + "/#/");
  await page.waitForFunction(() => navigator.serviceWorker?.controller || navigator.serviceWorker?.ready.then(() => true), null, { timeout: 10000 });
  await page.reload();
  const cdp = await ctx.newCDPSession(page);
  const { installabilityErrors } = await cdp.send("Page.getInstallabilityErrors");
  assert(installabilityErrors.length === 0, "installability: " + JSON.stringify(installabilityErrors));
  await ctx.close();
});

await test("מסגרת המחשה: מעבר על דרישה מדגיש את המספר בשרטוט, זום ולשוניות תכנית/חתך/תלת־ממד", async () => {
  const { page, ctx, errors } = await newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto(BASE + "/#/chapter/roads");
  await page.getByTestId("tab-1").click();
  const v = page.getByTestId("viewer-parking");
  await v.waitFor();
  await page.getByTestId("check-roads.parking.1").hover();
  assert(await v.locator(".callout.on text").textContent() === "2", "callout 2 not highlighted on hover");
  await page.waitForTimeout(400);
  assert((await v.locator(".zoom-v").textContent()) === "160%", "hover did not focus the drawing");
  await page.mouse.move(5, 5); await page.waitForTimeout(300);
  await v.getByRole("button", { name: "התקרבות" }).click();
  assert((await v.locator(".zoom-v").textContent()) === "125%", "zoom did not change");
  await v.getByRole("tab", { name: "חתך" }).click();
  await v.getByText("עין הנהג").waitFor();
  await v.getByRole("tab", { name: "תלת־ממד" }).click();
  await v.locator("canvas").waitFor({ timeout: 8000 });
  await page.waitForTimeout(3500);
  await v.screenshot({ path: SHOTS + "viewer-3d.png" });
  await v.getByRole("tab", { name: "תכנית" }).click();
  await page.getByTestId("check-roads.parking.1").hover();
  await page.waitForTimeout(500);
  await page.screenshot({ path: SHOTS + "chapter-roads-1600.png", fullPage: true });
  assert(await page.locator(".ws-cards .bcard").count() === 5, "expected 5 business cards");
  assert(errors.length === 0, "console errors: " + errors.join(" | "));
  await ctx.close();
});

await test("בדיקת תכנית: דוגמה מסמנת רמזור, וטעינת CSV מעדכנת", async () => {
  const { page, ctx } = await newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(BASE + "/#/check");
  await page.getByRole("tab", { name: /בדיקה מספרית/ }).click();
  await page.getByTestId("check-example").click();
  const status = (id) => page.getByTestId(`check-row-${id}`).getAttribute("data-status");
  assert(await status("parking_regular") === "warn", "parking should be warn");
  assert(await status("generators") === "bad", "generator should be bad");
  assert(await status("pit_volume") === "ok", "pit should be ok");
  await page.locator('input[type=file]').setInputFiles({ name: "plan.csv", mimeType: "text/csv", buffer: Buffer.from("id,value\nparking_regular,72\ngenerators,1\n") });
  await page.getByTestId("toast").waitFor();
  assert(await status("parking_regular") === "ok", "parking not updated from CSV");
  assert(await status("generators") === "ok", "generator not updated from CSV");
  await page.waitForTimeout(800);
  await page.screenshot({ path: SHOTS + "check.png", fullPage: true });
  await ctx.close();
});

await test("קבועים: שינוי תעריף אגרה משנה את התוצאה, ואיפוס מחזיר", async () => {
  const { page, ctx } = await newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(BASE + "/#/tool/fee");
  await page.getByTestId("gfa").first().fill("100");
  await page.getByTestId("kpanel-fee").locator("summary").click();
  await page.getByTestId("k-fee.perSqm").fill("200");
  await page.waitForTimeout(1000);
  assert((await page.locator('[aria-label="אגרת בנייה משוערת"] .v').textContent()).includes("20,000"), "fee did not use edited constant");
  await page.getByRole("button", { name: /החזרת אגרת בנייה/ }).click();
  await page.waitForTimeout(1000);
  assert((await page.locator('[aria-label="אגרת בנייה משוערת"] .v').textContent()).includes("18,800"), "reset failed");
  await page.getByTestId("doc-fee").locator("summary").click();
  await page.screenshot({ path: SHOTS + "constants.png", fullPage: true });
  await ctx.close();
});

await test("ממ\"ד, כבאות ופרוגרמה: מחשבונים חדשים עובדים", async () => {
  const { page, ctx, errors } = await newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(BASE + "/#/tool/mamad");
  await page.getByTestId("mamad-l").fill("3"); await page.getByTestId("mamad-w").fill("2.8"); await page.getByTestId("mamad-h").fill("2.5"); await page.getByTestId("mamad-wall").fill("25");
  await page.getByText("8.4 מ\"ר מול מינימום 9 מ\"ר").waitFor();
  await page.waitForTimeout(800);
  await page.screenshot({ path: SHOTS + "mamad.png", fullPage: true });
  await page.goto(BASE + "/#/tool/fireAccess");
  await page.getByTestId("fire-height").fill("31"); await page.getByTestId("fire-road").fill("3.8");
  await page.getByText(/בניין רב קומות/).first().waitFor();
  await page.waitForTimeout(800);
  await page.screenshot({ path: SHOTS + "fire.png", fullPage: true });
  await page.goto(BASE + "/#/tool/program");
  await page.getByTestId("units").first().fill("500");
  await page.getByText("תושבים צפויים").waitFor();
  await page.getByText("גן ילדים (3 עד 6)").first().waitFor();
  await page.waitForTimeout(800);
  await page.screenshot({ path: SHOTS + "program.png", fullPage: true });
  for (const id of ["fire", "hfc", "program", "water"]) { await page.goto(BASE + "/#/chapter/" + id); await page.locator(".ws-title h1").first().waitFor(); }
  await page.goto(BASE + "/#/chapter/fire"); await page.getByTestId("tab-1").click(); await page.waitForTimeout(800);
  await page.screenshot({ path: SHOTS + "chapter-fire.png", fullPage: true });
  assert(errors.length === 0, "console errors: " + errors.join(" | "));
  await ctx.close();
});

await test("בדיקת תוכנית לפי מספר: תב/1815 מעלה דוח התאמה ושרטוטים", async () => {
  const { page, ctx, errors } = await newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto(BASE + "/#/check");
  await page.getByTestId("plan-num").fill("1815");
  await page.getByTestId("plan-go").click();
  const rep = page.getByTestId("plan-report");
  await rep.getByText("תב/1815").first().waitFor();
  assert(await rep.locator('tr[data-verdict]').count() === 11, "expected 11 findings");
  assert(await rep.locator('tr[data-verdict="missing"]').count() >= 1, "expected missing approvals");
  await rep.getByText(/תשתיות/).first().waitFor();
  await page.waitForTimeout(900);
  await page.screenshot({ path: SHOTS + "plan-report.png", fullPage: true });
  await page.emulateMedia({ media: "print" });
  await page.screenshot({ path: SHOTS + "plan-report-print.png", fullPage: true });
  const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
  const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
  assert(pages === 1, `report should print on one A4 page, got ${pages}`);
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("tab", { name: /שרטוטים/ }).click();
  await page.locator(".imgpan img").waitFor();
  await page.screenshot({ path: SHOTS + "plan-images.png" });
  assert(errors.length === 0, "console errors: " + errors.join(" | "));
  await ctx.close();
});

await test("v6: מודל מהנתונים, דוגמה מונחית, תרשים זרימה, הערות לדוח וקישורים", async () => {
  const { page, ctx, errors } = await newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + "/#/tool/drainage");
  await page.getByTestId("pviewer-drainage").waitFor();
  await page.getByTestId("demo-start").click();
  await page.getByTestId("demo-card").waitFor();
  await page.locator(".pviewer canvas").first().waitFor({ timeout: 15000 });
  await page.getByTestId("demo-next").click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: SHOTS + "v6-tool-demo.png" });
  await page.getByTestId("demo-end").click();
  await page.goto(BASE + "/#/chapter/fire");
  await page.getByTestId("tab-0").waitFor();
  const n = await page.locator(".ws-tab").count();
  await page.getByTestId(`tab-${n - 1}`).click();
  await page.getByTestId("flow").waitFor();
  await page.waitForTimeout(3200);
  await page.screenshot({ path: SHOTS + "v6-flow.png" });
  await page.getByTestId("notes").locator("summary").click();
  await page.getByTestId("note-authority").fill("נדרש תיאום רחבה עם רשות הכבאות");
  await page.getByTestId("links").locator("summary").click();
  assert(await page.locator(".links-pop a").count() >= 3, "links missing");
  await page.goto(BASE + "/#/project");
  await page.getByTestId("rtab-2").click();
  await page.getByTestId("notes-report").getByText("נדרש תיאום רחבה").waitFor();
  await page.goto(BASE + "/#/chapter/roads"); await page.getByTestId("tab-0").click();
  await page.locator(".ws-split .checklist li").nth(1).hover();
  await page.waitForTimeout(700);
  await page.screenshot({ path: SHOTS + "v6-focus.png" });
  assert(await page.locator(".viewer-key li.on").count() === 1, "key item not highlighted");
  assert(errors.length === 0, "console errors: " + errors.join(" | "));
  await ctx.close();
});

await test("גריד אחיד: בלי גלילת דף ב-1440×900 וב-1280×800, כותרת באותו גובה בכל הדפים", async () => {
  for (const [w, h] of [[1440, 900], [1280, 800]]) {
    const { page, ctx } = await newPage({ viewport: { width: w, height: h } });
    const heads = [];
    for (const r of ["/", "/tools", "/tool/drainage", "/tool/program", "/chapter/licensing", "/chapter/fire", "/contacts", "/project", "/check"]) {
      await page.goto(BASE + "/#" + r);
      await page.waitForTimeout(500);
      const over = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      assert(over <= 2, `${r} at ${w}x${h} scrolls by ${over}px`);
      const nav = await page.evaluate(() => { const n = document.querySelector(".navrow"); return n ? n.scrollWidth - n.clientWidth : 0; });
      assert(nav <= 1, `nav overflows at ${w}: ${nav}px`);
      if (r !== "/") heads.push(await page.locator(".ws-head").first().evaluate((el) => Math.round(el.getBoundingClientRect().top)));
    }
    assert(new Set(heads).size === 1, `header top differs between pages: ${heads.join(",")}`);
    await ctx.close();
  }
});

await test("טקסט לא יוצא ממסגרת: מדדים ושלבי חישוב במחשבונים, תוויות במודל לא חופפות", async () => {
  const { page, ctx } = await newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(BASE + "/#/project");
  await page.getByTestId("load-example").click();
  for (const t of ["drainage", "water", "program", "mamad", "green", "fireAccess"]) {
    await page.goto(BASE + "/#/tool/" + t);
    await page.waitForTimeout(1400);
    const bad = await page.evaluate(() => [...document.querySelectorAll("main .metric, main .metric .v, main .calc-steps li, main .preqs li")].filter((e) => e.scrollWidth > e.clientWidth + 2).map((e) => e.textContent.trim().slice(0, 30)));
    assert(bad.length === 0, `${t}: text overflows: ${bad.join(" | ")}`);
    const overlap = await page.evaluate(() => {
      const st = document.querySelector(".pviewer .viewer-stage").getBoundingClientRect();
      const r = [...document.querySelectorAll(".pviewer .l3")].map((e) => e.getBoundingClientRect()).filter((b) => b.top >= st.top && b.bottom <= st.bottom && b.left >= st.left && b.right <= st.right);
      let n = 0; for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) { const a = r[i], c = r[j]; if (a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom) n++; } return n;
    });
    assert(overlap === 0, `${t}: ${overlap} 3D labels overlap`);
  }
  await ctx.close();
});

await test("דף שלא קיים מציג הודעה ברורה", async () => {
  const { page, ctx } = await newPage();
  await page.goto(BASE + "/#/nope");
  await page.getByRole("heading", { name: "הדף לא נמצא" }).waitFor();
  await page.goto(BASE + "/#/chapter/nope");
  await page.getByRole("heading", { name: "הדף לא נמצא" }).waitFor();
  await ctx.close();
});

await browser.close();
server.kill();
console.log(results.join("\n"));
console.log(failures ? `\n${failures} failed` : "\nall passed");
process.exit(failures ? 1 : 0);
