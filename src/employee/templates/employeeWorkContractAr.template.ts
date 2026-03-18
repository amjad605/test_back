import path from "path";
import fs from "fs";
import { ICompany } from "../../companies/company.model";
import { IEmployee } from "../employee.model";

export function generateWorkContractArHtml(
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

  // Embed Amiri fonts as base64 to ensure Arabic text renders on any server
  const amiriRegularPath = path.join(__dirname, "../../fonts/Amiri-Regular.ttf");
  const amiriBoldPath = path.join(__dirname, "../../fonts/Amiri-Bold.ttf");
  const amiriRegularBase64 = fs.readFileSync(amiriRegularPath).toString("base64");
  const amiriBoldBase64 = fs.readFileSync(amiriBoldPath).toString("base64");

  const headerTemplate = `
<div style="width:100%; font-size:10px; direction:rtl; padding:10px 40px;">
  <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
    <div style="width:80px; height:80px; background:#333; border-radius:50%; overflow:hidden; display:flex; align-items:center; justify-content:center;">
      <img src="${logoDataUri}" alt="Company Logo" style="width:100%; height:100%; object-fit:cover;" />
    </div>
    <div style="text-align:center; flex:1; font-size: 16px;">
      <div style="font-size:16px; font-weight:bold;">Global Business Gate</div>
      <div style="border:1.5px solid #000; display:block; padding:2px 10px; margin: 0 24px; margin-top:5px; font-weight:bold;">
        عقد عمل 
      </div>
    </div>
    <div style="width:70px; height:70px; border:1px solid #ccc; display:flex; align-items:center; justify-content:center; font-size:8px;">
      QR
    </div>
  </div>
</div>
`;

  const footerTemplate = `
<div style="width:100%; font-size:9px; direction:rtl; padding:0 40px;">
  <div style="border-top:1px solid #000; padding-top:6px; display:flex; justify-content:space-between; align-items: center;">
    <div style="flex: 1; text-align: right; color: #555;">
      ملاحظة / هذا النموذج يعد نموذجاً إرشادياً لشروط و أحكام عقد العمل في القطاع الأهلي ، ويحق لكل شركة إعداد نموذج مماثلاً له على المطبوعات الخاصة بها شرط ان يتضمن كافة الأحكام والشروط الواردة بهذا النموذج .
    </div>
    <div style="margin-left: 20px;">
      <span class="pageNumber"></span>
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
    @font-face {
      font-family: 'Amiri';
      src: url(data:font/truetype;base64,${amiriRegularBase64}) format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    @font-face {
      font-family: 'Amiri';
      src: url(data:font/truetype;base64,${amiriBoldBase64}) format('truetype');
      font-weight: bold;
      font-style: normal;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Amiri', 'Arial', sans-serif;
      background: #fff;
      padding: 0;
      font-size: 12px;
      color: #000;
      line-height: 1.2;
    }
    .page-container {
      padding: 0 40px 40px 40px;
    }
    .contract-border {
      border: 1.2px solid #000;
      padding: 15px;
      min-height: 800px;
      position: relative;
    }
    .title-box {
      background: #444;
      color: #fff;
      text-align: center;
      padding: 5px 10px;
      margin: 0 auto 15px auto;
      width: fit-content;
      font-weight: bold;
      font-size: 12px;
    }
    .section-header {
      margin-bottom: 15px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .right-info {
      text-align: right;
      font-weight: bold;
    }
    .clause {
      margin-top: 12px;
      text-align: right;
    }
    .clause-title {
      font-weight: bold;
      text-align: center;
      margin-bottom: 3px;
      text-decoration: underline;
    }
    .shaded {
      
      padding: 0 4px;
      display: inline-block;
      font-weight: bold;
    }
    .bold { font-weight: bold; }
    .underlined { text-decoration: underline; }
    .signature-row {
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
      padding: 0 20px;
    }
    .signature-col {
      text-align: center;
      width: 45%;
    }
    .page-break {
      page-break-after: always;
    }
    .footer-note {
      font-size: 9px;
      margin-top: 15px;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="contract-border">
      <div class="title-box">
        نموذج عقد عمل استرشادي<br>
      </div>

      <div class="section-header">
        <div class="right-info" style="font-size: 11px;">
          دولة الكويت<br>
          الهيئة العامة للقوى العاملة / إدارة عمل حولي<br>
          انه في يوم <span class="shaded">${new Date().toLocaleDateString("ar-KW", { weekday: "long" })}</span> الموافق : <span class="shaded">${new Date().toLocaleDateString("ar-KW")}</span><br>
          تحرر هذا العقد بين كل من:-
        </div>
      </div>

      <div class="clause">
        1- شركة : <span class="shaded">${company.name}</span><br>
        ويمثلها في التوقيع على العقد:<br>
        الاسم : <span class="shaded">${company.managerName || "—"}</span><br>
        رقم مدني : <span class="shaded">${company.licenseNumber || "—"}</span><br>
        <span class="bold">"طرف أول"</span>
      </div>

      <div class="clause">
        2- الاسم : <span class="shaded">${employee.fullName}</span><br>
        الجنسية : <span class="shaded">${employee.nationality || "—"}</span><br>
        رقم مدني : <span class="shaded">${employee.civilId}</span><br>
        الإقامة : <span class="shaded">كويت</span><br>
        <span class="bold">"طرف ثان"</span>
      </div>

      <div class="clause" style="text-align: center; margin-top: 15px;">
        <span class="underlined bold">تمهيد</span>
      </div>
      <div class="clause">
        يمتلك الطرف الأول منشأة باسم شركة <span class="shaded">${company.name}</span> وتعمل في مجال <span class="shaded">${company.industry || "التجارة العامة"}</span> ويرغب في التعاقد مع الطرف الثاني للعمل لديه بمهنة <span class="shaded">${employee.jobTitle}</span> وبعد أن أقر الطرفان بأهليتهما في إبرام هذا العقد تم الاتفاق على ما يلي:
      </div>

      <div class="clause">
        <div class="clause-title">البند الأول</div>
        يعتبر التمهيد السابق جزء لا يتجزأ من هذا العقد.
      </div>

      <div class="clause">
        <div class="clause-title">البند الثاني</div>
        <div style="text-align: center; font-weight: bold;">"طبيعة العمل"</div>
        تعاقد الطرف الأول مع الطرف الثاني للعمل لديه بمهنة <span class="shaded">${employee.jobTitle}</span> داخل دولة الكويت.
      </div>

      <div class="clause">
        <div class="clause-title">البند الثالث</div>
        <div style="text-align: center; font-weight: bold;">"فترة التجربة"</div>
        يخضع الطرف الثاني لفترة تجربة لمدة لا تزيد عن 100 يوم عمل، ويحق لكل من الطرفين إنهاء العقد خلال تلك الفترة دون إخطار.
      </div>

      <div class="clause">
        <div class="clause-title">البند الرابع</div>
        <div style="text-align: center; font-weight: bold;">"قيمة الأجر"</div>
        يتقاضى الطرف الثاني عن تنفيذ هذا العقد أجراً مقداره <span class="shaded">${employee.salary?.basic || 0} ديناراً كويتي</span> في نهاية كل شهر ، ولا يجوز للطرف الأول تخفيض الأجر أثناء سريان هذا العقد، ولا يجوز نقل الطرف الثاني إلى الأجر اليومي دون موافقته .
      </div>

      <div class="clause">
        <div class="clause-title">البند الخامس</div>
        <div style="text-align: center; font-weight: bold;">"نفاذ العقد"</div>
        يبدأ نفاذ العقد اعتباراً من <span class="shaded">${employee.hiringDate ? new Date(employee.hiringDate).toLocaleDateString("ar-KW") : "2026/02/01"}</span> ويلتزم الطرف الثاني بالقيام بأداء عمله طوال مدة نفاذه.
      </div>

      <div class="clause">
        <div class="clause-title">البند السادس</div>
        <div style="text-align: center; font-weight: bold;">"مدة العقد"</div>
        * هذا العقد محدد المدة ويبدأ اعتباراً من <span class="shaded">${employee.hiringDate ? new Date(employee.hiringDate).toLocaleDateString("ar-KW") : "2026/02/01"}</span> ولمدة <span class="shaded">سنه</span> ويجوز تجديد العقد بموافقة الطرفين لمدد مماثلة بحد أقصى خمس سنوات ميلادية .
      </div>
<div class="clause">
        * اعتبار العقد محدد المدة أو غير محدد المدة يخضع لاختياره لإرادة الطرفين.
      </div>
      
    </div>
  </div>

  <div class="page-break"></div>

  <div class="page-container" style="padding-top: 20px;">
    <div class="contract-border" style="min-height: 800px;">
      
      
      <div class="clause">
        <div class="clause-title">البند السابع</div>
        <div style="text-align: center; font-weight: bold;">"الإجازة السنوية"</div>
        للطرف الثاني الحق في إجازة سنوية مدفوعة الأجر مدتها شهر يوماً، ولا يستحقها عن السنة الأولى إلا بعد انقضاء مدة تسعة أشهر تحسب من تاريخ نفاذ العقد.
      </div>

      <div class="clause">
        <div class="clause-title">البند الثامن</div>
        <div style="text-align: center; font-weight: bold;">"عدد ساعات العمل"</div>
        لا يجوز للطرف الأول تشغيل الطرف الثاني لمدة لا تزيد عن ثماني ساعات عمل يومياً تتخللها فترة راحة لا تقل عن ساعة باستثناء الحالات المقررة قانوناً.
      </div>

      <div class="clause">
        <div class="clause-title">البند التاسع</div>
        <div style="text-align: center; font-weight: bold;">"قيمة تذكرة السفر"</div>
        يتحمل الطرف الأول مصاريف عودة الطرف الثاني إلى بلدة عند انتهاء علاقة العمل ومغادرته نهائيا البلاد.
      </div>

      <div class="clause">
        <div class="clause-title">البند العاشر</div>
        <div style="text-align: center; font-weight: bold;">"التأمين ضد إصابات وأمراض العمل"</div>
        يلتزم الطرف الأول بالتأمين على الطرف الثاني ضد إصابات وإمراض العمل، كما يلتزم بقيمة التأمين الصحي طبقاً للقانون رقم (1) لسنة 1999.
      </div>

      <div class="clause">
        <div class="clause-title">البند الحادي عشر</div>
        <div style="text-align: center; font-weight: bold;">"مكافأة نهاية الخدمة"</div>
        يستحق الطرف الثاني مكافأة نهاية الخدمة المنصوص عليها بالقوانين المنظمة.
      </div>

      <div class="clause">
        <div class="clause-title">البند الثاني عشر</div>
        <div style="text-align: center; font-weight: bold;">"القانون الواجب للتطبيق"</div>
        تسري أحكام قانون العمل في القطاع الأهلي رقم 6 لسنة 2010 والقرارات المنفذة له فيما لم يرد بشأنه نص في هذا العقد، ويقع باطلاً كل شرط تم الاتفاق عليه بالمخالفة لأحكام القانون، وما لم يكن فيه ميزة أفضل للعامل.
      </div>

      <div class="clause">
        <div class="clause-title">البند الثالث عشر</div>
        <div style="text-align: center; font-weight: bold;">"شروط خاصة"</div>
        1- لا يـــــوجـــــد شـــــروط<br>
        2- لا يـــــوجـــــد شـــــروط<br>
        3- لا يـــــوجـــــد شـــــروط
      </div>

      <div class="clause">
        <div class="clause-title">البند الرابع عشر</div>
        <div style="text-align: center; font-weight: bold;">"المحكمة المختصة"</div>
        تختص المحكمة الكلية ودوائرها العمالية طبقاً لأحكام القانون رقم 46 لسنة 1987، بنظر كافة المنازعات الناشئة عن تطبيق أو تفسير هذا العقد.
      </div>

      <div class="clause">
        <div class="clause-title">البند الخامس عشر</div>
        <div style="text-align: center; font-weight: bold;">"لغة العقد"</div>
        حرر هذا العقد باللغة العربية.
      </div>

      <div class="clause">
        <div class="clause-title">البند السادس عشر</div>
        <div style="text-align: center; font-weight: bold;">"نسخ العقد"</div>
        حرر هذا العقد من ثلاث نسخ بيد كل طرف نسخة للعمل بموجبها والثالثة تودع لدى الهيئة العامة للقوى العاملة.
      </div>

      <div class="signature-row">
        <div class="signature-col">
          <div class="bold">الطرف الأول</div>
          <div style="height: 50px; margin-top: 10px; display: flex; align-items: center; justify-content: center;">
             <span style="color: #ccc;">(توقيع الطرف الأول)</span>
          </div>
        </div>
        <div class="signature-col">
          <div class="bold">الطرف الثاني</div>
          <div style="height: 50px; margin-top: 10px; display: flex; align-items: center; justify-content: center;">
             <span style="color: #ccc;">(توقيع الطرف الثاني)</span>
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
