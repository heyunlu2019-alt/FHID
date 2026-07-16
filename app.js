// ---------------- 資料設定 ----------------

// 分公司資料來源：fullhouseid.com 官網「公司組織．分公司」各分點頁面(2026-07 擷取)
// 注意：官網「中山公司」頁面位址與「大安公司」相同、「南西公司」頁面位址與「民生公司」相同，
// 疑似官網資料尚未更新，先照官網現況列出，可於表單中手動修正。
const BRANCHES = {
  "承德公司": { short: "承德", addr: "103 台北市大同區承德路一段17號B棟6F-1", tel: "+886-2-2556-1197", fax: "+886-2-2558-4694" },
  "大安公司": { short: "大安", addr: "106 台北市大安區復興南路一段203號12樓", tel: "+886-2-8772-0899", fax: "+886-2-8772-5699" },
  "復興一部": { short: "復興一部", addr: "105 台北市松山區復興北路35號10F", tel: "+886-2-2778-3398", fax: "+886-2-2778-3435" },
  "復興二部": { short: "復興二部", addr: "台北市敦化北路309號3樓之3", tel: "+886-2-8772-1277", fax: "+886-2-2713-8939" },
  "復興台中": { short: "復興台中", addr: "403 台中市西區台灣大道二段218號6樓之3", tel: "+886-4-2328-6008", fax: "+886-4-2328-6001" },
  "忠孝公司": { short: "忠孝", addr: "110 台北市信義區忠孝東路五段1-5號12F", tel: "+886-2-3765-3933", fax: "+886-2-3765-3935" },
  "民生公司": { short: "民生", addr: "104 台北市中山區民生東路二段143號6F", tel: "+886-2-2507-2578", fax: "+886-2-2506-5478" },
  "中山公司": { short: "中山", addr: "106 台北市大安區復興南路一段203號12樓", tel: "+886-2-7729-7155", fax: "+886-2-8772-5699" },
  "中山台南": { short: "台南", addr: "700 台南市西門路三段159號8樓之3", tel: "+886-6-222-3058", fax: "+886-6-222-3239" },
  "南西公司": { short: "南西", addr: "104 台北市中山區民生東路二段143號6F", tel: "+886-2-2555-5918", fax: "+886-2-2506-5478" },
  "南京公司": { short: "南京", addr: "台北市松山區南京東路四段180號8F-3", tel: "+886-2-2579-3667", fax: "+886-2-2579-0667" },
  "敦北公司": { short: "敦北", addr: "台北市敦化北路309號3樓之3", tel: "+886-2-2713-8838", fax: "+886-2-2713-8939" }
};

const COMPANY_WEBSITE = "WWW.FULLHOUSEID.COM.TW";
const COMPANY_HOTLINE = "0809-080158";

function toLocalPhone(intl) {
  const parts = intl.split("-");
  if (parts.length < 3) return intl;
  const area = "0" + parts[1];
  const rest = parts.slice(2).join("");
  return `${area}-${rest}`;
}

const PARTY_B_DEFAULT = { name: "成舍企業股份有限公司", rep: "詹美珠", id: "86320066", email: "fullhouseid@mail2000.com.tw", defaultBranch: "承德公司" };

// version = 公司合約修訂版本(依原始Word檔案版次,勿隨意變動;僅錯字/排版修正不改版)
const CONTRACT_TYPES = {
  engineering: { label: "工程合約", version: "20260312", branches: BRANCHES, partyB: PARTY_B_DEFAULT, titleText: "工程合約書", badge: "", template: TEMPLATE_ENGINEERING },
  design_general: { label: "設計合約", version: "20200723", branches: BRANCHES, partyB: PARTY_B_DEFAULT, titleText: "設計合約書", badge: "", template: TEMPLATE_DESIGN_GENERAL },
  design_custom: { label: "客變專用合約", version: "20230830", branches: BRANCHES, partyB: PARTY_B_DEFAULT, titleText: "設計合約書", badge: "（客變專用）", template: TEMPLATE_DESIGN_CUSTOM }
};

let currentType = "engineering";

// ---------------- 工具函式 ----------------

function fillTemplate(tpl, data) {
  return tpl.replace(/{{\s*([\w]+)\s*}}/g, (m, key) => {
    const v = data[key];
    return (v === undefined || v === null || v === "") ? "" : v;
  });
}

const CN_NUM = ["零","壹","貳","參","肆","伍","陸","柒","捌","玖"];
const CN_UNIT = ["","拾","佰","仟"];
const CN_BIG_UNIT = ["","萬","億","兆"];

function numberToChineseCapital(num) {
  num = Math.round(Number(num) || 0);
  if (num === 0) return "零元整";
  if (num < 0) return "負" + numberToChineseCapital(-num);
  let s = String(num);
  let groups = [];
  while (s.length > 0) {
    groups.unshift(s.slice(-4));
    s = s.slice(0, -4);
  }
  let result = "";
  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    const bigUnit = CN_BIG_UNIT[groups.length - 1 - gi] || "";
    let groupStr = "";
    let zeroFlag = false;
    for (let i = 0; i < g.length; i++) {
      const d = Number(g[i]);
      const unitIdx = g.length - 1 - i;
      if (d === 0) {
        if (groupStr) zeroFlag = true;
      } else {
        if (zeroFlag) { groupStr += "零"; zeroFlag = false; }
        groupStr += CN_NUM[d] + CN_UNIT[unitIdx];
      }
    }
    if (groupStr) result += groupStr + bigUnit;
  }
  result = result.replace(/零+/g, "零").replace(/零$/, "");
  return result + "元整";
}

// 簽署日期 → 全中文(壓底日期用):2026-07-16 → 中華民國一一五年七月十六日
function toChineseSignDate(dateStr) {
  const dt = dateStr ? new Date(dateStr + "T00:00:00") : null;
  if (!dt || isNaN(dt.getTime())) return "中華民國　　年　　月　　日";
  const digits = ["〇","一","二","三","四","五","六","七","八","九"];
  const yr = String(dt.getFullYear() - 1911).split("").map(c => digits[+c]).join("");
  const num = n => n <= 10
    ? ["","一","二","三","四","五","六","七","八","九","十"][n]
    : (n < 20 ? "十" + (n % 10 ? digits[n % 10] : "")
              : digits[Math.floor(n / 10)] + "十" + (n % 10 ? digits[n % 10] : ""));
  return `中華民國${yr}年${num(dt.getMonth() + 1)}月${num(dt.getDate())}日`;
}

function toRocFullDate(dateStr) {
  if (!dateStr) return null;
  const dt = new Date(dateStr + "T00:00:00");
  if (isNaN(dt.getTime())) return null;
  const roc = dt.getFullYear() - 1911;
  return `${roc}年${dt.getMonth() + 1}月${dt.getDate()}日`;
}

function fmtMoney(n) {
  return Math.round(n).toLocaleString("zh-TW");
}

// 折扣百分比 → 中文「折」數：90→九、85→八五、95→九五
function pctToZheText(p) {
  p = Math.round(Number(p) || 90);
  if (p >= 100) return "十";
  if (p <= 0) return "";
  const cn = ["零","一","二","三","四","五","六","七","八","九"];
  const tens = Math.floor(p / 10), ones = p % 10;
  return (tens ? cn[tens] : "") + (ones ? cn[ones] : "");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ---------------- 內容區塊產生 ----------------

function buildBranchList(branches, selected) {
  return Object.keys(branches).map(name => {
    const sel = name === selected;
    // 選中的方格用實心「■」字元填滿,列印關閉背景圖形時也印得出來
    return `<span class="branch-chk${sel ? " selected" : ""}"><span class="box">${sel ? "■" : ""}</span>${branches[name].short}</span>`;
  }).join("");
}

function buildBranchAddressList(branches) {
  return Object.keys(branches).map(name => {
    const b = branches[name];
    return `<div class="branch-block"><div class="branch-name">${name}</div><div>${b.addr}</div><div>TEL:${b.tel}　FAX:${b.fax}</div></div>`;
  }).join("");
}

function buildCoverFooter(branches, selected) {
  const b = branches[selected] || Object.values(branches)[0];
  return `<div>${b.addr}</div><div>TEL：${toLocalPhone(b.tel)}</div>` +
    `<div>${COMPANY_WEBSITE}</div><div>FAX：${toLocalPhone(b.fax)}</div>` +
    `<div>免費客服專線</div><div>${COMPANY_HOTLINE}</div>`;
}

function buildAppendixList(d) {
  const items = [
    ["工程單價表", d.app_priceList],
    ["工程設計圖", d.app_designDrawing],
    ["工程進度表", d.app_schedule],
    ["各部施工圖", d.app_shopDrawing],
    ["家具估價單", d.app_furnitureQuote]
  ];
  const cnNum = ["一","二","三","四","五"];
  const rows = items
    .filter(it => Number(it[1]) > 0)
    .map((it, i) => `<div>（${cnNum[i]}）${it[0]}一份　${it[1]}　張</div>`)
    .join("");
  return `<div class="appendix-list">${rows || "（無附件）"}</div>`;
}

const ENG_PRESETS = {
  small: [
    { label: "簽約款", pct: 60, timing: "合約簽訂後，收到乙方請款單(或發票)時，以現金、即期支票或電匯支付" },
    { label: "木作進場款", pct: 30, timing: "木作工程進場後開立請款單(或發票)，甲方應於收到後七日內支付" },
    { label: "完工驗收款", pct: 10, timing: "全部工程完成驗收（複驗完成）後開立請款單(或發票)，甲方應於收到後七日內支付" }
  ],
  standard: [
    { label: "簽約款", pct: 30, timing: "本合約簽訂後，收到乙方請款單(或發票)時，以現金、即期支票或電匯支付" },
    { label: "木作進場款", pct: 30, timing: "木作工程進場後開立請款單(或發票)，甲方應於收到後七日內支付" },
    { label: "油漆進場款", pct: 30, timing: "油漆工程進場後開立請款單(或發票)，甲方應於收到後七日內支付" },
    { label: "完工驗收款", pct: 10, timing: "全部工程完成驗收（複驗完成）後開立請款單(或發票)，甲方應於收到後七日內支付" }
  ]
};

function applyEngPreset(name) {
  if (name === "custom") return;
  const rows = ENG_PRESETS[name];
  setVal("eng_installmentCount", String(rows.length));
  for (let i = 0; i < 5; i++) {
    const r = rows[i];
    setVal(`eng_ms${i + 1}_label`, r ? r.label : "");
    setVal(`eng_ms${i + 1}_pct`, r ? r.pct : "");
    setVal(`eng_ms${i + 1}_timing`, r ? r.timing : "");
  }
  updateEngRowVisibility();
}

function updateEngRowVisibility() {
  const count = Number(document.getElementById("engInstallmentCount").value) || 4;
  document.querySelectorAll("#fieldset_eng_payment .pay-row").forEach(row => {
    const idx = Number(row.dataset.idx);
    row.classList.toggle("hidden-row", idx > count);
  });
}

function buildPaymentTable(totalAmount, rows) {
  const total = Number(totalAmount) || 0;
  const cnOrdinal = ["一","二","三","四","五"];
  const amounts = rows.map(r => Math.round(total * r.pct / 100));
  const sumButLast = amounts.slice(0, -1).reduce((a, b) => a + b, 0);
  if (amounts.length) amounts[amounts.length - 1] = total - sumButLast;
  const trs = rows.map((r, i) =>
    `<tr><td class="cell-period">第${cnOrdinal[i] || i + 1}期${r.label ? "－" + r.label : ""}</td><td>${r.timing || ""}</td><td class="cell-pct">${r.pct}%</td><td class="cell-amount">新台幣 ${fmtMoney(amounts[i])} 元整</td></tr>`
  ).join("");
  return `<table class="payment-table"><thead><tr><th>期別</th><th>付款條件</th><th>比例</th><th>金額</th></tr></thead><tbody>${trs}</tbody>
  <tfoot><tr><td colspan="3">合計（工程總價）</td><td class="cell-amount">新台幣 ${fmtMoney(total)} 元整</td></tr></tfoot></table>`;
}

const STAGE_DEFS = {
  general: [
    { name: "簽約款", items: ["設計合約書簽定"] },
    { name: "第一階段", items: ["初步規劃","平面配置圖","與甲方討論後設計定案（設計構想、色彩搭配、取材風格）","隔間放樣圖","地板配置圖","天花板配置圖","空調配置圖","天花板燈具及開關配置圖","迴路配置圖","水電配置圖"] },
    { name: "第二階段", items: ["各向立面圖","剖面施工圖","工程預算書","建材選樣"] },
    { name: "尾款", items: ["全套設計圖說交付"] }
  ],
  custom: [
    { name: "簽約訂金費用", items: ["設計合約書簽定"] },
    { name: "第一階段", items: ["初步規劃及平面圖","與甲方討論後設計定案（設計構想、色彩搭配、取材風格）","隔間放樣圖","水電配置圖","天花板燈具及開關配置圖","地板配置圖","協助客戶變更選材"] },
    { name: "第二階段", items: ["基本Sketchup 3D模型","天花板及空調配置圖","迴路配置圖","建材樣品板","重點立面及剖面"] },
    { name: "第三階段", items: ["立面施工圖","細部及剖面設計圖","編訂工程預算書"] }
  ]
};

const STAGE_DEFAULT_PCT = {
  general: [30, 30, 30, 10],
  custom: [30, 30, 30, 10]
};

function buildStageTable(variant, totalFee, pcts) {
  const total = Number(totalFee) || 0;
  const defs = STAGE_DEFS[variant];
  const stages = defs.map((s, i) => ({ ...s, pct: (Number(pcts[i]) || 0) / 100 }));
  const amounts = stages.map(s => Math.round(total * s.pct));
  const sumButLast = amounts.slice(0, -1).reduce((a, b) => a + b, 0);
  amounts[amounts.length - 1] = total - sumButLast;
  const rows = stages.map((s, i) =>
    `<tr><td class="cell-period">${s.name}</td><td>${s.items.join("、")}</td><td class="cell-pct">${(s.pct*100).toFixed(0)}%</td><td class="cell-amount">新台幣 ${fmtMoney(amounts[i])} 元整</td></tr>`
  ).join("");
  return `<table class="stage-table"><thead><tr><th>階段</th><th>應備文件及圖說</th><th>比例</th><th>金額</th></tr></thead><tbody>${rows}</tbody>
  <tfoot><tr><td colspan="3">合計</td><td class="cell-amount">新台幣 ${fmtMoney(total)} 元整</td></tr></tfoot></table>`;
}

// 簽名區:甲方在左、乙方在右,逐列左右對稱等高
function buildSignBlock(d, isEng) {
  const v = k => d[k] || "";
  const rows = [
    ["甲　方", v("partyA_name"), "乙　方", v("partyB_branchName")],
    ["負責人", v("partyA_rep"), "負責人", v("partyB_rep")],
    ["代理人", v("partyA_agent"), "代理人", v("partyB_agent")],
    ["地　址", v("partyA_address"), "地　址", v("partyB_address")],
    ["統一編號/身分證字號", v("partyA_id"), "統一編號", v("partyB_id")]
  ];
  if (isEng) {
    rows.push(["簽約代表(簽字)", "", "專案設計師", v("partyB_designer")]);
    rows.push(["工程驗收代表", "", "", ""]);
  }
  rows.push(["電　話", v("partyA_phone"), "電　話", v("partyB_phone")]);
  rows.push(["傳　真", v("partyA_fax"), "傳　真", v("partyB_fax")]);
  if (isEng) {
    rows.push(["行動電話", v("partyA_mobile"), "行動電話", ""]);
  } else {
    rows.push(["行動電話", v("partyA_mobile"), "專案設計師", v("partyB_designer")]);
  }
  rows.push(["E-mail", v("partyA_email"), "E-mail", v("partyB_email")]);
  const trs = rows.map(r => {
    const cell = (label, val) => label === "" && val === ""
      ? '<td class="sl"></td><td class="sv-empty"></td>'
      : `<td class="sl">${label}：</td><td class="sv">${val}</td>`;
    return `<tr>${cell(r[0], r[1])}${cell(r[2], r[3])}</tr>`;
  }).join("");
  return `<table class="sign-table"><tbody>${trs}</tbody></table>`;
}

// ---------------- 分頁 ----------------
// 依區塊實際高度自動分頁：每頁盡量填滿，避免半頁空白。

let _pxPerMmCache = null;
function pxPerMm() {
  if (_pxPerMmCache) return _pxPerMmCache;
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;visibility:hidden;height:100mm;width:1px;";
  document.body.appendChild(probe);
  _pxPerMmCache = probe.offsetHeight / 100;
  document.body.removeChild(probe);
  return _pxPerMmCache;
}

// 把「（一）（二）…」條款項目與「1、/(1)/1.1」子項拆成獨立段落，
// 項目之間才有空行、分頁也更平均（大段落不會整塊跳頁留下半頁空白）
function splitClauseItems(html) {
  return html
    .replace(/<br>\s*(?=（[一二三四五六七八九十]{1,3}）)/g, "</p><p>")
    .replace(/<br>\s*(?=　[\(（]?\d)/g, '</p><p class="sub-item">')
    .replace(/<br>\s*(?=\d\.\d　)/g, '</p><p class="sub-item">');
}

function paginate(html, docCode) {
  html = splitClauseItems(html.replace(/<!--PAGEBREAK-->/g, ""));

  // 用隱藏的同尺寸頁面量測每個區塊高度
  const measurer = document.createElement("section");
  measurer.className = "page contract-page";
  measurer.style.cssText = "position:absolute;left:-9999px;top:0;";
  document.body.appendChild(measurer);
  measurer.innerHTML = html;

  const mm = pxPerMm();
  const availHeight = (297 - 18 - 18) * mm - 52; // A4 高度 － 上下留白 － 頁尾（含列印誤差安全邊距）

  const blocks = Array.from(measurer.children).map(el => {
    const st = getComputedStyle(el);
    const mT = parseFloat(st.marginTop), mB = parseFloat(st.marginBottom);
    return {
      el, mT,
      h: el.offsetHeight + mT + mB,
      isHeading: el.tagName === "P" && !!el.querySelector("b") && el.textContent.trim().length <= 16,
      isSign: el.classList.contains("sign-area"),
      isSpecial: el.classList.contains("sign-area") || el.classList.contains("appendix-fixed")
    };
  });

  // 依大項目分組:標題與其後內文為一組(同一件事盡量同頁)
  const groups = [];
  let g = null;
  blocks.forEach(b => {
    if (b.isHeading || b.isSpecial || !g || g.special) {
      g = { blocks: [b], h: b.h, special: b.isSpecial, sign: b.isSign };
      groups.push(g);
    } else {
      g.blocks.push(b);
      g.h += b.h;
    }
  });

  // 分頁規則:
  // 1. 整組放得下 → 同頁
  // 2. 放不下且本頁已夠滿(門檻) → 整組換頁(不拆開同一條款)
  // 3. 其餘情況(組太大或本頁太空) → 組內拆分,但標題不孤懸頁底
  const packPages = (threshold) => {
    const pgs = [];
    let cur = [], curH = 0;
    const flush = () => { if (cur.length) { pgs.push({ blocks: cur, used: curH }); cur = []; curH = 0; } };
    groups.forEach(grp => {
      if (grp.sign) flush(); // 簽約區獨立成頁
      if (curH + grp.h <= availHeight) {
        cur.push(...grp.blocks); curH += grp.h;
      } else if (grp.h <= availHeight && curH >= availHeight * threshold) {
        flush();
        cur.push(...grp.blocks); curH += grp.h;
      } else {
        grp.blocks.forEach((b, i) => {
          const next = grp.blocks[i + 1];
          const need = (b.isHeading && next) ? b.h + next.h : b.h;
          if (cur.length && curH + need > availHeight) flush();
          cur.push(b); curH += b.h;
        });
      }
      if (grp.sign) flush();
    });
    flush();
    return pgs;
  };

  // 嘗試多種門檻,選頁數最少、各頁最平均(最空頁面填滿度最高)的方案
  let pages = null, bestKey = null;
  [0.6, 0.7, 0.8, 0.9, 2].forEach(t => {
    const pgs = packPages(t);
    const normal = pgs.filter((p, i) => !p.blocks.some(b => b.isSign) && i !== pgs.length - 1);
    const minFill = normal.length ? Math.min(...normal.map(p => p.used / availHeight)) : 1;
    const key = [pgs.length, -minFill];
    if (!pages || key[0] < bestKey[0] || (key[0] === bestKey[0] && key[1] < bestKey[1])) {
      pages = pgs; bestKey = key;
    }
  });

  // 垂直勻版:各頁剩餘空間平均分配到條款起始處,版面均勻不留大片空白
  // (簽約頁除外:簽約表固定、日期壓底;最末頁不硬撐)
  pages.forEach((pg, pi) => {
    if (pg.blocks.some(b => b.isSign)) return;
    let leftover = availHeight - pg.used;
    if (leftover <= 0) return;
    const isLast = pi === pages.length - 1;
    // 第一層:分配到條款(大項目)起始處
    const gapsA = pg.blocks.filter((b, i) => i > 0 && (b.isHeading || b.isSpecial));
    if (gapsA.length) {
      let quota = isLast ? Math.min(leftover, gapsA.length * 8) : leftover;
      const extra = Math.min(Math.floor(quota / gapsA.length), 30);
      if (extra > 0) {
        gapsA.forEach(b => { b.el.style.marginTop = (b.mT + extra) + "px"; });
        leftover -= extra * gapsA.length;
      }
    }
    if (isLast) return;
    // 第二層:仍有明顯剩餘時,平均分到一般段落之間(小幅,編號小項除外)
    const gapsB = pg.blocks.filter((b, i) =>
      i > 0 && !b.isHeading && !b.isSpecial && !b.el.classList.contains("sub-item"));
    if (leftover > 60 && gapsB.length) {
      const extra2 = Math.min(Math.floor(leftover / gapsB.length), 12);
      if (extra2 > 0) gapsB.forEach(b => {
        const cur = parseFloat(b.el.style.marginTop) || b.mT;
        b.el.style.marginTop = (cur + extra2) + "px";
      });
    }
  });

  const total = pages.length;
  const out = pages.map((pg, i) => {
    const cls = pg.blocks.some(b => b.isSign) ? "page contract-page sign-page" : "page contract-page";
    return `<section class="${cls}">${pg.blocks.map(b => b.el.outerHTML).join("")}` +
      `<div class="page-footer"><span>第 ${i + 1} 頁，共 ${total} 頁</span><span>${docCode}</span></div>` +
      `</section>`;
  }).join("");
  document.body.removeChild(measurer);
  return out;
}

// ---------------- 表單 <-> 分公司預設值 ----------------

function setVal(name, value) {
  const el = document.querySelector(`[name="${name}"]`);
  if (el) el.value = value ?? "";
}

// 重複欄位雙向連動:填一處,其餘自動帶入(封面 ↔ 工程/設計內容 ↔ 乙方設計師)
const SYNC_GROUPS = [
  ["cover_projectName", "eng_projectName", "design_caseName"],
  ["cover_siteAddress", "eng_projectLocation", "design_siteAddress"],
  ["cover_designer", "partyB_designer"]
];

function syncLinkedFields(sourceName) {
  for (const grp of SYNC_GROUPS) {
    if (!grp.includes(sourceName)) continue;
    const src = document.querySelector(`[name="${sourceName}"]`);
    if (!src) continue;
    grp.forEach(n => { if (n !== sourceName) setVal(n, src.value); });
  }
}

function syncAllFromCover() {
  SYNC_GROUPS.forEach(grp => syncLinkedFields(grp[0]));
}

function populateBranchSelect(type) {
  const cfg = CONTRACT_TYPES[type];
  const select = document.getElementById("branchSelect");
  select.innerHTML = Object.keys(cfg.branches).map(name => `<option value="${name}">${name}</option>`).join("");
  select.value = cfg.partyB.defaultBranch;
}

function applyBranchDefaults(type, branchName) {
  const cfg = CONTRACT_TYPES[type];
  const bKey = (branchName && cfg.branches[branchName]) ? branchName : Object.keys(cfg.branches)[0];
  const b = cfg.branches[bKey];
  const pb = cfg.partyB;
  setVal("partyB_branchName", pb.name + (type === "engineering" ? "" : bKey));
  setVal("partyB_rep", pb.rep);
  setVal("partyB_agent", "");
  setVal("partyB_address", b.addr);
  setVal("partyB_id", pb.id);
  setVal("partyB_phone", b.tel);
  setVal("partyB_fax", b.fax);
  setVal("partyB_designer", "");
  setVal("partyB_email", pb.email);
}

// ---------------- 主要渲染 ----------------

function render() {
  const cfg = CONTRACT_TYPES[currentType];
  const form = document.getElementById("contractForm");
  const fd = new FormData(form);
  const d = {};
  for (const [k, v] of fd.entries()) d[k] = v;

  const rawEngStart = d.eng_startDate;
  const rawEngEnd = d.eng_endDate;
  d.eng_startDate = rawEngStart ? toRocFullDate(rawEngStart) : "　　年　　月　　日";
  d.eng_endDate = rawEngEnd ? toRocFullDate(rawEngEnd) : "　　年　　月　　日";
  d.eng_totalAmount_capital = d.eng_totalAmount ? numberToChineseCapital(d.eng_totalAmount) : "";
  d.eng_taxNote = d.eng_taxNote || "含稅";

  const engCount = Number(d.eng_installmentCount) || 4;
  const engRows = [];
  for (let i = 1; i <= engCount; i++) {
    engRows.push({
      label: d[`eng_ms${i}_label`] || "",
      pct: Number(d[`eng_ms${i}_pct`]) || 0,
      timing: d[`eng_ms${i}_timing`] || ""
    });
  }
  const engPctSum = engRows.reduce((a, r) => a + r.pct, 0);
  const engHintEl = document.getElementById("engPctSumHint");
  if (engHintEl) {
    engHintEl.textContent = `目前比例總和：${engPctSum}%` + (engPctSum !== 100 ? "（建議調整為100%）" : "");
    engHintEl.style.color = engPctSum !== 100 ? "#c0392b" : "#888";
  }

  const variant = currentType === "design_custom" ? "custom" : "general";
  const calcFee = (Number(d.design_pricePerPing) || 0) * (Number(d.design_ping) || 0);
  const totalFee = d.design_totalFeeOverride ? Number(d.design_totalFeeOverride) : calcFee;
  d.design_totalFee_fmt = totalFee ? fmtMoney(totalFee) : "";
  d.design_pricePerPing = d.design_pricePerPing ? fmtMoney(d.design_pricePerPing) : "";

  const pctInputs = [d.design_pct1, d.design_pct2, d.design_pct3, d.design_pct4];
  const pcts = STAGE_DEFAULT_PCT[variant].map((def, i) => (pctInputs[i] === undefined || pctInputs[i] === "") ? def : Number(pctInputs[i]));
  d.design_signFee = totalFee ? fmtMoney(totalFee * (pcts[0] / 100)) : "";
  d.design_signPct = pcts[0];
  d.design_discountPct = Math.round(Number(d.design_discountPct) || 90);
  d.design_discountZhe = pctToZheText(d.design_discountPct);
  d.design_caseDate = d.design_caseDate || toRocFullDate(d.signDate) || "　　年　　月　　日";
  d.design_signDate_roc = toChineseSignDate(d.signDate);
  d.signDate_zh = toChineseSignDate(d.signDate);
  // 封面日期用西元:2026 / 07 / 16
  d.cover_date = d.signDate ? d.signDate.split("-").join(" / ") : "";

  const pctSum = pcts.reduce((a, b) => a + b, 0);
  const pctHintEl = document.getElementById("pctSumHint");
  if (pctHintEl) {
    pctHintEl.textContent = `目前比例總和：${pctSum}%` + (pctSum !== 100 ? "（建議調整為100%）" : "");
    pctHintEl.style.color = pctSum !== 100 ? "#c0392b" : "#888";
  }
  const totalPreviewEl = document.getElementById("designTotalPreview");
  if (totalPreviewEl && currentType !== "engineering") {
    totalPreviewEl.textContent = `目前總計費用：新台幣 ${fmtMoney(totalFee)} 元整` + (d.design_totalFeeOverride ? "（手動覆蓋）" : "（＝每坪×坪數）");
  }

  d.PAYMENT_TABLE = buildPaymentTable(d.eng_totalAmount, engRows);
  d.APPENDIX_LIST = buildAppendixList(d);
  d.STAGE_TABLE = buildStageTable(variant, totalFee, pcts);
  d.SIGN_BLOCK = buildSignBlock(d, currentType === "engineering");
  d.coverTitleChars = cfg.titleText.split("").join("<br>");
  d.coverBadge = cfg.badge;
  d.BRANCH_LIST = buildBranchList(cfg.branches, d.branch);
  d.BRANCH_ADDRESS_LIST = buildBranchAddressList(cfg.branches);
  d.COVER_FOOTER = buildCoverFooter(cfg.branches, d.branch);

  const docCode = cfg.version + "版" + cfg.label;
  const html =
    fillTemplate(COVER_TEMPLATE, d) +
    fillTemplate(COVER_BACK_TEMPLATE, d) +
    paginate(fillTemplate(cfg.template, d), docCode);

  document.getElementById("previewRoot").innerHTML = html;
}

// ---------------- 匯出 ----------------

function buildFileName(ext) {
  const cfg = CONTRACT_TYPES[currentType];
  const nameEl = document.querySelector('[name="partyA_name"]');
  const partyA = (nameEl && nameEl.value.trim()) || "未命名";
  const today = new Date().toISOString().slice(0, 10);
  return `${cfg.label}_${partyA}_${today}.${ext}`;
}

// ---------------- Word 匯出(原生 docx) ----------------
// 直接產生原生 Word 段落/表格/頁碼,不經 HTML 轉換,格式才能與預覽/PDF一致。
// 注意:spacing.line 搭配 lineRule:"auto" 時,單位是 1/240 行(即 360=1.5倍行距)。

const DOCX_CONTENT_W = 10092; // A4 寬 11906 - 左右邊距 907*2 (twip)
const DOCX_SUB_INDENT = 250;  // 編號小項縮排(約一個全形字)

function _noBorder() {
  const n = { style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return { top: n, bottom: n, left: n, right: n };
}

function _gridBorder() {
  const b = { style: docx.BorderStyle.SINGLE, size: 4, color: "999999" };
  return { top: b, bottom: b, left: b, right: b };
}

// 元素內文(含 <b>、.fill 底線欄位)→ TextRun 陣列(不處理 <br>,由段落切割負責)
function _inlineRuns(el, fmt, runs) {
  el.childNodes.forEach(n => {
    if (n.nodeType === Node.TEXT_NODE) {
      const text = n.textContent.replace(/[\r\n]/g, "");
      if (text) {
        runs.push(new docx.TextRun({
          text, bold: fmt.bold, size: fmt.size,
          underline: fmt.underline ? { type: docx.UnderlineType.SINGLE } : undefined
        }));
      }
    } else if (n.nodeType === Node.ELEMENT_NODE) {
      if (n.tagName === "BR") return;
      const f = Object.assign({}, fmt);
      if (n.tagName === "B" || n.tagName === "STRONG") f.bold = true;
      if (n.classList && n.classList.contains("fill")) {
        f.underline = true;
        if (!n.textContent.trim()) {
          runs.push(new docx.TextRun({
            text: "　　　　　", size: f.size,
            underline: { type: docx.UnderlineType.SINGLE }
          }));
          return;
        }
      }
      _inlineRuns(n, f, runs);
    }
  });
}

function _runsOf(el, size, bold) {
  const runs = [];
  _inlineRuns(el, { size: size || 24, bold: !!bold }, runs);
  return runs;
}

// 依 <br> 把元素切成多個段落片段(Word 對「兩端對齊+手動換行」會把字撐滿整行,必須改成獨立段落)
function _segmentsOf(el) {
  const segs = [];
  let cur = document.createElement("span");
  el.childNodes.forEach(n => {
    if (n.nodeType === Node.ELEMENT_NODE && n.tagName === "BR") {
      segs.push(cur);
      cur = document.createElement("span");
    } else {
      cur.appendChild(n.cloneNode(true));
    }
  });
  segs.push(cur);
  return segs.filter(s => s.textContent.replace(/[\s　]/g, "") !== "" || s.querySelector(".fill"));
}

// 去掉片段開頭的全形/半形空白,回傳是否有前導縮排
function _stripLead(seg) {
  let lead = 0;
  const walker = document.createTreeWalker(seg, NodeFilter.SHOW_TEXT);
  const first = walker.nextNode();
  if (first) {
    const m = first.textContent.match(/^[\s　]+/);
    if (m) {
      lead = m[0].length;
      first.textContent = first.textContent.slice(m[0].length);
    }
  }
  return lead;
}

// 段落(P)→ 一或多個 Word 段落:<br> 拆段、編號小項用真正縮排對齊
function _parasFromP(el, opts) {
  opts = opts || {};
  const isSub = el.classList && el.classList.contains("sub-item");
  const isHeading = el.tagName === "P" && el.querySelector("b") && el.textContent.trim().length <= 16;
  const segs = _segmentsOf(el);
  return segs.map((seg, i) => {
    const lead = _stripLead(seg);
    const text = seg.textContent;
    const indent = (lead > 0 || /^\d+\.\d/.test(text)) ? DOCX_SUB_INDENT : 0;
    return new docx.Paragraph({
      children: _runsOf(seg, opts.size),
      alignment: docx.AlignmentType.JUSTIFIED,
      indent: indent ? { left: indent } : undefined,
      spacing: {
        before: i === 0 ? (isSub ? 10 : (isHeading ? 200 : 80)) : 30,
        after: i === segs.length - 1 ? (isSub ? 10 : 80) : 30
      },
      pageBreakBefore: !!opts.pageBreakBefore && i === 0
    });
  });
}

function _textPara(text, opts) {
  opts = opts || {};
  return new docx.Paragraph({
    children: [new docx.TextRun({ text, bold: opts.bold, size: opts.size || 24, color: opts.color })],
    alignment: opts.alignment,
    spacing: opts.spacing || { before: 40, after: 40 },
    pageBreakBefore: !!opts.pageBreakBefore,
    border: opts.border
  });
}

function _pageBreakPara() {
  return new docx.Paragraph({ children: [new docx.PageBreak()], spacing: { before: 0, after: 0, line: 240, lineRule: "auto" } });
}

// 付款表/階段表(有框、表頭底色、金額靠右)
function _tableFrom(tb, colWidths) {
  const rows = [];
  tb.querySelectorAll("tr").forEach(tr => {
    const cells = [];
    let ci = 0;
    Array.from(tr.cells).forEach(td => {
      const isHead = td.tagName === "TH";
      const span = td.colSpan || 1;
      let w = 0;
      for (let k = 0; k < span; k++) w += colWidths[ci + k] || 0;
      ci += span;
      const alignRight = td.classList.contains("cell-amount");
      const alignCenter = td.classList.contains("cell-pct") || isHead;
      cells.push(new docx.TableCell({
        width: { size: w, type: docx.WidthType.DXA },
        columnSpan: span > 1 ? span : undefined,
        borders: _gridBorder(),
        shading: isHead ? { fill: "FAF3D1" } : undefined,
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        verticalAlign: docx.VerticalAlign.TOP,
        children: [new docx.Paragraph({
          children: _runsOf(td, 21, isHead),
          alignment: alignRight ? docx.AlignmentType.RIGHT : (alignCenter ? docx.AlignmentType.CENTER : docx.AlignmentType.LEFT),
          spacing: { before: 0, after: 0, line: 280, lineRule: "auto" }
        })]
      }));
    });
    rows.push(new docx.TableRow({ children: cells }));
  });
  return new docx.Table({
    width: { size: DOCX_CONTENT_W, type: docx.WidthType.DXA },
    columnWidths: colWidths,
    rows
  });
}

// 立約人表(無框,標籤粗體)
function _partyTable(tb) {
  const rows = [];
  tb.querySelectorAll("tr").forEach(tr => {
    const cells = Array.from(tr.cells).map(td => new docx.TableCell({
      borders: _noBorder(),
      columnSpan: td.colSpan > 1 ? td.colSpan : undefined,
      margins: { top: 20, bottom: 20, left: 40, right: 40 },
      children: [new docx.Paragraph({
        children: _runsOf(td, 24, td.classList.contains("label")),
        spacing: { before: 0, after: 0, line: 300, lineRule: "auto" }
      })]
    }));
    rows.push(new docx.TableRow({ children: cells }));
  });
  return new docx.Table({ width: { size: DOCX_CONTENT_W, type: docx.WidthType.DXA }, rows });
}

// 簽名表(甲乙各半、值欄底線、列高預留用印)
function _signTable(tb) {
  const widths = [2725, 2321, 1716, 3330];
  const rows = [];
  Array.from(tb.rows).forEach((tr, ri) => {
    const cells = Array.from(tr.cells).map((td, ci) => {
      const borders = _noBorder();
      if (td.classList.contains("sv")) {
        borders.bottom = { style: docx.BorderStyle.DOTTED, size: 6, color: "999999" };
      }
      return new docx.TableCell({
        width: { size: widths[ci] || 1000, type: docx.WidthType.DXA },
        borders,
        verticalAlign: docx.VerticalAlign.BOTTOM,
        margins: { top: 20, bottom: 20, left: 20, right: 60 },
        children: [new docx.Paragraph({
          children: _runsOf(td, 21),
          spacing: { before: 0, after: 0, line: 260, lineRule: "auto" }
        })]
      });
    });
    rows.push(new docx.TableRow({
      height: { value: ri === 0 ? 900 : 540, rule: docx.HeightRule.ATLEAST },
      children: cells
    }));
  });
  return new docx.Table({ width: { size: DOCX_CONTENT_W, type: docx.WidthType.DXA }, columnWidths: widths, rows });
}

// 匯款資訊框(單格表格+底色)
function _infoBox(box) {
  const paras = [];
  const title = box.querySelector(".payment-info-title");
  if (title) {
    paras.push(new docx.Paragraph({
      children: _runsOf(title, 22, true),
      spacing: { before: 0, after: 60, line: 300, lineRule: "auto" }
    }));
  }
  const clone = box.cloneNode(true);
  const t2 = clone.querySelector(".payment-info-title");
  if (t2) t2.remove();
  _segmentsOf(clone).forEach(seg => {
    _stripLead(seg);
    paras.push(new docx.Paragraph({
      children: _runsOf(seg, 22),
      spacing: { before: 20, after: 20, line: 300, lineRule: "auto" }
    }));
  });
  const b = { style: docx.BorderStyle.SINGLE, size: 6, color: "998A2E" };
  return new docx.Table({
    width: { size: DOCX_CONTENT_W, type: docx.WidthType.DXA },
    rows: [new docx.TableRow({
      children: [new docx.TableCell({
        borders: { top: b, bottom: b, left: b, right: b },
        shading: { fill: "FFFDF3" },
        margins: { top: 80, bottom: 80, left: 160, right: 160 },
        children: paras
      })]
    })]
  });
}

function _logoRun() {
  if (typeof LOGO_DATA_URI === "undefined") return null;
  try {
    const b64 = LOGO_DATA_URI.split(",")[1];
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const img = document.querySelector(".cover-logo");
    const ratio = (img && img.naturalWidth) ? img.naturalHeight / img.naturalWidth : 0.22;
    return new docx.ImageRun({ type: "png", data: arr, transformation: { width: 150, height: Math.round(150 * ratio) } });
  } catch (e) { return null; }
}

// 封面(單頁)
function _coverChildren(cover) {
  const out = [];
  Array.from(cover.querySelector(".cover-title").textContent.trim()).forEach((ch, i) => {
    out.push(new docx.Paragraph({
      children: [new docx.TextRun({ text: ch, size: 44 })],
      alignment: docx.AlignmentType.CENTER,
      spacing: { before: i === 0 ? 1100 : 30, after: 30, line: 260, lineRule: "auto" }
    }));
  });
  const badge = cover.querySelector(".cover-badge");
  if (badge && badge.textContent.trim()) {
    out.push(_textPara(badge.textContent.trim(), {
      alignment: docx.AlignmentType.CENTER, bold: true, size: 21, color: "B8960C",
      spacing: { before: 60, after: 0, line: 260, lineRule: "auto" }
    }));
  }
  for (let i = 0; i < 5; i++) {
    out.push(new docx.Paragraph({ text: "", spacing: { before: 0, after: 0, line: 240, lineRule: "auto" } }));
  }

  const fieldParas = Array.from(cover.querySelectorAll(".cover-row")).map(r => {
    const label = r.querySelector(".cover-label");
    const fill = r.querySelector(".fill");
    const val = fill && fill.textContent.trim() ? fill.textContent.trim() : "　　　　　　　　　　";
    return new docx.Paragraph({
      children: [
        new docx.TextRun({ text: (label ? label.textContent.trim() : "") + "：", size: 22 }),
        new docx.TextRun({ text: val, size: 22, underline: { type: docx.UnderlineType.SINGLE } })
      ],
      spacing: { before: 40, after: 40, line: 280, lineRule: "auto" }
    });
  });
  const logoRun = _logoRun();
  out.push(new docx.Table({
    width: { size: DOCX_CONTENT_W, type: docx.WidthType.DXA },
    columnWidths: [4300, 5792],
    rows: [new docx.TableRow({
      children: [
        new docx.TableCell({
          borders: _noBorder(), verticalAlign: docx.VerticalAlign.BOTTOM,
          children: [logoRun
            ? new docx.Paragraph({ children: [logoRun], spacing: { before: 0, after: 0 } })
            : new docx.Paragraph({ text: "", spacing: { before: 0, after: 0 } })]
        }),
        new docx.TableCell({ borders: _noBorder(), verticalAlign: docx.VerticalAlign.BOTTOM, children: fieldParas })
      ]
    })]
  }));
  out.push(new docx.Paragraph({
    text: "", spacing: { before: 60, after: 20, line: 100, lineRule: "auto" },
    border: { bottom: { style: docx.BorderStyle.SINGLE, size: 12, color: "333333" } }
  }));
  const brand = cover.querySelector(".cover-brand-name");
  if (brand) {
    out.push(_textPara(brand.textContent.trim(), {
      size: 26, spacing: { before: 40, after: 20, line: 280, lineRule: "auto" }
    }));
  }
  const branches = cover.querySelector(".cover-branches");
  if (branches) {
    const runs = [];
    branches.querySelectorAll(".branch-chk").forEach(chk => {
      const sel = chk.classList.contains("selected");
      const name = chk.textContent.replace(/[■□✔]/g, "").trim();
      runs.push(new docx.TextRun({ text: (sel ? "■" : "□") + name + "　", size: 18 }));
    });
    out.push(new docx.Paragraph({ children: runs, spacing: { before: 0, after: 20, line: 240, lineRule: "auto" } }));
  }
  const bar = cover.querySelector(".cover-footer-bar");
  if (bar) {
    const cells = Array.from(bar.children).map(d => d.textContent.trim());
    const rows = [];
    for (let i = 0; i < cells.length; i += 2) {
      rows.push(new docx.TableRow({
        children: [
          new docx.TableCell({
            borders: _noBorder(),
            children: [_textPara(cells[i] || "", { size: 17, spacing: { before: 0, after: 0, line: 240, lineRule: "auto" } })]
          }),
          new docx.TableCell({
            borders: _noBorder(),
            children: [_textPara(cells[i + 1] || "", { size: 17, alignment: docx.AlignmentType.RIGHT, spacing: { before: 0, after: 0, line: 240, lineRule: "auto" } })]
          })
        ]
      }));
    }
    out.push(new docx.Table({ width: { size: DOCX_CONTENT_W, type: docx.WidthType.DXA }, columnWidths: [6000, 4092], rows }));
  }
  return out;
}

// 封底(分公司地址列表,單頁)
function _coverBackChildren(back) {
  const out = [];
  let first = true;
  Array.from(back.children).forEach(div => {
    if (div.classList.contains("branch-block")) {
      Array.from(div.children).forEach((line, li) => {
        out.push(new docx.Paragraph({
          children: [new docx.TextRun({ text: line.textContent.trim(), bold: li === 0, size: 18 })],
          spacing: { before: li === 0 && !first ? 70 : 0, after: 0, line: 250, lineRule: "auto" },
          pageBreakBefore: first && li === 0
        }));
        if (li === 0) first = false;
      });
    } else if (div.classList.contains("branch-email")) {
      out.push(new docx.Paragraph({
        children: [new docx.TextRun({ text: div.textContent.trim(), size: 18 })],
        spacing: { before: 140, after: 0, line: 250, lineRule: "auto" }
      }));
    }
  });
  return out;
}

// 內文區塊 → docx 元素
function _blockToDocx(el, pb) {
  if (el.tagName === "H1") {
    return [new docx.Paragraph({
      children: [new docx.TextRun({ text: el.textContent.trim(), bold: true, size: 36 })],
      alignment: docx.AlignmentType.CENTER,
      spacing: { before: 0, after: 240 },
      pageBreakBefore: pb
    })];
  }
  if (el.classList.contains("party-block")) {
    const arr = [];
    if (pb) arr.push(_pageBreakPara());
    arr.push(_partyTable(el.querySelector("table")));
    return arr;
  }
  if (el.tagName === "P") return _parasFromP(el, { pageBreakBefore: pb });
  if (el.tagName === "TABLE") {
    const arr = [];
    if (pb) arr.push(_pageBreakPara());
    const isStage = el.classList.contains("stage-table");
    arr.push(_tableFrom(el, isStage ? [1500, 4792, 800, 3000] : [1900, 4392, 800, 3000]));
    arr.push(new docx.Paragraph({ text: "", spacing: { before: 0, after: 0, line: 120, lineRule: "auto" } }));
    return arr;
  }
  if (el.classList.contains("payment-info-box")) {
    const arr = [];
    if (pb) arr.push(_pageBreakPara());
    arr.push(_infoBox(el));
    arr.push(new docx.Paragraph({ text: "", spacing: { before: 0, after: 0, line: 120, lineRule: "auto" } }));
    return arr;
  }
  if (el.classList.contains("appendix-list")) {
    return Array.from(el.children).map((d, i) => new docx.Paragraph({
      children: _runsOf(d, 24),
      spacing: { before: 20, after: 20 },
      pageBreakBefore: pb && i === 0
    }));
  }
  if (el.classList.contains("sign-area")) {
    const arr = [];
    if (pb) arr.push(_pageBreakPara());
    arr.push(_signTable(el.querySelector(".sign-table")));
    const df = el.querySelector(".doc-footer");
    if (df) {
      arr.push(_textPara(df.textContent.trim(), {
        alignment: docx.AlignmentType.CENTER, spacing: { before: 700, after: 0 }
      }));
    }
    return arr;
  }
  if (el.classList.contains("appendix-fixed")) {
    const arr = [];
    arr.push(new docx.Paragraph({
      text: "", pageBreakBefore: pb, spacing: { before: 0, after: 60, line: 100, lineRule: "auto" },
      border: { bottom: { style: docx.BorderStyle.DOTTED, size: 4, color: "AAAAAA" } }
    }));
    Array.from(el.children).forEach(p => arr.push(..._parasFromP(p)));
    return arr;
  }
  if (el.classList.contains("doc-footer")) {
    return [_textPara(el.textContent.trim(), {
      alignment: docx.AlignmentType.CENTER, spacing: { before: 700, after: 0 }, pageBreakBefore: pb
    })];
  }
  return _parasFromP(el, { pageBreakBefore: pb });
}

function _contractChildren(pages) {
  const out = [];
  pages.forEach((pg, pi) => {
    let needBreak = pi > 0; // 第一頁由分節自然開新頁,之後每頁強制分頁對齊預覽
    Array.from(pg.children).forEach(el => {
      if (el.classList.contains("page-footer")) return;
      const pb = needBreak;
      needBreak = false;
      out.push(..._blockToDocx(el, pb));
    });
  });
  return out;
}

async function exportWord() {
  const root = document.getElementById("previewRoot");
  const cover = root.querySelector(".cover-page");
  const back = root.querySelector(".cover-back-page");
  const contentPages = Array.from(root.querySelectorAll("section.contract-page"));
  const cfg = CONTRACT_TYPES[currentType];
  const docCode = cfg.version + "版" + cfg.label;

  const pageProps = {
    size: { width: 11906, height: 16838 },
    margin: { top: 1021, bottom: 1021, left: 907, right: 907 }
  };

  const footer = new docx.Footer({
    children: [new docx.Paragraph({
      tabStops: [{ type: docx.TabStopType.RIGHT, position: DOCX_CONTENT_W }],
      children: [
        new docx.TextRun({ text: "第 ", size: 16, color: "777777" }),
        new docx.TextRun({ children: [docx.PageNumber.CURRENT], size: 16, color: "777777" }),
        new docx.TextRun({ text: " 頁\t" + docCode, size: 16, color: "777777" })
      ],
      border: { top: { style: docx.BorderStyle.SINGLE, size: 2, color: "CCCCCC" } }
    })]
  });

  const doc = new docx.Document({
    styles: {
      default: {
        document: {
          run: { font: { ascii: "SimSun", eastAsia: "SimSun", hAnsi: "SimSun" }, size: 24 },
          paragraph: { spacing: { line: 340, lineRule: "auto" } }
        }
      }
    },
    sections: [
      {
        properties: { page: pageProps },
        children: [..._coverChildren(cover), ..._coverBackChildren(back)]
      },
      {
        properties: { page: Object.assign({}, pageProps, { pageNumbers: { start: 1 } }) },
        footers: { default: footer },
        children: _contractChildren(contentPages)
      }
    ]
  });

  const blob = await docx.Packer.toBlob(doc);
  downloadBlob(blob, buildFileName("docx"));
}

// ---------------- 事件綁定 ----------------

function switchType(type) {
  currentType = type;
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.type === type);
  });
  const isEng = type === "engineering";
  document.getElementById("fieldset_engineering").style.display = isEng ? "" : "none";
  document.getElementById("fieldset_eng_payment").style.display = isEng ? "" : "none";
  document.getElementById("fieldset_eng_appendix").style.display = isEng ? "" : "none";
  document.getElementById("fieldset_design").style.display = isEng ? "none" : "";
  populateBranchSelect(type);
  applyBranchDefaults(type, CONTRACT_TYPES[type].partyB.defaultBranch);
  syncAllFromCover();

  if (type !== "engineering") {
    const variant = type === "design_custom" ? "custom" : "general";
    const defaults = STAGE_DEFAULT_PCT[variant];
    setVal("design_pct1", defaults[0]);
    setVal("design_pct2", defaults[1]);
    setVal("design_pct3", defaults[2]);
    setVal("design_pct4", defaults[3] ?? "");
    document.getElementById("pct4Wrapper").style.display = "";
  }

  render();
}

document.addEventListener("DOMContentLoaded", () => {
  const signDateInput = document.getElementById("signDateInput");
  signDateInput.value = new Date().toISOString().slice(0, 10);

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchType(btn.dataset.type));
  });

  document.getElementById("branchSelect").addEventListener("change", (e) => {
    applyBranchDefaults(currentType, e.target.value);
    syncAllFromCover();
    render();
  });

  document.getElementById("engPresetSelect").addEventListener("change", (e) => {
    applyEngPreset(e.target.value);
    render();
  });
  document.getElementById("engInstallmentCount").addEventListener("change", () => {
    updateEngRowVisibility();
    render();
  });

  applyEngPreset("standard");

  document.getElementById("contractForm").addEventListener("input", (e) => {
    if (e.target && e.target.name) syncLinkedFields(e.target.name);
    render();
  });

  document.getElementById("btnPrint").addEventListener("click", () => window.print());
  document.getElementById("btnWord").addEventListener("click", exportWord);
  document.getElementById("btnReset").addEventListener("click", () => {
    document.getElementById("contractForm").reset();
    signDateInput.value = new Date().toISOString().slice(0, 10);
    switchType(currentType);
    applyEngPreset(document.getElementById("engPresetSelect").value);
  });

  switchType("engineering");
});
