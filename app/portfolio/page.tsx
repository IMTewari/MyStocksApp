
import SectorIndustryMix from "@/app/components/SectorIndustryMix";
import ExitAlerts from "@/app/components/ExitAlerts";
import TrendAllocator from "@/app/components/TrendAllocator";

import { Holding, ExitSignalInput, SectorMomentum } from "@/app/lib/portfolio/types";
import { computeSectorIndustryMix } from "@/app/lib/portfolio/mix";

export default async function PortfolioDashboard() {
  // TODO: Replace with real data fetching (e.g., from your API or DB)
  const holdings: Holding[] = [
    { symbol: "RELIANCE", name: "Reliance Industries Ltd", sector: "Energy", industry: "Oil & Gas Integrated", market_value: 550000 },
    { symbol: "TCS", name: "Tata Consultancy Services", sector: "IT", industry: "IT Services", market_value: 420000 },
    { symbol: "HDFCBANK", name: "HDFC Bank Ltd", sector: "Financials", industry: "Private Banks", market_value: 380000 },
    { symbol: "MARUTI", name: "Maruti Suzuki India", sector: "Consumer Discretionary", industry: "Auto Manufacturers", market_value: 210000 },
    { symbol: "NTPC", name: "NTPC Ltd", sector: "Utilities", industry: "Power Generation", market_value: 160000 },
  ];

  const mix = computeSectorIndustryMix(holdings);

  const exitInputs: ExitSignalInput[] = [
    { symbol: "XYZ", name: "Example Co", sector: "IT", industry: "Software", position_value: 100000, day_change_pct: -3.5, week_change_pct: -8.2, volume_ratio: 1.7, below_200dma: true, rsi: 28, news_sentiment: -0.4, stop_loss_pct: 10, pnl_pct: -11 },
    { symbol: "ABC", name: "Another Co", sector: "Financials", industry: "NBFC", position_value: 80000, day_change_pct: -1.0, week_change_pct: -2.0, volume_ratio: 1.2, below_200dma: false, rsi: 45, news_sentiment: 0.1, stop_loss_pct: 8, pnl_pct: -3 },
  ];

  const momentum: SectorMomentum[] = [
    { sector: "IT", r1m: 4.1, r3m: 9.3, r6m: 15.2, vol: 22, sentiment: 0.25 },
    { sector: "Financials", r1m: 2.0, r3m: 6.1, r6m: 12.0, vol: 18, sentiment: 0.10 },
    { sector: "Energy", r1m: -1.0, r3m: 3.5, r6m: 10.0, vol: 25, sentiment: -0.05 },
    { sector: "Consumer Discretionary", r1m: 3.2, r3m: 7.8, r6m: 11.0, vol: 20, sentiment: 0.15 },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Portfolio Overview</h1>

      <SectorIndustryMix mix={mix} concentrationThreshold={35} />

      <div className="grid md:grid-cols-2 gap-6">
        <ExitAlerts inputs={exitInputs} />
        <TrendAllocator momentum={momentum} freedCapital={250000} />
      </div>
    </div>
  );
}
