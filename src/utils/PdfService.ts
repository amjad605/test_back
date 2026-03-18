import puppeteer, { PDFOptions } from "puppeteer";

export interface PdfMargins {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export interface GeneratePdfOptions {
  html: string;
  headerTemplate?: string;
  footerTemplate?: string;
  format?: "A4" | "A3" | "Letter" | "Legal";
  landscape?: boolean;
  printBackground?: boolean;
  displayHeaderFooter?: boolean;
  margin?: PdfMargins;
}

const DEFAULT_MARGINS: PdfMargins = {
  top: "140px",
  right: "20px",
  bottom: "120px",
  left: "20px",
};

class PdfService {
  async generatePdf(options: GeneratePdfOptions): Promise<Buffer> {
    const {
      html,
      headerTemplate = "",
      footerTemplate = "",
      format = "A4",
      landscape = false,
      printBackground = true,
      displayHeaderFooter = true,
      margin = DEFAULT_MARGINS,
    } = options;

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();

      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdfOptions: PDFOptions = {
        format,
        landscape,
        printBackground,
        displayHeaderFooter,
        headerTemplate,
        footerTemplate,
        margin,
      };

      const pdfBuffer = await page.pdf(pdfOptions);

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}

export default new PdfService();
