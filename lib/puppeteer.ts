import puppeteer, { type Browser, type PDFOptions } from "puppeteer";

let browserPromise: Promise<Browser> | null = null;

function chromeExecutablePath(): string | undefined {
  return (
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.CHROME_PATH ||
    "/usr/bin/google-chrome-stable"
  );
}

/**
 * Shared headless Chrome instance for PDF + screenshot rendering.
 */
export async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      executablePath: chromeExecutablePath(),
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--font-render-hinting=none",
      ],
    });
  }
  return browserPromise;
}

export async function renderPdfFromUrl(
  url: string,
  options: PDFOptions = {},
): Promise<Uint8Array> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60_000 });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", right: "14mm", bottom: "16mm", left: "14mm" },
      ...options,
    });
    return pdf;
  } finally {
    await page.close();
  }
}

export async function renderCarouselScreenshots(
  url: string,
  slideCount: number,
): Promise<Buffer[]> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  const shots: Buffer[] = [];

  try {
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60_000 });

    for (let i = 0; i < slideCount; i += 1) {
      await page.evaluate((index) => {
        const root = document.documentElement;
        root.dataset.activeSlide = String(index);
        window.dispatchEvent(
          new CustomEvent("lpe:set-slide", { detail: { index } }),
        );
      }, i);
      await new Promise((r) => setTimeout(r, 120));
      const buffer = await page.screenshot({ type: "png" });
      shots.push(Buffer.from(buffer));
    }
  } finally {
    await page.close();
  }

  return shots;
}

export async function closeBrowser(): Promise<void> {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
}
