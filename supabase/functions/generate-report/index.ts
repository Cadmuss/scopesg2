import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { anthropicErrorResponse, callAnthropicReportText } from "../_shared/anthropic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REPORT_PROMPT = `You are a senior Singapore business consultant preparing a PREMIUM Business Viability Report. Current date: ${new Date().toISOString().split('T')[0]}.

Output: a COMPLETE, SELF-CONTAINED HTML document. The report will be rendered directly in the browser and exported as PDF.

## CRITICAL HTML RULES
- Output ONLY raw HTML — no markdown, no backticks, no explanations
- Start with <!DOCTYPE html> and end with </html>
- All CSS must be inline in a <style> tag in the <head>
- Use the exact color scheme and styling provided below
- Every section MUST have at least one table, scorecard, or visual element
- NO walls of text — maximum 2-3 sentences before breaking into a table or list
- All numbers in SGD
- All links must be real Singapore government or business URLs

## COLOR SCHEME & STYLING
Use this exact CSS:

<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8f9fa; color: #1a1a2e; font-size: 14px; line-height: 1.6; }
  .report-wrapper { max-width: 900px; margin: 0 auto; background: white; }
  
  /* Header */
  .report-header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: white; padding: 48px 48px 36px; }
  .report-header .badge { background: #e2b04a; color: #1a1a2e; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; display: inline-block; margin-bottom: 16px; }
  .report-header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
  .report-header .subtitle { font-size: 16px; opacity: 0.8; margin-bottom: 24px; }
  .report-meta { display: flex; gap: 32px; font-size: 12px; opacity: 0.7; }
  
  /* Verdict banner */
  .verdict-banner { background: #f0f7f0; border-left: 4px solid #28a745; padding: 16px 24px; margin: 0 48px 32px; border-radius: 0 8px 8px 0; display: flex; gap: 32px; flex-wrap: wrap; }
  .verdict-banner.medium { background: #fff8e6; border-color: #e2b04a; }
  .verdict-banner.low { background: #fef0f0; border-color: #dc3545; }
  .verdict-item { display: flex; flex-direction: column; }
  .verdict-item .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #666; font-weight: 600; }
  .verdict-item .value { font-size: 18px; font-weight: 700; color: #1a1a2e; }
  
  /* Sections */
  .section { padding: 32px 48px; border-bottom: 1px solid #f0f0f0; }
  .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .section-number { background: #1a1a2e; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
  .section-title { font-size: 18px; font-weight: 700; color: #1a1a2e; }
  .section p { color: #444; margin-bottom: 16px; max-width: 700px; }
  
  /* Tables */
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
  thead { background: #1a1a2e; color: white; }
  thead th { padding: 10px 14px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  tbody tr:nth-child(even) { background: #f8f9fa; }
  tbody tr:hover { background: #f0f4ff; }
  tbody td { padding: 10px 14px; border-bottom: 1px solid #eee; vertical-align: top; }
  tbody td strong { color: #1a1a2e; }
  
  /* Scorecard */
  .scorecard { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin: 20px 0; }
  .score-card { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; text-align: center; }
  .score-card .score-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 8px; }
  .score-card .score-value { font-size: 28px; font-weight: 700; color: #1a1a2e; }
  .score-card .score-stars { color: #e2b04a; font-size: 16px; margin: 4px 0; }
  .score-card .score-note { font-size: 11px; color: #888; }
  .score-card.highlight { background: #1a1a2e; border-color: #1a1a2e; }
  .score-card.highlight .score-label, .score-card.highlight .score-note { color: #aaa; }
  .score-card.highlight .score-value { color: #e2b04a; }
  
  /* SWOT */
  .swot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; margin: 16px 0; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
  .swot-cell { padding: 20px; }
  .swot-cell.strengths { background: #e8f5e9; }
  .swot-cell.weaknesses { background: #ffeaea; }
  .swot-cell.opportunities { background: #e3f2fd; }
  .swot-cell.threats { background: #fff8e1; }
  .swot-cell h4 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-bottom: 12px; }
  .swot-cell.strengths h4 { color: #2e7d32; }
  .swot-cell.weaknesses h4 { color: #c62828; }
  .swot-cell.opportunities h4 { color: #1565c0; }
  .swot-cell.threats h4 { color: #e65100; }
  .swot-cell ul { list-style: none; }
  .swot-cell ul li { font-size: 13px; padding: 4px 0; color: #333; }
  .swot-cell ul li::before { content: "• "; font-weight: 700; }
  
  /* Risk badges */
  .badge-high { background: #ffeaea; color: #c62828; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .badge-med { background: #fff8e1; color: #e65100; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .badge-low { background: #e8f5e9; color: #2e7d32; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  
  /* Roadmap */
  .roadmap-phases { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; margin: 20px 0; }
  .roadmap-phase { padding: 20px 16px; text-align: center; }
  .roadmap-phase:nth-child(1) { background: #e8eaf6; }
  .roadmap-phase:nth-child(2) { background: #e3f2fd; }
  .roadmap-phase:nth-child(3) { background: #e8f5e9; }
  .roadmap-phase:nth-child(4) { background: #fff8e1; }
  .roadmap-phase .phase-num { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 4px; }
  .roadmap-phase .phase-name { font-size: 14px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
  .roadmap-phase .phase-weeks { font-size: 11px; color: #888; margin-bottom: 12px; }
  .roadmap-phase ul { list-style: none; text-align: left; }
  .roadmap-phase ul li { font-size: 12px; color: #444; padding: 3px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
  .roadmap-phase ul li::before { content: "→ "; color: #888; }
  
  /* Grant cards */
  .grant-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin: 16px 0; }
  .grant-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; border-top: 3px solid #e2b04a; }
  .grant-card .grant-name { font-size: 13px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
  .grant-card .grant-agency { font-size: 11px; color: #888; margin-bottom: 8px; }
  .grant-card .grant-amount { font-size: 20px; font-weight: 700; color: #e2b04a; margin-bottom: 4px; }
  .grant-card .grant-match { font-size: 11px; }
  .grant-card .grant-match.eligible { color: #2e7d32; }
  .grant-card .grant-match.conditional { color: #e65100; }
  .grant-card a { display: inline-block; margin-top: 8px; font-size: 11px; color: #1a1a2e; text-decoration: none; border: 1px solid #1a1a2e; padding: 4px 10px; border-radius: 4px; }
  
  /* Financial scenarios */
  .scenario-table thead tr th:nth-child(2) { background: #c62828; }
  .scenario-table thead tr th:nth-child(3) { background: #e65100; }
  .scenario-table thead tr th:nth-child(4) { background: #2e7d32; }
  
  /* Callout */
  .callout { background: #f0f4ff; border-left: 3px solid #1a1a2e; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 16px 0; font-size: 13px; }
  .callout strong { color: #1a1a2e; }
  
  /* Footer */
  .report-footer { background: #1a1a2e; color: white; padding: 24px 48px; text-align: center; }
  .report-footer p { font-size: 12px; opacity: 0.7; }
  .report-footer .disclaimer { font-size: 11px; opacity: 0.5; margin-top: 8px; }
  
  /* Print */
  @media print {
    body { background: white; }
    .section { page-break-inside: avoid; }
  }
</style>

## REPORT STRUCTURE — OUTPUT THIS EXACT HTML STRUCTURE

Generate a complete HTML report following this structure. Replace all [PLACEHOLDERS] with real data from the consultation:

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ScopeAI Premium Report — [Business Name]</title>
[PASTE ALL CSS FROM ABOVE IN STYLE TAG]
</head>
<body>
<div class="report-wrapper">

  <!-- HEADER -->
  <div class="report-header">
    <div class="badge">Premium Report</div>
    <h1>[Business Name / Concept]</h1>
    <div class="subtitle">[One line description of the business]</div>
    <div class="report-meta">
      <span>Prepared by ScopeAI</span>
      <span>${new Date().toISOString().split('T')[0]}</span>
      <span>Singapore Market</span>
      <span>Confidential</span>
    </div>
  </div>

  <!-- VERDICT BANNER — use class verdict-banner, verdict-banner medium, or verdict-banner low -->
  <div class="verdict-banner [high/medium/low]" style="margin-top:32px;">
    <div class="verdict-item"><span class="label">Overall Viability</span><span class="value">[High/Medium/Low]</span></div>
    <div class="verdict-item"><span class="label">Capital Required</span><span class="value">SGD $[X]</span></div>
    <div class="verdict-item"><span class="label">Break-even</span><span class="value">[X] months</span></div>
    <div class="verdict-item"><span class="label">Verdict</span><span class="value">[Go/Pivot/No-Go]</span></div>
  </div>

  <!-- SECTION 1: EXECUTIVE SUMMARY -->
  <div class="section">
    <div class="section-header"><div class="section-number">1</div><div class="section-title">Executive Summary</div></div>
    <p>[2-3 short sentences on the opportunity and headline verdict]</p>
    <div class="scorecard">
      <div class="score-card"><div class="score-label">Market Opportunity</div><div class="score-stars">[★★★★☆]</div><div class="score-value">[X]/5</div><div class="score-note">[1 line]</div></div>
      <div class="score-card"><div class="score-label">Founder-Market Fit</div><div class="score-stars">[★★★☆☆]</div><div class="score-value">[X]/5</div><div class="score-note">[1 line]</div></div>
      <div class="score-card"><div class="score-label">Competitive Moat</div><div class="score-stars">[★★☆☆☆]</div><div class="score-value">[X]/5</div><div class="score-note">[1 line]</div></div>
      <div class="score-card"><div class="score-label">Regulatory Clarity</div><div class="score-stars">[★★★★☆]</div><div class="score-value">[X]/5</div><div class="score-note">[1 line]</div></div>
      <div class="score-card"><div class="score-label">Capital Efficiency</div><div class="score-stars">[★★★☆☆]</div><div class="score-value">[X]/5</div><div class="score-note">[1 line]</div></div>
      <div class="score-card highlight"><div class="score-label">Composite Score</div><div class="score-value">[X]/25</div><div class="score-note">[Verdict]</div></div>
    </div>
  </div>

  <!-- SECTION 2: MARKET ANALYSIS -->
  <div class="section">
    <div class="section-header"><div class="section-number">2</div><div class="section-title">Market Analysis</div></div>
    <p>[1-2 sentences on Singapore market context]</p>
    <table>
      <thead><tr><th>Dimension</th><th>Insight</th><th>Source</th></tr></thead>
      <tbody>
        <tr><td><strong>Market Size (SG)</strong></td><td>SGD $[X]M, growing [X]% CAGR</td><td>DOS / MTI / Statista</td></tr>
        <tr><td><strong>Target Segment</strong></td><td>[Who, how many people]</td><td>[Source]</td></tr>
        <tr><td><strong>Key Trend 1</strong></td><td>[Specific trend]</td><td>[Source]</td></tr>
        <tr><td><strong>Key Trend 2</strong></td><td>[Specific trend]</td><td>[Source]</td></tr>
        <tr><td><strong>Consumer Behaviour</strong></td><td>[Key insight]</td><td>[Source]</td></tr>
      </tbody>
    </table>
  </div>

  <!-- SECTION 3: COMPETITIVE LANDSCAPE -->
  <div class="section">
    <div class="section-header"><div class="section-number">3</div><div class="section-title">Competitive Landscape</div></div>
    <p>[1-2 sentences on competitive context]</p>
    <table>
      <thead><tr><th>Competitor</th><th>Positioning</th><th>Pricing (SGD)</th><th>Weakness to Exploit</th></tr></thead>
      <tbody>
        <tr><td><strong>[Competitor 1]</strong></td><td>[1 line]</td><td>$[X]</td><td>[Gap]</td></tr>
        <tr><td><strong>[Competitor 2]</strong></td><td>[1 line]</td><td>$[X]</td><td>[Gap]</td></tr>
        <tr><td><strong>[Competitor 3]</strong></td><td>[1 line]</td><td>$[X]</td><td>[Gap]</td></tr>
      </tbody>
    </table>
    <div class="swot-grid">
      <div class="swot-cell strengths"><h4>Strengths</h4><ul><li>[Point 1]</li><li>[Point 2]</li><li>[Point 3]</li></ul></div>
      <div class="swot-cell weaknesses"><h4>Weaknesses</h4><ul><li>[Point 1]</li><li>[Point 2]</li><li>[Point 3]</li></ul></div>
      <div class="swot-cell opportunities"><h4>Opportunities</h4><ul><li>[Point 1]</li><li>[Point 2]</li><li>[Point 3]</li></ul></div>
      <div class="swot-cell threats"><h4>Threats</h4><ul><li>[Point 1]</li><li>[Point 2]</li><li>[Point 3]</li></ul></div>
    </div>
  </div>

  <!-- SECTION 4: FINANCIAL PROJECTIONS -->
  <div class="section">
    <div class="section-header"><div class="section-number">4</div><div class="section-title">Financial Projections</div></div>
    <p>Startup cost breakdown and revenue scenarios based on your business model.</p>
    <table>
      <thead><tr><th>Category</th><th>Item</th><th>Where to Source</th><th>Est. Cost (SGD)</th></tr></thead>
      <tbody>
        <tr><td><strong>Registration</strong></td><td>ACRA Pte Ltd incorporation</td><td><a href="https://www.bizfile.gov.sg">BizFile+</a> / <a href="https://sleek.com/sg">Sleek</a></td><td>$315</td></tr>
        <tr><td><strong>Premises</strong></td><td>[Type]</td><td>[Vendor]</td><td>$[X]</td></tr>
        <tr><td><strong>Equipment</strong></td><td>[Item]</td><td>[Vendor]</td><td>$[X]</td></tr>
        <tr><td><strong>Software/POS</strong></td><td>[Tool]</td><td><a href="https://www.storehub.com/sg">StoreHub</a> / <a href="https://www.qashier.com">Qashier</a></td><td>$[X]</td></tr>
        <tr><td><strong>Marketing (3mo)</strong></td><td>[Channel mix]</td><td>Meta + Google + TikTok Ads</td><td>$[X]</td></tr>
        <tr><td><strong>Working Capital (6mo)</strong></td><td>—</td><td>—</td><td>$[X]</td></tr>
        <tr><td><strong>Contingency (15%)</strong></td><td>—</td><td>—</td><td>$[X]</td></tr>
        <tr style="background:#f0f4ff;font-weight:700;"><td colspan="3"><strong>TOTAL</strong></td><td><strong>$[X]</strong></td></tr>
      </tbody>
    </table>
    <table class="scenario-table" style="margin-top:24px;">
      <thead><tr><th>Metric</th><th>Conservative</th><th>Moderate</th><th>Optimistic</th></tr></thead>
      <tbody>
        <tr><td><strong>Monthly Revenue (Mo 6)</strong></td><td>$[X]</td><td>$[X]</td><td>$[X]</td></tr>
        <tr><td><strong>Monthly Revenue (Mo 12)</strong></td><td>$[X]</td><td>$[X]</td><td>$[X]</td></tr>
        <tr><td><strong>Gross Margin</strong></td><td>[X]%</td><td>[X]%</td><td>[X]%</td></tr>
        <tr><td><strong>Break-even</strong></td><td>[X] months</td><td>[X] months</td><td>[X] months</td></tr>
        <tr><td><strong>Year-1 P&L</strong></td><td>$[X]</td><td>$[X]</td><td>$[X]</td></tr>
      </tbody>
    </table>
    <div class="callout"><strong>Bottom line:</strong> [One sentence summary of financial viability]</div>
  </div>

  <!-- SECTION 5: REGULATORY & COMPLIANCE -->
  <div class="section">
    <div class="section-header"><div class="section-number">5</div><div class="section-title">Regulatory & Compliance Checklist</div></div>
    <p>Every license, permit, and registration required to operate legally in Singapore.</p>
    <table>
      <thead><tr><th>#</th><th>Requirement</th><th>Agency</th><th>Where to Apply</th><th>Timeline</th><th>Cost (SGD)</th></tr></thead>
      <tbody>
        <tr><td>1</td><td><strong>Incorporate Pte Ltd</strong></td><td>ACRA</td><td><a href="https://www.bizfile.gov.sg">BizFile+</a></td><td>1-2 days</td><td>$315</td></tr>
        <tr><td>2</td><td><strong>GST Registration</strong></td><td>IRAS</td><td><a href="https://www.iras.gov.sg">IRAS</a></td><td>2-3 weeks</td><td>Free</td></tr>
        <tr><td>3</td><td><strong>PDPA Compliance</strong></td><td>PDPC</td><td><a href="https://www.pdpc.gov.sg">PDPC</a></td><td>Immediate</td><td>Free</td></tr>
        <tr><td>4</td><td><strong>[Industry License]</strong></td><td>[Agency]</td><td><a href="https://www.gobusiness.gov.sg/licences">GoBusiness</a></td><td>[X] weeks</td><td>$[X]</td></tr>
        <tr><td>5</td><td><strong>Work Passes (if hiring foreign)</strong></td><td>MOM</td><td><a href="https://www.mom.gov.sg">MOM EP Online</a></td><td>3 weeks</td><td>$225/pass</td></tr>
      </tbody>
    </table>
  </div>

  <!-- SECTION 6: RISK ASSESSMENT -->
  <div class="section">
    <div class="section-header"><div class="section-number">6</div><div class="section-title">Risk Assessment</div></div>
    <table>
      <thead><tr><th>#</th><th>Risk</th><th>Likelihood</th><th>Impact</th><th>Mitigation</th></tr></thead>
      <tbody>
        <tr><td>1</td><td><strong>[Risk 1]</strong></td><td><span class="badge-high">High</span></td><td><span class="badge-high">High</span></td><td>[Specific action]</td></tr>
        <tr><td>2</td><td><strong>[Risk 2]</strong></td><td><span class="badge-med">Med</span></td><td><span class="badge-high">High</span></td><td>[Specific action]</td></tr>
        <tr><td>3</td><td><strong>[Risk 3]</strong></td><td><span class="badge-med">Med</span></td><td><span class="badge-med">Med</span></td><td>[Specific action]</td></tr>
        <tr><td>4</td><td><strong>[Risk 4]</strong></td><td><span class="badge-low">Low</span></td><td><span class="badge-high">High</span></td><td>[Specific action]</td></tr>
      </tbody>
    </table>
  </div>

  <!-- SECTION 7: GRANTS -->
  <div class="section">
    <div class="section-header"><div class="section-number">7</div><div class="section-title">Matched Government Grants & Support</div></div>
    <p>Grants you are eligible for based on your business profile. Total potential funding: <strong>SGD $[X]</strong></p>
    <div class="grant-grid">
      <div class="grant-card">
        <div class="grant-name">[Grant Name]</div>
        <div class="grant-agency">[Agency]</div>
        <div class="grant-amount">Up to $[X]</div>
        <div class="grant-match eligible">✅ You are eligible — [reason]</div>
        <a href="[URL]">Apply Now →</a>
      </div>
      <div class="grant-card">
        <div class="grant-name">[Grant Name]</div>
        <div class="grant-agency">[Agency]</div>
        <div class="grant-amount">Up to $[X]</div>
        <div class="grant-match conditional">⚠️ Conditional — [what to fix first]</div>
        <a href="[URL]">Apply Now →</a>
      </div>
    </div>
    <div class="callout"><strong>Recommended application order:</strong> [Grant 1] first (fastest approval, 30 days) → then [Grant 2] (use PSG approval to strengthen EDG application) → then [Grant 3].</div>
    
    <p style="margin-top:20px;font-weight:700;">Step-by-Step Application Guide</p>
    <table>
      <thead><tr><th>Grant</th><th>Documents Required</th><th>Common Rejection Reasons</th><th>Pro Tip</th></tr></thead>
      <tbody>
        <tr><td><strong>[Grant 1]</strong></td><td>[Doc 1, Doc 2, Doc 3]</td><td>[Reason]</td><td>[Legal optimisation tip]</td></tr>
        <tr><td><strong>[Grant 2]</strong></td><td>[Doc 1, Doc 2]</td><td>[Reason]</td><td>[Tip]</td></tr>
      </tbody>
    </table>
  </div>

  <!-- SECTION 8: 90-DAY ROADMAP -->
  <div class="section">
    <div class="section-header"><div class="section-number">8</div><div class="section-title">90-Day Launch Roadmap</div></div>
    <div class="roadmap-phases">
      <div class="roadmap-phase">
        <div class="phase-num">Phase 1</div>
        <div class="phase-name">Foundation</div>
        <div class="phase-weeks">Week 1–2</div>
        <ul>
          <li>[Task 1]</li>
          <li>[Task 2]</li>
          <li>[Task 3]</li>
          <li>[Task 4]</li>
        </ul>
      </div>
      <div class="roadmap-phase">
        <div class="phase-num">Phase 2</div>
        <div class="phase-name">Registration</div>
        <div class="phase-weeks">Week 3–4</div>
        <ul>
          <li>[Task 1]</li>
          <li>[Task 2]</li>
          <li>[Task 3]</li>
          <li>[Task 4]</li>
        </ul>
      </div>
      <div class="roadmap-phase">
        <div class="phase-num">Phase 3</div>
        <div class="phase-name">Pre-Launch</div>
        <div class="phase-weeks">Week 5–8</div>
        <ul>
          <li>[Task 1]</li>
          <li>[Task 2]</li>
          <li>[Task 3]</li>
          <li>[Task 4]</li>
        </ul>
      </div>
      <div class="roadmap-phase">
        <div class="phase-num">Phase 4</div>
        <div class="phase-name">Launch</div>
        <div class="phase-weeks">Week 9–13</div>
        <ul>
          <li>[Task 1]</li>
          <li>[Task 2]</li>
          <li>[Task 3]</li>
          <li>[Task 4]</li>
        </ul>
      </div>
    </div>
    <table style="margin-top:16px;">
      <thead><tr><th>Week</th><th>Task</th><th>Tools & Vendors</th><th>Cost (SGD)</th></tr></thead>
      <tbody>
        <tr><td><strong>1-2</strong></td><td>[Task]</td><td>[Tool/Vendor with link]</td><td>$[X]</td></tr>
        <tr><td><strong>3-4</strong></td><td>[Task]</td><td>[Tool/Vendor]</td><td>$[X]</td></tr>
        <tr><td><strong>5-8</strong></td><td>[Task]</td><td>[Tool/Vendor]</td><td>$[X]</td></tr>
        <tr><td><strong>9-13</strong></td><td>[Task]</td><td>[Tool/Vendor]</td><td>$[X]</td></tr>
      </tbody>
    </table>
    <table style="margin-top:16px;">
      <thead><tr><th>Milestone</th><th>By When</th><th>Success Metric</th></tr></thead>
      <tbody>
        <tr><td><strong>First paying customer</strong></td><td>Week 6</td><td>1+ transaction</td></tr>
        <tr><td><strong>50 beta users</strong></td><td>Week 8</td><td>40%+ weekly active</td></tr>
        <tr><td><strong>Public launch</strong></td><td>Week 9</td><td>500+ site visits</td></tr>
        <tr><td><strong>[Custom milestone]</strong></td><td>[Week X]</td><td>[Metric]</td></tr>
      </tbody>
    </table>
  </div>

  <!-- SECTION 9: KEY SUCCESS FACTORS -->
  <div class="section">
    <div class="section-header"><div class="section-number">9</div><div class="section-title">Key Success Factors</div></div>
    <table>
      <thead><tr><th>#</th><th>Factor</th><th>Concrete Action</th><th>Tool / Vendor</th></tr></thead>
      <tbody>
        <tr><td>1</td><td><strong>[Factor]</strong></td><td>[Action]</td><td>[Tool]</td></tr>
        <tr><td>2</td><td><strong>[Factor]</strong></td><td>[Action]</td><td>[Tool]</td></tr>
        <tr><td>3</td><td><strong>[Factor]</strong></td><td>[Action]</td><td>[Tool]</td></tr>
        <tr><td>4</td><td><strong>[Factor]</strong></td><td>[Action]</td><td>[Tool]</td></tr>
        <tr><td>5</td><td><strong>[Factor]</strong></td><td>[Action]</td><td>[Tool]</td></tr>
      </tbody>
    </table>
  </div>

  <!-- SECTION 10: RESOURCES & NEXT STEPS -->
  <div class="section">
    <div class="section-header"><div class="section-number">10</div><div class="section-title">Immediate Next Steps</div></div>
    <table>
      <thead><tr><th>Priority</th><th>Action</th><th>How</th><th>Deadline</th></tr></thead>
      <tbody>
        <tr><td><span class="badge-high">This Week</span></td><td><strong>[Action 1]</strong></td><td>[How + link]</td><td>[Date]</td></tr>
        <tr><td><span class="badge-med">This Month</span></td><td><strong>[Action 2]</strong></td><td>[How + link]</td><td>[Date]</td></tr>
        <tr><td><span class="badge-low">Month 2</span></td><td><strong>[Action 3]</strong></td><td>[How + link]</td><td>[Date]</td></tr>
      </tbody>
    </table>
    <div class="callout" style="margin-top:20px;"><strong>Your total potential grant funding:</strong> SGD $[X] across [X] matched grants. Start with [Grant Name] — fastest approval and strongest match for your profile.</div>
  </div>

  <!-- FOOTER -->
  <div class="report-footer">
    <p>Generated by ScopeAI • Premium Business Intelligence for Singapore Entrepreneurs</p>
    <p class="disclaimer">AI-generated using public data. Informational only — not legal, tax, or financial advice. Verify all figures and regulations with the relevant Singapore agencies before acting.</p>
  </div>

</div>
</body>
</html>`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const { orderId } = await req.json();
    if (!orderId) throw new Error("orderId is required");

    // Fetch order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("report_orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) throw new Error("Order not found");
    if (order.status === "completed" && order.report_content) {
      return new Response(JSON.stringify({ report: order.report_content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build conversation context from consultation data
    const consultationMessages = order.consultation_data as Array<{ role: string; content: string }>;
    const conversationSummary = consultationMessages
      .map((m: { role: string; content: string }) => `${m.role === "user" ? "Client" : "Consultant"}: ${m.content}`)
      .join("\n\n");

    let reportContent: string;
    try {
      reportContent = await callAnthropicReportText({
        system: REPORT_PROMPT,
        userMessage: `Here is the consultation conversation with the client:\n\n${conversationSummary}\n\nGenerate the full Premium Business Viability Report based on this consultation.`,
        maxTokens: 8192,
      });
    } catch (aiErr) {
      const status = (aiErr as Error & { status?: number }).status;
      if (status) return anthropicErrorResponse(status, corsHeaders);
      throw aiErr;
    }

    // Save report
    await supabaseAdmin
      .from("report_orders")
      .update({ status: "completed", report_content: reportContent })
      .eq("id", orderId);

    return new Response(JSON.stringify({ report: reportContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-report error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
