

## Trend Forecasting Dashboard with Visual Charts

### What We'll Build

A new **Trends** page (`/trends`) with interactive charts visualizing Singapore market data across key sectors. The data will be fetched from an AI model via a backend function, then rendered using the `recharts` library (already installed).

### Architecture

```text
User visits /trends
       │
       ▼
  Trends Page (React)
       │
       ▼
  Edge Function: sg-market-trends
       │
       ▼
  Lovable AI (Gemini 2.5 Flash)
  → Prompted to return structured JSON
    with sector data, growth rates, risk
    scores, saturation levels
       │
       ▼
  Charts render the structured data
```

### Key Components

1. **Edge Function (`supabase/functions/sg-market-trends/index.ts`)**
   - Calls Lovable AI (Gemini 2.5 Flash) with a system prompt requesting structured JSON about Singapore market trends
   - Returns data shaped for charts: sector names, growth rates, saturation %, risk scores, regulation impact scores
   - Caches responses in a `market_trends_cache` database table to avoid redundant AI calls (cache TTL ~24 hours)

2. **Database: `market_trends_cache` table**
   - Stores cached AI responses with a timestamp
   - Simple structure: `id`, `query_key`, `data` (jsonb), `created_at`
   - RLS: publicly readable (trend data is not sensitive)

3. **Trends Page (`src/pages/Trends.tsx`)**
   - **Sector Growth Bar Chart** — horizontal bars showing projected growth % by sector (F&B, Fintech, E-commerce, Healthcare, Logistics, etc.)
   - **Market Saturation Radar Chart** — radar/spider chart showing saturation levels across sectors
   - **Risk Assessment Heat Chart** — bar chart with color-coded risk scores (regulatory, financial, operational)
   - **Trend Over Time Line Chart** — line chart showing sector momentum over recent quarters
   - Filter controls: users can select sectors or time ranges
   - Loading skeletons while data fetches

4. **Routing** — Add `/trends` route to `App.tsx` and a "Trends" link in the Navbar

5. **Navbar Update** — Add "Trends" navigation item with a chart icon

### Technical Details

- Uses `recharts` (already installed) with the existing `ChartContainer`, `ChartTooltip`, and `ChartLegendContent` components from `src/components/ui/chart.tsx`
- Styled with the existing navy/gold design system
- Mobile responsive with stacked chart layout on small screens
- Free users can view charts; detailed drill-down could be Pro-gated later

### Tasks Summary
1. Create the `market_trends_cache` table with migration
2. Build the `sg-market-trends` edge function calling Lovable AI
3. Create the Trends page with 4 chart types
4. Update routing and navbar

