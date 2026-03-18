import path from "path";
import { ICompany } from "../../companies/company.model";
import { IEmployee } from "../employee.model";

const fs = require("fs");

export function generateTerminationLetterHtml(
  employee: IEmployee,
  company: ICompany,
): string[] {
  const printDate = new Date().toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  const logoPath = path.join(__dirname, "../../images/logo.png");
  const logoBase64 = fs.readFileSync(logoPath).toString("base64");
  const logoDataUri = `data:image/png;base64,${logoBase64}`;

  const headerTemplate = `
<div style="width:100%; font-size:10px; padding:10px 40px;">
  <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
    <div style="width:80px; height:80px; background:#333; border-radius:50%; overflow:hidden; display:flex; align-items:center; justify-content:center;">
      <img src="${logoDataUri}" alt="Company Logo" style="width:100%; height:100%; object-fit:cover;" />
    </div>
    <div style="text-align:left; flex:1; font-size: 10px; margin-left: 20px;">
       Date: ${printDate}
    </div>
  </div>
</div>
`;

  const footerTemplate = `
<div style="width:100%; height: 40px; margin-top: 20px;"></div>
`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: 'Arial', sans-serif;
      padding: 40px 60px;
      line-height: 1.6;
      color: #333;
      font-size: 14px;
    }
    .bilingual-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .field-label {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .en-side { width: 55%; text-align: left; direction: ltr; }
    .ar-side { width: 40%; text-align: right; direction: rtl; font-family: 'Arial', sans-serif; }
    .subject {
      margin-top: 40px;
      margin-bottom: 20px;
      font-weight: bold;
      text-decoration: underline;
    }
    .body-text {
      margin-bottom: 40px;
    }
    .bold { font-weight: bold; }
    .footer-company {
      margin-top: 80px;
      text-align: center;
      font-weight: bold;
    }
    .signature-line {
      margin-top: 40px;
      border-top: 1px dashed #333;
      width: 300px;
      margin-left: auto;
      margin-right: auto;
    }
  </style>
</head>
<body>
  <div class="bilingual-row" style="margin-top: 20px;">
    <div class="en-side">
      <div class="field-label">Name: <span class="bold">${employee.fullName}</span></div>
      <div class="field-label">Position: <span class="bold">${employee.jobTitle}</span></div>
    </div>
    <div class="ar-side">
      <div class="field-label">الاسم: <span class="bold">${employee.fullName}</span></div>
      <div class="field-label">الوظيفة: <span class="bold">${employee.jobTitle}</span></div>
    </div>
  </div>

  <div class="bilingual-row subject" style="font-size: 16px;">
    <div class="en-side">SUBJECT: TERMINATION:</div>
    <div class="ar-side">الموضوع: إنهاء خدمات:</div>
  </div>

  <div class="bilingual-row body-text">
    <div class="en-side">
      With reference to the above, we regret to inform you that the management has decided to terminate your employment with <span class="bold">${company.name}</span>.
      <br><br>
      You are relieved from your services as of <span class="bold">${printDate}</span> and your last working day will be <span class="bold">${printDate}</span>.
      <br><br>
      You are requested to contact HR & Administration Department for your final settlement and clearances (the clearance form should be submitted). Please arrange to hand over all items and assets provided to you by the company.
      <br><br>
      Please acknowledge this letter as a token of your understanding.
    </div>
    <div class="ar-side">
      بالإشارة الى الموضوع المذكور أعلاه ومع كامل تقديرنا لجهودك يؤسفنا إبلاغك بأن إدارة الشركة قد قررت إنهاء خدماتك في شركة <span class="bold">${company.name}</span>.
      <br><br>
      سوف يتم إعفاؤك من خدماتك إعتباراً من تاريخ <span class="bold">${new Date().toLocaleDateString("ar-KW")}</span>، على أن يكون آخر يوم عمل لك هو <span class="bold">${new Date().toLocaleDateString("ar-KW")}</span>.
      <br><br>
      يرجى التكرم بمراجعة قسم الموارد البشرية وشؤون الموظفين لاستلام كافة مستحقاتك، مع تسليم نموذج إخلاء الطرف. ويرجى تسليم جميع المستندات والأصول الخاصة بالشركة إلى الإدارة.
      <br><br>
      يرجى التوقيع بما يفيد إطلاعكم بما جاء في هذا الكتاب.
    </div>
  </div>

  <div class="footer-company">
    شركة <span class="bold">${company.name}</span>
  </div>

  <div class="signature-line"></div>
</body>
</html>
`;

  return [html, headerTemplate, footerTemplate];
}
