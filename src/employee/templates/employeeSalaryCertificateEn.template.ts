import path from "path";
import fs from "fs";
import { ICompany } from "../../companies/company.model";
import { IEmployee } from "../employee.model";

export function generateSalaryCertificateEnHtml(
  employee: IEmployee,
  company: ICompany,
): string[] {
  const printDate = new Date().toLocaleDateString("en-GB", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  const logoPath = path.join(__dirname, "../../images/logo.png");
  const logoBase64 = fs.readFileSync(logoPath).toString("base64");
  const logoDataUri = `data:image/png;base64,${logoBase64}`;

  // Embed Cairo font as base64 to ensure text renders consistently on any server
  const cairoFontPath = path.join(__dirname, "../../fonts/Cairo-Regular.ttf");
  const cairoFontBase64 = fs.readFileSync(cairoFontPath).toString("base64");

  const headerTemplate = `
<style>
  @font-face {
    font-family: 'Cairo';
    src: url(data:font/truetype;base64,${cairoFontBase64}) format('truetype');
    font-weight: 100 900;
    font-style: normal;
  }
</style>
<div style="width:100%; font-size:10px; padding:10px 40px; font-family: 'Cairo', 'Arial', sans-serif;">
  <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
    <div style="width:80px; height:80px; background:#333; border-radius:50%; overflow:hidden; display:flex; align-items:center; justify-content:center;">
      <img src="${logoDataUri}" alt="Company Logo" style="width:100%; height:100%; object-fit:cover;" />
    </div>
    <div style="text-align:right; flex:1; font-size: 10px; margin-right: 20px; font-family: 'Cairo', 'Arial', sans-serif;">
       Kuwait, ${printDate}
    </div>
  </div>
</div>
`;

  const footerTemplate = `
<div style="width:100%; height: 40px; background: #333; margin-top: 20px; font-family: 'Cairo', 'Arial', sans-serif;"></div>
`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    @font-face {
      font-family: 'Cairo';
      src: url(data:font/truetype;base64,${cairoFontBase64}) format('truetype');
      font-weight: 100 900;
      font-style: normal;
    }
    body {
      font-family: 'Cairo', 'Arial', sans-serif;
      padding: 60px;
      line-height: 1.8;
      color: #333;
    }
    .title {
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      text-decoration: underline;
      margin-bottom: 50px;
      margin-top: 20px;
    }
    .content {
      font-size: 16px;
      text-align: justify;
    }
    .bold { font-weight: bold; }
    .signature-section {
      margin-top: 100px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      padding-right: 10%;
    }
    .signature-label {
      font-weight: bold;
      font-size: 18px;
    }
  </style>
</head>
<body>
  <div class="title">Salary Certificate</div>
  <div class="content">
    We, <span class="bold">${company.name}</span>, certify that Mr. <span class="bold">${employee.fullName}</span> - <span class="bold">${employee.nationality || "—"}</span> nationality - holding Civil ID number <span class="bold">(${employee.civilId})</span>, Passport Number <span class="bold">(—)</span>, has been employed with us as an <span class="bold">${employee.jobTitle}</span> since <span class="bold">${employee.hiringDate ? new Date(employee.hiringDate).toLocaleDateString("en-GB") : "—"}</span>. He receives a monthly salary of <span class="bold">${employee.salary.basic} KD</span> only.
    <br><br>
    This certificate is issued to him upon his request to be presented to whom it may concern, without any liability on the company.
  </div>

  <div class="signature-section">
    <div class="signature-label">Authorized Signature:</div>
    <div style="height: 60px;"></div>
  </div>
</body>
</html>
`;

  return [html, headerTemplate, footerTemplate];
}
