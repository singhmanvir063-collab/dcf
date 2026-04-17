import { useState, useMemo, useCallback, useEffect } from "react";

const FONTS = "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Instrument+Sans:wght@400;500;600;700&display=swap";

/* ═══════════════════════════════════════════
   PRE-LOADED COMPANY DATA (Real SEC Filings)
   - revHistory:            [FY-2, FY-1] revenue ($M)
   - ebitdaMarginHistory:   [FY-2, FY-1] EBITDA margin (%)
   - totalDebt:             gross debt ($M) — market-value proxy for WACC weights
   - costOfDebt:            pre-tax YTM (%) — actual credit spread
   ═══════════════════════════════════════════ */
const COMPANIES = {
  AAPL: {
    name: "Apple Inc.", sector: "Technology", price: 230,
    revenue: 383285, ebitdaMargin: 33.5, daPercent: 3.0, capexPercent: 2.8,
    taxRate: 16.2, netDebt: 49230, totalDebt: 106572, costOfDebt: 4.3,
    shares: 15460, beta: 1.24,
    growth: [2.0, 5.0, 6.0, 5.0, 4.0],
    margins: [33.5, 33.8, 34.0, 34.2, 34.5],
    revHistory: [365817, 394328], ebitdaMarginHistory: [32.0, 33.2],
  },
  MSFT: {
    name: "Microsoft Corp.", sector: "Technology", price: 420,
    revenue: 245122, ebitdaMargin: 53.0, daPercent: 5.6, capexPercent: 14.0,
    taxRate: 18.5, netDebt: -36200, totalDebt: 97851, costOfDebt: 4.0,
    shares: 7430, beta: 0.90,
    growth: [16.0, 14.0, 12.0, 10.0, 9.0],
    margins: [53.0, 53.5, 54.0, 54.5, 55.0],
    revHistory: [198270, 211915], ebitdaMarginHistory: [50.0, 51.5],
  },
  GOOGL: {
    name: "Alphabet Inc.", sector: "Technology", price: 175,
    revenue: 350018, ebitdaMargin: 38.0, daPercent: 5.8, capexPercent: 14.6,
    taxRate: 14.0, netDebt: -90800, totalDebt: 28220, costOfDebt: 4.2,
    shares: 12160, beta: 1.06,
    growth: [14.0, 12.0, 10.0, 9.0, 8.0],
    margins: [38.0, 38.5, 39.0, 39.5, 40.0],
    revHistory: [282836, 307394], ebitdaMarginHistory: [34.0, 36.2],
  },
  AMZN: {
    name: "Amazon.com Inc.", sector: "Consumer / Cloud", price: 205,
    revenue: 637997, ebitdaMargin: 17.8, daPercent: 7.2, capexPercent: 12.5,
    taxRate: 14.8, netDebt: -23600, totalDebt: 135611, costOfDebt: 4.8,
    shares: 10520, beta: 1.15,
    growth: [11.0, 11.0, 10.0, 9.0, 8.0],
    margins: [17.8, 18.5, 19.2, 20.0, 20.8],
    revHistory: [513983, 574785], ebitdaMarginHistory: [11.3, 15.4],
  },
  NVDA: {
    name: "NVIDIA Corp.", sector: "Semiconductors", price: 130,
    revenue: 130497, ebitdaMargin: 65.0, daPercent: 2.0, capexPercent: 2.5,
    taxRate: 12.5, netDebt: -18000, totalDebt: 8460, costOfDebt: 4.3,
    shares: 24500, beta: 1.70,
    growth: [55.0, 30.0, 20.0, 15.0, 12.0],
    margins: [65.0, 63.0, 61.0, 59.0, 57.0],
    revHistory: [26974, 60922], ebitdaMarginHistory: [29.5, 55.5],
  },
  TSLA: {
    name: "Tesla Inc.", sector: "Auto / Energy", price: 270,
    revenue: 97690, ebitdaMargin: 17.5, daPercent: 6.5, capexPercent: 9.8,
    taxRate: 16.0, netDebt: -20300, totalDebt: 12385, costOfDebt: 6.8,
    shares: 3210, beta: 2.30,
    growth: [8.0, 15.0, 18.0, 15.0, 12.0],
    margins: [17.5, 18.5, 19.5, 20.5, 21.5],
    revHistory: [81462, 96773], ebitdaMarginHistory: [22.2, 15.2],
  },
  META: {
    name: "Meta Platforms Inc.", sector: "Technology", price: 600,
    revenue: 164710, ebitdaMargin: 50.0, daPercent: 7.0, capexPercent: 24.0,
    taxRate: 13.5, netDebt: -34400, totalDebt: 18385, costOfDebt: 4.6,
    shares: 2530, beta: 1.25,
    growth: [20.0, 15.0, 12.0, 10.0, 8.0],
    margins: [50.0, 49.0, 48.0, 47.5, 47.0],
    revHistory: [116609, 134902], ebitdaMarginHistory: [36.6, 44.0],
  },
  JPM: {
    name: "JPMorgan Chase & Co.", sector: "Financials", price: 250,
    revenue: 177600, ebitdaMargin: 45.0, daPercent: 2.0, capexPercent: 3.5,
    taxRate: 22.0, netDebt: 250000, totalDebt: 428381, costOfDebt: 4.5,
    shares: 2860, beta: 1.10,
    growth: [5.0, 4.0, 4.0, 3.0, 3.0],
    margins: [45.0, 45.0, 44.5, 44.0, 44.0],
    revHistory: [128710, 158104], ebitdaMarginHistory: [44.0, 45.0],
  },
  JNJ: {
    name: "Johnson & Johnson", sector: "Healthcare", price: 155,
    revenue: 89008, ebitdaMargin: 34.0, daPercent: 4.5, capexPercent: 4.8,
    taxRate: 17.5, netDebt: 14600, totalDebt: 34567, costOfDebt: 4.4,
    shares: 2410, beta: 0.52,
    growth: [4.0, 4.5, 4.0, 3.5, 3.0],
    margins: [34.0, 34.5, 35.0, 35.5, 36.0],
    revHistory: [94943, 85159], ebitdaMarginHistory: [31.2, 30.5],
  },
  XOM: {
    name: "Exxon Mobil Corp.", sector: "Energy", price: 110,
    revenue: 344582, ebitdaMargin: 19.0, daPercent: 5.5, capexPercent: 7.0,
    taxRate: 25.0, netDebt: 16800, totalDebt: 42557, costOfDebt: 4.6,
    shares: 4230, beta: 0.85,
    growth: [-2.0, 1.0, 2.0, 2.0, 1.5],
    margins: [19.0, 18.5, 18.0, 17.5, 17.0],
    revHistory: [277516, 413680], ebitdaMarginHistory: [18.8, 22.1],
  },
  WMT: {
    name: "Walmart Inc.", sector: "Consumer Retail", price: 95,
    revenue: 674538, ebitdaMargin: 6.2, daPercent: 1.7, capexPercent: 3.2,
    taxRate: 24.5, netDebt: 36200, totalDebt: 60403, costOfDebt: 4.3,
    shares: 8050, beta: 0.55,
    growth: [5.0, 4.5, 4.0, 3.5, 3.0],
    margins: [6.2, 6.3, 6.4, 6.5, 6.6],
    revHistory: [611289, 648125], ebitdaMarginHistory: [5.5, 6.0],
  },
  DIS: {
    name: "The Walt Disney Co.", sector: "Media / Entertainment", price: 110,
    revenue: 91361, ebitdaMargin: 22.0, daPercent: 5.5, capexPercent: 6.8,
    taxRate: 21.0, netDebt: 33100, totalDebt: 47540, costOfDebt: 4.9,
    shares: 1820, beta: 1.35,
    growth: [4.0, 5.0, 5.0, 4.0, 3.5],
    margins: [22.0, 23.0, 24.0, 25.0, 25.5],
    revHistory: [82722, 88898], ebitdaMarginHistory: [16.2, 19.5],
  },
};

const TICKERS = Object.keys(COMPANIES);

/* ── Helpers ── */
const fmt = (n, d = 0) => {
  if (n == null || isNaN(n)) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
};

/* ── WACC Buildup (CAPM + Cost of Debt, market-value weights) ── */
function calcWACC({ rf, beta, erp, costOfDebt, taxRate, totalDebt, marketEquity }) {
  const ke = rf + beta * erp;
  const kdAT = costOfDebt * (1 - taxRate / 100);
  const E = Math.max(1, marketEquity);
  const D = Math.max(0, totalDebt);
  const V = E + D;
  const wE = E / V;
  const wD = D / V;
  const wacc = wE * ke + wD * kdAT;
  return { ke, kdPre: costOfDebt, kdAT, wE, wD, wacc, E, D, V };
}

/* ── DCF Engine (5-year explicit + mid-year convention + dual terminal methods) ── */
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
    const t = a.midYear ? i + 0.5 : i + 1;
    const df = 1 / Math.pow(1 + a.wacc / 100, t);
    proj.push({ year: i + 1, revenue: rev, ebitda, da, ebit, taxes, nopat, capex, nwc, fcf, df, pvFCF: fcf * df });
  }

  const w = a.wacc / 100, g = a.terminalGrowth / 100;
  const lastFCF = proj[4].fcf;
  const lastEBITDA = proj[4].ebitda;

  let tv = 0, invalid = false;
  if (a.termMethod === "exitMultiple") {
    tv = lastEBITDA * a.exitMultiple;
  } else {
    if (w <= g) invalid = true;
    else tv = (lastFCF * (1 + g)) / (w - g);
  }

  const tvT = a.midYear ? 4.5 : 5;
  const pvTV = tv / Math.pow(1 + w, tvT);
  const sumPV = proj.reduce((s, p) => s + p.pvFCF, 0);
  const ev = sumPV + pvTV;
  const eq = ev - a.netDebt;
  const pps = a.sharesOutstanding > 0 ? eq / a.sharesOutstanding : 0;
  const tvPct = ev > 0 ? (pvTV / ev) * 100 : 0;

  // Cross-checks (always computed)
  const impliedExitMultiple = lastEBITDA > 0 && tv > 0 ? tv / lastEBITDA : 0;
  // Gordon inversion: TV = FCF(1+g)/(w-g)  →  g = (TV·w − FCF)/(TV + FCF)
  const impliedPerpGrowth = (tv > 0 && lastFCF > 0)
    ? ((tv * w - lastFCF) / (tv + lastFCF)) * 100
    : 0;
  const y5FcfYield = ev > 0 ? (lastFCF / ev) * 100 : 0;

  return {
    proj, tv, pvTV, sumPV, ev, eq, pps, tvPct,
    impliedExitMultiple, impliedPerpGrowth, y5FcfYield, invalid,
  };
}

/* ── Sensitivity grid (adapts to terminal method) ── */
function buildSens(a) {
  const wR = [-2, -1, 0, 1, 2].map(d => +(a.wacc + d).toFixed(2));
  if (a.termMethod === "exitMultiple") {
    const xR = [-2, -1, 0, 1, 2].map(d => +Math.max(1, a.exitMultiple + d).toFixed(1));
    const grid = wR.map(w => xR.map(em => {
      const r = runDCF({ ...a, wacc: w, exitMultiple: em });
      return r.invalid ? null : r.pps;
    }));
    return { wR, xR, grid, xLabel: "Exit Mult", xFmt: v => `${v.toFixed(1)}x` };
  }
  const xR = [-1.5, -0.75, 0, 0.75, 1.5].map(d => +(Math.max(0.1, a.terminalGrowth + d)).toFixed(2));
  const grid = wR.map(w => xR.map(tg => {
    const r = runDCF({ ...a, wacc: w, terminalGrowth: tg });
    return r.invalid ? null : r.pps;
  }));
  return { wR, xR, grid, xLabel: "Term g", xFmt: v => `${v.toFixed(2)}%` };
}

/* ── Scenario deltas (applied to the base case) ── */
const SCENARIO_DEFS = [
  { key: "bear", label: "Bear", growth: -2.0, margin: -1.0, wacc: +0.5, tg: -0.5 },
  { key: "base", label: "Base", growth:  0.0, margin:  0.0, wacc:  0.0, tg:  0.0 },
  { key: "bull", label: "Bull", growth: +2.0, margin: +1.0, wacc: -0.5, tg: +0.5 },
];

function applyScenario(a, scn) {
  return {
    ...a,
    revenueGrowth: a.revenueGrowth.map(v => v + scn.growth),
    ebitdaMargin: a.ebitdaMargin.map(v => Math.max(1, Math.min(99, v + scn.margin))),
    wacc: Math.max(1, +(a.wacc + scn.wacc).toFixed(2)),
    terminalGrowth: Math.max(0.1, +(a.terminalGrowth + scn.tg).toFixed(2)),
  };
}

/* ── Styles ── */
const LIGHT = {
  bg: "#f7f8fa", card: "#fff", border: "#e4e7ec", text: "#1b1f2e",
  sub: "#5f6b7a", muted: "#97a0ae", accent: "#2563eb", accentBg: "#f0f4ff",
  green: "#059669", red: "#dc2626", yellow: "#ca8a04",
  greenBg: "#05966910", redBg: "#dc262610", yellowBg: "#ca8a0415",
  inputBg: "#fff",
};

const DARK = {
  bg: "#0f1117", card: "#1a1d28", border: "#2a2e3b", text: "#e4e7ec",
  sub: "#9ca3b0", muted: "#6b7280", accent: "#3b82f6", accentBg: "#3b82f615",
  green: "#10b981", red: "#ef4444", yellow: "#eab308",
  greenBg: "#10b98115", redBg: "#ef444415", yellowBg: "#eab30815",
  inputBg: "#232636",
};

const FONTS_SHARED = { mono: "'IBM Plex Mono', monospace", sans: "'Instrument Sans', sans-serif" };

function getTheme(dark) { return { ...(dark ? DARK : LIGHT), ...FONTS_SHARED }; }

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

function MetricPill({ label, value, tone = "neutral", S, hint }) {
  const col = tone === "good" ? S.green : tone === "warn" ? S.yellow : tone === "bad" ? S.red : S.text;
  const bg  = tone === "good" ? S.greenBg : tone === "warn" ? S.yellowBg : tone === "bad" ? S.redBg : "transparent";
  const borderCol = tone === "neutral" ? S.border : (tone === "good" ? S.green : tone === "warn" ? S.yellow : S.red) + "55";
  return (
    <div title={hint || ""} style={{
      background: bg, border: `1px solid ${borderCol}`, borderRadius: 8,
      padding: "10px 14px", flex: 1, minWidth: 150,
    }}>
      <div style={{ fontSize: 9, fontFamily: S.mono, color: S.muted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 17, fontFamily: S.mono, color: col, fontWeight: 700, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function SegBtn({ active, onClick, children, S }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 14px", fontSize: 11, fontFamily: S.mono, fontWeight: active ? 600 : 400,
      background: active ? S.accent : "transparent", color: active ? "#fff" : S.sub,
      border: "none", cursor: "pointer", borderRadius: 6, letterSpacing: "0.04em",
      transition: "all 0.15s",
    }}>{children}</button>
  );
}

function Segmented({ options, value, onChange, S }) {
  return (
    <div style={{ display: "inline-flex", background: S.inputBg, border: `1px solid ${S.border}`, borderRadius: 8, padding: 2, gap: 2 }}>
      {options.map(opt => (
        <SegBtn key={String(opt.v)} active={value === opt.v} onClick={() => onChange(opt.v)} S={S}>
          {opt.l}
        </SegBtn>
      ))}
    </div>
  );
}

function SmallStat({ label, value, hint, bold, accent, S }) {
  return (
    <div title={hint || ""}>
      <div style={{ fontSize: 9, fontFamily: S.mono, color: S.muted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: bold ? 17 : 13, fontFamily: S.mono, color: accent ? S.accent : S.text, fontWeight: bold ? 700 : 500, marginTop: 3 }}>{value}</div>
    </div>
  );
}

function ScnRow({ l, v, S }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: S.mono }}>
      <span style={{ color: S.muted }}>{l}</span>
      <span style={{ color: S.text, fontWeight: 500 }}>{v}</span>
    </div>
  );
}

function ScenarioBars({ results, marketPrice, S }) {
  const maxPps = Math.max(marketPrice || 0, ...results.map(r => r.r.pps || 0));
  const scale = maxPps > 0 ? 100 / maxPps : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {results.map(sr => {
        const col = sr.key === "bull" ? S.green : sr.key === "bear" ? S.red : S.accent;
        const w = Math.max(2, (sr.r.pps || 0) * scale);
        return (
          <div key={sr.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 54, fontSize: 10, fontFamily: S.mono, color: S.sub, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{sr.label}</div>
            <div style={{ flex: 1, height: 28, background: S.bg, borderRadius: 4, position: "relative", border: `1px solid ${S.border}`, overflow: "hidden" }}>
              <div style={{
                width: `${w}%`, height: "100%", background: col,
                display: "flex", alignItems: "center", justifyContent: "flex-end",
                paddingRight: 10, color: "#fff", fontSize: 11, fontFamily: S.mono, fontWeight: 600,
                minWidth: 64, transition: "width 0.3s ease",
              }}>
                ${sr.r.pps.toFixed(2)}
              </div>
              {marketPrice && scale > 0 && (
                <div style={{
                  position: "absolute", left: `${Math.min(100, marketPrice * scale)}%`, top: -4, bottom: -4,
                  width: 2, background: S.text, opacity: 0.55,
                }} title={`Market: $${marketPrice}`} />
              )}
            </div>
          </div>
        );
      })}
      {marketPrice && (
        <div style={{ fontSize: 10, color: S.muted, fontFamily: S.mono, marginTop: 2 }}>
          Vertical line = current market price (${marketPrice})
        </div>
      )}
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
const TABS = ["Model", "Sensitivity", "Scenarios", "Valuation"];

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
  const [companyMeta, setCompanyMeta] = useState({ name: "", sector: "", price: null });

  const [a, setA] = useState({
    currentRevenue: 10000,
    revenueGrowth: [10, 8, 7, 6, 5],
    ebitdaMargin: [25, 25.5, 26, 26.5, 27],
    daPercent: 3.5, capexPercent: 4.0, nwcPercent: 1.5,
    taxRate: 21,
    // WACC inputs
    rf: 4.2, erp: 5.5, beta: 1.10, costOfDebt: 5.0,
    totalDebt: 500, marketEquity: 5000,
    // Terminal & discounting
    terminalGrowth: 2.5, midYear: true, termMethod: "gordon", exitMultiple: 12,
    // Capital structure
    netDebt: 2000, sharesOutstanding: 500,
    // Historical
    revHistory: [8500, 9200], ebitdaMarginHistory: [24.5, 24.8],
  });

  // WACC computed from buildup inputs (single source of truth)
  const waccCalc = useMemo(() => calcWACC({
    rf: a.rf, beta: a.beta, erp: a.erp, costOfDebt: a.costOfDebt,
    taxRate: a.taxRate, totalDebt: a.totalDebt, marketEquity: a.marketEquity,
  }), [a.rf, a.beta, a.erp, a.costOfDebt, a.taxRate, a.totalDebt, a.marketEquity]);

  // Assumption set with WACC injected (what gets passed to runDCF)
  const aEff = useMemo(() => ({ ...a, wacc: +waccCalc.wacc.toFixed(2) }), [a, waccCalc.wacc]);

  const u = useCallback((k, v) => setA(p => ({ ...p, [k]: v })), []);

  const loadCompany = (ticker) => {
    const co = COMPANIES[ticker];
    if (!co) return;
    setSelectedTicker(ticker);
    setCompanyMeta({ name: co.name, sector: co.sector, price: co.price });
    setA(prev => ({
      ...prev, // preserve user preferences: rf, erp, midYear, termMethod, exitMultiple, terminalGrowth
      currentRevenue: co.revenue,
      revenueGrowth: [...co.growth],
      ebitdaMargin: [...co.margins],
      daPercent: co.daPercent, capexPercent: co.capexPercent, nwcPercent: 1.5,
      taxRate: co.taxRate,
      beta: co.beta, costOfDebt: co.costOfDebt,
      totalDebt: co.totalDebt,
      marketEquity: +(co.price * co.shares).toFixed(0),
      netDebt: co.netDebt, sharesOutstanding: co.shares,
      revHistory: [...co.revHistory], ebitdaMarginHistory: [...co.ebitdaMarginHistory],
    }));
    setTab("Model");
  };

  const r = useMemo(() => runDCF(aEff), [aEff]);
  const s = useMemo(() => buildSens(aEff), [aEff]);
  const pos = r.pps > 0;
  const price = companyMeta.price;
  const upside = price && r.pps ? ((r.pps - price) / price) * 100 : null;

  // TV % of EV tone: >75% red, 60–75% yellow, <60% green
  const tvTone = r.invalid ? "neutral" : r.tvPct > 75 ? "bad" : r.tvPct > 60 ? "warn" : "good";
  // Implied perp g tone: >3% flag (above long-run GDP)
  const perpTone = r.invalid ? "neutral" : Math.abs(r.impliedPerpGrowth) > 4 ? "warn" : "neutral";

  // Historical table data (derived)
  const histData = useMemo(() => {
    const rh = a.revHistory || [];
    const mh = a.ebitdaMarginHistory || [];
    return rh.map((rev, i) => ({
      revenue: rev,
      ebitda: rev * (mh[i] || a.ebitdaMargin[0]) / 100,
    }));
  }, [a.revHistory, a.ebitdaMarginHistory, a.ebitdaMargin]);

  const lfyData = useMemo(() => ({
    revenue: a.currentRevenue,
    ebitda: a.currentRevenue * a.ebitdaMargin[0] / 100,
  }), [a.currentRevenue, a.ebitdaMargin]);

  // Scenario results (Bull/Base/Bear)
  const scenarioResults = useMemo(() => (
    SCENARIO_DEFS.map(scn => {
      const aScn = applyScenario(aEff, scn);
      const res = runDCF(aScn);
      return { ...scn, a: aScn, r: res };
    })
  ), [aEff]);

  const th = { padding: "8px 10px", textAlign: "right", fontSize: 10, fontFamily: S.mono, color: S.muted, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `2px solid ${S.border}`, fontWeight: 500 };
  const td = (hl) => ({ padding: "7px 10px", textAlign: "right", fontSize: 12, fontFamily: S.mono, color: hl ? S.accent : S.text, fontWeight: hl ? 600 : 400, borderBottom: `1px solid ${S.bg}` });

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
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          {/* ── Header ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, paddingBottom: 20, borderBottom: `1px solid ${S.border}` }}>
            <div>
              <div style={{ fontFamily: S.mono, fontSize: 10, color: S.accent, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>DCF Valuation Engine</div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: "-0.025em", color: S.text }}>
                {companyMeta.name ? `${companyMeta.name}` : "Discounted Cash Flow Model"}
              </h1>
              {companyMeta.name ? (
                <p style={{ fontSize: 12, color: S.muted, margin: "4px 0 0", fontFamily: S.mono }}>
                  {selectedTicker} · {companyMeta.sector} · LFY Rev ${fmt(a.currentRevenue)}M · WACC {waccCalc.wacc.toFixed(2)}%
                </p>
              ) : (
                <p style={{ fontSize: 12, color: S.muted, margin: "4px 0 0" }}>
                  Select a company below or input custom assumptions · WACC {waccCalc.wacc.toFixed(2)}%
                </p>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: S.mono, fontSize: 30, fontWeight: 700, color: pos ? S.green : S.red, letterSpacing: "-0.02em" }}>
                {r.invalid ? "N/A" : `$${r.pps.toFixed(2)}`}
              </div>
              <div style={{ fontSize: 10, color: S.muted, fontFamily: S.mono, textTransform: "uppercase", letterSpacing: "0.05em" }}>Implied Price</div>
              {upside !== null && !r.invalid && (
                <div style={{ fontFamily: S.mono, fontSize: 11, marginTop: 4, color: upside >= 0 ? S.green : S.red, fontWeight: 600 }}>
                  {upside >= 0 ? "+" : ""}{upside.toFixed(1)}% vs. ${price} mkt
                </div>
              )}
            </div>
          </div>

          {/* ── Sanity Check Strip ── */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <MetricPill label="TV % of EV" tone={tvTone} S={S}
              value={r.invalid ? "—" : `${r.tvPct.toFixed(1)}%`}
              hint="Terminal value as % of enterprise value. >75% is a red flag — too much value from perpetuity assumption." />
            <MetricPill label="Implied Exit Mult" S={S}
              value={r.invalid ? "—" : `${r.impliedExitMultiple.toFixed(1)}x`}
              hint="Implied EV/EBITDA at end of forecast. Compare to sector trading multiples." />
            <MetricPill label="Implied Perp g" tone={perpTone} S={S}
              value={r.invalid ? "—" : `${r.impliedPerpGrowth.toFixed(2)}%`}
              hint="Implied perpetuity growth rate. Should be ≤ long-run GDP growth (~2–3%)." />
            <MetricPill label="Y5 FCF / EV" S={S}
              value={r.invalid ? "—" : `${r.y5FcfYield.toFixed(2)}%`}
              hint="Year-5 unlevered FCF yield on EV. Rough cash-on-cash sanity check." />
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

          {/* ══ MODEL TAB ══ */}
          {tab === "Model" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Methodology Toggles */}
              <Card title="Methodology" S={S}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-end" }}>
                  <div>
                    <div style={{ fontSize: 10, fontFamily: S.mono, color: S.muted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 6 }}>Discount Convention</div>
                    <Segmented
                      options={[{ v: true, l: "Mid-Year" }, { v: false, l: "Year-End" }]}
                      value={a.midYear} onChange={v => u("midYear", v)} S={S}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontFamily: S.mono, color: S.muted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 6 }}>Terminal Value Method</div>
                    <Segmented
                      options={[{ v: "gordon", l: "Gordon Growth" }, { v: "exitMultiple", l: "Exit Multiple" }]}
                      value={a.termMethod} onChange={v => u("termMethod", v)} S={S}
                    />
                  </div>
                  {a.termMethod === "exitMultiple" && (
                    <Field label="Exit EV/EBITDA" value={a.exitMultiple} onChange={v => u("exitMultiple", v)} suffix="x" w={70} S={S} />
                  )}
                </div>
              </Card>

              {/* Operating Assumptions */}
              <Card title="Operating Assumptions" S={S}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 14, marginBottom: 18 }}>
                  <Field label="Revenue ($M)" value={a.currentRevenue} onChange={v => u("currentRevenue", v)} w={110} S={S} />
                  <Field label="Net Debt ($M)" value={a.netDebt} onChange={v => u("netDebt", v)} w={100} S={S} />
                  <Field label="Shares (M)" value={a.sharesOutstanding} onChange={v => u("sharesOutstanding", v)} w={90} S={S} />
                  <Field label="Tax Rate" value={a.taxRate} onChange={v => u("taxRate", v)} suffix="%" w={64} S={S} />
                  <Field label="Terminal g" value={a.terminalGrowth} onChange={v => u("terminalGrowth", v)} suffix="%" w={64} S={S} />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 18 }}>
                  <YearInputs label="Revenue Growth (%)" values={a.revenueGrowth} onChange={v => u("revenueGrowth", v)} S={S} />
                  <YearInputs label="EBITDA Margin (%)" values={a.ebitdaMargin} onChange={v => u("ebitdaMargin", v)} S={S} />
                </div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <Field label="D&A % Rev" value={a.daPercent} onChange={v => u("daPercent", v)} suffix="%" w={64} S={S} />
                  <Field label="CapEx % Rev" value={a.capexPercent} onChange={v => u("capexPercent", v)} suffix="%" w={64} S={S} />
                  <Field label="ΔNWC % Rev" value={a.nwcPercent} onChange={v => u("nwcPercent", v)} suffix="%" w={64} S={S} />
                </div>
              </Card>

              {/* WACC Buildup */}
              <Card title="WACC Buildup" tag="CAPM · MARKET WEIGHTS" S={S}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 14, marginBottom: 16 }}>
                  <Field label="Risk-Free Rate" value={a.rf} onChange={v => u("rf", v)} suffix="%" w={64} S={S} />
                  <Field label="Equity Beta" value={a.beta} onChange={v => u("beta", v)} w={64} S={S} />
                  <Field label="Equity Risk Prem" value={a.erp} onChange={v => u("erp", v)} suffix="%" w={64} S={S} />
                  <Field label="Cost of Debt (Pre-Tax)" value={a.costOfDebt} onChange={v => u("costOfDebt", v)} suffix="%" w={64} S={S} />
                  <Field label="Total Debt ($M)" value={a.totalDebt} onChange={v => u("totalDebt", v)} w={100} S={S} />
                  <Field label="Mkt Equity ($M)" value={a.marketEquity} onChange={v => u("marketEquity", v)} w={120} S={S} />
                </div>
                <div style={{ background: S.bg, borderRadius: 8, padding: "14px 16px", border: `1px solid ${S.border}` }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 14 }}>
                    <SmallStat label="Cost of Equity (Kₑ)" value={`${waccCalc.ke.toFixed(2)}%`} hint="Rf + β × ERP" S={S} />
                    <SmallStat label="Kd After-Tax" value={`${waccCalc.kdAT.toFixed(2)}%`} hint="Kd × (1 − T)" S={S} />
                    <SmallStat label="E / V" value={`${(waccCalc.wE * 100).toFixed(1)}%`} hint="Equity weight" S={S} />
                    <SmallStat label="D / V" value={`${(waccCalc.wD * 100).toFixed(1)}%`} hint="Debt weight" S={S} />
                    <SmallStat label="WACC" value={`${waccCalc.wacc.toFixed(2)}%`} bold accent hint="Blended discount rate for unlevered FCF" S={S} />
                  </div>
                </div>
              </Card>

              {/* Financial Build Table */}
              <Card title="Financial Build ($M)" tag="HIST + PROJ" S={S}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                    <thead>
                      <tr>
                        <th style={{ ...th, textAlign: "left" }}>Line Item</th>
                        <th style={{ ...th, color: S.sub, fontStyle: "italic" }}>FY-2</th>
                        <th style={{ ...th, color: S.sub, fontStyle: "italic" }}>FY-1</th>
                        <th style={{ ...th, color: S.sub, fontStyle: "italic", borderRight: `2px solid ${S.border}` }}>LFY</th>
                        {[1, 2, 3, 4, 5].map(y => <th key={y} style={th}>FY+{y}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { l: "Revenue", k: "revenue" },
                        { l: "EBITDA", k: "ebitda" },
                        { l: "D&A", k: "da", histNull: true },
                        { l: "EBIT", k: "ebit", histNull: true },
                        { l: "Taxes", k: "taxes", histNull: true },
                        { l: "NOPAT", k: "nopat", histNull: true },
                        { l: "CapEx", k: "capex", histNull: true },
                        { l: "ΔNWC", k: "nwc", histNull: true },
                        { l: "Free Cash Flow", k: "fcf", hl: true, histNull: true },
                        { l: "PV of FCF", k: "pvFCF", hl: true, histNull: true },
                      ].map((row, i) => (
                        <tr key={i} style={row.hl ? { background: S.accentBg } : {}}>
                          <td style={{ ...td(row.hl), textAlign: "left", fontSize: 11 }}>{row.l}</td>
                          {[0, 1].map(j => (
                            <td key={`h${j}`} style={{ ...td(row.hl), color: S.sub, fontStyle: "italic" }}>
                              {row.histNull ? "—" : fmt(histData[j] ? histData[j][row.k] : null, 1)}
                            </td>
                          ))}
                          <td style={{ ...td(row.hl), color: S.sub, fontStyle: "italic", borderRight: `2px solid ${S.border}` }}>
                            {row.histNull ? "—" : fmt(lfyData[row.k], 1)}
                          </td>
                          {r.proj.map((p, j) => <td key={j} style={td(row.hl)}>{fmt(p[row.k], 1)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 10, fontSize: 10, color: S.muted, fontFamily: S.mono }}>
                  Italic columns = historical actuals. LFY = last fiscal year (projection base).
                </div>
              </Card>

            </div>
          )}

          {/* ══ SENSITIVITY TAB ══ */}
          {tab === "Sensitivity" && (
            <Card title={`Sensitivity — Implied PPS (WACC × ${a.termMethod === "exitMultiple" ? "Exit Multiple" : "Terminal g"})`} S={S}>
              <p style={{ fontSize: 12, color: S.sub, margin: "0 0 16px" }}>
                {a.termMethod === "exitMultiple"
                  ? "WACC (rows) × Exit EV/EBITDA Multiple (columns). Base case highlighted."
                  : "WACC (rows) × Terminal Growth (columns). Base case highlighted."}
              </p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ ...th, textAlign: "center", fontSize: 9 }}>WACC \ {s.xLabel}</th>
                      {s.xR.map((v, i) => <th key={i} style={{ ...th, textAlign: "center" }}>{s.xFmt(v)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {s.grid.map((row, ri) => (
                      <tr key={ri}>
                        <td style={{ padding: "10px 12px", textAlign: "center", fontFamily: S.mono, fontSize: 12, fontWeight: 500, color: S.sub, borderBottom: `1px solid ${S.bg}` }}>{s.wR[ri].toFixed(2)}%</td>
                        {row.map((val, ci) => {
                          const baseX = a.termMethod === "exitMultiple" ? a.exitMultiple : a.terminalGrowth;
                          const isBase = Math.abs(s.wR[ri] - aEff.wacc) < 0.01 && Math.abs(s.xR[ci] - baseX) < 0.01;
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

          {/* ══ SCENARIOS TAB ══ */}
          {tab === "Scenarios" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Card title="Scenario Analysis" tag="BULL / BASE / BEAR" S={S}>
                <p style={{ fontSize: 12, color: S.sub, margin: "0 0 18px", lineHeight: 1.6 }}>
                  Deltas applied to the base case · <b style={{ color: S.green }}>Bull</b>: +2% growth, +1% margin, −0.5% WACC, +0.5% terminal g · <b style={{ color: S.red }}>Bear</b>: the mirror.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                  {scenarioResults.map(sr => {
                    const scnUpside = price && sr.r.pps && !sr.r.invalid ? ((sr.r.pps - price) / price) * 100 : null;
                    const scnCol = sr.key === "bull" ? S.green : sr.key === "bear" ? S.red : S.accent;
                    return (
                      <div key={sr.key} style={{
                        background: S.card, border: `1px solid ${S.border}`, borderRadius: 10,
                        padding: "20px", borderTop: `3px solid ${scnCol}`,
                      }}>
                        <div style={{ fontSize: 10, fontFamily: S.mono, color: scnCol, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{sr.label} Case</div>
                        <div style={{ fontSize: 28, fontFamily: S.mono, color: sr.r.pps > 0 ? S.text : S.red, fontWeight: 700, marginBottom: 4 }}>
                          {sr.r.invalid ? "N/A" : `$${sr.r.pps.toFixed(2)}`}
                        </div>
                        {scnUpside !== null && (
                          <div style={{ fontSize: 12, color: scnUpside >= 0 ? S.green : S.red, fontFamily: S.mono, fontWeight: 600, marginBottom: 14 }}>
                            {scnUpside >= 0 ? "+" : ""}{scnUpside.toFixed(1)}% vs. mkt
                          </div>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14 }}>
                          <ScnRow l="EV" v={`$${fmt(sr.r.ev, 0)}M`} S={S} />
                          <ScnRow l="Equity" v={`$${fmt(sr.r.eq, 0)}M`} S={S} />
                          <ScnRow l="TV % of EV" v={`${sr.r.tvPct.toFixed(1)}%`} S={S} />
                          <ScnRow l="WACC" v={`${sr.a.wacc.toFixed(2)}%`} S={S} />
                          <ScnRow l="Term g" v={`${sr.a.terminalGrowth.toFixed(2)}%`} S={S} />
                          <ScnRow l="Y1 Growth" v={`${sr.a.revenueGrowth[0].toFixed(1)}%`} S={S} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card title="Implied Price Comparison" S={S}>
                <ScenarioBars results={scenarioResults} marketPrice={price} S={S} />
              </Card>
            </div>
          )}

          {/* ══ VALUATION TAB ══ */}
          {tab === "Valuation" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, padding: "36px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 10, fontFamily: S.mono, color: S.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                  {companyMeta.name ? `${selectedTicker} — ` : ""}Implied Equity Value Per Share
                </div>
                <div style={{ fontFamily: S.mono, fontSize: 44, fontWeight: 700, color: pos ? S.green : S.red, letterSpacing: "-0.02em" }}>
                  {r.invalid ? "N/A" : `$${r.pps.toFixed(2)}`}
                </div>

                {upside !== null && !r.invalid && (
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

                <div style={{ display: "flex", justifyContent: "center", gap: 36, marginTop: 28, flexWrap: "wrap" }}>
                  {[
                    { l: "Enterprise Value", v: `$${fmt(r.ev, 1)}M` },
                    { l: "Equity Value", v: `$${fmt(r.eq, 1)}M` },
                    { l: "TV % of EV", v: `${r.tvPct.toFixed(1)}%` },
                    { l: "WACC", v: `${waccCalc.wacc.toFixed(2)}%` },
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
                  5-year unlevered FCF (NOPAT + D&A − CapEx − ΔNWC) discounted at WACC using {a.midYear ? "mid-year" : "year-end"} convention. Terminal Value via {a.termMethod === "exitMultiple" ? `Exit EV/EBITDA Multiple (${a.exitMultiple}x)` : "Gordon Growth Model"}. WACC built from CAPM cost of equity (Rf + β × ERP) blended with after-tax cost of debt, weighted by market-value capital structure (E/V, D/V). Enterprise Value = Σ PV(FCF) + PV(TV). Equity Value = EV − Net Debt. Sanity checks include TV % of EV (flags {">"}75%), implied exit multiple, implied perpetuity growth, and Y5 FCF yield. All assumptions adjustable.
                </p>
              </Card>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 32, paddingTop: 12, borderTop: `1px solid ${S.border}`, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: S.mono, fontSize: 10, color: S.muted }}>Built by Manny · UMass Boston Capital Management Group</span>
            <span style={{ fontFamily: S.mono, fontSize: 10, color: S.muted }}>v4.0</span>
          </div>
        </div>
      </div>
    </>
  );
}
