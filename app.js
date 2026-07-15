// ---------------- 資料設定 ----------------

// 分公司資料來源：fullhouseid.com 官網「公司組織．分公司」各分點頁面(2026-07 擷取)
// 注意：官網「中山公司」頁面位址與「大安公司」相同、「南西公司」頁面位址與「民生公司」相同，
// 疑似官網資料尚未更新，先照官網現況列出，可於表單中手動修正。
const BRANCHES = {
  "承德公司": { short: "承德", addr: "103 台北市大同區承德路1段17號B棟6F-1", tel: "+886-2-2556-1197", fax: "+886-2-2558-4694" },
  "大安公司": { short: "大安", addr: "106 台北市大安區復興南路一段203號12樓", tel: "+886-2-8772-0899", fax: "+886-2-8772-5699" },
  "復興一部": { short: "復興一部", addr: "105 台北市松山區復興北路35號10F", tel: "+886-2-2778-3398", fax: "+886-2-2778-3435" },
  "復興二部": { short: "復興二部", addr: "台北市敦化北路309號3樓之3", tel: "+886-2-8772-1277", fax: "+886-2-2713-8939" },
  "復興台中": { short: "復興台中", addr: "403 台中市西區台灣大道二段218號6樓之3", tel: "+886-4-2328-6008", fax: "+886-4-2328-6001" },
  "忠孝公司": { short: "忠孝", addr: "110 台北市信義區忠孝東路5段1-5號12F", tel: "+886-2-3765-3933", fax: "+886-2-3765-3935" },
  "民生公司": { short: "民生", addr: "104 台北市中山區民生東路2段143號6F", tel: "+886-2-2507-2578", fax: "+886-2-2506-5478" },
  "中山公司": { short: "中山", addr: "106 台北市大安區復興南路一段203號12樓", tel: "+886-2-7729-7155", fax: "+886-2-8772-5699" },
  "中山台南": { short: "台南", addr: "700 台南市西門路三段159號8樓之3", tel: "+886-6-222-3058", fax: "+886-6-222-3239" },
  "南西公司": { short: "南西", addr: "104 台北市中山區民生東路2段143號6F", tel: "+886-2-2555-5918", fax: "+886-2-2506-5478" },
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

const CONTRACT_TYPES = {
  engineering: { label: "工程合約", branches: BRANCHES, partyB: PARTY_B_DEFAULT, titleText: "工程合約書", badge: "", template: TEMPLATE_ENGINEERING },
  design_general: { label: "設計合約", branches: BRANCHES, partyB: PARTY_B_DEFAULT, titleText: "設計合約書", badge: "", template: TEMPLATE_DESIGN_GENERAL },
  design_custom: { label: "客變專用合約", branches: BRANCHES, partyB: PARTY_B_DEFAULT, titleText: "設計合約書", badge: "（客變專用）", template: TEMPLATE_DESIGN_CUSTOM }
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
    const cls = name === selected ? "branch-chk selected" : "branch-chk";
    return `<span class="${cls}"><span class="box"></span>${branches[name].short}</span>`;
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
    { name: "第二階段", items: ["初步規劃","平面配置圖","與甲方討論後設計定案（設計構想、色彩搭配、取材風格）","隔間放樣圖","地板配置圖","天花板配置圖","空調配置圖","天花板燈具及開關配置圖","迴路配置圖","水電配置圖"] },
    { name: "第三階段", items: ["各向立面圖","剖面施工圖","工程預算書","建材選樣"] }
  ],
  custom: [
    { name: "簽約款", items: ["設計合約書簽定"] },
    { name: "第一階段", items: ["初步規劃及平面圖","與甲方討論後設計定案（設計構想、色彩搭配、取材風格）","隔間放樣圖","水電配置圖","天花板燈具及開關配置圖","地板配置圖","協助客戶變更選材"] },
    { name: "第二階段", items: ["基本Sketchup 3D模型","天花板及空調配置圖","迴路配置圖","建材樣品板","重點立面及剖面"] },
    { name: "第三階段", items: ["立面施工圖","細部及剖面設計圖","編訂工程預算書"] }
  ]
};

const STAGE_DEFAULT_PCT = {
  general: [60, 30, 10],
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
    .replace(/<br>\s*(?=　[\(（]?\d)/g, "</p><p>")
    .replace(/<br>\s*(?=\d\.\d　)/g, "</p><p>");
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
  const availHeight = (297 - 18 - 18) * mm - 62; // A4 高度 － 上下留白 － 頁尾（含列印誤差安全邊距）

  const blocks = Array.from(measurer.children).map(el => {
    const st = getComputedStyle(el);
    const mT = parseFloat(st.marginTop), mB = parseFloat(st.marginBottom);
    return {
      html: el.outerHTML,
      h: el.offsetHeight + mT + mB,
      isHeading: el.tagName === "P" && !!el.querySelector("b") && el.textContent.trim().length <= 16
    };
  });
  document.body.removeChild(measurer);

  // 表格（及所有區塊）整塊不跨頁；條文標題不孤懸頁底
  const pages = [];
  let cur = [];
  let curH = 0;
  blocks.forEach((b, i) => {
    const next = blocks[i + 1];
    const groupH = (b.isHeading && next) ? b.h + next.h : b.h;
    if (cur.length && curH + groupH > availHeight) {
      pages.push(cur);
      cur = [];
      curH = 0;
    }
    cur.push(b.html);
    curH += b.h;
  });
  if (cur.length) pages.push(cur);

  const total = pages.length;
  return pages.map((els, i) =>
    `<section class="page contract-page">${els.join("")}` +
    `<div class="page-footer"><span>第 ${i + 1} 頁，共 ${total} 頁</span><span>${docCode}</span></div>` +
    `</section>`
  ).join("");
}

// ---------------- 表單 <-> 分公司預設值 ----------------

function setVal(name, value) {
  const el = document.querySelector(`[name="${name}"]`);
  if (el) el.value = value ?? "";
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
  d.eng_totalAmount_capital = numberToChineseCapital(d.eng_totalAmount);
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
  d.design_totalFee_capital = numberToChineseCapital(totalFee);

  const pctInputs = [d.design_pct1, d.design_pct2, d.design_pct3, d.design_pct4];
  const pcts = STAGE_DEFAULT_PCT[variant].map((def, i) => (pctInputs[i] === undefined || pctInputs[i] === "") ? def : Number(pctInputs[i]));
  d.design_signFee = totalFee ? fmtMoney(totalFee * (pcts[0] / 100)) : "";
  d.design_caseDate = d.design_caseDate || toRocFullDate(d.signDate) || "　　年　　月　　日";
  d.design_signDate_roc = "中華民國" + (toRocFullDate(d.signDate) || "　　年　　月　　日");
  d.cover_date = toRocFullDate(d.signDate) || "";

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
  d.SIGN_BLOCK = fillTemplate(SIGN_BLOCK_TEMPLATE, d);
  d.coverTitleChars = cfg.titleText.split("").join("<br>");
  d.coverBadge = cfg.badge;
  d.BRANCH_LIST = buildBranchList(cfg.branches, d.branch);
  d.BRANCH_ADDRESS_LIST = buildBranchAddressList(cfg.branches);
  d.COVER_FOOTER = buildCoverFooter(cfg.branches, d.branch);

  const docCode = new Date().toISOString().slice(0, 10).replace(/-/g, "") + cfg.label;
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

const WORD_EXPORT_CSS = `
body{font-family:"SimSun","宋体","NSimSun","PMingLiU","新細明體",serif;font-size:12pt;line-height:1.9;}
.page{page-break-after:always;}
table{border-collapse:collapse;width:100%;page-break-inside:avoid;}
tr{page-break-inside:avoid;}
td,th{border:1px solid #999;padding:5px 7px;font-size:11.5pt;vertical-align:top;}
.doc-title{text-align:center;font-size:18pt;font-weight:bold;margin-bottom:16pt;letter-spacing:6px;}
.cover-title{text-align:center;font-size:20pt;font-weight:bold;letter-spacing:4px;}
.fill{border-bottom:1px solid #999;padding:0 4px;}
p{margin:6pt 0;text-align:justify;}
.doc-footer{text-align:center;margin-top:20pt;}
`;

function exportWord() {
  const previewHtml = document.getElementById("previewRoot").innerHTML;
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${WORD_EXPORT_CSS}</style></head><body>${previewHtml}</body></html>`;
  const blob = htmlDocx.asBlob(fullHtml);
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

  if (type !== "engineering") {
    const variant = type === "design_custom" ? "custom" : "general";
    const defaults = STAGE_DEFAULT_PCT[variant];
    setVal("design_pct1", defaults[0]);
    setVal("design_pct2", defaults[1]);
    setVal("design_pct3", defaults[2]);
    setVal("design_pct4", defaults[3] ?? "");
    document.getElementById("pct4Wrapper").style.display = (variant === "custom") ? "" : "none";
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

  document.getElementById("contractForm").addEventListener("input", render);

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
