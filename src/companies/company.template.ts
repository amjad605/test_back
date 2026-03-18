import { ICompany } from "./company.model";
import { IEmployee } from "../employee/employee.model";
import path from "path";
const fs = require("fs");

// Read the image and convert to base64

export function generateCompanyPdfHtml(
  company: ICompany,
  employees: IEmployee[],
): string[] {
  const printDate = new Date().toLocaleDateString("ar-KW", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const printTime = new Date().toLocaleTimeString("ar-KW", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const employeeRows = employees
    .map(
      (emp, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${emp.civilId}</td>
        <td style="text-align: right;">${emp.fullName}</td>
        <td>${emp.nationality || "—"}</td>
        <td>${emp.status === "Active" ? "عماله وطنية" : "عماله وافدة"}</td>
        <td>${emp.jobTitle || "—"}</td>
        <td>${emp.hiringDate ? new Date(emp.hiringDate).toLocaleDateString("ar-KW") : "—"}</td>
        <td>—</td> <td>${emp.salary?.basic || 0}</td>
      </tr>
    `,
    )
    .join("");
  const logoPath = path.join(__dirname, "../images/logo.png");
  const logoBase64 = fs.readFileSync(logoPath).toString("base64");
  const logoDataUri = `data:image/png;base64,${logoBase64}`;
  const headerTemplate = `
<div style="width:100%; font-size:10px; direction:rtl; padding:10px 40px;">
  
  <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
    
<div style="width:80px; height:80px; background:#333; border-radius:50%; overflow:hidden; display:flex; align-items:center; justify-content:center;">
  <img 
    src="${logoDataUri}" 
    alt="Company Logo" 
    style="width:100%; height:100%; object-fit:cover;"
  />
</div>

    <div style="text-align:center; flex:1; font-size: 16px;">
      <div style="font-size:16px; font-weight:bold;">Global Business Gate</div>
      <div style="border:1.5px solid #000; display:block; padding:2px 10px; margin: 0 24px; margin-top:5px; font-weight:bold;">
        كشف العمالة
      </div>
    </div>

    <div style="width:70px; height:70px; border:1px solid #ccc; display:flex; align-items:center; justify-content:center; font-size:8px;">
      QR
    </div>

  </div>

  

</div>
`;

  const footerTemplate = `
<div style="width:100%; font-size:9px; direction:rtl; padding:0 20px;">
  
  <div style="border-top:1px solid #000; padding-top:6px;">
    <div>
      هذا المستخرج من النظام الآلي للهيئة العامة للقوى العاملة وليس بحاجة لختم أو توقيع .
    </div>

    <div>
      للتحقق من صحة بيان المستخرج يمكنك مسح رمز التشفير - QR Code مدة صلاحية المستخرج 90 يوما من تاريخ الإصدار
    </div>

    <div style="display:flex; justify-content:space-between; margin-top:5px;">
      <span>تاريخ الطباعة ${printTime} ${printDate}</span>
      <span>رمز المستخدم: U021142948</span>
      <span>
        صفحة <span class="pageNumber"></span> من <span class="totalPages"></span>
      </span>
    </div>
  </div>

</div>
`;
  const html = `
  <!DOCTYPE html>
  <html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <style>
     
      
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Noto Kufi Arabic', sans-serif;
        background: #fff;
        padding: 40px 20px;
        font-size: 11px;
        color: #000;
      }
        #watermark {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        opacity: 0.1; /* Keep it light so text is readable */
        z-index: -1;   /* Place it behind your content */
        width: 500px; /* Adjust size as needed */
        pointer-events: none;
      }
thead {
  display: table-header-group;
}
      /* Page Header Layout */
      .header-container {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 30px;

      }
      .header-side { width: 100px; }
      .header-center { text-align: center; flex: 1; }
      
      .qr-placeholder { width: 70px; height: 70px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; font-size: 8px; }
      .logo-placeholder { width: 80px; height: 80px; background: #eee; border-radius: 50%; margin-right: auto; }

      .main-title-box {
        border: 1.5px solid #000;
        display: block;
        padding: 2px 10px;
        margin-top: 10px;
        margin: 0 24px;
        font-weight: bold;
        font-size: 16px;
      }

      /* Top Details Row */
      .request-meta {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
        font-size: 12px;
      }

      /* The Fieldset Style */
      .content-section {
        position: relative;
        border: 1px solid #000;
        margin-bottom: 25px;
        padding: 20px 15px 15px 15px;
      }
      .section-legend {
        position: absolute;
        top: -12px;
        right: 15px;
        background: #fff;
        border: 1px solid #000;
        padding: 2px 10px;
        font-weight: bold;
        font-size: 11px;
      }
.license-container {
    direction: rtl;
    font-family: Arial, sans-serif;
    padding: 20px;
    color: #000;
  }

  .title {
    text-align: right;
    font-weight: bold;
    font-size: 18px;
    text-decoration: underline;
    margin-bottom: 25px;
  }
      /* Grid Layout */
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 12px;
      }
        .full-width {
    grid-column: span 3;
    margin-top: 10px;
  }
      .info-item { display: flex; align-items: baseline; }
      .label { font-weight: bold; margin-left: 5px; white-space: nowrap; }
      .value { flex: 1; }

      /* Official Table Style */
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }
      th {
        background: #ccccccff;
        color: #000;
        border: 1px solid #000;
        padding: 6px 2px;
        font-size: 10px;
      }
      td {
        border: 1px solid #000;
        padding: 5px 2px;
        text-align: center;
        font-size: 10px;
      }

      .footer-section {
        margin-top: 30px;
        font-size: 10px;
        border-top: 1px solid #000;
        padding-top: 10px;
      }
      .print-bar {
        display: flex;
        justify-content: space-between;
        margin-top: 5px;
      }
    </style>
  </head>
  <body>

  
    <div id="watermark">
      <img src="${logoDataUri}" alt="Watermark" style="width:100%; height:100%; object-fit:cover;" />
    </div>
    <div class="request-meta">
      <div><span class="label">رقم الطلب :</span> 17603353</div>
      <div><span class="label"">نوع الكشف : كامل الملف مع العقود</span></div>
    </div>

    <div class="content-section">
      <div class="section-legend">تفاصيل الملف</div>
      <div class="info-grid">
        <div class="info-item"><span class="label">رقم الملف :</span><span class="value">100168727</span></div>
        <div class="info-item"><span class="label">اسم الملف :</span><span class="value">${company.name}</span></div>
        <div class="info-item"><span class="label">اجمالي عدد العمال :</span><span class="value">${employees.length}</span></div>
        
        <div class="info-item"><span class="label">حالة الملف :</span><span class="value">فعال</span></div>
        <div class="info-item"><span class="label">تصنيف الملف :</span><span class="value">مستثمر اجنبي</span></div>
        <div class="info-item"><span class="label">اجمالي عدد التراخيص :</span><span class="value">1</span></div>
        
        <div class="info-item"><span class="label">تاريخ انشاء الملف :</span><span class="value">06/10/2020</span></div>
        <div class="info-item"><span class="label">ادارة الملف :</span><span class="value">محافظة مبارك الكبير</span></div>
        <div class="info-item"><span class="label">اجمالي العقود الحكومية :</span><span class="value">0</span></div>
      </div>
    </div>

   <div class="license-container">
  <p class="title">قائمة التراخيص</p>
  
  <div class="info-grid">
    <div class="info-item">
      <span class="label">الرقم المدني للترخيص :</span>
      <span class="value">4743199</span>
    </div>
    <div class="info-item">
      <span class="label">ترخيص رئيسي :</span>
      <span class="value">نعم</span>
    </div>
    <div class="info-item">
      <span class="label">اجمالي عدد العمالة :</span>
      <span class="value">27</span>
    </div>

    <div class="info-item">
      <span class="label">اسم الترخيص :</span>
      <span class="value">شركة نوفارتس كويت لترويج المنتجات</span>
    </div>
    <div class="info-item">
      <span class="label">حالة الترخيص :</span>
      <span class="value">فعال</span>
    </div>
    <div class="info-item">
      <span class="label">رقم الترخيص حسب جهة الاصدار :</span>
      <span class="value">2020/7017</span>
    </div>

    <div class="info-item">
      <span class="label">جهة اصدار الترخيص :</span>
      <span class="value">وزارة التجارة والصناعة</span>
    </div>
    <div class="info-item">
      <span class="label">تاريخ الإصدار :</span>
      <span class="value">24/06/2020</span>
    </div>
    <div class="info-item">
      <span class="label">تاريخ الإنتهاء :</span>
      <span class="value">23/06/2024</span>
    </div>

    <div class="info-item full-width">
      <span class="label">العنوان :</span>
      <span class="value">المحافظة : محافظة حولي - المنطقة : السالميه - القطعة : 002 - القسيمة : 007121 - الشارع : - المالك : شركة جزيرة وربه العقاريه - رقم الوحدة : 6</span>
    </div>
  </div>
</div>

    <table>
      <thead>
        <tr>
          <th style="width: 30px;">م</th>
          <th>الرقم المدني للعامل</th>
          <th style="width: 200px;">اسم العامل</th>
          <th>الجنسية</th>
          <th>النوع</th>
          <th>الوظيفة</th>
          <th>تاريخ التعيين</th>
          <th>تاريخ نهاية أذن العمل</th>
          <th>الراتب</th>
        </tr>
      </thead>
      <tbody>
        ${employeeRows}
        
  
      </tbody>
    </table>

    

  </body>
  </html>
  `;
  return [html, headerTemplate, footerTemplate];
}
