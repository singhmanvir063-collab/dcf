import { useState, useMemo, useCallback, useEffect } from "react";

const FONTS = "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Instrument+Sans:wght@400;500;600;700&display=swap";

/* ═══════════════════════════════════════════
   PRE-LOADED COMPANY DATA (Real SEC Filings)
   ═══════════════════════════════════════════ */
const COMPANIES = {
  AAPL: {
    name: "Apple Inc.", sector: "Technology", price: 230,
    revenue: 383285, ebitdaMargin: 33.5, daPercent: 3.0, capexPercent: 2.8,
    taxRate: 16.2, netDebt: 49230, shares: 15460, beta: 1.24,
    growth: [2.0, 5.0, 6.0, 5.0, 4.0],
    margins: [33.5, 33.8, 34.0, 34.2, 34.5],
  },
  MSFT: {
    name: "Microsoft Corp.", sector: "Technology", price: 420,
    revenue: 245122, ebitdaMargin: 53.0, daPercent: 5.6, capexPercent: 14.0,
    taxRate: 18.5, netDebt: -36200, shares: 7430, beta: 0.90,
    growth: [16.0, 14.0, 12.0, 10.0, 9.0],
    margins: [53.0, 53.5, 54.0, 54.5, 55.0],
  },
  GOOGL: {
    name: "Alphabet Inc.", sector: "Technology", price: 175,
    revenue: 350018, ebitdaMargin: 38.0, daPercent: 5.8, capexPercent: 14.6,
    taxRate: 14.0, netDebt: -90800, shares: 12160, beta: 1.06,
    growth: [14.0, 12.0, 10.0, 9.0, 8.0],
    margins: [38.0, 38.5, 39.0, 39.5, 40.0],
  },
  AMZN: {
    name: "Amazon.com Inc.", sector: "Consumer / Cloud", price: 205,
    revenue: 637997, ebitdaMargin: 17.8, daPercent: 7.2, capexPercent: 12.5,
    taxRate: 14.8, netDebt: -23600, shares: 10520, beta: 1.15,
    growth: [11.0, 11.0, 10.0, 9.0, 8.0],
    margins: [17.8, 18.5, 19.2, 20.0, 20.8],
  },
  NVDA: {
    name: "NVIDIA Corp.", sector: "Semiconductors", price: 130,
    revenue: 130497, ebitdaMargin: 65.0, daPercent: 2.0, capexPercent: 2.5,
    taxRate: 12.5, netDebt: -18000, shares: 24500, beta: 1.70,
    growth: [55.0, 30.0, 20.0, 15.0, 12.0],
    margins: [65.0, 63.0, 61.0, 59.0, 57.0],
  },
  TSLA: {
    name: "Tesla Inc.", sector: "Auto / Energy", price: 270,
    revenue: 97690, ebitdaMargin: 17.5, daPercent: 6.5, capexPercent: 9.8,
    taxRate: 16.0, netDebt: -20300, shares: 3210, beta: 2.30,
    growth: [8.0, 15.0, 18.0, 15.0, 12.0],
    margins: [17.5, 18.5, 19.5, 20.5, 21.5],
  },
  META: {
    name: "Meta Platforms Inc.", sector: "Technology", price: 600,
    revenue: 164710, ebitdaMargin: 50.0, daPercent: 7.0, capexPercent: 24.0,
    taxRate: 13.5, netDebt: -34400, shares: 2530, beta: 1.25,
    growth: [20.0, 15.0, 12.0, 10.0, 8.0],
    margins: [50.0, 49.0, 48.0, 47.5, 47.0],
  },
  JPM: {
    name: "JPMorgan Chase & Co.", sector: "Financials", price: 250,
    revenue: 177600, ebitdaMargin: 45.0, daPercent: 2.0, capexPercent: 3.5,
    taxRate: 22.0, netDebt: 250000, shares: 2860, beta: 1.10,
    growth: [5.0, 4.0, 4.0, 3.0, 3.0],
    margins: [45.0, 45.0, 44.5, 44.0, 44.0],
  },
  JNJ: {
    name: "Johnson & Johnson", sector: "Healthcare", price: 155,
    revenue: 89008, ebitdaMargin: 34.0, daPercent: 4.5, capexPercent: 4.8,
    taxRate: 17.5, netDebt: 14600, shares: 2410, beta: 0.52,
    growth: [4.0, 4.5, 4.0, 3.5, 3.0],
    margins: [34.0, 34.5, 35.0, 35.5, 36.0],
  },
  XOM: {
    name: "Exxon Mobil Corp.", sector: "Energy", price: 110,
    revenue: 344582, ebitdaMargin: 19.0, daPercent: 5.5, capexPercent: 7.0,
    taxRate: 25.0, netDebt: 16800, shares: 4230, beta: 0.85,
    growth: [-2.0, 1.0, 2.0, 2.0, 1.5],
    margins: [19.0, 18.5, 18.0, 17.5, 17.0],
  },
  WMT: {
    name: "Walmart Inc.", sector: "Consumer Retail", price: 95,
    revenue: 674538, ebitdaMargin: 6.2, daPercent: 1.7, capexPercent: 3.2,
    taxRate: 24.5, netDebt: 36200, shares: 8050, beta: 0.55,
    growth: [5.0, 4.5, 4.0, 3.5, 3.0],
    margins: [6.2, 6.3, 6.4, 6.5, 6.6],
  },
  DIS: {
    name: "The Walt Disney Co.", sector: "Media / Entertainment", price: 110,
    revenue: 91361, ebitdaMargin: 22.0, daPercent: 5.5, capexPercent: 6.8,
    taxRate: 21.0, netDebt: 33100, shares: 1820, beta: 1.35,
    growth: [4.0, 5.0, 5.0, 4.0, 3.5],
    margins: [22.0, 23.0, 24.0, 25.0, 25.5],
  },
};

const TICKERS = Object.keys(COMPANIES);

/* ── Helpers ── */
const fmt = (n, d = 0) => {
  if (n == null || isNaN(n)) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
};

/* ── DCF Engine ── */
function runDCF(a) {
  const proj = [];
  let rev = a.currentRevenue;
  for (let i = 0; i < 5; i++) {
    rev *= 1 + a.revenueGrowth[i] / 100;
    const ebitda = rev * a.ebitdaMargin[i] / 100;
    const da = rev * a.daPercent / 100;
    const ebit = ebitda - da;
    const taxes = Math.max(0, ebit * a.taxRate / 100);
    const nopat = ebit - taxes;
    const capex = rev * a.capexPercent / 100;
    const nwc = rev * a.nwcPercent / 100;
    const fcf = nopat + da - capex - nwc;
    const df = 1 / Math.pow(1 + a.wacc / 100, i + 1);
    proj.push({ year: i + 1, revenue: rev, ebitda, da, ebit, taxes, nopat, capex, nwc, fcf, df, pvFCF: fcf * df });
  }
  const lastFCF = proj[4].fcf;
  const w = a.wacc / 100, g = a.terminalGrowth / 100;
  if (w <= g) return { proj, tv: 0, pvTV: 0, sumPV: 0, ev: 0, eq: 0, pps: 0, tvPct: 0 };
  const tv = (lastFCF * (1 + g)) / (w - g);
  const pvTV = tv / Math.pow(1 + w, 5);
  const sumPV = proj.reduce((s, p) => s + p.pvFCF, 0);
  const ev = sumPV + pvTV;
  const eq = ev - a.netDebt;
  const pps = a.sharesOutstanding > 0 ? eq / a.sharesOutstanding : 0;
  return { proj, tv, pvTV, sumPV, ev, eq, pps, tvPct: ev > 0 ? (pvTV / ev) * 100 : 0 };
}

function buildSens(a) {
  const wR = [-2, -1, 0, 1, 2].map(d => a.wacc + d);
  const tR = [-1.5, -0.75, 0, 0.75, 1.5].map(d => +(Math.max(0.1, a.terminalGrowth + d)).toFixed(2));
  const grid = wR.map(w => tR.map(tg => w / 100 <= tg / 100 ? null : runDCF({ ...a, wacc: w, terminalGrowth: tg }).pps));
  return { wR, tR, grid };
}

function calcWACC(beta) {
  const rf = 4.2, mrp = 5.5;
  return +(Math.min(Math.max(rf + beta * mrp, 7), 18)).toFixed(1);
}

/* ── Styles ── */
const LIGHT = {
  bg: "#f7f8fa", card: "#fff", border: "#e4e7ec", text: "#1b1f2e",
  sub: "#5f6b7a", muted: "#97a0ae", accent: "#2563eb", accentBg: "#f0f4ff",
  green: "#059669", red: "#dc2626", greenBg: "#05966910", redBg: "#dc262610",
  inputBg: "#fff",
};

const DARK = {
  bg: "#0f1117", card: "#1a1d28", border: "#2a2e3b", text: "#e4e7ec",
  sub: "#9ca3b0", muted: "#6b7280", accent: "#3b82f6", accentBg: "#3b82f615",
  green: "#10b981", red: "#ef4444", greenBg: "#10b98115", redBg: "#ef444415",
  inputBg: "#232636",
};

const FONTS_SHARED = {
  mono: "'IBM Plex Mono', monospace", sans: "'Instrument Sans', sans-serif",
};

function getTheme(dark) {
  return { ...(dark ? DARK : LIGHT), ...FONTS_SHARED };
}

function getInputBase(S) {
  return {
    padding: "7px 10px", background: S.inputBg, border: `1px solid ${S.border}`,
    borderRadius: 6, color: S.text, fontFamily: S.mono, fontSize: 13, outline: "none",
  };
}

/* ── Sub-Components ── */
function Field({ label, value, onChange, suffix, w = 90, S }) {
  const iBase = getInputBase(S);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 10, fontFamily: S.mono, color: S.muted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input type="number" value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)}
          style={{ ...iBase, width: w, paddingRight: suffix ? 24 : 10 }} />
        {suffix && <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: S.muted, fontFamily: S.mono }}>{suffix}</span>}
      </div>
    </div>
  );
}

function YearInputs({ label, values, onChange, S }) {
  const iBase = getInputBase(S);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 10, fontFamily: S.mono, color: S.muted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>{label}</label>
      <div style={{ display: "flex", gap: 4 }}>
        {values.map((v, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: S.muted, fontFamily: S.mono, marginBottom: 2 }}>Y{i + 1}</div>
            <input type="number" value={v}
              onChange={e => { const n = [...values]; n[i] = parseFloat(e.target.value) || 0; onChange(n); }}
              style={{ ...iBase, width: 48, textAlign: "center", padding: "6px 4px", fontSize: 12 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ title, tag, children, S }) {
  return (
    <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, padding: "20px 24px" }}>
      {(title || tag) && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          {title && <div style={{ fontSize: 11, fontFamily: S.mono, color: S.accent, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</div>}
          {tag && <span style={{ fontSize: 9, fontFamily: S.mono, background: S.accentBg, color: S.accent, padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{tag}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

function ThemeToggle({ dark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        position: "fixed", top: 18, right: 18, zIndex: 999,
        width: 40, height: 40, borderRadius: "50%",
        border: "1px solid " + (dark ? "#2a2e3b" : "#e4e7ec"),
        background: dark ? "#1a1d28" : "#fff",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: dark ? "0 2px 12px rgba(0,0,0,0.5)" : "0 2px 12px rgba(0,0,0,0.08)",
        transition: "all 0.3s ease",
      }}
    >
      {dark ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

/* ── MAIN ── */
const TABS = ["Model", "Sensitivity", "Valuation"];

export default function DCFApp() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("dcf-dark-mode") === "true"; } catch { return false; }
  });
  const S = useMemo(() => getTheme(dark), [dark]);

  useEffect(() => {
    try { localStorage.setItem("dcf-dark-mode", dark); } catch {}
  }, [dark]);

  const [selectedTicker, setSelectedTicker] = useState("");
  const [tab, setTab] = useState("Model");

  const [a, setA] = useState({
    currentRevenue: 10000, revenueGrowth: [10, 8, 7, 6, 5],
    ebitdaMargin: [25, 25.5, 26, 26.5, 27], daPercent: 3.5, capexPercent: 4.0,
    nwcPercent: 1.5, taxRate: 21, wacc: 10, terminalGrowth: 2.5,
    netDebt: 2000, sharesOutstanding: 500,
  });

  const [companyMeta, setCompanyMeta] = useState({ name: "", sector: "", price: null });

  const u = useCallback((k, v) => setA(p => ({ ...p, [k]: v })), []);

  const loadCompany = (ticker) => {
    const co = COMPANIES[ticker];
    if (!co) return;
    setSelectedTicker(ticker);
    setCompanyMeta({ name: co.name, sector: co.sector, price: co.price });
    setA({
      currentRevenue: co.revenue,
      revenueGrowth: [...co.growth],
      ebitdaMargin: [...co.margins],
      daPercent: co.daPercent,
      capexPercent: co.capexPercent,
      nwcPercent: 1.5,
      taxRate: co.taxRate,
      wacc: calcWACC(co.beta),
      terminalGrowth: 2.5,
      netDebt: co.netDebt,
      sharesOutstanding: co.shares,
    });
    setTab("Model");
  };

  const r = useMemo(() => runDCF(a), [a]);
  const s = useMemo(() => buildSens(a), [a]);
  const pos = r.pps > 0;
  const price = companyMeta.price;
  const upside = price && r.pps ? ((r.pps - price) / price) * 100 : null;

  const th = { padding: "8px 12px", textAlign: "right", fontSize: 10, fontFamily: S.mono, color: S.muted, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `2px solid ${S.border}`, fontWeight: 500 };
  const td = (hl) => ({ padding: "7px 12px", textAlign: "right", fontSize: 12, fontFamily: S.mono, color: hl ? S.accent : S.text, fontWeight: hl ? 600 : 400, borderBottom: `1px solid ${S.bg}` });

  return (
    <>
      <link href={FONTS} rel="stylesheet" />
      <style>{`
        .ticker-btn { padding: 8px 14px; border: 1px solid ${S.border}; border-radius: 8px; background: ${S.card}; cursor: pointer; font-family: ${S.mono}; font-size: 12px; color: ${S.text}; transition: all 0.15s; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; min-width: 110px; }
        .ticker-btn:hover { border-color: ${S.accent}; background: ${S.accentBg}; }
        .ticker-btn.active { border-color: ${S.accent}; background: ${S.accentBg}; box-shadow: 0 0 0 1px ${S.accent}; }
        .ticker-btn .sym { font-weight: 700; font-size: 13px; }
        .ticker-btn .nm { font-size: 9px; color: ${S.muted}; font-family: ${S.sans}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px; }
        input[type="number"] { color-scheme: ${dark ? "dark" : "light"}; }
      `}</style>
      <ThemeToggle dark={dark} onToggle={() => setDark(d => !d)} />
      <div style={{ minHeight: "100vh", background: S.bg, color: S.text, fontFamily: S.sans, padding: "28px 20px", transition: "background 0.3s ease, color 0.3s ease" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>

          {/* ── Header ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${S.border}` }}>
            <div>
              <div style={{ fontFamily: S.mono, fontSize: 10, color: S.accent, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>DCF Valuation Engine</div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: "-0.025em", color: S.text }}>
                {companyMeta.name ? `${companyMeta.name}` : "Discounted Cash Flow Model"}
              </h1>
              {companyMeta.name ? (
                <p style={{ fontSize: 12, color: S.muted, margin: "4px 0 0", fontFamily: S.mono }}>
                  {selectedTicker} · {companyMeta.sector} · Revenue: ${fmt(a.currentRevenue)}M
                </p>
              ) : (
                <p style={{ fontSize: 12, color: S.muted, margin: "4px 0 0" }}>Select a company below or adjust assumptions manually</p>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: S.mono, fontSize: 30, fontWeight: 700, color: pos ? S.green : S.red, letterSpacing: "-0.02em" }}>
                ${r.pps.toFixed(2)}
              </div>
              <div style={{ fontSize: 10, color: S.muted, fontFamily: S.mono, textTransform: "uppercase", letterSpacing: "0.05em" }}>Implied Price</div>
              {upside !== null && (
                <div style={{ fontFamily: S.mono, fontSize: 11, marginTop: 4, color: upside >= 0 ? S.green : S.red, fontWeight: 600 }}>
                  {upside >= 0 ? "+" : ""}{upside.toFixed(1)}% vs. ${price} mkt
                </div>
              )}
            </div>
          </div>

          {/* ── Company Selector ── */}
          <Card title="Select Company" tag="SEC FILING DATA" S={S}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TICKERS.map(t => (
                <button key={t} className={`ticker-btn ${selectedTicker === t ? "active" : ""}`} onClick={() => loadCompany(t)}>
                  <span className="sym">{t}</span>
                  <span className="nm">{COMPANIES[t].name.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* ── Tabs ── */}
          <div style={{ display: "flex", gap: 0, marginTop: 20, marginBottom: 20, borderBottom: `1px solid ${S.border}` }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "10px 18px", background: "none", border: "none", cursor: "pointer",
                borderBottom: tab === t ? `2px solid ${S.accent}` : "2px solid transparent",
                color: tab === t ? S.text : S.muted,
                fontFamily: S.mono, fontSize: 11, fontWeight: tab === t ? 600 : 400,
                letterSpacing: "0.04em", textTransform: "uppercase", transition: "all 0.15s",
              }}>{t}</button>
            ))}
          </div>

          {/* ══ MODEL ══ */}
          {tab === "Model" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Card title="Assumptions" S={S}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 14, marginBottom: 18 }}>
                  <Field label="Revenue ($M)" value={a.currentRevenue} onChange={v => u("currentRevenue", v)} w={110} S={S} />
                  <Field label="Net Debt ($M)" value={a.netDebt} onChange={v => u("netDebt", v)} w={100} S={S} />
                  <Field label="Shares (M)" value={a.sharesOutstanding} onChange={v => u("sharesOutstanding", v)} w={90} S={S} />
                  <Field label="Tax Rate" value={a.taxRate} onChange={v => u("taxRate", v)} suffix="%" w={64} S={S} />
                  <Field label="WACC" value={a.wacc} onChange={v => u("wacc", v)} suffix="%" w={64} S={S} />
                  <Field label="Terminal g" value={a.terminalGrowth} onChange={v => u("terminalGrowth", v)} suffix="%" w={64} S={S} />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 18 }}>
                  <YearInputs label="Revenue Growth (%)" values={a.revenueGrowth} onChange={v => u("revenueGrowth", v)} S={S} />
                  <YearInputs label="EBITDA Margin (%)" values={a.ebitdaMargin} onChange={v => u("ebitdaMargin", v)} S={S} />
                </div>
                <div style={{ display: "flex", gap: 14 }}>
                  <Field label="D&A % Rev" value={a.daPercent} onChange={v => u("daPercent", v)} suffix="%" w={64} S={S} />
                  <Field label="CapEx % Rev" value={a.capexPercent} onChange={v => u("capexPercent", v)} suffix="%" w={64} S={S} />
                  <Field label="ΔNWC % Rev" value={a.nwcPercent} onChange={v => u("nwcPercent", v)} suffix="%" w={64} S={S} />
                </div>
              </Card>

              <Card title="Projected Financials ($M)" S={S}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ ...th, textAlign: "left" }}>Line Item</th>
                        {[1,2,3,4,5].map(y => <th key={y} style={th}>Year {y}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { l: "Revenue", k: "revenue" }, { l: "EBITDA", k: "ebitda" },
                        { l: "D&A", k: "da" }, { l: "EBIT", k: "ebit" },
                        { l: "Taxes", k: "taxes" }, { l: "NOPAT", k: "nopat" },
                        { l: "CapEx", k: "capex" }, { l: "ΔNWC", k: "nwc" },
                        { l: "Free Cash Flow", k: "fcf", hl: true },
                        { l: "PV of FCF", k: "pvFCF", hl: true },
                      ].map((row, i) => (
                        <tr key={i} style={row.hl ? { background: S.accentBg } : {}}>
                          <td style={{ ...td(row.hl), textAlign: "left", fontSize: 11 }}>{row.l}</td>
                          {r.proj.map((p, j) => <td key={j} style={td(row.hl)}>{fmt(p[row.k], 1)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ══ SENSITIVITY ══ */}
          {tab === "Sensitivity" && (
            <Card title="Sensitivity — Implied Share Price" S={S}>
              <p style={{ fontSize: 12, color: S.sub, margin: "0 0 16px" }}>WACC (rows) × Terminal Growth (columns). Base case outlined.</p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ ...th, textAlign: "center", fontSize: 9 }}>WACC \ Tg</th>
                      {s.tR.map((tg, i) => <th key={i} style={{ ...th, textAlign: "center" }}>{tg.toFixed(2)}%</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {s.grid.map((row, ri) => (
                      <tr key={ri}>
                        <td style={{ padding: "10px 12px", textAlign: "center", fontFamily: S.mono, fontSize: 12, fontWeight: 500, color: S.sub, borderBottom: `1px solid ${S.bg}` }}>{s.wR[ri].toFixed(1)}%</td>
                        {row.map((val, ci) => {
                          const isBase = s.wR[ri] === a.wacc && Math.abs(s.tR[ci] - a.terminalGrowth) < 0.01;
                          return (
                            <td key={ci} style={{
                              padding: "10px 12px", textAlign: "center", fontFamily: S.mono, fontSize: 12,
                              borderBottom: `1px solid ${S.bg}`,
                              color: val === null ? S.muted : val > 0 ? S.green : S.red,
                              fontWeight: isBase ? 700 : 400,
                              background: isBase ? S.accentBg : "transparent",
                              outline: isBase ? `2px solid ${S.accent}` : "none",
                              borderRadius: isBase ? 4 : 0,
                            }}>
                              {val === null ? "N/A" : "$" + val.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ══ VALUATION ══ */}
          {tab === "Valuation" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, padding: "36px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 10, fontFamily: S.mono, color: S.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                  {companyMeta.name ? `${selectedTicker} — ` : ""}Implied Equity Value Per Share
                </div>
                <div style={{ fontFamily: S.mono, fontSize: 44, fontWeight: 700, color: pos ? S.green : S.red, letterSpacing: "-0.02em" }}>${r.pps.toFixed(2)}</div>

                {upside !== null && (
                  <div style={{
                    display: "inline-block", marginTop: 14, padding: "6px 18px", borderRadius: 20,
                    background: upside >= 0 ? S.greenBg : S.redBg,
                    border: `1px solid ${upside >= 0 ? S.green : S.red}33`,
                  }}>
                    <span style={{ fontFamily: S.mono, fontSize: 13, color: upside >= 0 ? S.green : S.red, fontWeight: 600 }}>
                      {upside >= 0 ? "▲" : "▼"} {Math.abs(upside).toFixed(1)}% {upside >= 0 ? "Upside" : "Downside"} vs. ${price.toFixed(2)} Market
                    </span>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "center", gap: 36, marginTop: 28 }}>
                  {[
                    { l: "Enterprise Value", v: `$${fmt(r.ev, 1)}M` },
                    { l: "Equity Value", v: `$${fmt(r.eq, 1)}M` },
                    { l: "TV % of EV", v: `${r.tvPct.toFixed(1)}%` },
                  ].map((m, i) => (
                    <div key={i} style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: S.mono, fontSize: 16, fontWeight: 600, color: S.text }}>{m.v}</div>
                      <div style={{ fontSize: 10, color: S.muted, fontFamily: S.mono, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>{m.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              <Card title="Valuation Bridge ($M)" S={S}>
                {[
                  { l: "PV of Projected FCFs (Yr 1–5)", v: r.sumPV },
                  { l: "PV of Terminal Value", v: r.pvTV },
                  { l: "Enterprise Value", v: r.ev, b: true },
                  { l: "Less: Net Debt", v: -a.netDebt },
                  { l: "Equity Value", v: r.eq, b: true },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", padding: "10px 0",
                    borderBottom: i < 4 ? `1px solid ${S.bg}` : "none",
                  }}>
                    <span style={{ fontFamily: S.mono, fontSize: 12, color: item.b ? S.text : S.sub, fontWeight: item.b ? 600 : 400 }}>{item.l}</span>
                    <span style={{ fontFamily: S.mono, fontSize: 13, color: item.b ? S.accent : S.text, fontWeight: item.b ? 700 : 400 }}>
                      {item.v < 0 ? "(" : ""}${fmt(Math.abs(item.v), 1)}{item.v < 0 ? ")" : ""}
                    </span>
                  </div>
                ))}
              </Card>

              <Card S={S}>
                <div style={{ fontSize: 10, fontFamily: S.mono, color: S.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontWeight: 500 }}>Methodology</div>
                <p style={{ fontSize: 13, color: S.sub, lineHeight: 1.8, margin: 0 }}>
                  5-year unlevered FCF projection: NOPAT + D&A − CapEx − ΔNWC. Terminal Value via Gordon Growth Model. WACC estimated using CAPM (Rf + β × MRP). Enterprise Value = Σ PV(FCF) + PV(TV). Equity Value = EV − Net Debt. Company financials sourced from SEC annual filings. All assumptions are fully adjustable.
                </p>
              </Card>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 32, paddingTop: 12, borderTop: `1px solid ${S.border}`, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: S.mono, fontSize: 10, color: S.muted }}>Built by Manny · UMass Boston Capital Management Group</span>
            <span style={{ fontFamily: S.mono, fontSize: 10, color: S.muted }}>v3.0</span>
          </div>
        </div>
      </div>
    </>
  );
}
