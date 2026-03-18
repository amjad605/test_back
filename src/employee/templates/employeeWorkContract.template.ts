import path from "path";
import { ICompany } from "../../companies/company.model";
import { IEmployee } from "../employee.model";

const fs = require("fs");

export function generateWorkContractHtml(
  employee: IEmployee,
  company: ICompany,
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

  const logoPath = path.join(__dirname, "../../images/logo.png");
  const logoBase64 = fs.readFileSync(logoPath).toString("base64");
  const logoDataUri = `data:image/png;base64,${logoBase64}`;

  const headerTemplate = `
<div style="width:100%; font-size:10px; direction:rtl; padding:10px 40px;">
  <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
    <div style="width:80px; height:80px; background:#333; border-radius:50%; overflow:hidden; display:flex; align-items:center; justify-content:center;">
      <img src="${logoDataUri}" alt="Company Logo" style="width:100%; height:100%; object-fit:cover;" />
    </div>
    <div style="text-align:center; flex:1; font-size: 16px;">
      <div style="font-size:16px; font-weight:bold;">Global Business Gate</div>
      <div style="border:1.5px solid #000; display:block; padding:2px 10px; margin: 0 24px; margin-top:5px; font-weight:bold;">
        عقد عمل / Work Contract
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
    <div style="display:flex; justify-content:space-between; margin-top:5px;">
      <span>تاريخ الطباعة ${printTime} ${printDate}</span>
      <span>
        صفحة <span class="pageNumber"></span> من <span class="totalPages"></span>
      </span>
    </div>
  </div>
</div>
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {

      background: #fff;
      padding: 0;
      font-size: 9px;
      color: #000;
      line-height: 1.2;
    }
    .page-container {
 
      page-break-after: always;
      min-height: 60vh;
    }
    .page-container:last-child {
      page-break-after: auto;
    }
    .columns-container {
      display: flex;
      width: 100%;
      border: 1.5px solid #000;
      min-height: 850px;
    }
    .column {
      width: 50%;
      padding: 15px;
      position: relative;
    }
    .column-en {
      border-right: 1.5px solid #000;
      text-align: left;
      direction: ltr;
    }
    .column-ar {
      text-align: right;
      direction: rtl;
    }
    .clause {
      margin-bottom: 12px;
      padding-bottom: 8px;
    }
    .clause-title {
      font-weight: bold;
      text-align: center;
      text-decoration: underline;
      margin-bottom: 5px;
    }
    .bold { font-weight: bold; }
    .underlined { text-decoration: underline; }
    .signature-container {
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 0 10px;
    }
    .signature-item {
      text-align: center;
      width: 45%;
    }
  </style>
</head>
<body>
  <!-- PAGE 1 -->
  <div class="page-container">
    <div class="columns-container">
      <!-- Page 1 English Column -->
      <div class="column column-en">
        <div style="margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
          <div style="font-size: 12px; font-weight: bold;">State of Kuwait<br>Public Authority for Manpower</div>
        </div>

        <div class="clause">
          On this day <span class="bold">${new Date().toLocaleDateString("en-US", { weekday: "long" })}</span> dated <span class="bold">${new Date().toLocaleDateString("en-US")}</span><br>
          This contract was edited between:<br>
          1- Company: <span class="bold">${company.name}</span> represented by:<br>
          Name: <span class="bold">${company.managerName || "—"}</span><br>
          Civil ID: <span class="bold">${company.licenseNumber || "—"}</span><br>
          <span class="bold">"First Party"</span>
        </div>

        <div class="clause">
          2- Name: <span class="bold">${employee.fullName}</span><br>
          Nationality: <span class="bold">${employee.nationality || "—"}</span><br>
          Civil ID: <span class="bold">${employee.civilId}</span><br>
          <span class="bold">"Second Party"</span>
        </div>

        <div class="clause">
          <div class="clause-title">Preamble</div>
          The First Party owns a facility in the name <span class="bold">${company.name}</span> working in the field of <span class="bold">${company.industry || "General Trading"}</span> and wishes to contract with the Second Party to work for him as <span class="bold">${employee.jobTitle}</span> and after both parties acknowledged their eligibility to conclude  this contract, the following was agreed upon:
        </div>

        <div class="clause">
          <div class="clause-title">Article One</div>
          The preamble above shall constitute an integral part of the present contract.
        </div>

        <div class="clause">
          <div class="clause-title">Article Two</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"Nature of Work"</div>
          The First Party has contracted with the Second Party to work for him as <span class="bold">${employee.jobTitle}</span> worker inside the State of Kuwait.
        </div>

        <div class="clause">
          <div class="clause-title"> Article Three</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"Probation Period"</div>
          The secound party is subject to a trail period of no more than 100 working days, and each party has the right to terminate the contract during this period without notice.
        </div>

        <div class="clause">
          <div class="clause-title"> Article Four</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"Salary"</div>
         For implementation of the contract, the Second Party shall receive a wage of <span class="bold">${employee.salary.basic} KWD</span> at the end of each month. The First Party may not reduce the wage during the validity of the contract, and the Second Party may not transfer to daily wage without his consent.
        </div>

        <div class="clause">
          <div class="clause-title"> Article Five</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"Entry into Force"</div>
          The contract becomes effective as of <span class="bold">${employee.hiringDate ? new Date(employee.hiringDate).toLocaleDateString("en-US") : "—"}</span> and the Second Party is obligated to carry out its work throughout the validity period.
        </div>

        <div class="clause">
          <div class="clause-title"> Article Six</div>
         <div style="text-align:center; font-weight:bold; text-decoration:underline;">Contract Duration</div>
         * This contract is for a fixed term, starting from 
           <span class="bold">
                ${
                  employee.hiringDate
                    ? new Date(employee.hiringDate).toLocaleDateString("en-GB")
                    : "—"
                }
                    </span> and for a period of 
                    <span class="bold">
                    ${
                      employee.contractType === "Limited"
                        ? "________ (years / months)"
                        : employee.contractType === "Unlimited"
                          ? "an Indefinite term"
                          : "the duration of the assigned project"
                    }
             </span>. The contract may be renewed with the consent of both parties for similar periods with a maximum of five Gregorian years. ___ / ___ / ___ * Considering the contract as having a definite or Indefinite term shall be subject to the will of the two parties.
      </div>
       
    </div>

      <!-- Page 1 Arabic Column -->
      <div class="column column-ar">
        <div style="margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
          <div style="font-size: 12px; font-weight: bold;">دولة الكويت<br>الهيئة العامة للقوى العاملة</div>
        </div>

        <div class="clause">
          انه في يوم <span class="bold">${new Date().toLocaleDateString("ar-KW", { weekday: "long" })}</span> الموافق <span class="bold">${new Date().toLocaleDateString("ar-KW")}</span><br>
          تحرر هذا العقد بين كل من:-<br>
          1- شركة / <span class="bold">${company.name}</span> ويمثلها في التوقيع على العقد:<br>
          الاسم: <span class="bold">${company.managerName || "—"}</span><br>
          رقم مدني: <span class="bold">${company.licenseNumber || "—"}</span><br>
          <span class="bold">"طرف أول"</span>
        </div>

        <div class="clause">
          2- الاسم: <span class="bold">${employee.fullName}</span><br>
          الجنسية: <span class="bold">${employee.nationality || "—"}</span><br>
          رقم مدني: <span class="bold">${employee.civilId}</span><br>
          <span class="bold">"طرف ثان"</span>
        </div>

        <div class="clause">
          <div class="clause-title">تمهيد</div>
          يمتلك الطرف الأول منشأة باسم شركة <span class="bold">${company.name}</span> وتعمل في مجال <span class="bold">${company.industry || "التجارة العامة"}</span> ويرغب في التعاقد مع الطرف الثاني للعمل لديه بمهنة <span class="bold">${employee.jobTitle}</span> وبعد أن أقر الطرفان بأهليتهما في إبرام هذا العقد تم الاتفاق على ما يلي:
        </div>

        <div class="clause">
          <div class="clause-title">البند الأول</div>
          يعتبر التمهيد السابق جزء لا يتجزأ من هذا العقد.
        </div>

        <div class="clause">
          <div class="clause-title">البند الثاني</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"طبيعة العمل"</div>
          تعاقد الطرف الأول مع الطرف الثاني للعمل لديه بمهنة <span class="bold">${employee.jobTitle}</span> داخل دولة الكويت.
        </div>

        <div class="clause">
          <div class="clause-title">البند الثالث</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"فترة التجربة"</div>
          يخضع الطرف الثاني لفترة تجربة لمدة لا تزيد عن 100 يوم عمل، ويحق لكل منهما إنهاء العقد خلال تلك الفترة دون إخطار.
        </div>

        <div class="clause">
          <div class="clause-title">البند الرابع</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"قيمة الأجر"</div>
          يتقاضى الطرف الثاني عن تنفيذ هذا العقد أجراً مقداره <span class="bold">${employee.salary.basic} دينار</span> كويتي في نهاية كل شهر، ولا يجوز للطرف الأول تخفيض الأجر أثناء سريان العقد، ولا يجوز نقل الطرف الثاني إلى الأجر اليومي دون موافقته.
        </div>

        <div class="clause">
          <div class="clause-title">البند الخامس</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"نفاذ العقد"</div>
          يبدأ نفاذ العقد اعتباراً من <span class="bold">${employee.hiringDate ? new Date(employee.hiringDate).toLocaleDateString("ar-KW") : "—"}</span> ويلتزم الطرف الثاني بالقيام بأداء عمله طوال مدة نفاذه.
        </div>

        <div class="clause">
          <div class="clause-title">البند السادس</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"مدة العقد"</div>
          * هذا العقد يكون لمدة محددة، تبدأ من 
            <span class="bold">
                 ${
                   employee.hiringDate
                     ? new Date(employee.hiringDate).toLocaleDateString("en-GB")
                     : "—"
                 }
            </span> و لمدة 
            <span class="bold">
            ${
              employee.contractType === "Limited"
                ? "________ (years / months)"
                : employee.contractType === "Unlimited"
                  ? "an Indefinite term"
                  : "the duration of the assigned project"
            }
             </span>. يمكن تجديد العقد مع موافقة كلا الطرفين لمدة مماثلة مع حد أقصى من خمس سنوات. ___ / ___ / ___ * يعتبر العقد بأنه ينطوي على مدة محددة أو مدة غير محددة يعتمد على رغبة كلا الطرفين.
        </div>
       
      </div>
    </div>
  </div>

  <!-- PAGE 2 -->
  <div class="page-container">
    <div class="columns-container">
      <!-- Page 2 English Column -->
      <div class="column column-en">
        
 <div class="clause">
          <div class="clause-title">Article Seven</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"Annual Leave"</div>
          The second party shall have the right to a paid annual leave with a term of <span class="bold">30</span> days. It shall not be due on the first year save after the expiration of nine months to be calculated from the date of the contract coming into force.
        </div>
        <div class="clause">
          <div class="clause-title">Article Eight</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"Number of Work Hours"</div>
          The first party may not require that the second party work for a term exceeding eight daily work hours with rest periods not less than one hour, except for the cases set forth in the law.
        </div>

        <div class="clause">
          <div class="clause-title">Article Nine</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"Ticket Value"</div>
          The first party shall bear the expenses of the return of the second party to his country after the expiration of the work relationship and his final departure from the country.
        </div>

        <div class="clause">
          <div class="clause-title">Article Ten</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"Insurance against Injuries and work Maladies"</div>
          The first party shall insure the second party against injuries and work maladies. It shall also commit to the health insurance value in accordance with the law No. (1) of the year 1999.
        </div>

        <div class="clause">
          <div class="clause-title">Article Eleven</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"End of Service Benefit"</div>
          The second party shall be due the end of service benefit as set forth in the regulating laws.
        </div>

        <div class="clause">
          <div class="clause-title">Article Twelve</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"Applicable Law"</div>
          The provision of the Labour code in the civil sector No. 6 of 2010 and the decisions executing the same shall apply for all matters not provided for in the present contract. Shall be considered null every condition agreed upon in violation of the provisions of the law, unless the same has a better benefit for the worker.
        </div>

        <div class="clause">
          <div class="clause-title">Article Thirteen</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"Special Conditions"</div>
          1. There are no conditions<br>
          2. There are no conditions<br>
          3. There are no conditions
        </div>

        <div class="clause">
          <div class="clause-title">Article Fourteen</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"Specialized Court"</div>
          The court of the instance and its Labour departments, in accordance with the provisions of the law No. 46 of the year 1987, shall be competent to peruse any conflicts resulting from the execution or interpretation of the present contract.
        </div>

        <div class="clause">
          <div class="clause-title">Article Fifteen</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"Contract Language"</div>
          The present contract was made in Arabic and English. The Arabic texts shall prevail in the case of any conflict between them.
        </div>

        <div class="clause">
          <div class="clause-title">Article Sixteen</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"Contract Copies"</div>
          The present contract was made in three copies, one for each party to work in accordance therewith. The third copy shall be deposited at the Public Authority for Manpower.
        </div>

        <div class="signature-container">
          <div class="signature-item">
            <div class="bold">Second Party الطرف الثاني</div>
            <br><br>................................
          </div>
          <div class="signature-item">
            <div class="bold">First Party الطرف الأول</div>
            <br><br>................................
          </div>
        </div>
      </div>

      <!-- Page 2 Arabic Column -->
      <div class="column column-ar">
        
 <div class="clause">
          <div class="clause-title">البند السابع</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"الإجازة السنوية"</div>
          للطرف الثاني الحق في إجازة سنوية مدفوعة الأجر مدتها <span class="bold">30</span> يوم ، ولا يستحقها عن السنة الأولى إلا بعد انقضاء مدة تسعة أشهر تحسب من تاريخ نفاذ العقد.
        </div>
        <div class="clause">
          <div class="clause-title">البند الثامن</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"عدد ساعات العمل"</div>
          لا يجوز للطرف الأول تشغيل الطرف الثاني لمدة لا تزيد عن ثماني ساعات عمل يومياً تتخللها فترة راحة لا تقل عن ساعة باستثناء الحالات المقررة قانوناً.
        </div>

        <div class="clause">
          <div class="clause-title">البند التاسع</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"قيمة تذكرة السفر"</div>
          يتحمل الطرف الأول مصاريف عودة الطرف الثاني إلى بلدة عند انتهاء علاقة العمل ومغادرته نهائيا البلاد.
        </div>

        <div class="clause">
          <div class="clause-title">البند العاشر</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"التأمين ضد الإصابات وأمراض العمل"</div>
          يلتزم الطرف الأول بالتأمين على الطرف الثاني ضد إصابات وأمراض العمل ، كما يلتزم بقيمة التأمين الصحي طبقاً للقانون رقم (1) لسنة 1999.
        </div>

        <div class="clause">
          <div class="clause-title">البند الحادي عشر</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"مكافأة نهاية الخدمة"</div>
          يستحق الطرف الثاني مكافأة نهاية الخدمة المنصوص عليها بالقوانين المنظمة.
        </div>

        <div class="clause">
          <div class="clause-title">البند الثاني عشر</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"القانون الواجب للتطبيق"</div>
          تسري أحكام قانون العمل في القطاع الأهلي رقم 6 لسنة 2010 والقرارات المنفذة له فيما لم يرد بشأنه نص في هذا العقد ، ويقع باطلاً كل شرط تم الاتفاق عليه بالمخالفة لأحكام القانون ، وما لم يكن فيه ميزة أفضل للعامل.
        </div>

        <div class="clause">
          <div class="clause-title">البند الثالث عشر</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"شروط خاصة"</div>
          1- لا يوجد شروط<br>
          2- لا يوجد شروط<br>
          3- لا يوجد شروط
        </div>

        <div class="clause">
          <div class="clause-title">البند الرابع عشر</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"المحكمة المختصة"</div>
          تختص المحكمة الكلية ودوائرها العمالية طبقاً لأحكام القانون رقم 46 لسنة 1987 ، بنظر كافة المنازعات الناشئة عن تطبيق أو تفسير هذا العقد.
        </div>

        <div class="clause">
          <div class="clause-title">البند الخامس عشر</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"لغة العقد"</div>
          حرر هذا العقد باللغتين العربية والانجليزية ، ويعتد بنصوص اللغة العربية عند وقوع أي تعارض بينهما.
        </div>

        <div class="clause">
          <div class="clause-title">البند السادس عشر</div>
          <div style="text-align:center; font-weight:bold; text-decoration:underline;">"نسخ العقد"</div>
          حرر هذا العقد من ثلاث نسخ بيد كل طرف نسخة للعمل بموجبها والثالثة تودع لدى الهيئة العامة للقوى العاملة.
        </div>

        <div class="signature-container">
          <div class="signature-item">
            <div class="bold">Second Party الطرف الثاني</div>
            <br><br>................................
          </div>
          <div class="signature-item">
            <div class="bold">First Party الطرف الأول</div>
            <br><br>................................
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

  return [html, headerTemplate, footerTemplate];
}
