import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const outDir = "/opt/cursor/artifacts";
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: outDir, size: { width: 1280, height: 800 } },
});
const page = await context.newPage();

await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "Still", exact: true }).waitFor();
await page.screenshot({ path: `${outDir}/still-hero.png`, fullPage: false });

await page.getByRole("button", { name: "Begin a Still" }).click();
await page.getByRole("heading", { name: "Claim the hour" }).waitFor();
await page.getByRole("button", { name: "15m" }).click();
await page.getByLabel("Intention").fill("Ship the product brief");
await page.screenshot({ path: `${outDir}/still-setup.png`, fullPage: false });

await page.getByRole("button", { name: "Enter Still mode" }).click();
await page.getByRole("timer").waitFor();
await page.getByText("Ship the product brief").waitFor();
await page.screenshot({ path: `${outDir}/still-session.png`, fullPage: false });

await page.getByRole("button", { name: "End early" }).click();
await page.getByRole("heading", { name: "Reclaimed" }).waitFor();
await page.getByLabel("Optional note").fill("Focused without notifications");
const another = page.getByRole("button", { name: "Another Still" });
await another.waitFor();
const anotherBox = await another.boundingBox();
if (!anotherBox || anotherBox.width < 40) {
  throw new Error("Another Still button missing or invisible");
}
await page.screenshot({ path: `${outDir}/still-done.png`, fullPage: false });

await page.getByRole("button", { name: "Done" }).click();
await page.getByRole("heading", { name: "Still", exact: true }).waitFor();

await page.getByRole("button", { name: "See this week" }).click();
await page.getByRole("heading", { name: "This week" }).waitFor();
await page.getByText("Ship the product brief").waitFor();
await page.getByText("Focused without notifications").waitFor();
await page.screenshot({ path: `${outDir}/still-history.png`, fullPage: false });

const video = page.video();
await context.close();
await browser.close();

if (video) {
  const videoPath = await video.path();
  console.log("VIDEO", videoPath);
}
console.log("SMOKE_OK");
