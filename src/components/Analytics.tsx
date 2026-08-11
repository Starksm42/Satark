import React, { useMemo, useState } from 'react';
import { useTransport } from '../context/TransportContext';
import { formatCurrency, formatDate } from '../utils';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  Truck, 
  User, 
  Fuel, 
  PieChart, 
  BarChart3, 
  ChevronRight,
  Lightbulb,
  AlertTriangle,
  Award,
  Wrench,
  Gauge,
  Activity,
  DollarSign,
  HelpCircle
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const { db } = useTransport();
  const currency = db.settings.currencySymbol;

  // Active sub-tab inside Analytics
  const [chartMode, setChartMode] = useState<'trends' | 'categories' | 'vehicles' | 'drivers' | 'insights'>('trends');

  // Compute stats for past 7 days (Daily Income vs Expense double bar)
  const pastSevenDays = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const income = db.income
        .filter(item => item.date === dStr)
        .reduce((sum, item) => sum + item.tripAmount, 0);

      const expense = db.expenses
        .filter(item => item.date === dStr)
        .reduce((sum, item) => sum + item.amount, 0);

      data.push({ dayStr: dStr, dayName, income, expense });
    }
    return data;
  }, [db]);

  // Compute Expense categories breakdown (for Pie/Donut chart)
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    db.expenses.forEach(item => {
      map[item.category] = (map[item.category] || 0) + item.amount;
    });

    const list = Object.entries(map).map(([name, amount]) => ({ name, amount }));
    const total = list.reduce((sum, item) => sum + item.amount, 0);

    return list
      .map(item => ({
        ...item,
        percentage: total > 0 ? Math.round((item.amount / total) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [db.expenses]);

  // Vehicle Profit breakdown (horizontal charts)
  const vehicleProfits = useMemo(() => {
    return db.vehicles.map(v => {
      const income = db.income.filter(item => item.vehicleId === v.id).reduce((sum, item) => sum + item.tripAmount, 0);
      const expense = db.expenses.filter(item => item.vehicleId === v.id).reduce((sum, item) => sum + item.amount, 0);
      return {
        number: v.number,
        name: v.name,
        income,
        expense,
        profit: income - expense
      };
    }).sort((a, b) => b.profit - a.profit);
  }, [db.vehicles, db.income, db.expenses]);

  // Driver performance summaries
  const driverPerformance = useMemo(() => {
    return db.drivers.map(d => {
      const trips = db.income.filter(item => item.driverId === d.id);
      const totalIncome = trips.reduce((sum, item) => sum + item.tripAmount, 0);
      
      const driverExpenses = db.expenses
        .filter(item => item.driverId === d.id && item.category === 'Driver Salary')
        .reduce((sum, item) => sum + item.amount, 0);

      return {
        name: d.name,
        tripsCount: trips.length,
        totalIncome,
        expensesPaid: driverExpenses
      };
    }).sort((a, b) => b.totalIncome - a.totalIncome);
  }, [db.drivers, db.income, db.expenses]);

  // Max scale helper for double bar chart Y axis
  const maxBarValue = useMemo(() => {
    const values = pastSevenDays.flatMap(d => [d.income, d.expense]);
    return Math.max(...values, 5000); // Minimum scale floor
  }, [pastSevenDays]);

  // Core financial variables
  const { totalIncome, totalExpense, netProfit, profitMargin } = useMemo(() => {
    const totalIncome = db.income.reduce((sum, item) => sum + item.tripAmount, 0);
    const totalExpense = db.expenses.reduce((sum, item) => sum + item.amount, 0);
    const netProfit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    return { totalIncome, totalExpense, netProfit, profitMargin };
  }, [db]);

  // Fuel Metrics
  const fuelMetrics = useMemo(() => {
    const records = db.fuelRecords;
    if (records.length === 0) {
      return { avgMileage: 0, totalFuelCost: 0, dieselCount: 0, cngCount: 0, liquidRatio: 100 };
    }
    const totalMileage = records.reduce((sum, item) => sum + item.mileage, 0);
    const avgMileage = totalMileage / records.length;
    const totalFuelCost = records.reduce((sum, item) => sum + item.totalCost, 0);
    
    const dieselCount = records.filter(r => r.fuelUnit === 'L').length;
    const cngCount = records.filter(r => r.fuelUnit === 'Kg').length;
    const totalCount = records.length;
    const liquidRatio = totalCount > 0 ? Math.round((dieselCount / totalCount) * 100) : 100;

    return {
      avgMileage: Number(avgMileage.toFixed(2)),
      totalFuelCost,
      dieselCount,
      cngCount,
      liquidRatio
    };
  }, [db.fuelRecords]);

  // Maintenance Metrics
  const maintenanceCost = useMemo(() => {
    return db.expenses
      .filter(e => e.category === 'Maintenance' || e.category === 'Repair' || e.category === 'Service')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [db.expenses]);

  // Smart Alerts / Operational Insights
  const smartAlerts = useMemo(() => {
    const alerts: { type: 'success' | 'warning' | 'info'; title: string; desc: string; category: string }[] = [];

    // Alert 1: Low mileage warning
    db.fuelRecords.forEach(record => {
      if (record.mileage > 0 && record.mileage < 6) {
        const vNum = db.vehicles.find(v => v.id === record.vehicleId)?.number || 'Vehicle';
        const exists = alerts.some(a => a.title.includes(vNum));
        if (!exists) {
          alerts.push({
            type: 'warning',
            title: `Low Mileage: ${vNum}`,
            desc: `Logged poor fuel mileage of ${record.mileage} KM/${record.fuelUnit === 'Kg' ? 'Kg' : 'L'} on ${record.date}. Odometer: ${record.odometerReading} KM. Check tire pressure, filter or engine health.`,
            category: 'Fuel Audit'
          });
        }
      }
    });

    // Alert 2: Maintenance cost ratio high
    db.vehicles.forEach(v => {
      const vIncome = db.income.filter(i => i.vehicleId === v.id).reduce((sum, i) => sum + i.tripAmount, 0);
      const vMaint = db.expenses
        .filter(e => e.vehicleId === v.id && (e.category === 'Maintenance' || e.category === 'Repair' || e.category === 'Service'))
        .reduce((sum, e) => sum + e.amount, 0);
      
      if (vIncome > 0 && (vMaint / vIncome) > 0.25) {
        alerts.push({
          type: 'warning',
          title: `High Upkeep on ${v.number}`,
          desc: `Maintenance fees consumed ${((vMaint / vIncome) * 100).toFixed(0)}% of its trip revenue. Monitor engine repair logs or check driving habits.`,
          category: 'Fleet Health'
        });
      }
    });

    // Alert 3: CNG Saving opportunity
    const cngVehicles = db.vehicles.filter(v => v.fuelType === 'CNG');
    if (cngVehicles.length === 0 && db.vehicles.length > 0) {
      alerts.push({
        type: 'info',
        title: 'CNG Conversion Potential',
        desc: 'Your active fleet runs entirely on liquid diesel/petrol. Upgrading light vehicles to CNG can lower fuel run-rates by up to 35% on inner-city routes.',
        category: 'Eco Suggestion'
      });
    }

    // Alert 4: Top Profit Celebration
    const topV = vehicleProfits[0];
    if (topV && topV.profit > 5000) {
      alerts.push({
        type: 'success',
        title: `Top Performer: ${topV.number}`,
        desc: `Vehicle ${topV.number} generated ${currency}${topV.profit.toLocaleString()} in net profits. This vehicle is highly optimized for current routing.`,
        category: 'Profit Milestone'
      });
    }

    // Default general advice if clean
    if (alerts.length === 0) {
      alerts.push({
        type: 'success',
        title: 'Operations Well Balanced',
        desc: 'All active fleet mileage logs are healthy, maintenance overheads are within normal budget guidelines, and profit lines are positive.',
        category: 'Diagnostics'
      });
    }

    return alerts.slice(0, 4); // Limit to top 4 insights
  }, [db, vehicleProfits, currency]);

  // Color map for Category breakdown
  const categoryColors: Record<string, string> = {
    Fuel: 'bg-amber-500 text-amber-500',
    'Toll Tax': 'bg-blue-500 text-blue-500',
    Fastag: 'bg-indigo-500 text-indigo-500',
    'Driver Salary': 'bg-emerald-500 text-emerald-500',
    Maintenance: 'bg-rose-500 text-rose-500',
    Tyre: 'bg-sky-500 text-sky-500',
    'Engine Oil': 'bg-orange-500 text-orange-500',
    Service: 'bg-violet-500 text-violet-500',
    Insurance: 'bg-purple-500 text-purple-500',
    RTO: 'bg-cyan-500 text-cyan-500',
    Parking: 'bg-teal-500 text-teal-500',
    Food: 'bg-fuchsia-500 text-fuchsia-500',
    Hotel: 'bg-pink-500 text-pink-500',
    Repair: 'bg-red-500 text-red-500',
    Other: 'bg-slate-500 text-slate-500'
  };

  const getCategoryBgColor = (catName: string) => {
    return categoryColors[catName]?.split(' ')[0] || 'bg-slate-400';
  };

  const getCategoryTextColor = (catName: string) => {
    return categoryColors[catName]?.split(' ')[1] || 'text-slate-400';
  };

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
            Analytics & Reports
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Graphical insights and fleet operating performance metrics.
          </p>
        </div>

        {/* Chart switcher tabs */}
        <div className="flex flex-wrap bg-slate-50 dark:bg-slate-700/40 p-1 rounded-xl border border-slate-100 dark:border-slate-700 w-full sm:w-auto gap-0.5">
          {(['trends', 'categories', 'vehicles', 'drivers', 'insights'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setChartMode(mode)}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                chartMode === mode
                  ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm font-bold'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
              }`}
            >
              {mode === 'trends' ? 'Tally Trends' : mode === 'insights' ? 'Detailed Insights' : mode}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Analytics Card Display */}
      {chartMode === 'trends' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-base font-display text-slate-800 dark:text-white">Daily Income vs Expenses</h3>
              <p className="text-slate-400 text-xs mt-0.5">Activity across the last 7 calendar days</p>
            </div>
            
            {/* Legend indicators */}
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
                Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm" />
                Expense
              </span>
            </div>
          </div>

          {/* Interactive SVG bar chart */}
          <div className="relative h-[250px] w-full mt-4 flex items-end justify-between px-2 sm:px-6">
            {pastSevenDays.map((day, idx) => {
              // Calculate heights (scale to maximum Y scale of 200px)
              const incHeight = (day.income / maxBarValue) * 180;
              const expHeight = (day.expense / maxBarValue) * 180;

              return (
                <div key={idx} className="flex flex-col items-center flex-1 mx-2 sm:mx-3 group">
                  
                  {/* Tooltip on hover */}
                  <div className="absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-xl border border-slate-700 shadow-md flex gap-2 pointer-events-none z-10 font-mono">
                    <span className="text-emerald-400">+{currency}{day.income.toLocaleString()}</span>
                    <span className="text-rose-400">-{currency}{day.expense.toLocaleString()}</span>
                  </div>

                  {/* Dual Bar columns */}
                  <div className="flex items-end gap-1.5 h-[180px] w-full justify-center">
                    {/* Income bar */}
                    <div 
                      className="w-3 sm:w-4 bg-emerald-500 rounded-t-sm transition-all duration-300 hover:bg-emerald-400"
                      style={{ height: `${Math.max(4, incHeight)}px` }}
                    />
                    {/* Expense bar */}
                    <div 
                      className="w-3 sm:w-4 bg-rose-500 rounded-t-sm transition-all duration-300 hover:bg-rose-400"
                      style={{ height: `${Math.max(4, expHeight)}px` }}
                    />
                  </div>

                  {/* Day label */}
                  <span className="text-[10px] text-slate-400 font-bold mt-2 font-mono">
                    {day.dayName}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-center text-[10px] text-slate-400 italic mt-6">
            💡 Touch or hover over columns to inspect accurate financial tallies.
          </p>
        </div>
      )}

      {/* Category breakdown (donut list) */}
      {chartMode === 'categories' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 p-6 shadow-sm">
          <h3 className="font-bold text-base font-display text-slate-800 dark:text-white mb-1">Expense Categories Breakdown</h3>
          <p className="text-slate-400 text-xs mb-6">Total operational outflows split by custom categories</p>

          {categoryBreakdown.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No expense records loaded to compile category statistics.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              
              {/* Donut representation as simple SVG circle track */}
              <div className="flex justify-center items-center relative">
                <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 42 42">
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e2e8f0" strokeWidth="3" />
                  
                  {/* Generate simple dynamic segments based on top categories */}
                  {categoryBreakdown.slice(0, 4).map((item, idx) => {
                    // Cumulative percentage offsets
                    const offset = categoryBreakdown.slice(0, idx).reduce((sum, c) => sum + c.percentage, 0);
                    const colorMap = ['#f59e0b', '#3b82f6', '#10b981', '#f43f5e'];
                    
                    return (
                      <circle
                        key={idx}
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="transparent"
                        stroke={colorMap[idx] || '#64748b'}
                        strokeWidth="3.5"
                        strokeDasharray={`${item.percentage} ${100 - item.percentage}`}
                        strokeDashoffset={100 - offset}
                      />
                    );
                  })}
                </svg>
                {/* Center text label */}
                <div className="absolute text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Out</span>
                  <p className="text-lg font-extrabold font-display text-slate-800 dark:text-white mt-0.5">
                    {formatCurrency(db.expenses.reduce((sum, item) => sum + item.amount, 0), currency)}
                  </p>
                </div>
              </div>

              {/* Progress bars split list */}
              <div className="space-y-4">
                {categoryBreakdown.map((item, idx) => {
                  const textColor = getCategoryTextColor(item.name);
                  const bgColor = getCategoryBgColor(item.name);

                  return (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${bgColor}`} />
                          {item.name}
                        </span>
                        <span className="font-mono font-semibold text-slate-500">
                          {formatCurrency(item.amount, currency)} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${bgColor}`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}
        </div>
      )}

      {/* Vehicle Profits Horizontal Charts */}
      {chartMode === 'vehicles' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 p-6 shadow-sm space-y-5">
          <div>
            <h3 className="font-bold text-base font-display text-slate-800 dark:text-white">Vehicle-wise Operating Profits</h3>
            <p className="text-slate-400 text-xs mt-0.5">Calculated net margin (Trip Revenue - Total Expenses)</p>
          </div>

          <div className="space-y-4">
            {vehicleProfits.map((item, idx) => {
              const isProfitPositive = item.profit >= 0;
              return (
                <div 
                  key={idx}
                  className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100/40 dark:border-slate-700/30 text-xs space-y-2.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 font-display">
                      <Truck className="w-4 h-4 text-brand" />
                      {item.number} ({item.name})
                    </span>
                    <span className={`font-mono font-extrabold ${isProfitPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {isProfitPositive ? '+' : ''}{formatCurrency(item.profit, currency)}
                    </span>
                  </div>

                  {/* Stat columns */}
                  <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/40">
                    <div>
                      Trip Revenue: <strong className="text-slate-700 dark:text-slate-200 font-mono">{formatCurrency(item.income, currency)}</strong>
                    </div>
                    <div>
                      Linked Expenses: <strong className="text-slate-700 dark:text-slate-200 font-mono">{formatCurrency(item.expense, currency)}</strong>
                    </div>
                  </div>

                  {/* Horizontal visual visualizer */}
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isProfitPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ 
                        width: `${item.income > 0 ? Math.min(100, Math.max(10, (item.profit / item.income) * 100)) : 0}%` 
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Driver Performance rankings */}
      {chartMode === 'drivers' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 p-6 shadow-sm space-y-5">
          <div>
            <h3 className="font-bold text-base font-display text-slate-800 dark:text-white">Driver Performance Ledger</h3>
            <p className="text-slate-400 text-xs mt-0.5">Trip count, revenue contribution, and allowances logged</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 font-bold uppercase text-[9px] tracking-wider pb-3">
                  <th className="pb-2.5">Driver Name</th>
                  <th className="pb-2.5 text-center">Trips Completed</th>
                  <th className="pb-2.5 text-right">Revenue Produced</th>
                  <th className="pb-2.5 text-right">Salary/Allowance Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                {driverPerformance.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10">
                    <td className="py-3.5 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <div className="p-1.5 bg-brand/10 rounded-lg text-brand">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      {item.name}
                    </td>
                    <td className="py-3.5 text-center font-bold font-mono text-slate-600 dark:text-slate-300">
                      {item.tripsCount}
                    </td>
                    <td className="py-3.5 text-right font-bold text-emerald-500 font-mono">
                      {formatCurrency(item.totalIncome, currency)}
                    </td>
                    <td className="py-3.5 text-right font-bold text-rose-500 font-mono">
                      {formatCurrency(item.expensesPaid, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Insights & Smart Widgets Panel */}
      {chartMode === 'insights' && (
        <div className="space-y-6">
          {/* Bento Grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Widget 1: Financial Health Score Gauge */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl text-emerald-500">
                    <Gauge className="w-5 h-5" />
                  </span>
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                    profitMargin >= 35 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                    profitMargin >= 15 ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                    profitMargin > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                    'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {profitMargin >= 35 ? 'High Efficiency' :
                     profitMargin >= 15 ? 'Healthy Margin' :
                     profitMargin > 0 ? 'Optimal Baseline' :
                     'Loss / Action Required'}
                  </span>
                </div>
                
                <h4 className="font-bold text-base font-display text-slate-800 dark:text-white mb-1">Financial Health Ratio</h4>
                <p className="text-xs text-slate-400">Calculated as net profit percentage over gross receipts</p>
              </div>

              {/* Graphical Circular Arc Gauge */}
              <div className="flex flex-col items-center justify-center my-6 relative">
                <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
                  {/* Outer circle track */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="8" className="dark:stroke-slate-700" />
                  {/* Colored progress arc */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    stroke={profitMargin >= 35 ? '#10b981' : profitMargin >= 15 ? '#6366f1' : profitMargin > 0 ? '#f59e0b' : '#ef4444'} 
                    strokeWidth="8" 
                    strokeDasharray={`${Math.max(0, Math.min(100, profitMargin)) * 2.51} 251`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute text-center mt-1">
                  <span className="text-2xl font-extrabold font-display text-slate-800 dark:text-white">
                    {profitMargin.toFixed(1)}%
                  </span>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider mt-0.5">Profit Margin</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-400 flex justify-between items-center">
                <span>Total Gross Income:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">{formatCurrency(totalIncome, currency)}</span>
              </div>
            </div>

            {/* Widget 2: Fuel Audit Heat Indicator */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500">
                    <Fuel className="w-5 h-5" />
                  </span>
                  <span className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                    {db.fuelRecords.length} Refuels Logged
                  </span>
                </div>
                
                <h4 className="font-bold text-base font-display text-slate-800 dark:text-white mb-1">Fuel Overhead Ratio</h4>
                <p className="text-xs text-slate-400">Fuel expenses vs total operational expenditures</p>
              </div>

              {/* Fuel Overhead visual heat block */}
              <div className="my-6 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span>Average Fleet Mileage</span>
                    <span className="font-mono text-amber-500 font-extrabold">{fuelMetrics.avgMileage > 0 ? `${fuelMetrics.avgMileage} km/l` : 'No logs'}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${Math.min(100, (fuelMetrics.avgMileage / 15) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 italic block">Calculated dynamically from real-time log book distance tallies.</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span>Fuel Portion of Expenses</span>
                    <span className="font-mono text-rose-500 font-extrabold">
                      {totalExpense > 0 ? ((fuelMetrics.totalFuelCost / totalExpense) * 100).toFixed(0) : '0'}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-rose-500"
                      style={{ width: `${totalExpense > 0 ? (fuelMetrics.totalFuelCost / totalExpense) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-400 flex justify-between items-center">
                <span>Refuel Expenditures:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">{formatCurrency(fuelMetrics.totalFuelCost, currency)}</span>
              </div>
            </div>

            {/* Widget 3: Asset Leadership Honors (Best driver / best truck) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                <span className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-500">
                  <Award className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-bold text-sm font-display text-slate-800 dark:text-white">Active Fleet Leaders</h4>
                  <p className="text-[10px] text-slate-400">Top-performing transport assets this month</p>
                </div>
              </div>

              {/* Grid lists of highlights */}
              <div className="space-y-3.5">
                {/* Vehicle Leader */}
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100/60 dark:border-slate-700/40">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide font-bold block">Top Truck</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {vehicleProfits[0]?.number || 'N/A'} {vehicleProfits[0] ? `(${vehicleProfits[0].name})` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide font-bold block">Profit Ledger</span>
                    <span className="text-xs font-extrabold text-emerald-500 font-mono">
                      +{vehicleProfits[0] ? formatCurrency(vehicleProfits[0].profit, currency) : `${currency}0`}
                    </span>
                  </div>
                </div>

                {/* Driver Leader */}
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100/60 dark:border-slate-700/40">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide font-bold block">Star Driver</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {driverPerformance[0]?.name || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide font-bold block">Sales Produced</span>
                    <span className="text-xs font-extrabold text-indigo-500 font-mono">
                      {driverPerformance[0] ? formatCurrency(driverPerformance[0].totalIncome, currency) : `${currency}0`}
                    </span>
                  </div>
                </div>

                {/* Maintenance High point */}
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100/60 dark:border-slate-700/40">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide font-bold block">Upkeep Costs</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Repairs & Maintenance
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide font-bold block">Net Expensed</span>
                    <span className="text-xs font-extrabold text-rose-500 font-mono">
                      -{formatCurrency(maintenanceCost, currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Widget 4: Diagnostics Alert Center */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                <span className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl text-rose-500">
                  <Activity className="w-4 h-4 animate-pulse" />
                </span>
                <div>
                  <h4 className="font-bold text-sm font-display text-slate-800 dark:text-white">Smart Diagnostic Feed</h4>
                  <p className="text-[10px] text-slate-400">Automated operations suggestions and alerts</p>
                </div>
              </div>

              {/* Feed items list */}
              <div className="space-y-3 max-h-[195px] overflow-y-auto pr-1">
                {smartAlerts.map((alert, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-2xl border flex gap-3 text-xs ${
                      alert.type === 'warning' 
                        ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-200' 
                        : alert.type === 'success'
                        ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-200'
                        : 'bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/20 text-indigo-800 dark:text-indigo-200'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {alert.type === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      ) : alert.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Lightbulb className="w-4 h-4 text-indigo-500" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100 text-[11px]">
                        <span>{alert.title}</span>
                        <span className="text-[9px] font-semibold opacity-60 px-1.5 py-0.5 bg-black/5 dark:bg-white/5 rounded-md uppercase tracking-wider">{alert.category}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {alert.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Widget 5: Full Width Mileage vs Profit Correlation Matrix */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h4 className="font-bold text-base font-display text-slate-800 dark:text-white">Active Mileage & Operating Efficiency Log</h4>
                <p className="text-xs text-slate-400 mt-0.5">Historical log trends for cost per kilometer & mileage performance</p>
              </div>
              <span className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl">
                <BarChart3 className="w-4 h-4" />
              </span>
            </div>

            {db.fuelRecords.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No mileage logs found. Add refuel logs in the dashboard to populate the efficiency matrix.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 font-semibold uppercase text-[9px] tracking-wider pb-3">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Vehicle</th>
                      <th className="pb-2">Odometer Run</th>
                      <th className="pb-2 text-right">Distance (KM)</th>
                      <th className="pb-2 text-right">Fuel Volume</th>
                      <th className="pb-2 text-right">Mileage</th>
                      <th className="pb-2 text-right">Cost Per KM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                    {db.fuelRecords.slice(-5).reverse().map((record, index) => {
                      const vNum = db.vehicles.find(v => v.id === record.vehicleId)?.number || 'N/A';
                      return (
                        <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10">
                          <td className="py-2.5 font-medium text-slate-600 dark:text-slate-300">{formatDate(record.date)}</td>
                          <td className="py-2.5 font-bold text-slate-800 dark:text-slate-100">{vNum}</td>
                          <td className="py-2.5 font-mono text-slate-500">{record.odometerReading.toLocaleString()} km</td>
                          <td className="py-2.5 text-right font-bold font-mono text-slate-700 dark:text-slate-300">+{record.distanceTravelled} km</td>
                          <td className="py-2.5 text-right font-mono text-slate-500">{record.fuelQuantity} {record.fuelUnit === 'Kg' ? 'kg' : 'l'}</td>
                          <td className="py-2.5 text-right font-bold text-emerald-500 font-mono">
                            {record.mileage} km/{record.fuelUnit === 'Kg' ? 'kg' : 'l'}
                          </td>
                          <td className="py-2.5 text-right font-bold text-indigo-500 font-mono">
                            {formatCurrency(record.costPerKm, currency)}/km
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="text-[10px] text-slate-400 italic text-center mt-4">
                  Showing the latest 5 active refuel logs. Fully responsive real-time data binding.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
