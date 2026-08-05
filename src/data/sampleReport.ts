export const SAMPLE_REPORT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Artisan Juice &amp; Coffee Kiosk — Competitive Intelligence Report</title>
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
.legal-note { font-size:12px; color:#856404; background:#fff8e6; padding:10px 14px; border-left:3px solid #c9a84c; border-radius:0 4px 4px 0; margin:12px 0 20px; font-family:Arial,sans-serif; }
.plan-phase { background:#fff; border-radius:6px; padding:18px 22px; margin-bottom:12px; border-left:3px solid #c9a84c; }
.plan-phase h4 { color:#0a1628; font-size:14px; margin-bottom:8px; }
.plan-phase ul { padding-left:18px; font-size:13px; line-height:1.7; color:#2c3e55; }
</style>
</head>
<body>
  <div class="header">
    <div class="eyebrow">Pre-Launch Competitive Intelligence Report</div>
    <h1>Artisan Juice &amp; Coffee Kiosk</h1>
    <div class="subtitle">House-made syrups and loyalty app for office workers in CBD — Tanjong Pagar or Raffles Place, Singapore</div>
  </div>

  <div class="body">
    <div class="section-label">Executive Summary</div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-number">USD 2.1B</div><div class="stat-label">Market Size</div></div>
      <div class="stat-card"><div class="stat-number">USD 3.4B by 2030</div><div class="stat-label">Projected Size</div></div>
      <div class="stat-card"><div class="stat-number">10.2%</div><div class="stat-label">CAGR</div></div>
      <div class="stat-card"><div class="stat-number">150+</div><div class="stat-label">Active Competitors</div></div>
    </div>
    <div class="narrative"><p>A small-format beverage kiosk targeting CBD office workers with premium house-made fruit syrups as a differentiation point versus powder-based competitors. The S$80,000 budget supports a 2-3 person operation with a loyalty app to drive repeat business. Success depends on securing a high-foot-traffic location, managing fresh syrup production costs, and competing against established chains like Starbucks and Gong Cha.</p></div>

    <div class="section-label">Competitive Landscape</div>
    <table>
      <thead><tr><th>Brand</th><th>Price Range</th><th>Positioning</th><th>Presence</th><th>Threat Level</th></tr></thead>
      <tbody>
    <tr>
      <td class="td-name">Starbucks</td>
      <td>S$5.50–S$7.50 per drink</td>
      <td>Premium global coffee chain with app-based loyalty and customization</td>
      <td>60+ locations across Singapore including Tanjong Pagar and Raffles Place</td>
      <td style="color:#e05c5c;font-weight:700;">HIGH</td>
    </tr>
    <tr>
      <td class="td-name">Gong Cha</td>
      <td>S$4.50–S$6.50 per drink</td>
      <td>Bubble tea chain with strong presence in CBD, powder-based drinks</td>
      <td>40+ locations, multiple outlets in financial district</td>
      <td style="color:#e05c5c;font-weight:700;">HIGH</td>
    </tr>
    <tr>
      <td class="td-name">Koi Cafe</td>
      <td>S$5.00–S$7.00 per drink</td>
      <td>Premium bubble tea and coffee hybrid with mobile ordering</td>
      <td>25+ locations including Raffles Place</td>
      <td style="color:#e05c5c;font-weight:700;">HIGH</td>
    </tr>
    <tr>
      <td class="td-name">Nespresso Boutique</td>
      <td>S$6.00–S$8.00 per drink</td>
      <td>Luxury espresso-based drinks with sleek retail experience</td>
      <td>3 locations, Raffles Place flagship</td>
      <td style="color:#d4a843;font-weight:700;">MEDIUM</td>
    </tr>
    <tr>
      <td class="td-name">Chained local juice bars (JUS, Machi Machi, etc.)</td>
      <td>S$6.00–S$9.00 per drink</td>
      <td>Health-focused fresh juices and smoothies, some with loyalty apps</td>
      <td>35+ combined locations across CBD</td>
      <td style="color:#d4a843;font-weight:700;">MEDIUM</td>
    </tr>
    <tr>
      <td class="td-name">Independent kiosk operators</td>
      <td>S$2.50–S$4.50 per drink</td>
      <td>Street coffee carts, informal juice stands with low overhead</td>
      <td>100+ unregistered or informal operators across CBD</td>
      <td style="color:#d4a843;font-weight:700;">MEDIUM</td>
    </tr>
    <tr>
      <td class="td-name">7-Eleven and Cheers</td>
      <td>S$2.00–S$4.00 per drink</td>
      <td>Convenience stores with ready-made bottled drinks and coffee pods</td>
      <td>200+ locations covering all CBD areas</td>
      <td style="color:#d4a843;font-weight:700;">MEDIUM</td>
    </tr>
    <tr>
      <td class="td-name">Tiong Bahru Bakery</td>
      <td>S$5.50–S$7.50 per drink</td>
      <td>Artisanal café with premium pastries and espresso</td>
      <td>8 locations, strong presence in Tanjong Pagar area</td>
      <td style="color:#d4a843;font-weight:700;">MEDIUM</td>
    </tr></tbody>
    </table>

    <div class="section-label">SWOT Analysis</div>
    <div class="swot-grid">
      
    <div class="swot-col">
      <h4>Strengths</h4>
      <div class="swot-item"><strong>Differentiated product—house-made fruit syrups</strong><p>Competitors rely on powder mixes; fresh syrups offer premium positioning and perceived quality, justifying higher prices and building brand loyalty among discerning office workers.</p></div><div class="swot-item"><strong>Low capex footprint and fast payback</strong><p>Kiosk format (S$80,000) requires minimal fit-out versus full F&amp;B shop; breakeven achievable within 8–12 months if target volume hit, enabling rapid scaling or pivot if needed.</p></div><div class="swot-item"><strong>Experienced co-founder reduces operational risk</strong><p>Partner with prior café operations knowledge mitigates first-time entrepreneur risk; capability to manage inventory, staff scheduling, and supplier relationships from day one.</p></div><div class="swot-item"><strong>Loyalty app creates repeat customer lock-in</strong><p>Punch-card gamification and data capture enable targeted promotions and higher customer lifetime value versus casual walk-in competitors.</p></div>
    </div>
      
    <div class="swot-col">
      <h4>Weaknesses</h4>
      <div class="swot-item"><strong>No prior F&amp;B experience for primary founder</strong><p>Limited understanding of cost control, supplier negotiations, regulatory compliance (NEA, MOM), and crisis management; heavy reliance on one co-founder creates single-point-of-failure risk.</p></div><div class="swot-item"><strong>Fresh syrup production adds operational complexity and waste</strong><p>Requires daily prep, food safety training, cold storage, and handling of perishable fruit; spoilage, batch failures, or inconsistent taste risk damaging brand reputation and margins.</p></div><div class="swot-item"><strong>Tiny kiosk format limits product range and upsell potential</strong><p>Cannot offer seating, food pairings, or extensive menu; revenue per square foot heavily dependent on transaction frequency; hard to differentiate on ambiance or experience.</p></div><div class="swot-item"><strong>Underfunded compared to chains</strong><p>S$80,000 covers setup but leaves minimal buffer for marketing, staff training, or weathering slow season; no capital for technology stack beyond basic loyalty app.</p></div>
    </div>
      
    <div class="swot-col">
      <h4>Opportunities</h4>
      <div class="swot-item"><strong>Premiumization trend among younger office workers</strong><p>Gen Y/Z professionals spend S$6–S$9 on artisanal drinks; willing to pay more for sustainability, health benefits, and Instagram-worthy products; house-made positioning aligns with this.</p></div><div class="swot-item"><strong>Untapped office worker micro-mobility</strong><p>Raffles Place and Tanjong Pagar have 50,000+ daily office workers; most rely on Starbucks or generic convenience stores; a faster, fresher alternative with loyalty rewards could capture 5–10% share.</p></div><div class="swot-item"><strong>B2B corporate gifting via loyalty app</strong><p>Corporates buy gift cards and bulk drink vouchers for staff; integrate app with corporate procurement platforms (e.g., Grab, Favpay) to unlock recurring revenue.</p></div><div class="swot-item"><strong>Expansion to complementary formats (food delivery, ghost kitchen)</strong><p>If kiosk succeeds, syrup recipe/brand can scale via Deliveroo, Grab, or Foodpanda; or partner with other cafés to supply syrups as wholesale co-packing.</p></div>
    </div>
      
    <div class="swot-col">
      <h4>Threats</h4>
      <div class="swot-item"><strong>Intense price competition from established chains and convenience stores</strong><p>Starbucks, Gong Cha, and 7-Eleven can undercut margins via economies of scale; office workers price-sensitive if convenience/speed similar; difficult to defend premium pricing without strong brand.</p></div><div class="swot-item"><strong>Regulatory tightening on food safety and licensing</strong><p>NEA may require commercial kitchen certification for syrup production; MOM enforces stricter wage/hour rules; ACRA tax audits on small cash businesses; compliance costs could spike post-2027.</p></div><div class="swot-item"><strong>Location-dependent success; foot traffic decay post-pandemic</strong><p>WFH adoption in Singapore weakened CBD foot traffic; hybrid work may not recover fully; chosen kiosk location could have lower passing trade than assumed; lease renewal risk in 2029.</p></div><div class="swot-item"><strong>Supply chain volatility for fresh fruit</strong><p>Seasonal fruit scarcity, price spikes (e.g., mango shortage), and import dependency expose syrup-making to cost shocks; fixed pricing hard to maintain if COGS swings 30–40%.</p></div>
    </div>
    </div>

    <div class="section-label">Unit Economics</div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-number">S$1.65</div><div class="stat-label">Cost / Cup</div></div>
      <div class="stat-card"><div class="stat-number">S$5.80</div><div class="stat-label">Price / Cup</div></div>
      <div class="stat-card"><div class="stat-number">S$4.15</div><div class="stat-label">Margin / Cup (72%)</div></div>
      <div class="stat-card"><div class="stat-number">38 cups/day</div><div class="stat-label">Breakeven / Day</div></div>
    </div>
    <div class="legal-note">Estimates based on information you provided and general market assumptions. Actual costs, pricing, and margins will vary — validate with real supplier quotes before committing capital.</div>

    <div class="section-label">Risk Register</div>
    <table>
      <thead><tr><th>Risk</th><th>Likelihood</th><th>Impact</th><th>Mitigation</th></tr></thead>
      <tbody></tbody>
    </table>
    <div class="legal-note">This is not an exhaustive list of risks. Consult relevant professionals (legal, financial, industry-specific) for a complete risk assessment before launch.</div>

    <div class="disclaimer"><strong>⚠️ Disclaimer:</strong> This report incorporates real-time web search data current as of the report date. All regulatory information, competitor data, and market figures should be independently verified before making business decisions. This does not constitute professional legal, financial, or business advice.</div>

    <div class="section-label">Market Positioning Recommendations</div>
    
    <div class="rec-card" style="border-left-color:#c9a84c;">
      <span class="rec-num">1</span>
      <div>
        <h3>Secure Prime Kiosk Location with Foot Traffic Validation</h3>
        <p>Tanjong Pagar and Raffles Place are premium locations with high rent (typically SGD 3,000-6,000/month for small kiosks). Before signing a lease, validate foot traffic patterns during peak hours (11am-2pm, 3pm-5pm) and confirm office worker density. This is non-negotiable given your tight SGD 80,000 budget and reliance on high-velocity transactions.</p>
      </div>
    </div>
    <div class="rec-card" style="border-left-color:#c9a84c;">
      <span class="rec-num">2</span>
      <div>
        <h3>Develop Syrup Production SOP and Food Safety Certification</h3>
        <p>House-made fruit syrups are your differentiator but require NEA Food Safety Certification and hazard analysis plan. With no F&amp;B experience, you must document every recipe, source control, storage temperature, and shelf-life testing before launch. Budget SGD 2,000-3,000 for initial compliance consulting and equipment (vacuum sealer, sterilisation).</p>
      </div>
    </div>
    <div class="rec-card" style="border-left-color:#c9a84c;">
      <span class="rec-num">3</span>
      <div>
        <h3>Build Loyalty App MVP with Minimal Tech Spend</h3>
        <p>Punch-card loyalty apps cost SGD 500-2,000/month for white-label solutions (ShopBack, Loyalify, etc). Given your budget, negotiate startup rates or use basic SMS-based punch systems initially. Test the app with 50 customers before full rollout to validate customer adoption and repeat purchase rates.</p>
      </div>
    </div>
    <div class="rec-card" style="border-left-color:#2a4a7f;">
      <span class="rec-num">4</span>
      <div>
        <h3>Validate Unit Economics with Real Cost Testing</h3>
        <p>Run 2-week cost testing on 3-4 signature drinks: track ingredient costs, labour time per drink (target under 2 minutes), and waste. Ensure gross margin is 60%+ after syrup costs. At peak velocity of 80-100 drinks/day, you need SGD 400-500 daily revenue to cover rent, labour, and COGS. If testing shows lower margins, reconsider location or pricing.</p>
      </div>
    </div>
    <div class="rec-card" style="border-left-color:#2a4a7f;">
      <span class="rec-num">5</span>
      <div>
        <h3>Hire and Train Operations Lead Before Launch</h3>
        <p>Your partner's cafe experience is critical, but they cannot be everywhere. Hire an experienced barista/beverage specialist 4 weeks before opening to document procedures, train the other 1-2 staff, and stress-test service speed. This prevents launch chaos and protects your reputation among office workers who have zero patience for queues.</p>
      </div>
    </div>
    <div class="rec-card" style="border-left-color:#4a5a6f;">
      <span class="rec-num">6</span>
      <div>
        <h3>Plan Contingency for Supplier Reliability</h3>
        <p>House-made syrups depend on consistent fruit sourcing. Identify 2-3 backup suppliers (Pasir Ris fruit wholesale, wet markets) and negotiate weekly delivery contracts. If your primary supplier fails mid-week, you cannot pivot to powder mixes without losing your core differentiator. Build a 1-week ingredient buffer into your working capital.</p>
      </div>
    </div>

    <div class="section-label">90-Day Launch Plan</div>
    
    <div class="plan-phase">
      <h4>Weeks 1-2: Pre-Launch Setup — Regulatory compliance, supplier contracts, and staff onboarding</h4>
      <ul><li>Submit NEA Food Safety application and complete hazard analysis for syrup production</li><li>Finalize kiosk lease agreement and complete fit-out (POS system, syrup storage, ice machine)</li><li>Lock in weekly fruit supplier contracts and conduct first batch of syrup trials</li><li>Onboard operations lead and begin staff training on recipes and service protocols</li></ul>
    </div>
    <div class="plan-phase">
      <h4>Weeks 3-4: Soft Launch and Testing — Validate operations, refine product, test loyalty app</h4>
      <ul><li>Launch soft opening to office workers (target: 30-50 customers/day) with promotional pricing</li><li>Run 2-week cost testing on signature drinks; adjust pricing if margins fall below 60%</li><li>Deploy loyalty app MVP (SMS-based or basic punch card) and track first 50 enrollments</li><li>Monitor service speed and adjust staffing or procedures if order fulfillment exceeds 2 minutes</li></ul>
    </div>
    <div class="plan-phase">
      <h4>Weeks 5-6: Optimization and Marketing Push — Ramp demand, refine app features, build brand awareness</h4>
      <ul><li>Launch social media campaign targeting Raffles Place and Tanjong Pagar office workers (LinkedIn, Instagram)</li><li>Introduce limited-time seasonal syrup flavors to drive trial and repeat visits</li><li>Upgrade loyalty app based on soft-launch feedback; offer sign-up incentive (free drink on 5th punch)</li><li>Track repeat purchase rate and adjust loyalty mechanics if below 35% target</li></ul>
    </div>
    <div class="plan-phase">
      <h4>Weeks 7-9: Stabilization and Scale Planning — Achieve sustainable daily targets and plan for growth</h4>
      <ul><li>Target 80-100 daily transactions and validate unit economics support operations</li><li>Analyze loyalty app data; segment customers by frequency and prepare targeted promotions</li><li>Evaluate second location feasibility if current location hits profitability targets</li><li>Document all processes and financial performance for potential investor or franchise conversations</li></ul>
    </div>

    <div class="section-label">Grants &amp; Funding to Explore</div>
    <table>
      <thead><tr><th>Grant</th><th>Agency</th><th>What It Covers</th><th>Est. Amount</th></tr></thead>
      <tbody>
    <tr>
      <td class="td-name">Enterprise Development Grant (EDG) - Capability Development</td>
      <td>Enterprise Singapore (ESG)</td>
      <td>Co-funds up to 70% of qualifying costs for business process improvements, systems, and training. Relevant for syrup production automation, POS systems, and staff training on food safety. Typical support: SGD 3,000-8,000 for small retail operations.</td>
      <td>SGD 5,000-6,000</td>
    </tr>
    <tr>
      <td class="td-name">Productivity Solutions Grant (PSG)</td>
      <td>Enterprise Singapore (ESG)</td>
      <td>Supports adoption of pre-approved digital solutions for retail operations. Your loyalty app and POS integration qualify. Grant covers 70-80% of solution costs with a cap of SGD 5,000 per solution.</td>
      <td>SGD 3,500-5,000</td>
    </tr>
    <tr>
      <td class="td-name">Startup SG Founder</td>
      <td>Enterprise Singapore (ESG)</td>
      <td>Cash grant for first-time entrepreneurs (max 1 grant per founder). Provides co-investment funds for working capital and initial setup. Requires matching capital from founder. For your SGD 80,000 budget, this could unlock SGD 15,000-20,000 in additional capital, subject to business plan and viability assessment.</td>
      <td>SGD 15,000-20,000</td>
    </tr>
    <tr>
      <td class="td-name">SPRING Singapore Food Safety and Regulatory Compliance Support</td>
      <td>Standards, Productivity and Innovation Board (SPRING Singapore, now part of ESG)</td>
      <td>Subsidized consulting for food and beverage businesses on NEA compliance, food safety systems, and traceability. Covers up to 50% of consulting costs for documentation and certification. Relevant for your syrup production SOP and food safety certification.</td>
      <td>SGD 1,000-2,000</td>
    </tr></tbody>
    </table>
    <div class="legal-note">Grant eligibility, amounts, and application requirements change and must be independently verified directly with the relevant agency (e.g. Enterprise Singapore) before applying. This is not a guarantee of eligibility or approval.</div>

    <div class="section-label">Key Performance Indicators — 90-Day Tracking</div>
    <table>
      <thead><tr><th>Metric</th><th>Target</th><th>Timeframe</th></tr></thead>
      <tbody>
    <tr><td>Daily Transaction Volume</td><td>80-100 drinks sold per day</td><td>By end of Month 2</td></tr>
    <tr><td>Average Transaction Value</td><td>SGD 5.50 per drink (allowing for loyalty discounts)</td><td>By end of Month 1</td></tr>
    <tr><td>Loyalty App Adoption Rate</td><td>35% of customers enrolled in punch-card system</td><td>By end of Month 3</td></tr>
    <tr><td>Repeat Purchase Rate</td><td>40% of customers return within 7 days</td><td>By end of Month 2</td></tr>
    <tr><td>Service Speed (Avg Order Fulfillment)</td><td>Under 2 minutes from order to hand-off</td><td>By end of Month 1</td></tr>
    <tr><td>Gross Margin</td><td>60% or higher after all COGS and syrup production costs</td><td>Ongoing from Day 1</td></tr></tbody>
    </table>

    <div class="verdict"><strong>Verdict:</strong> This beverage kiosk concept is viable in Q1 2027 with clear unit economics and a defensible differentiator in house-made syrups, but success hinges entirely on three factors: securing a high-traffic location in Raffles Place or Tanjong Pagar (non-negotiable), validating that 60%+ gross margins are achievable given syrup production costs, and leveraging your partner's cafe experience to execute operationally flawless service within 2 minutes per order. Your SGD 80,000 budget is tight after location deposit, equipment, and initial inventory—you will lose money if location rent exceeds SGD 4,500/month or if daily transaction velocity drops below 70 drinks during months 1-2.</div>
  </div>
</body>
</html>`;