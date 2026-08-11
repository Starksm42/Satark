import React, { useMemo, useState, useEffect } from 'react';
import { useTransport } from '../context/TransportContext';
import { formatCurrency, formatDate } from '../utils';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Truck, 
  Users, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  PlusCircle,
  Clock,
  ArrowRight,
  Fuel,
  Search,
  X,
  GripVertical,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Sliders,
  Sparkles,
  LayoutTemplate,
  Check,
  Zap,
  PieChart,
  Plus,
  Grid,
  Layers,
  ShieldCheck,
  UserCheck,
  UserX,
  Activity,
  Compass,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'motion/react';

// Tactile, texturized, interactive wrapper widget that responds to long touch by bobbing up/down gently
const TactileWidget: React.FC<{
  id: string;
  className?: string;
  children: React.ReactNode;
}> = ({ id, className = '', children }) => {
  const [isBobbing, setIsBobbing] = useState(false);
  const [pressTimer, setPressTimer] = useState<any>(null);

  const startPress = () => {
    // 600ms long press threshold
    const timer = setTimeout(() => {
      setIsBobbing(prev => !prev);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(35); // Haptic tick feedback
        } catch (e) {}
      }
    }, 600);
    setPressTimer(timer);
  };

  const cancelPress = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  return (
    <motion.div
      id={`tactile-widget-${id}`}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      animate={isBobbing ? {
        y: [0, -6, 0],
      } : { y: 0 }}
      transition={isBobbing ? {
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut"
      } : undefined}
      whileHover={{ scale: 1.008, transition: { duration: 0.2 } }}
      className={`relative rounded-3xl transition-all duration-300 overflow-hidden ${
        isBobbing 
          ? 'shadow-lg border-brand/50 ring-2 ring-brand/20' 
          : 'shadow-sm border-slate-100 dark:border-slate-700/60'
      } ${className}`}
      style={{
        // Add premium micro-dot tactile background texture
        backgroundImage: `radial-gradient(circle, currentColor 0.6px, transparent 0.6px)`,
        backgroundSize: '16px_16px',
      }}
    >
      {/* Texture mask overlay to keep it gentle */}
      <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.045] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:16px_16px] rounded-3xl" />
      
      {/* Bobbing Indicator Tag */}
      {isBobbing && (
        <div className="absolute top-3 right-4.5 z-40 flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-[8px] font-bold animate-pulse">
          <span className="w-1 h-1 rounded-full bg-brand" />
          Tactile Bobbing
        </div>
      )}
      
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </motion.div>
  );
};

interface Widget {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  gridSpan: 'full' | 'half' | 'third';
}

const DEFAULT_WIDGETS: Widget[] = [
  { id: 'welcome', title: 'Welcome Header', description: 'Displays company branding and real-time clock', enabled: true, gridSpan: 'full' },
  { id: 'quick-actions', title: 'Quick Actions Bar', description: 'Direct links to log income, expense, or fuel', enabled: true, gridSpan: 'full' },
  { id: 'today-activities', title: "Today's Quick Tally", description: 'Active daily transaction summaries', enabled: true, gridSpan: 'full' },
  { id: 'maintenance-cost', title: 'Maintenance Cost Audit', description: 'Visualizes total maintenance expense per vehicle and flags those exceeding fleet average', enabled: true, gridSpan: 'half' },
  { id: 'monthly-income', title: 'Monthly Income Card', description: 'Summarizes accumulated cash flow for the active month', enabled: true, gridSpan: 'third' },
  { id: 'monthly-expenses', title: 'Monthly Expenses Card', description: 'Summarizes cash outflow for the active month', enabled: true, gridSpan: 'third' },
  { id: 'fuel-trend', title: 'Fuel Mileage Trend', description: 'Calculates active fuel efficiency ratios', enabled: true, gridSpan: 'third' },
  { id: 'monthly-fuel-spend', title: 'Monthly Fuel Spend', description: 'Total amount spent on refueling this month', enabled: true, gridSpan: 'third' },
  { id: 'top-earning-vehicle', title: 'Top Earning Vehicle', description: 'Identifies the vehicle driving highest revenue', enabled: true, gridSpan: 'third' },
  { id: 'top-earning-driver', title: 'Top Earning Driver', description: 'Identifies the driver generating highest income', enabled: true, gridSpan: 'third' },
  { id: 'pending-balances', title: 'Outstanding Balances', description: 'Tracks outstanding unpaid balances from customers', enabled: true, gridSpan: 'third' },
  { id: 'total-income', title: 'Lifetime Income Card', description: 'Total accumulated earnings with interactive weekly sparkline', enabled: true, gridSpan: 'third' },
  { id: 'total-expense', title: 'Lifetime Expense Card', description: 'Total accumulated expenses with interactive weekly sparkline', enabled: true, gridSpan: 'third' },
  { id: 'net-profit', title: 'Net Profit Margin Card', description: 'Calculates true profitability ratios and business health', enabled: true, gridSpan: 'third' },
  { id: 'recent-entries', title: 'Recent Transactions Ledger', description: 'Live scrollable ledger entries with inline search filtering', enabled: true, gridSpan: 'half' },
  { id: 'fleet-summaries', title: 'Active Fleet Summaries', description: 'Overview of vehicle profit margins and active trip counters', enabled: true, gridSpan: 'third' }
];

export interface WidgetTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  iconType: 'dollar' | 'truck' | 'fuel' | 'zap' | 'sparkles';
  badgeText: string;
  widgetIds: string[];
}

export const WIDGET_TEMPLATES: WidgetTemplate[] = [
  {
    id: 'financial-overview',
    name: 'Financial Overview',
    category: 'Accounting & Profitability',
    description: 'Prioritizes cash flows, monthly income & expenses, outstanding customer balances, and net profit health ratios.',
    iconType: 'dollar',
    badgeText: '9 Key Accounting Cards',
    widgetIds: [
      'welcome',
      'quick-actions',
      'monthly-income',
      'monthly-expenses',
      'net-profit',
      'pending-balances',
      'total-income',
      'total-expense',
      'recent-entries'
    ]
  },
  {
    id: 'fleet-status',
    name: 'Fleet Status & Operations',
    category: 'Fleet Operations',
    description: 'Tailored for fleet managers & dispatchers: monitors active vehicle statuses, driver revenue, mileage efficiency, maintenance costs, and daily trips.',
    iconType: 'truck',
    badgeText: '9 Operational Cards',
    widgetIds: [
      'welcome',
      'quick-actions',
      'today-activities',
      'maintenance-cost',
      'fleet-summaries',
      'top-earning-vehicle',
      'top-earning-driver',
      'fuel-trend',
      'monthly-fuel-spend',
      'recent-entries'
    ]
  },
  {
    id: 'fuel-cost-control',
    name: 'Fuel & Cost Control',
    category: 'Expense Audit',
    description: 'Highlights fuel efficiency trends, refueling costs, vehicle maintenance audit, total expenses, and live transaction ledgers.',
    iconType: 'fuel',
    badgeText: '9 Expense Cards',
    widgetIds: [
      'welcome',
      'quick-actions',
      'maintenance-cost',
      'fuel-trend',
      'monthly-fuel-spend',
      'monthly-expenses',
      'total-expense',
      'top-earning-vehicle',
      'fleet-summaries',
      'recent-entries'
    ]
  },
  {
    id: 'compact-essentials',
    name: 'Compact Essentials',
    category: 'Streamlined View',
    description: 'A clean, clutter-free dashboard featuring quick action logging, daily tallies, core monthly performance, and recent activity.',
    iconType: 'zap',
    badgeText: '7 Essential Cards',
    widgetIds: [
      'welcome',
      'quick-actions',
      'today-activities',
      'monthly-income',
      'monthly-expenses',
      'net-profit',
      'recent-entries'
    ]
  },
  {
    id: 'executive-complete',
    name: 'Executive Master Dashboard',
    category: 'Full Analytics',
    description: 'Enables all 16 operational, maintenance, financial, and fuel metrics in a comprehensive multi-column layout.',
    iconType: 'sparkles',
    badgeText: 'All 16 Cards Enabled',
    widgetIds: [
      'welcome',
      'quick-actions',
      'today-activities',
      'maintenance-cost',
      'monthly-income',
      'monthly-expenses',
      'fuel-trend',
      'monthly-fuel-spend',
      'top-earning-vehicle',
      'top-earning-driver',
      'pending-balances',
      'total-income',
      'total-expense',
      'net-profit',
      'recent-entries',
      'fleet-summaries'
    ]
  }
];

export const Dashboard: React.FC<{ 
  onNavigateToAdd: (tab: 'income' | 'expense' | 'fuel') => void;
  onNavigateToTab: (tab: string) => void;
}> = ({ onNavigateToAdd, onNavigateToTab }) => {
  const { db, editDriver } = useTransport();
  const currency = db.settings.currencySymbol;

  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showDriverStatusModal, setShowDriverStatusModal] = useState(false);
  const [isRadialOpen, setIsRadialOpen] = useState(false);
  const [activeNotification, setActiveNotification] = useState<string | null>(null);
  const [templateCategory, setTemplateCategory] = useState<string>('All');
  const [modalTab, setModalTab] = useState<'templates' | 'catalog'>('templates');

  // Load and store customizable widgets from localStorage
  const [widgets, setWidgets] = useState<Widget[]>(() => {
    const saved = localStorage.getItem('dashboard_widgets_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Sync structures (ensure new default widgets are added if missing)
        const merged = DEFAULT_WIDGETS.map(def => {
          const found = parsed.find((p: any) => p.id === def.id);
          if (found) {
            return { ...def, enabled: found.enabled };
          }
          return def;
        });
        // Maintain save order
        const ordered = [...merged].sort((a, b) => {
          const idxA = parsed.findIndex((p: any) => p.id === a.id);
          const idxB = parsed.findIndex((p: any) => p.id === b.id);
          if (idxA === -1 && idxB === -1) return 0;
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
        });
        return ordered;
      } catch (e) {
        console.error("Failed to restore customizable dashboard widgets. Restoring default layout.", e);
      }
    }
    return DEFAULT_WIDGETS;
  });

  useEffect(() => {
    localStorage.setItem('dashboard_widgets_v1', JSON.stringify(widgets));
  }, [widgets]);

  const applyTemplate = (template: WidgetTemplate) => {
    const targetIds = template.widgetIds;
    const reordered: Widget[] = [];

    // Add widgets present in template.widgetIds in order and set enabled
    targetIds.forEach(id => {
      const existing = DEFAULT_WIDGETS.find(w => w.id === id);
      if (existing) {
        reordered.push({ ...existing, enabled: true });
      }
    });

    // Append remaining widgets as disabled
    DEFAULT_WIDGETS.forEach(def => {
      if (!targetIds.includes(def.id)) {
        reordered.push({ ...def, enabled: false });
      }
    });

    setWidgets(reordered);
    setActiveNotification(`Applied "${template.name}" layout template!`);
    setShowTemplatesModal(false);

    setTimeout(() => {
      setActiveNotification(null);
    }, 4500);
  };

  const isTemplateActive = (template: WidgetTemplate) => {
    const enabledIds = widgets.filter(w => w.enabled).map(w => w.id);
    if (enabledIds.length !== template.widgetIds.length) return false;
    return template.widgetIds.every(id => enabledIds.includes(id));
  };

  // Compute Metrics
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthPrefix = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    // Total Income
    const totalIncome = db.income.reduce((sum, item) => sum + item.tripAmount, 0);
    // Total Expenses
    const totalExpense = db.expenses.reduce((sum, item) => sum + item.amount, 0);
    const netProfit = totalIncome - totalExpense;

    // Today's Income & Expense
    const todayIncome = db.income
      .filter(item => item.date === todayStr)
      .reduce((sum, item) => sum + item.tripAmount, 0);

    const todayExpense = db.expenses
      .filter(item => item.date === todayStr)
      .reduce((sum, item) => sum + item.amount, 0);

    // Monthly Summary
    const monthIncome = db.income
      .filter(item => item.date.startsWith(currentMonthPrefix))
      .reduce((sum, item) => sum + item.tripAmount, 0);

    const monthExpense = db.expenses
      .filter(item => item.date.startsWith(currentMonthPrefix))
      .reduce((sum, item) => sum + item.amount, 0);

    // Vehicle wise summaries
    const vehicleSummary = db.vehicles.map(v => {
      const inc = db.income.filter(i => i.vehicleId === v.id).reduce((sum, i) => sum + i.tripAmount, 0);
      const exp = db.expenses.filter(e => e.vehicleId === v.id).reduce((sum, e) => sum + e.amount, 0);
      const trips = db.income.filter(i => i.vehicleId === v.id).length;
      return {
        ...v,
        income: inc,
        expense: exp,
        profit: inc - exp,
        trips
      };
    });

    // Driver wise summaries
    const driverSummary = db.drivers.map(d => {
      const inc = db.income.filter(i => i.driverId === d.id).reduce((sum, i) => sum + i.tripAmount, 0);
      const exp = db.expenses.filter(e => e.driverId === d.id).reduce((sum, e) => sum + e.amount, 0);
      const trips = db.income.filter(i => i.driverId === d.id).length;
      return {
        ...d,
        income: inc,
        expense: exp,
        profit: inc - exp,
        trips
      };
    });

    // Get all entries (Income, Expense, or Fuel) sorted by date/time
    const combinedHistory = [
      ...db.income.map(i => ({ ...i, type: 'income' as const })),
      ...db.expenses.map(e => ({ ...e, type: 'expense' as const })),
      ...db.fuelRecords.map(f => ({ ...f, type: 'fuel' as const }))
    ].sort((a, b) => {
      const dateTimeA = `${a.date}T${a.time || '00:00'}`;
      const dateTimeB = `${b.date}T${b.time || '00:00'}`;
      return dateTimeB.localeCompare(dateTimeA);
    });

    // Fuel consumption trend calculations
    const fuelThisMonth = db.fuelRecords.filter(f => f.date.startsWith(currentMonthPrefix));
    const monthFuelCost = fuelThisMonth.reduce((sum, f) => sum + f.totalCost, 0);
    const monthFuelQty = fuelThisMonth.reduce((sum, f) => sum + f.fuelQuantity, 0);
    
    // Total fuel distance & quantity for lifetime or monthly average mileage
    const fuelWithMileage = db.fuelRecords.filter(f => f.mileage && f.mileage > 0);
    const avgMileage = fuelWithMileage.length > 0 
      ? fuelWithMileage.reduce((sum, f) => sum + f.mileage, 0) / fuelWithMileage.length
      : 0;
    
    // Sort fuel records by date to find latest vs average trend
    const sortedFuel = [...db.fuelRecords].sort((a,b) => b.date.localeCompare(a.date));
    const latestMileage = sortedFuel.length > 0 ? (sortedFuel[0].mileage || 0) : 0;
    
    let fuelTrendStatus: 'efficient' | 'moderate' | 'high' | 'none' = 'none';
    if (avgMileage > 0 && latestMileage > 0) {
      const difference = ((latestMileage - avgMileage) / avgMileage) * 100;
      if (difference > 5) {
        fuelTrendStatus = 'efficient'; // Mileage is better than average
      } else if (difference < -5) {
        fuelTrendStatus = 'high'; // Mileage is worse than average (consuming more fuel)
      } else {
        fuelTrendStatus = 'moderate';
      }
    }

    return {
      totalIncome,
      totalExpense,
      netProfit,
      todayIncome,
      todayExpense,
      monthIncome,
      monthExpense,
      vehicleSummary,
      driverSummary,
      combinedHistory,
      avgMileage,
      monthFuelQty,
      fuelTrendStatus
    };
  }, [db]);

  // Compute New Quick Custom Stats
  const monthlyFuelSpend = useMemo(() => {
    const currentMonthPrefix = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    return db.fuelRecords
      .filter(f => f.date.startsWith(currentMonthPrefix))
      .reduce((sum, f) => sum + f.totalCost, 0);
  }, [db.fuelRecords]);

  const topEarningVehicle = useMemo(() => {
    if (db.income.length === 0 || db.vehicles.length === 0) return null;
    const vehicleEarnings: Record<string, number> = {};
    db.income.forEach(entry => {
      vehicleEarnings[entry.vehicleId] = (vehicleEarnings[entry.vehicleId] || 0) + entry.tripAmount;
    });
    let topId = '';
    let maxEarnings = -1;
    Object.entries(vehicleEarnings).forEach(([id, amt]) => {
      if (amt > maxEarnings) {
        maxEarnings = amt;
        topId = id;
      }
    });
    const vehicle = db.vehicles.find(v => v.id === topId);
    return vehicle ? { name: vehicle.name, number: vehicle.number, earnings: maxEarnings } : null;
  }, [db.income, db.vehicles]);

  const topEarningDriver = useMemo(() => {
    if (db.income.length === 0 || db.drivers.length === 0) return null;
    const driverEarnings: Record<string, number> = {};
    db.income.forEach(entry => {
      if (entry.driverId && entry.driverId !== 'none') {
        driverEarnings[entry.driverId] = (driverEarnings[entry.driverId] || 0) + entry.tripAmount;
      }
    });
    let topId = '';
    let maxEarnings = -1;
    Object.entries(driverEarnings).forEach(([id, amt]) => {
      if (amt > maxEarnings) {
        maxEarnings = amt;
        topId = id;
      }
    });
    const driver = db.drivers.find(d => d.id === topId);
    return driver ? { name: driver.name, earnings: maxEarnings } : null;
  }, [db.income, db.drivers]);

  const pendingBalances = useMemo(() => {
    return db.income.reduce((sum, item) => sum + (item.balance || 0), 0);
  }, [db.income]);

  // Maintenance cost audit calculation
  const maintenanceMetrics = useMemo(() => {
    const keywords = ['maintenance', 'service', 'repair', 'tyre', 'tire', 'oil', 'spare', 'garage', 'mechanic', 'breakdown', 'parts', 'rto', 'fitness', 'permit', 'wash', 'grease', 'alignment', 'retread', 'puncture'];

    const maintenanceExpenses = db.expenses.filter(e => {
      if (!e.category) return false;
      const cat = e.category.toLowerCase();
      const sub = (e.subCategory || '').toLowerCase();
      return (
        cat === 'maintenance' ||
        cat === 'service' ||
        cat === 'tyre' ||
        cat === 'engine oil' ||
        keywords.some(k => cat.includes(k) || sub.includes(k))
      );
    });

    const totalFleetMaintenance = maintenanceExpenses.reduce((sum, e) => sum + e.amount, 0);

    const vehicleMap: Record<string, { total: number; count: number; items: typeof maintenanceExpenses }> = {};

    db.vehicles.forEach(v => {
      vehicleMap[v.id] = { total: 0, count: 0, items: [] };
    });

    maintenanceExpenses.forEach(e => {
      if (e.vehicleId && vehicleMap[e.vehicleId]) {
        vehicleMap[e.vehicleId].total += e.amount;
        vehicleMap[e.vehicleId].count += 1;
        vehicleMap[e.vehicleId].items.push(e);
      }
    });

    const totalVehiclesCount = db.vehicles.length || 1;
    const fleetAverageCost = totalFleetMaintenance / totalVehiclesCount;

    const vehicleStats = db.vehicles.map(v => {
      const stat = vehicleMap[v.id] || { total: 0, count: 0, items: [] };
      const exceedsAverage = stat.total > fleetAverageCost && fleetAverageCost > 0;
      const excessAmount = stat.total - fleetAverageCost;
      const percentageOfAvg = fleetAverageCost > 0 ? (stat.total / fleetAverageCost) * 100 : 0;
      return {
        vehicle: v,
        totalMaintenance: stat.total,
        maintenanceCount: stat.count,
        items: stat.items,
        exceedsAverage,
        excessAmount: excessAmount > 0 ? excessAmount : 0,
        percentageOfAvg
      };
    }).sort((a, b) => b.totalMaintenance - a.totalMaintenance);

    const highMaintenanceVehiclesCount = vehicleStats.filter(v => v.exceedsAverage).length;

    return {
      totalFleetMaintenance,
      fleetAverageCost,
      vehicleStats,
      highMaintenanceVehiclesCount,
      totalMaintenanceExpensesCount: maintenanceExpenses.length
    };
  }, [db.expenses, db.vehicles]);

  // Filter history based on search query by vehicle number, vehicle name, driver name, customer name, or category
  const filteredHistory = useMemo(() => {
    const history = metrics.combinedHistory;
    if (!searchQuery.trim()) {
      return history.slice(0, 5); // Return top 5 when search is empty
    }

    const query = searchQuery.toLowerCase().trim();

    // Maps for fast lookups with explicit types
    const vehicleNoMap = new Map<string, string>(db.vehicles.map(v => [v.id, v.number.toLowerCase()]));
    const vehicleNameMap = new Map<string, string>(db.vehicles.map(v => [v.id, v.name.toLowerCase()]));
    const driverNameMap = new Map<string, string>(db.drivers.map(d => [d.id, d.name.toLowerCase()]));

    return history.filter(item => {
      const vNo = item.vehicleId ? (vehicleNoMap.get(item.vehicleId) || '') : '';
      const vName = item.vehicleId ? (vehicleNameMap.get(item.vehicleId) || '') : '';
      
      let dName = '';
      if ('driverId' in item && (item as any).driverId) {
        dName = driverNameMap.get((item as any).driverId) || '';
      }

      const custName: string = 'customerName' in item ? String((item as any).customerName).toLowerCase() : '';
      const catName: string = 'category' in item ? String((item as any).category).toLowerCase() : '';
      const subCatName: string = 'subCategory' in item ? String((item as any).subCategory).toLowerCase() : '';
      const fromLoc: string = 'fromLocation' in item ? String((item as any).fromLocation).toLowerCase() : '';
      const toLoc: string = 'toLocation' in item ? String((item as any).toLocation).toLowerCase() : '';
      const fStation: string = 'fuelStation' in item ? String((item as any).fuelStation).toLowerCase() : '';

      return (
        vNo.includes(query) ||
        vName.includes(query) ||
        dName.includes(query) ||
        custName.includes(query) ||
        catName.includes(query) ||
        subCatName.includes(query) ||
        fromLoc.includes(query) ||
        toLoc.includes(query) ||
        fStation.includes(query)
      );
    });
  }, [metrics.combinedHistory, searchQuery, db.vehicles, db.drivers]);

  // Generate a mini sparkline chart of past week's incomes
  const sparklinePoints = useMemo(() => {
    const points: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayTotal = db.income
        .filter(item => item.date === dStr)
        .reduce((sum, item) => sum + item.tripAmount, 0);
      points.push(dayTotal);
    }
    const maxVal = Math.max(...points, 1);
    return points.map((p, idx) => {
      const x = (idx / 6) * 100;
      const y = 30 - (p / maxVal) * 25; // Scale to fit height 30
      return `${x},${y}`;
    }).join(' ');
  }, [db.income]);

  // Generate a mini sparkline chart of past week's expenses
  const expenseSparklinePoints = useMemo(() => {
    const points: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayTotal = db.expenses
        .filter(item => item.date === dStr)
        .reduce((sum, item) => sum + item.amount, 0);
      points.push(dayTotal);
    }
    const maxVal = Math.max(...points, 1);
    return points.map((p, idx) => {
      const x = (idx / 6) * 100;
      const y = 30 - (p / maxVal) * 25; // Scale to fit height 30
      return `${x},${y}`;
    }).join(' ');
  }, [db.expenses]);

  // Drag and Drop State and Handlers
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;

    const dragIdx = widgets.findIndex(w => w.id === draggedId);
    const targetIdx = widgets.findIndex(w => w.id === targetId);

    if (dragIdx !== -1 && targetIdx !== -1) {
      const reordered = [...widgets];
      const [draggedItem] = reordered.splice(dragIdx, 1);
      reordered.splice(targetIdx, 0, draggedItem);
      setWidgets(reordered);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const reordered = [...widgets];
    const temp = reordered[index];
    reordered[index] = reordered[index - 1];
    reordered[index - 1] = temp;
    setWidgets(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index === widgets.length - 1) return;
    const reordered = [...widgets];
    const temp = reordered[index];
    reordered[index] = reordered[index + 1];
    reordered[index + 1] = temp;
    setWidgets(reordered);
  };

  const handleToggleWidget = (id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  };

  const handleResetWidgets = () => {
    const freshDefaults: Widget[] = DEFAULT_WIDGETS.map(w => ({ ...w }));
    setWidgets(freshDefaults);
    localStorage.setItem('dashboard_widgets_v1', JSON.stringify(freshDefaults));
    setActiveNotification('Dashboard widget layout reset to default order & visibility!');
    setTimeout(() => {
      setActiveNotification(null);
    }, 4500);
  };

  const renderWidgetContent = (id: string) => {
    switch (id) {
      case 'welcome':
        return (
          <TactileWidget id="welcome" className="bg-white dark:bg-slate-800 p-6 border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
                  {db.settings.companyName || 'Express Logistics'}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Real-time offline ledger & fleet analytics. <span className="text-brand font-medium text-xs ml-1">• Try long-touching widgets to float! 💫</span>
                </p>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-700/40 px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                <Clock className="w-4 h-4 text-brand" />
                <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </TactileWidget>
        );
      case 'quick-actions':
        return (
          <TactileWidget id="quick-actions" className="bg-white dark:bg-slate-800 p-5 border">
            <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-3">
              <motion.button
                id="quick-action-add-income"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigateToAdd('income')}
                className="flex flex-col sm:flex-row items-center justify-center gap-2 p-3 sm:py-3.5 bg-emerald-50/60 hover:bg-emerald-100/60 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100/50 dark:border-emerald-500/10 transition-colors cursor-pointer text-center"
              >
                <ArrowUpRight className="w-4 h-4 shrink-0 text-emerald-500" />
                <span className="text-xs font-bold font-display tracking-tight">Add Income</span>
              </motion.button>
              
              <motion.button
                id="quick-action-add-expense"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigateToAdd('expense')}
                className="flex flex-col sm:flex-row items-center justify-center gap-2 p-3 sm:py-3.5 bg-rose-50/60 hover:bg-rose-100/60 dark:bg-rose-500/10 dark:hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100/50 dark:border-rose-500/10 transition-colors cursor-pointer text-center"
              >
                <ArrowDownRight className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="text-xs font-bold font-display tracking-tight">Add Expense</span>
              </motion.button>

              <motion.button
                id="quick-action-add-fuel"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigateToAdd('fuel')}
                className="flex flex-col sm:flex-row items-center justify-center gap-2 p-3 sm:py-3.5 bg-amber-50/60 hover:bg-amber-100/60 dark:bg-amber-500/10 dark:hover:bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-100/50 dark:border-amber-500/10 transition-colors cursor-pointer text-center"
              >
                <Fuel className="w-4 h-4 shrink-0 text-amber-500" />
                <span className="text-xs font-bold font-display tracking-tight">Add Fuel</span>
              </motion.button>
            </div>
          </TactileWidget>
        );
      case 'today-activities':
        return (
          <TactileWidget id="today-activities" className="bg-brand p-6 text-white shadow-md relative overflow-hidden border border-brand/50">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-2 text-white/90 text-xs font-semibold tracking-wider uppercase">
                  <Calendar className="w-3.5 h-3.5" />
                  Today's Quick Tally
                </div>
                <div className="flex items-baseline gap-4 mt-2">
                  <div className="text-xl font-bold font-display">
                    +{formatCurrency(metrics.todayIncome, currency)} <span className="text-xs text-white/80 font-normal">Income</span>
                  </div>
                  <div className="text-xl font-bold font-display text-white/90">
                    -{formatCurrency(metrics.todayExpense, currency)} <span className="text-xs text-white/70 font-normal">Expense</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2.5">
                <button 
                  onClick={() => onNavigateToAdd('income')}
                  className="px-4 py-2 bg-white text-brand font-semibold text-xs rounded-xl hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add Income
                </button>
                <button 
                  onClick={() => onNavigateToAdd('expense')}
                  className="px-4 py-2 bg-black/20 hover:bg-black/35 border border-white/20 text-white font-semibold text-xs rounded-xl active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add Expense
                </button>
              </div>
            </div>
          </TactileWidget>
        );
      case 'maintenance-cost': {
        const {
          totalFleetMaintenance,
          fleetAverageCost,
          vehicleStats,
          highMaintenanceVehiclesCount,
          totalMaintenanceExpensesCount
        } = maintenanceMetrics;

        const maxMaintenance = Math.max(...vehicleStats.map(s => s.totalMaintenance), fleetAverageCost * 1.2, 1);

        return (
          <TactileWidget id="maintenance-cost" className="bg-white dark:bg-slate-800 p-6 border h-full min-h-[340px]">
            {/* Widget Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 border-b border-slate-100 dark:border-slate-700/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg font-display text-slate-900 dark:text-white">
                    Maintenance Cost per Vehicle
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Expense audit & fleet average benchmark threshold
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {highMaintenanceVehiclesCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    {highMaintenanceVehiclesCount} {highMaintenanceVehiclesCount === 1 ? 'Vehicle Exceeds' : 'Vehicles Exceed'} Avg
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    All Vehicles Within Range
                  </span>
                )}

                <button
                  onClick={() => onNavigateToTab('expenses')}
                  className="text-xs font-semibold text-brand hover:text-brand-hover flex items-center gap-1 cursor-pointer"
                >
                  <span>Log Expense</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Summary Stat Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Fleet Maintenance Total
                </p>
                <p className="text-lg font-black font-display text-slate-900 dark:text-white mt-0.5">
                  {formatCurrency(totalFleetMaintenance, currency)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {totalMaintenanceExpensesCount} total service entries
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Fleet Average / Vehicle
                </p>
                <p className="text-lg font-black font-display text-indigo-900 dark:text-indigo-200 mt-0.5">
                  {formatCurrency(fleetAverageCost, currency)}
                </p>
                <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 mt-0.5">
                  Benchmark for {vehicleStats.length} active vehicles
                </p>
              </div>

              <div className={`p-3.5 rounded-2xl border ${
                highMaintenanceVehiclesCount > 0
                  ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50'
                  : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50'
              }`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${
                  highMaintenanceVehiclesCount > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'
                }`}>
                  High Maintenance Alerts
                </p>
                <p className={`text-lg font-black font-display mt-0.5 ${
                  highMaintenanceVehiclesCount > 0 ? 'text-rose-900 dark:text-rose-200' : 'text-emerald-900 dark:text-emerald-200'
                }`}>
                  {highMaintenanceVehiclesCount} {highMaintenanceVehiclesCount === 1 ? 'Vehicle' : 'Vehicles'}
                </p>
                <p className={`text-[10px] mt-0.5 ${
                  highMaintenanceVehiclesCount > 0 ? 'text-rose-600/80 dark:text-rose-400/80' : 'text-emerald-600/80 dark:text-emerald-400/80'
                }`}>
                  {highMaintenanceVehiclesCount > 0 ? 'Exceeds average threshold' : 'Optimal maintenance efficiency'}
                </p>
              </div>
            </div>

            {/* Per-Vehicle Maintenance Progress Bars */}
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                <span>Vehicle Breakdown</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  Fleet Avg Benchmark: {formatCurrency(fleetAverageCost, currency)}
                </span>
              </div>

              {vehicleStats.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No vehicle records found in database.
                </div>
              ) : (
                vehicleStats.map(({ vehicle, totalMaintenance, maintenanceCount, exceedsAverage, excessAmount }) => {
                  const barWidthPercent = Math.min(100, Math.max(4, (totalMaintenance / maxMaintenance) * 100));
                  const avgLinePositionPercent = Math.min(100, (fleetAverageCost / maxMaintenance) * 100);

                  return (
                    <div
                      key={vehicle.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        exceedsAverage
                          ? 'bg-rose-50/50 dark:bg-rose-950/25 border-rose-200/90 dark:border-rose-900/70 shadow-sm'
                          : 'bg-slate-50/80 dark:bg-slate-700/30 border-slate-100 dark:border-slate-700/50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl shrink-0 ${
                            exceedsAverage
                              ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                              : 'bg-slate-200/80 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                          }`}>
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 font-display">
                                {vehicle.number}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                ({vehicle.name})
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {maintenanceCount} {maintenanceCount === 1 ? 'service entry' : 'service entries'} logged
                            </p>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto mt-1 sm:mt-0">
                          <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                            {formatCurrency(totalMaintenance, currency)}
                          </span>
                          {exceedsAverage ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              Exceeds Avg (+{formatCurrency(excessAmount, currency)})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              Within Fleet Avg
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bar Visualization with Fleet Average Benchmark Marker Line */}
                      <div className="relative mt-3">
                        <div className="w-full bg-slate-200 dark:bg-slate-700/80 h-2.5 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              exceedsAverage
                                ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            }`}
                            style={{ width: `${barWidthPercent}%` }}
                          />
                        </div>

                        {/* Benchmark Line */}
                        {fleetAverageCost > 0 && (
                          <div
                            className="absolute -top-1 bottom-0 w-0.5 bg-amber-500 z-10 shadow-sm"
                            style={{ left: `${avgLinePositionPercent}%` }}
                            title={`Fleet Average: ${formatCurrency(fleetAverageCost, currency)}`}
                          >
                            <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-500 border border-white dark:border-slate-900" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TactileWidget>
        );
      }
      case 'monthly-income':
        return (
          <TactileWidget id="monthly-income" className="bg-slate-900 text-white p-6 border-slate-800 shadow-lg min-h-[160px]">
            <div className="relative overflow-hidden flex flex-col justify-between h-full min-h-[110px] group">
              <div className="absolute top-0 right-0 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-300">
                <TrendingUp className="w-16 h-16 text-emerald-400" />
              </div>
              <div className="space-y-1 relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Total Monthly Income</span>
                </div>
                <h2 className="text-3xl font-extrabold font-display tracking-tight text-white mt-2">
                  {formatCurrency(metrics.monthIncome, currency)}
                </h2>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-400 relative z-10">
                <span>Current Month Total</span>
                <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 text-[10px]">Active</span>
              </div>
            </div>
          </TactileWidget>
        );
      case 'monthly-expenses':
        return (
          <TactileWidget id="monthly-expenses" className="bg-slate-900 text-white p-6 border-slate-800 shadow-lg min-h-[160px]">
            <div className="relative overflow-hidden flex flex-col justify-between h-full min-h-[110px] group">
              <div className="absolute top-0 right-0 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-300">
                <TrendingDown className="w-16 h-16 text-rose-400" />
              </div>
              <div className="space-y-1 relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Total Monthly Expenses</span>
                </div>
                <h2 className="text-3xl font-extrabold font-display tracking-tight text-white mt-2">
                  {formatCurrency(metrics.monthExpense, currency)}
                </h2>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-400 relative z-10">
                <span>Current Month Outflow</span>
                <span className="font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-lg border border-rose-500/20 text-[10px]">Real-time</span>
              </div>
            </div>
          </TactileWidget>
        );
      case 'fuel-trend':
        return (
          <TactileWidget id="fuel-trend" className="bg-slate-900 text-white p-6 border-slate-800 shadow-lg min-h-[160px]">
            <div className="relative overflow-hidden flex flex-col justify-between h-full min-h-[110px] group">
              <div className="absolute top-0 right-0 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-300">
                <Fuel className="w-16 h-16 text-amber-400" />
              </div>
              <div className="space-y-1 relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Fuel Consumption Trend</span>
                </div>
                <h2 className="text-2xl font-extrabold font-display tracking-tight text-white mt-2.5">
                  {metrics.avgMileage > 0 ? `${metrics.avgMileage.toFixed(2)} KM/L` : 'No Fuel Records'}
                </h2>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-400 relative z-10">
                <span className="truncate mr-2">
                  {metrics.monthFuelQty > 0 ? `${metrics.monthFuelQty.toLocaleString()} L consumed` : 'Average Efficiency'}
                </span>
                {metrics.fuelTrendStatus === 'efficient' && (
                  <span className="shrink-0 font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 text-[9px]">Optimal</span>
                )}
                {metrics.fuelTrendStatus === 'high' && (
                  <span className="shrink-0 font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20 text-[9px]">High Burn</span>
                )}
                {metrics.fuelTrendStatus === 'moderate' && (
                  <span className="shrink-0 font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 text-[9px]">Moderate</span>
                )}
                {metrics.fuelTrendStatus === 'none' && (
                  <span className="shrink-0 font-semibold text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-lg border border-slate-500/20 text-[9px]">Stable</span>
                )}
              </div>
            </div>
          </TactileWidget>
        );
      case 'monthly-fuel-spend':
        return (
          <TactileWidget id="monthly-fuel-spend" className="bg-slate-900 text-white p-6 border-slate-800 shadow-lg min-h-[160px]">
            <div className="relative overflow-hidden flex flex-col justify-between h-full min-h-[110px] group">
              <div className="absolute top-0 right-0 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-300">
                <Fuel className="w-16 h-16 text-amber-500" />
              </div>
              <div className="space-y-1 relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Monthly Fuel Spend</span>
                </div>
                <h2 className="text-3xl font-extrabold font-display tracking-tight text-white mt-2">
                  {formatCurrency(monthlyFuelSpend, currency)}
                </h2>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-400 relative z-10">
                <span>Fuel Cost This Month</span>
                <span className="font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20 text-[10px]">Tracked</span>
              </div>
            </div>
          </TactileWidget>
        );
      case 'top-earning-vehicle':
        return (
          <TactileWidget id="top-earning-vehicle" className="bg-slate-900 text-white p-6 border-slate-800 shadow-lg min-h-[160px]">
            <div className="relative overflow-hidden flex flex-col justify-between h-full min-h-[110px] group">
              <div className="absolute top-0 right-0 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-300">
                <Truck className="w-16 h-16 text-emerald-400" />
              </div>
              <div className="space-y-1 relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Top Earning Vehicle</span>
                </div>
                <h2 className="text-xl font-extrabold font-display tracking-tight text-white mt-2 truncate max-w-[200px]">
                  {topEarningVehicle ? topEarningVehicle.number : 'No Earnings'}
                </h2>
                <p className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]">
                  {topEarningVehicle ? topEarningVehicle.name : 'Record some incomes'}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-400 relative z-10">
                <span>Lifetime Revenue</span>
                <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 text-[10px]">
                  {topEarningVehicle ? formatCurrency(topEarningVehicle.earnings, currency) : '—'}
                </span>
              </div>
            </div>
          </TactileWidget>
        );
      case 'top-earning-driver':
        return (
          <TactileWidget id="top-earning-driver" className="bg-slate-900 text-white p-6 border-slate-800 shadow-lg min-h-[160px]">
            <div className="relative overflow-hidden flex flex-col justify-between h-full min-h-[110px] group">
              <div className="absolute top-0 right-0 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-300">
                <Users className="w-16 h-16 text-violet-400" />
              </div>
              <div className="space-y-1 relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Top Earning Driver</span>
                </div>
                <h2 className="text-xl font-extrabold font-display tracking-tight text-white mt-2 truncate max-w-[200px]">
                  {topEarningDriver ? topEarningDriver.name : 'No Earnings'}
                </h2>
                <p className="text-[11px] text-slate-400 font-medium">
                  {topEarningDriver ? 'Assigned Driver' : 'Record some incomes'}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-400 relative z-10">
                <span>Lifetime Revenue</span>
                <span className="font-semibold text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded-lg border border-violet-500/20 text-[10px]">
                  {topEarningDriver ? formatCurrency(topEarningDriver.earnings, currency) : '—'}
                </span>
              </div>
            </div>
          </TactileWidget>
        );
      case 'pending-balances':
        return (
          <TactileWidget id="pending-balances" className="bg-slate-900 text-white p-6 border-slate-800 shadow-lg min-h-[160px]">
            <div className="relative overflow-hidden flex flex-col justify-between h-full min-h-[110px] group">
              <div className="absolute top-0 right-0 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-300">
                <Clock className="w-16 h-16 text-rose-400" />
              </div>
              <div className="space-y-1 relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Outstanding Balances</span>
                </div>
                <h2 className="text-3xl font-extrabold font-display tracking-tight text-white mt-2">
                  {formatCurrency(pendingBalances, currency)}
                </h2>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-400 relative z-10">
                <span>Outstanding Customer Balances</span>
                <span className="font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-lg border border-rose-500/20 text-[10px]">Due</span>
              </div>
            </div>
          </TactileWidget>
        );
      case 'total-income':
        return (
          <TactileWidget id="total-income" className="bg-white dark:bg-slate-800 p-5 border flex flex-col justify-between h-[155px]">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Income</span>
                <h2 className="text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-white mt-1">
                  {formatCurrency(metrics.totalIncome, currency)}
                </h2>
              </div>
              <span className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500">
                <TrendingUp className="w-5 h-5" />
              </span>
            </div>
            <div className="flex justify-between items-end pt-3">
              <div className="text-[11px] text-slate-400">
                This Month: <span className="font-semibold text-emerald-500">{formatCurrency(metrics.monthIncome, currency)}</span>
              </div>
              <svg className="w-24 h-8 overflow-visible" strokeWidth="2" fill="none">
                <polyline
                  stroke="#10b981"
                  points={sparklinePoints}
                />
              </svg>
            </div>
          </TactileWidget>
        );
      case 'total-expense':
        return (
          <TactileWidget id="total-expense" className="bg-white dark:bg-slate-800 p-5 border flex flex-col justify-between h-[155px]">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Expense</span>
                <h2 className="text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-white mt-1">
                  {formatCurrency(metrics.totalExpense, currency)}
                </h2>
              </div>
              <span className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-500">
                <TrendingDown className="w-5 h-5" />
              </span>
            </div>
            <div className="flex justify-between items-end pt-3">
              <div className="text-[11px] text-slate-400">
                This Month: <span className="font-semibold text-rose-500">{formatCurrency(metrics.monthExpense, currency)}</span>
              </div>
              <svg className="w-24 h-8 overflow-visible" strokeWidth="2" fill="none">
                <polyline
                  stroke="#f43f5e"
                  points={expenseSparklinePoints}
                />
              </svg>
            </div>
          </TactileWidget>
        );
      case 'net-profit':
        return (
          <TactileWidget id="net-profit" className="bg-white dark:bg-slate-800 p-5 border flex flex-col justify-between h-[155px]">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Profit</span>
                <h2 className={`text-2xl font-bold font-display tracking-tight mt-1 ${metrics.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {formatCurrency(metrics.netProfit, currency)}
                </h2>
              </div>
              <span className={`p-2.5 rounded-2xl ${metrics.netProfit >= 0 ? 'bg-brand/10 dark:bg-brand/10 text-brand' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-500'}`}>
                <DollarSign className="w-5 h-5" />
              </span>
            </div>
            <div className="flex items-center justify-between pt-3">
              <div className="text-[11px] text-slate-400">
                Health Ratio: <span className="font-semibold text-brand">{metrics.totalIncome > 0 ? ((metrics.netProfit / metrics.totalIncome) * 100).toFixed(0) : '0'}% profit</span>
              </div>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${metrics.netProfit >= 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                {metrics.netProfit >= 0 ? 'Surplus' : 'Deficit'}
              </span>
            </div>
          </TactileWidget>
        );
      case 'recent-entries':
        return (
          <TactileWidget id="recent-entries" className="bg-white dark:bg-slate-800 p-6 border flex flex-col justify-between h-full min-h-[300px]">
            <div>
              <div className="flex flex-col gap-4 mb-5">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg font-display text-slate-800 dark:text-white">Recent Entries Log</h3>
                  <button 
                    onClick={() => onNavigateToTab('records')}
                    className="text-xs font-semibold text-brand hover:text-brand-hover flex items-center gap-1 cursor-pointer"
                  >
                    View Ledger
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Search Bar Input */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    id="dashboard-search-bar"
                    type="text"
                    placeholder="Search records by vehicle, driver, customer, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white dark:bg-slate-700/30 dark:hover:bg-slate-700/50 dark:focus:bg-white/10 dark:focus:bg-slate-900 border border-slate-100 dark:border-slate-700/40 rounded-2xl text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    {searchQuery ? 'No matching records found.' : 'No records stored yet. Click the Floating Action Button below!'}
                  </div>
                ) : (
                  filteredHistory.slice(0, 4).map((item) => {
                    const isIncome = item.type === 'income';
                    const isFuel = item.type === 'fuel';
                    let amount = 0;
                    let title = '';
                    let subtitle = '';

                    if (isIncome) {
                      const inc = item as any;
                      amount = inc.tripAmount;
                      title = inc.customerName || 'Direct Trip';
                      subtitle = `${inc.fromLocation} → ${inc.toLocation}`;
                    } else if (isFuel) {
                      const fl = item as any;
                      amount = fl.totalCost;
                      title = 'Fuel Fill';
                      subtitle = `${fl.fuelQuantity} ${fl.fuelUnit === 'Kg' ? 'Kg' : 'L'} at ${fl.fuelStation || 'Station'}`;
                    } else {
                      const exp = item as any;
                      amount = exp.amount;
                      title = exp.category;
                      subtitle = exp.subCategory || 'General Expense';
                    }

                    const vehicle = db.vehicles.find(v => v.id === item.vehicleId);
                    const driver = 'driverId' in item ? db.drivers.find(d => d.id === (item as any).driverId) : undefined;
                    const vehicleInfo = vehicle ? ` • ${vehicle.number}` : '';
                    const driverInfo = driver ? ` • ${driver.name}` : '';

                    return (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100/50 dark:border-slate-700/40"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`p-2 rounded-xl flex items-center justify-center ${
                            isIncome 
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' 
                              : isFuel 
                                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' 
                                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-500'
                          }`}>
                            {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[150px] sm:max-w-[200px]">
                              {title}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[140px] sm:max-w-[200px]">
                              {subtitle}{vehicleInfo}{driverInfo} • <span className="font-mono">{item.time || '00:00'}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-bold font-mono ${
                            isIncome ? 'text-emerald-500' : 'text-rose-500'
                          }`}>
                            {isIncome ? '+' : '-'}{formatCurrency(amount, currency)}
                          </span>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            {formatDate(item.date)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </TactileWidget>
        );
      case 'fleet-summaries':
        return (
          <TactileWidget id="fleet-summaries" className="bg-white dark:bg-slate-800 p-6 border h-full min-h-[300px]">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg font-display text-slate-800 dark:text-white">Active Fleet Summaries</h3>
              <button 
                onClick={() => onNavigateToTab('vehicles')}
                className="text-xs font-semibold text-brand hover:text-brand-hover flex items-center gap-1 cursor-pointer"
              >
                Manage Fleet
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-4">
              {metrics.vehicleSummary.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No vehicles configured in database.
                </div>
              ) : (
                metrics.vehicleSummary.slice(0, 3).map((v) => (
                  <div 
                     key={v.id}
                    className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100/50 dark:border-slate-700/40"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-100 font-display">
                            {v.number}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            v.status === 'active' 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-400'
                          }`}>
                            {v.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{v.name}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-bold font-mono ${v.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {v.profit >= 0 ? '+' : ''}{formatCurrency(v.profit, currency)}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{v.trips} trips run</p>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-3">
                      <div 
                        className={`h-full rounded-full ${v.profit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ 
                          width: `${Math.min(100, Math.max(10, v.income > 0 ? (v.profit / v.income) * 100 : 0))}%` 
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </TactileWidget>
        );
      default:
        return null;
    }
  };

  const renderTemplateIcon = (iconType: string) => {
    switch (iconType) {
      case 'dollar':
        return <DollarSign className="w-5 h-5 text-emerald-500" />;
      case 'truck':
        return <Truck className="w-5 h-5 text-indigo-500 text-brand" />;
      case 'fuel':
        return <Fuel className="w-5 h-5 text-amber-500" />;
      case 'zap':
        return <Zap className="w-5 h-5 text-violet-500" />;
      case 'sparkles':
      default:
        return <Sparkles className="w-5 h-5 text-brand" />;
    }
  };

  const filteredTemplates = WIDGET_TEMPLATES.filter(t => {
    if (templateCategory === 'All') return true;
    return t.category === templateCategory;
  });

  return (
    <div className="space-y-6 pb-20 select-none">
      
      {/* Toast Notification Banner */}
      {activeNotification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-emerald-500 text-white p-3.5 rounded-2xl shadow-lg border border-emerald-400 flex justify-between items-center text-xs font-bold font-display"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 bg-white/20 rounded-full p-0.5" />
            <span>{activeNotification}</span>
          </div>
          <button 
            onClick={() => setActiveNotification(null)}
            className="p-1 hover:bg-white/20 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Customization Controls Toolbar */}
      <div className="flex flex-wrap justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand animate-pulse" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            {isCustomizeMode ? 'Customizing Dashboard Layout' : 'Interactive Ledger Board'}
          </span>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Templates Selector Button */}
          <button
            onClick={() => setShowTemplatesModal(true)}
            className="px-3.5 py-1.5 text-xs font-bold font-display rounded-xl flex items-center gap-1.5 cursor-pointer bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition-all shadow-sm"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-brand" />
            <span>Layout Presets</span>
            <span className="bg-brand text-white text-[9px] px-1.5 py-0.2 rounded-md uppercase font-extrabold ml-0.5">
              5
            </span>
          </button>

          {isCustomizeMode && (
            <button
              onClick={handleResetWidgets}
              className="px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-600 rounded-xl transition-all"
              title="Reset Layout to Default"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Layout</span>
            </button>
          )}
          
          <button
            onClick={() => setIsCustomizeMode(!isCustomizeMode)}
            className={`px-3 py-1.5 text-xs font-bold font-display rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm border transition-all ${
              isCustomizeMode 
                ? 'bg-brand text-white border-brand ring-4 ring-brand/10' 
                : 'bg-white hover:bg-slate-50 border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-brand" />
            <span>{isCustomizeMode ? 'Finish Customizing' : 'Customize Layout'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid Render Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {widgets.map((widget, index) => {
          // If widget is disabled and we are NOT in customize mode, hide it entirely
          if (!widget.enabled && !isCustomizeMode) return null;

          // Compute column spans based on layout configs
          let colSpanClass = 'col-span-1 md:col-span-3'; // default full width
          if (widget.gridSpan === 'third') {
            colSpanClass = 'col-span-1';
          } else if (widget.gridSpan === 'half') {
            colSpanClass = 'col-span-1 md:col-span-2';
          }

          return (
            <motion.div
              key={widget.id}
              layout
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`relative group/widget ${colSpanClass} ${
                isCustomizeMode 
                  ? 'ring-2 ring-dashed ring-brand/40 bg-slate-100/10 dark:bg-slate-900/10 p-1.5 rounded-[32px] transition-all' 
                  : ''
              } ${!widget.enabled ? 'opacity-40' : ''}`}
              draggable={isCustomizeMode}
              onDragStart={(e) => handleDragStart(e, widget.id)}
              onDragOver={(e) => {
                e.preventDefault();
                handleDragEnter(widget.id);
              }}
              onDragEnd={handleDragEnd}
            >
              {/* Customize Overlay Toolbar */}
              {isCustomizeMode && (
                <div className="absolute top-3.5 left-3.5 right-3.5 z-40 flex items-center justify-between px-3 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 shadow-lg border border-slate-100 dark:border-slate-800/80 text-[10px] select-none">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                    <GripVertical className="w-3.5 h-3.5 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0" />
                    <span className="truncate max-w-[120px] sm:max-w-none">{widget.title}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Up button */}
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30 cursor-pointer transition-colors"
                      title="Move Widget Up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    
                    {/* Down button */}
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === widgets.length - 1}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30 cursor-pointer transition-colors"
                      title="Move Widget Down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-800" />

                    {/* Show/Hide Toggle */}
                    <button
                      onClick={() => handleToggleWidget(widget.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                        widget.enabled 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-500/10' 
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-100/50 dark:border-rose-500/10'
                      }`}
                    >
                      {widget.enabled ? (
                        <>
                          <Eye className="w-3 h-3" />
                          <span className="hidden sm:inline">Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span className="hidden sm:inline">Hidden</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Prevent interaction clicks inside actual widget during customize mode */}
              <div className={isCustomizeMode ? 'pointer-events-none pt-12.5 select-none' : ''}>
                {renderWidgetContent(widget.id)}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pre-configured Dashboard Widget Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-brand/10 text-brand rounded-xl">
                    <LayoutTemplate className="w-5 h-5" />
                  </span>
                  <h2 className="text-xl font-bold font-display text-slate-800 dark:text-white">
                    Dashboard Layout Presets
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                  Quickly switch your view with curated, task-optimized widget templates for accounting, fleet tracking, or expense auditing.
                </p>
              </div>

              <button
                onClick={() => setShowTemplatesModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Mode Tabs */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  onClick={() => setModalTab('templates')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    modalTab === 'templates'
                      ? 'bg-white dark:bg-slate-700 text-brand shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  <span>Pre-configured Templates</span>
                </button>
                <button
                  onClick={() => setModalTab('catalog')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    modalTab === 'catalog'
                      ? 'bg-white dark:bg-slate-700 text-brand shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Widget Catalog ({widgets.filter(w => w.enabled).length}/{widgets.length} Visible)</span>
                </button>
              </div>

              {modalTab === 'templates' && (
                <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto">
                  {['All', 'Accounting & Profitability', 'Fleet Operations', 'Expense Audit', 'Streamlined View', 'Full Analytics'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setTemplateCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                        templateCategory === cat
                          ? 'bg-brand/10 text-brand border border-brand/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto pr-1 space-y-4 flex-1">
              {modalTab === 'templates' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTemplates.map((template) => {
                    const active = isTemplateActive(template);

                    return (
                      <div
                        key={template.id}
                        className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                          active
                            ? 'bg-brand/5 border-brand ring-2 ring-brand/20 dark:bg-brand/10'
                            : 'bg-slate-50/70 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/60 shadow-sm hover:shadow-md'
                        }`}
                      >
                        <div>
                          {/* Card Top Row */}
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2.5">
                              <span className="p-2.5 bg-white dark:bg-slate-700 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-600">
                                {renderTemplateIcon(template.iconType)}
                              </span>
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                  {template.category}
                                </span>
                                <h3 className="font-bold text-base font-display text-slate-800 dark:text-white">
                                  {template.name}
                                </h3>
                              </div>
                            </div>

                            {active ? (
                              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                                <Check className="w-3 h-3" /> Active
                              </span>
                            ) : (
                              <span className="bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0">
                                {template.badgeText}
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                            {template.description}
                          </p>

                          {/* Included Widgets Chips */}
                          <div className="space-y-1.5 mb-5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Includes ({template.widgetIds.length} widgets):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {template.widgetIds.map((wid) => {
                                const wDef = DEFAULT_WIDGETS.find(d => d.id === wid);
                                if (!wDef) return null;
                                return (
                                  <span
                                    key={wid}
                                    className="text-[10px] bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-slate-600 font-medium"
                                  >
                                    {wDef.title}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Apply Action Button */}
                        <button
                          onClick={() => applyTemplate(template)}
                          disabled={active}
                          className={`w-full py-2.5 rounded-2xl text-xs font-bold font-display flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm ${
                            active
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 cursor-default'
                              : 'bg-brand hover:bg-brand-hover text-white active:scale-[0.98]'
                          }`}
                        >
                          {active ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Current Active Template</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              <span>Select & Apply Template</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Individual Widget Catalog View */
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <span>
                      Toggle individual widgets on or off. Changes will persist to your local dashboard view.
                    </span>
                    <button
                      onClick={handleResetWidgets}
                      className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer transition-all shrink-0"
                    >
                      Reset to Defaults
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {widgets.map((w) => (
                      <div
                        key={w.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                          w.enabled
                            ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm'
                            : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/60 opacity-60'
                        }`}
                      >
                        <div className="space-y-0.5 truncate">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {w.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate">
                            {w.description}
                          </p>
                        </div>

                        <button
                          onClick={() => handleToggleWidget(w.id)}
                          className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                            w.enabled
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100'
                              : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                          }`}
                          title={w.enabled ? 'Hide Widget' : 'Show Widget'}
                        >
                          {w.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span>5 Pre-configured presets available</span>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Floating Quick Actions Radial Menu */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50">
        {/* Radial Backdrop Overlay when open */}
        {isRadialOpen && (
          <div 
            onClick={() => setIsRadialOpen(false)}
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity"
          />
        )}

        <div className="relative z-50">
          {/* Expanded Radial Menu Items */}
          {isRadialOpen && (
            <div className="absolute bottom-16 right-0 flex flex-col items-end gap-2.5 mb-2 pointer-events-auto">
              {[
                {
                  id: 'fuel',
                  title: 'Add Fuel',
                  subtitle: 'Log fuel purchase',
                  icon: Fuel,
                  badgeBg: 'bg-amber-500 text-white shadow-amber-500/20',
                  action: () => {
                    setIsRadialOpen(false);
                    onNavigateToAdd('fuel');
                  }
                },
                {
                  id: 'income',
                  title: 'Add Income',
                  subtitle: 'Record freight bill',
                  icon: ArrowUpRight,
                  badgeBg: 'bg-emerald-500 text-white shadow-emerald-500/20',
                  action: () => {
                    setIsRadialOpen(false);
                    onNavigateToAdd('income');
                  }
                },
                {
                  id: 'expense',
                  title: 'Add Expense',
                  subtitle: 'Tolls & repairs',
                  icon: ArrowDownRight,
                  badgeBg: 'bg-rose-500 text-white shadow-rose-500/20',
                  action: () => {
                    setIsRadialOpen(false);
                    onNavigateToAdd('expense');
                  }
                },
                {
                  id: 'fleet',
                  title: 'Check Fleet',
                  subtitle: 'Manage vehicles',
                  icon: Truck,
                  badgeBg: 'bg-indigo-600 text-white shadow-indigo-600/20',
                  action: () => {
                    setIsRadialOpen(false);
                    onNavigateToTab('vehicles');
                  }
                },
                {
                  id: 'driver-status',
                  title: 'Update Driver Status',
                  subtitle: 'Toggle roster state',
                  icon: Users,
                  badgeBg: 'bg-violet-600 text-white shadow-violet-600/20',
                  action: () => {
                    setIsRadialOpen(false);
                    setShowDriverStatusModal(true);
                  }
                },
                {
                  id: 'reset-widgets',
                  title: 'Reset Dashboard',
                  subtitle: 'Default widget layout',
                  icon: RotateCcw,
                  badgeBg: 'bg-slate-800 text-white shadow-slate-800/20 dark:bg-slate-700',
                  action: () => {
                    setIsRadialOpen(false);
                    handleResetWidgets();
                  }
                }
              ].map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.5, y: 20, x: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 10 }}
                    transition={{ duration: 0.18, delay: index * 0.03 }}
                    className="flex items-center gap-3 group cursor-pointer"
                    onClick={item.action}
                  >
                    {/* Tooltip Label */}
                    <div className="bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 px-3 py-1.5 rounded-xl text-xs font-bold font-display shadow-lg border border-white/10 dark:border-slate-800 flex flex-col items-end whitespace-nowrap">
                      <span>{item.title}</span>
                      <span className="text-[9px] font-normal opacity-70">{item.subtitle}</span>
                    </div>

                    {/* Radial Circular Button */}
                    <button
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-90 group-hover:scale-110 cursor-pointer ${item.badgeBg}`}
                      title={item.title}
                    >
                      <IconComponent className="w-5 h-5" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Central Radial Trigger FAB Button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsRadialOpen(!isRadialOpen)}
            className={`w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center cursor-pointer transition-all border border-white/20 relative ${
              isRadialOpen
                ? 'bg-rose-500 text-white rotate-45 ring-4 ring-rose-400/30'
                : 'bg-gradient-to-tr from-brand to-indigo-600 text-white hover:shadow-brand/40 ring-4 ring-brand/20'
            }`}
            title="Quick Actions Menu"
          >
            {isRadialOpen ? (
              <X className="w-7 h-7" />
            ) : (
              <div className="relative">
                <Zap className="w-7 h-7 text-white fill-white/20 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-indigo-600 animate-ping" />
              </div>
            )}
          </motion.button>
        </div>
      </div>

      {/* Driver Status Quick Update Modal */}
      {showDriverStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-2xl">
                  <Users className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold font-display text-lg text-slate-800 dark:text-white">
                    Driver Status Roster
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Update driver availability in real-time with one tap.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDriverStatusModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drivers List */}
            <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-1">
              {db.drivers.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No drivers currently added to the system.
                </div>
              ) : (
                db.drivers.map((driver) => {
                  const currentStatus = driver.status || 'active';
                  const assignedVeh = db.vehicles.find(v => v.id === driver.assignedVehicleId);

                  return (
                    <div 
                      key={driver.id} 
                      className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-800 dark:text-white">{driver.name}</h4>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                            currentStatus === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                            currentStatus === 'absent' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {currentStatus}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {driver.mobile ? `📞 ${driver.mobile}` : 'No phone'} 
                          {assignedVeh ? ` • 🚛 ${assignedVeh.number}` : ' • Unassigned'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <button
                          onClick={() => {
                            editDriver({ ...driver, status: 'active' });
                            setActiveNotification(`Updated ${driver.name}'s status to ACTIVE`);
                            setTimeout(() => setActiveNotification(null), 3000);
                          }}
                          className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            currentStatus === 'active'
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          Active
                        </button>
                        <button
                          onClick={() => {
                            editDriver({ ...driver, status: 'inactive' });
                            setActiveNotification(`Updated ${driver.name}'s status to INACTIVE`);
                            setTimeout(() => setActiveNotification(null), 3000);
                          }}
                          className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            currentStatus === 'inactive'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          Inactive
                        </button>
                        <button
                          onClick={() => {
                            editDriver({ ...driver, status: 'absent' });
                            setActiveNotification(`Updated ${driver.name}'s status to ABSENT`);
                            setTimeout(() => setActiveNotification(null), 3000);
                          }}
                          className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            currentStatus === 'absent'
                              ? 'bg-rose-500 text-white shadow-sm'
                              : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <button
                onClick={() => {
                  setShowDriverStatusModal(false);
                  onNavigateToTab('drivers');
                }}
                className="text-xs text-brand font-bold hover:underline cursor-pointer"
              >
                Manage Drivers Tab →
              </button>
              <button
                onClick={() => setShowDriverStatusModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
