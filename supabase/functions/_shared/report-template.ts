// ─── Types ────────────────────────────────────────────────────────────────

export interface ReportDataA {
    business_name: string;
    subtitle: string;
    location: string;
    stat_market_size: string;
    stat_projected_size: string;
    stat_cagr: string;
    stat_competitor_count: string;
    narrative: string;
    competitors: {
      name: string;
      price_range: string;
      positioning: string;
      presence: string;
      threat_level: "HIGH" | "MEDIUM" | "LOW";
    }[];
    swot: {
      strengths: { title: string; description: string }[];
      weaknesses: { title: string; description: string }[];
      opportunities: { title: string; description: string }[];
      threats: { title: string; description: string }[];
    };
  }
  
  export interface ReportDataB {
    recommendations: {
      priority: "HIGH" | "MEDIUM" | "LOW";
      title: string;
      description: string;
    }[];
    kpis: { metric: string; target: string; timeframe: string }[];
    verdict: string;
  }
  
  // ─── Anthropic tool schemas ─────────────────────────────────────────────
  
  export const REPORT_DATA_A_TOOL = {
    name: "submit_report_overview",
    description: "Submit the business overview, competitive landscape, and SWOT analysis for the report.",
    input_schema: {
      type: "object",
      properties: {
        business_name: { type: "string" },
        subtitle: { type: "string" },
        location: { type: "string" },
        stat_market_size: { type: "string", description: "e.g. 'USD 9.23M'" },
        stat_projected_size: { type: "string", description: "e.g. 'USD 18.57M by 2033'" },
        stat_cagr: { type: "string", description: "e.g. '6.8%'" },
        stat_competitor_count: { type: "string", description: "e.g. '60+'" },
        narrative: { type: "string", description: "2-3 sentence executive summary, plain text, no markdown" },
        competitors: {
          type: "array",
          minItems: 5,
          maxItems: 12,
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              price_range: { type: "string" },
              positioning: { type: "string" },
              presence: { type: "string" },
              threat_level: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
            },
            required: ["name", "price_range", "positioning", "presence", "threat_level"],
          },
        },
        swot: {
          type: "object",
          properties: {
            strengths: { type: "array", minItems: 3, maxItems: 4, items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } }, required: ["title", "description"] } },
            weaknesses: { type: "array", minItems: 3, maxItems: 4, items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } }, required: ["title", "description"] } },
            opportunities: { type: "array", minItems: 3, maxItems: 4, items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } }, required: ["title", "description"] } },
            threats: { type: "array", minItems: 3, maxItems: 4, items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } }, required: ["title", "description"] } },
          },
          required: ["strengths", "weaknesses", "opportunities", "threats"],
        },
      },
      required: ["business_name", "subtitle", "location", "stat_market_size", "stat_projected_size", "stat_cagr", "stat_competitor_count", "narrative", "competitors", "swot"],
    },
  };
  
  export const REPORT_DATA_B_TOOL = {
    name: "submit_report_recommendations",
    description: "Submit the recommendations, KPIs, and verdict for the report.",
    input_schema: {
      type: "object",
      properties: {
        recommendations: {
          type: "array",
          minItems: 6,
          maxItems: 6,
          description: "Exactly 6, ordered HIGH priority first, then MEDIUM, then LOW",
          items: {
            type: "object",
            properties: {
              priority: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
              title: { type: "string" },
              description: { type: "string" },
            },
            required: ["priority", "title", "description"],
          },
        },
        kpis: {
          type: "array",
          minItems: 4,
          maxItems: 6,
          items: {
            type: "object",
            properties: {
              metric: { type: "string" },
              target: { type: "string" },
              timeframe: { type: "string" },
            },
            required: ["metric", "target", "timeframe"],
          },
        },
        verdict: { type: "string", description: "2-3 sentence closing conclusion, plain text, no markdown" },
      },
      required: ["recommendations", "kpis", "verdict"],
    },
  };
  
  // ─── HTML escaping ─────────────────────────────────────────────────────
  
  function esc(s: string): string {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  
  const THREAT_COLOR: Record<string, string> = { HIGH: "#e05c5c", MEDIUM: "#d4a843", LOW: "#7ec8a0" };
  
  // ─── Fixed template — never regenerated, never truncated ──────────────
  
  export function renderReportHtml(a: ReportDataA, b: ReportDataB): string {
    const competitorRows = a.competitors.map((c) => `
      <tr>
        <td class="td-name">${esc(c.name)}</td>
        <td>${esc(c.price_range)}</td>
        <td>${esc(c.positioning)}</td>
        <td>${esc(c.presence)}</td>
        <td style="color:${THREAT_COLOR[c.threat_level] || "#c9a84c"};font-weight:700;">${esc(c.threat_level)}</td>
      </tr>`).join("");
  
    const swotBlock = (title: string, items: { title: string; description: string }[]) => `
      <div class="swot-col">
        <h4>${esc(title)}</h4>
        ${items.map((i) => `<div class="swot-item"><strong>${esc(i.title)}</strong><p>${esc(i.description)}</p></div>`).join("")}
      </div>`;
  
    const recBlocks = b.recommendations.map((r, idx) => `
      <div class="rec-card" style="border-left-color:${r.priority === "HIGH" ? "#c9a84c" : r.priority === "MEDIUM" ? "#2a4a7f" : "#4a5a6f"};">
        <span class="rec-num">${idx + 1}</span>
        <div>
          <h3>${esc(r.title)}</h3>
          <p>${esc(r.description)}</p>
        </div>
      </div>`).join("");
  
    const kpiRows = b.kpis.map((k) => `
      <tr><td>${esc(k.metric)}</td><td>${esc(k.target)}</td><td>${esc(k.timeframe)}</td></tr>`).join("");
  
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(a.business_name)} — Competitive Intelligence Report</title>
  <style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Georgia',serif; background:#f4f1eb; color:#0a1628; }
  .header { background:linear-gradient(135deg,#0a1628,#1a2f52); padding:48px; }
  .header .eyebrow { font-family:Arial,sans-serif; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:#c9a84c; margin-bottom:16px; }
  .header h1 { font-size:32px; color:#fff; margin-bottom:8px; }
  .header .subtitle { font-family:Arial,sans-serif; font-size:14px; color:rgba(255,255,255,.6); font-style:italic; }
  .body { max-width:960px; margin:0 auto; padding:48px; }
  .section-label { font-family:Arial,sans-serif; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#c9a84c; margin:40px 0 20px; }
  .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:2px; background:#e5e0d5; border-radius:8px; overflow:hidden; margin-bottom:32px; }
  .stat-card { background:#fff; padding:24px 18px; }
  .stat-number { font-size:24px; margin-bottom:4px; }
  .stat-label { font-family:Arial,sans-serif; font-size:10px; color:#6b7a8d; text-transform:uppercase; letter-spacing:1px; }
  .narrative { background:#fff; border-left:3px solid #c9a84c; padding:24px 28px; border-radius:0 6px 6px 0; font-size:15px; line-height:1.8; }
  table { width:100%; border-collapse:collapse; font-family:Arial,sans-serif; font-size:13px; background:#0a1628; color:#e8e0d0; border-radius:6px; overflow:hidden; }
  th { background:#c9a84c; color:#0a1628; padding:10px 12px; text-align:left; }
  td { padding:10px 12px; border-bottom:1px solid #1e3255; }
  .td-name { color:#c9a84c; font-weight:600; }
  .swot-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:16px; }
  .swot-col { background:#fff; border-radius:6px; padding:20px; }
  .swot-col h4 { color:#0a1628; margin-bottom:12px; font-family:Arial,sans-serif; font-size:12px; letter-spacing:1px; text-transform:uppercase; }
  .swot-item { margin-bottom:12px; font-size:13px; }
  .swot-item strong { display:block; margin-bottom:2px; }
  .rec-card { display:flex; gap:14px; background:#111e36; border:1px solid #1e3255; border-left:4px solid; border-radius:4px; padding:18px 22px; margin-bottom:12px; color:#c8bfb0; }
  .rec-num { background:#c9a84c; color:#0a1628; font-weight:700; min-width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:Arial,sans-serif; font-size:13px; }
  .rec-card h3 { color:#c9a84c; font-size:15px; margin-bottom:6px; }
  .rec-card p { font-size:13px; line-height:1.7; }
  .verdict { background:#0a1628; color:#e8e0d0; padding:28px; border-radius:6px; margin-top:32px; font-size:15px; line-height:1.8; border-left:4px solid #c9a84c; }
  .disclaimer { background:#fff8e6; border-left:4px solid #c9a84c; padding:15px 20px; margin:28px 0; font-size:.85em; color:#856404; font-family:sans-serif; }
  </style>
  </head>
  <body>
    <div class="header">
      <div class="eyebrow">Pre-Launch Competitive Intelligence Report</div>
      <h1>${esc(a.business_name)}</h1>
      <div class="subtitle">${esc(a.subtitle)} — ${esc(a.location)}</div>
    </div>
  
    <div class="body">
      <div class="section-label">Executive Summary</div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-number">${esc(a.stat_market_size)}</div><div class="stat-label">Market Size</div></div>
        <div class="stat-card"><div class="stat-number">${esc(a.stat_projected_size)}</div><div class="stat-label">Projected Size</div></div>
        <div class="stat-card"><div class="stat-number">${esc(a.stat_cagr)}</div><div class="stat-label">CAGR</div></div>
        <div class="stat-card"><div class="stat-number">${esc(a.stat_competitor_count)}</div><div class="stat-label">Active Competitors</div></div>
      </div>
      <div class="narrative"><p>${esc(a.narrative)}</p></div>
  
      <div class="section-label">Competitive Landscape</div>
      <table>
        <thead><tr><th>Brand</th><th>Price Range</th><th>Positioning</th><th>Presence</th><th>Threat Level</th></tr></thead>
        <tbody>${competitorRows}</tbody>
      </table>
  
      <div class="section-label">SWOT Analysis</div>
      <div class="swot-grid">
        ${swotBlock("Strengths", a.swot.strengths)}
        ${swotBlock("Weaknesses", a.swot.weaknesses)}
        ${swotBlock("Opportunities", a.swot.opportunities)}
        ${swotBlock("Threats", a.swot.threats)}
      </div>
  
      <div class="disclaimer"><strong>⚠️ Disclaimer:</strong> This report incorporates real-time web search data current as of the report date. All regulatory information, competitor data, and market figures should be independently verified before making business decisions. This does not constitute professional legal, financial, or business advice.</div>
  
      <div class="section-label">Market Positioning Recommendations</div>
      ${recBlocks}
  
      <div class="section-label">Key Performance Indicators — 90-Day Tracking</div>
      <table>
        <thead><tr><th>Metric</th><th>Target</th><th>Timeframe</th></tr></thead>
        <tbody>${kpiRows}</tbody>
      </table>
  
      <div class="verdict"><strong>Verdict:</strong> ${esc(b.verdict)}</div>
    </div>
  </body>
  </html>`;
  }