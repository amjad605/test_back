import path from "path";
import fs from "fs";
import { ICompany } from "../../companies/company.model";
import { IEmployee } from "../employee.model";

export function generateSalaryCertificateArHtml(
  employee: IEmployee,
  company: ICompany,
): string[] {
  const printDate = new Date().toLocaleDateString("ar-KW", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  const logoPath = path.join(__dirname, "../../images/logo.png");
  const logoBase64 = fs.readFileSync(logoPath).toString("base64");
  const logoDataUri = `data:image/png;base64,${logoBase64}`;

  // Embed Cairo font as base64 to ensure Arabic text renders on any server
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
<div style="width:100%; font-size:10px; direction:rtl; padding:10px 40px; font-family: 'Cairo', 'Arial', sans-serif;">
  <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
    <div style="width:80px; height:80px; background:#333; border-radius:50%; overflow:hidden; display:flex; align-items:center; justify-content:center;">
      <img src="${logoDataUri}" alt="Company Logo" style="width:100%; height:100%; object-fit:cover;" />
    </div>
    <div style="text-align:left; flex:1; font-size: 10px; direction: ltr; margin-left: 20px; font-family: 'Cairo', 'Arial', sans-serif;">
       الكويت, ${printDate}
    </div>
  </div>
</div>
`;

  const footerTemplate = `
<div style="width:100%; height: 40px; background: #333; margin-top: 20px; font-family: 'Cairo', 'Arial', sans-serif;">
</div>
`;

  const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
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
      padding-left: 10%;
    }
    .signature-label {
      font-weight: bold;
      font-size: 18px;
    }
  </style>
</head>
<body>
  <div class="title">شهادة راتب</div>
  <div class="content">
    تشهد شركة <span class="bold">${company.name}</span> بأن السيد / <span class="bold">${employee.fullName}</span> - <span class="bold">${employee.nationality || "—"}</span> الجنسية - ويحمل بطاقة مدنية رقم <span class="bold">(${employee.civilId})</span> و جواز سفر رقم <span class="bold">(—)</span> ، ويعمل لدينا بوظيفة <span class="bold">${employee.jobTitle}</span> ، منذ تاريخ <span class="bold">${employee.hiringDate ? new Date(employee.hiringDate).toLocaleDateString("ar-KW") : "—"}</span> حتى تاريخه ويتقاضى راتب شهري وقدره <span class="bold">(${employee.salary.basic} د.ك)</span> فقط لاغير .
    <br><br>
    وقد أعطيت له هذه الشهادة بناء على طلبه لتقديمها لمن يهمه الأمر . دون أدنى مسئولية على الشركة .
  </div>

  <div class="signature-section">
    <div class="signature-label">المفوض بالتوقيع</div>
    <div style="height: 60px;"></div>
  </div>
</body>
</html>
`;

  return [html, headerTemplate, footerTemplate];
}
