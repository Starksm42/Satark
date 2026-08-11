import React, { useState, useMemo } from 'react';
import { useTransport } from '../context/TransportContext';
import { formatCurrency, formatDate, downloadCSV, downloadExcel, downloadPrintableReport } from '../utils';
import { TrashBin } from './TrashBin';
import { 
  Search, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  SlidersHorizontal,
  Calendar,
  Fuel,
  ChevronDown,
  Edit2,
  Smartphone,
  Package,
  FileDown
} from 'lucide-react';

interface RecordsProps {
  onPrint?: () => void;
}

export const Records: React.FC<RecordsProps> = ({ onPrint }) => {
  const { db, deleteIncome, deleteExpense, deleteFuel, editIncome, editExpense, editFuel } = useTransport();
  const currency = db.settings.currencySymbol;

  // Active Ledger Category Tab
  const [activeTab, setActiveTab] = useState<'income' | 'expense' | 'fuel'>('income');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'weekly' | 'monthly' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  
  // Show/Hide advance filter drawer
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isTrashOpen, setIsTrashOpen] = useState<boolean>(false);

  // Helper to retrieve names of linked structures
  const getVehicleNumber = (vId: string) => {
    const v = db.vehicles.find(item => item.id === vId);
    return v ? v.number : 'Unknown Vehicle';
  };

  const getDriverName = (dId: string) => {
    const d = db.drivers.find(item => item.id === dId);
    return d ? d.name : 'System';
  };

  // Extract list of all subcategories based on chosen category for filter options
  const expenseSubcategories = useMemo(() => {
    const currentCat = db.categories.find(c => c.name === selectedCategory);
    return currentCat ? currentCat.subcategories : [];
  }, [db.categories, selectedCategory]);

  // Date Filtering logic helper
  const isDateInFilterRange = (itemDateStr: string) => {
    if (datePreset === 'all') return true;
    
    const itemDate = new Date(itemDateStr);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (datePreset === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      return itemDateStr === todayStr;
    }

    if (datePreset === 'weekly') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return itemDate >= oneWeekAgo && itemDate <= new Date();
    }

    if (datePreset === 'monthly') {
      const currentMonthPrefix = new Date().toISOString().slice(0, 7); // "YYYY-MM"
      return itemDateStr.startsWith(currentMonthPrefix);
    }

    if (datePreset === 'custom') {
      if (!startDate && !endDate) return true;
      const start = startDate ? new Date(startDate) : new Date('1970-01-01');
      const end = endDate ? new Date(endDate) : new Date('2099-12-31');
      end.setHours(23, 59, 59, 999);
      return itemDate >= start && itemDate <= end;
    }

    return true;
  };

  // Filtered lists
  const filteredIncome = useMemo(() => {
    return db.income.filter(item => {
      const matchesSearch = 
        item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fromLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.toLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getVehicleNumber(item.vehicleId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getDriverName(item.driverId).toLowerCase().includes(searchTerm.toLowerCase());

      const matchesVehicle = selectedVehicle === 'all' || item.vehicleId === selectedVehicle;
      const matchesDriver = selectedDriver === 'all' || item.driverId === selectedDriver;
      const matchesDate = isDateInFilterRange(item.date);
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

      return matchesSearch && matchesVehicle && matchesDriver && matchesDate && matchesCategory;
    });
  }, [db.income, searchTerm, selectedVehicle, selectedDriver, datePreset, startDate, endDate, selectedCategory]);

  const filteredExpense = useMemo(() => {
    return db.expenses.filter(item => {
      const matchesSearch = 
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getVehicleNumber(item.vehicleId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getDriverName(item.driverId).toLowerCase().includes(searchTerm.toLowerCase());

      const matchesVehicle = selectedVehicle === 'all' || item.vehicleId === selectedVehicle;
      const matchesDriver = selectedDriver === 'all' || item.driverId === selectedDriver;
      const matchesDate = isDateInFilterRange(item.date);
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSubcategory = selectedSubcategory === 'all' || item.subCategory === selectedSubcategory;

      return matchesSearch && matchesVehicle && matchesDriver && matchesDate && matchesCategory && matchesSubcategory;
    });
  }, [db.expenses, searchTerm, selectedVehicle, selectedDriver, datePreset, startDate, endDate, selectedCategory, selectedSubcategory]);

  const filteredFuel = useMemo(() => {
    return db.fuelRecords.filter(item => {
      const matchesSearch = 
        item.fuelStation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getVehicleNumber(item.vehicleId).toLowerCase().includes(searchTerm.toLowerCase());

      const matchesVehicle = selectedVehicle === 'all' || item.vehicleId === selectedVehicle;
      const matchesDate = isDateInFilterRange(item.date);

      return matchesSearch && matchesVehicle && matchesDate;
    });
  }, [db.fuelRecords, searchTerm, selectedVehicle, datePreset, startDate, endDate]);

  // Handle entries deletion
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    requiresPin: boolean;
    pinInput: string;
    error: string;
    onConfirm: () => void;
  } | null>(null);

  const [editingItem, setEditingItem] = useState<{
    type: 'income' | 'expense' | 'fuel';
    item: any;
  } | null>(null);

  const handleDeleteItem = (id: string) => {
    const isPinActive = db.settings.pinLock && !!db.settings.pinCode;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Record?',
      description: 'Are you sure you want to delete this record? This is irreversible.',
      requiresPin: isPinActive,
      pinInput: '',
      error: '',
      onConfirm: () => {
        if (activeTab === 'income') deleteIncome(id);
        if (activeTab === 'expense') deleteExpense(id);
        if (activeTab === 'fuel') deleteFuel(id);
      }
    });
  };

  const handleEditClick = (item: any, type: 'income' | 'expense' | 'fuel') => {
    const isPinActive = db.settings.pinLock && !!db.settings.pinCode;
    
    if (isPinActive) {
      setConfirmDialog({
        isOpen: true,
        title: 'Unlock Record Edit',
        description: 'Please enter your 4-Digit Security PIN to edit this record.',
        requiresPin: true,
        pinInput: '',
        error: '',
        onConfirm: () => {
          setEditingItem({ type, item });
        }
      });
    } else {
      setEditingItem({ type, item });
    }
  };

  const handleConfirmDialogSubmit = () => {
    if (!confirmDialog) return;
    
    if (confirmDialog.requiresPin) {
      if (confirmDialog.pinInput !== db.settings.pinCode) {
        setConfirmDialog(prev => prev ? { ...prev, error: 'Incorrect 4-Digit Security PIN!' } : null);
        return;
      }
    }
    
    confirmDialog.onConfirm();
    setConfirmDialog(null);
  };

  // Export Filtered data to styled Excel Spreadsheet
  const handleExcelExport = () => {
    if (activeTab === 'income') {
      downloadExcel(
        filteredIncome,
        `Income_Statement_${new Date().toISOString().split('T')[0]}`,
        ['Date', 'Time', 'Vehicle', 'Driver', 'Customer Details', 'From', 'To', 'Trip Amount', 'Advance Paid', 'Balance Left', 'Mode', 'Category', 'Notes'],
        (item) => [
          item.date,
          item.time || 'N/A',
          getVehicleNumber(item.vehicleId),
          getDriverName(item.driverId),
          item.customerName,
          item.fromLocation,
          item.toLocation,
          `${currency}${item.tripAmount}`,
          `${currency}${item.advance}`,
          `${currency}${item.balance}`,
          item.paymentMode,
          item.category,
          item.notes
        ],
        'Income Statement'
      );
    } else if (activeTab === 'expense') {
      downloadExcel(
        filteredExpense,
        `Expense_Statement_${new Date().toISOString().split('T')[0]}`,
        ['Date', 'Time', 'Vehicle', 'Driver', 'Category', 'Subcategory', 'Amount Paid', 'Notes'],
        (item) => [
          item.date,
          item.time || 'N/A',
          getVehicleNumber(item.vehicleId),
          getDriverName(item.driverId),
          item.category,
          item.subCategory,
          `${currency}${item.amount}`,
          item.notes
        ],
        'Expense Statement'
      );
    } else {
      downloadExcel(
        filteredFuel,
        `Fuel_Logs_Statement_${new Date().toISOString().split('T')[0]}`,
        ['Date', 'Time', 'Vehicle', 'Odometer Reading', 'Prev Odometer', 'Distance (KM)', 'Qty Filled', 'Rate', 'Total Cost', 'Mileage (KM/L)', 'Cost per KM', 'Station', 'Notes'],
        (item) => [
          item.date,
          item.time || 'N/A',
          getVehicleNumber(item.vehicleId),
          String(item.odometerReading),
          String(item.previousOdometer),
          String(item.distanceTravelled),
          `${item.fuelQuantity} ${item.fuelUnit === 'Kg' ? 'Kg' : 'L'}`,
          `${currency}${item.fuelRate}/${item.fuelUnit === 'Kg' ? 'Kg' : 'L'}`,
          `${currency}${item.totalCost}`,
          `${item.mileage} km/${item.fuelUnit === 'Kg' ? 'kg' : 'l'}`,
          `${currency}${item.costPerKm}/km`,
          item.fuelStation,
          item.notes
        ],
        'Fuel Logs Statement'
      );
    }
  };

  // Export Filtered data to Excel compatible CSV
  const handleCSVExport = () => {
    if (activeTab === 'income') {
      downloadCSV(
        filteredIncome,
        `Income_Report_${new Date().toISOString().split('T')[0]}`,
        ['Date', 'Time', 'Vehicle', 'Driver', 'Customer', 'From', 'To', 'Trip Amount', 'Advance Paid', 'Balance Left', 'Mode', 'Category', 'Notes'],
        (item) => [
          item.date,
          item.time || 'N/A',
          getVehicleNumber(item.vehicleId),
          getDriverName(item.driverId),
          item.customerName,
          item.fromLocation,
          item.toLocation,
          String(item.tripAmount),
          String(item.advance),
          String(item.balance),
          item.paymentMode,
          item.category,
          item.notes
        ]
      );
    } else if (activeTab === 'expense') {
      downloadCSV(
        filteredExpense,
        `Expense_Report_${new Date().toISOString().split('T')[0]}`,
        ['Date', 'Time', 'Vehicle', 'Driver', 'Category', 'Subcategory', 'Amount Paid', 'Notes'],
        (item) => [
          item.date,
          item.time || 'N/A',
          getVehicleNumber(item.vehicleId),
          getDriverName(item.driverId),
          item.category,
          item.subCategory,
          String(item.amount),
          item.notes
        ]
      );
    } else {
      downloadCSV(
        filteredFuel,
        `Fuel_Logs_${new Date().toISOString().split('T')[0]}`,
        ['Date', 'Time', 'Vehicle', 'Odometer Reading', 'Prev Odometer', 'Distance (KM)', 'Qty', 'Rate', 'Total Cost', 'Mileage', 'Cost/KM', 'Station', 'Notes'],
        (item) => [
          item.date,
          item.time || 'N/A',
          getVehicleNumber(item.vehicleId),
          String(item.odometerReading),
          String(item.previousOdometer),
          String(item.distanceTravelled),
          `${item.fuelQuantity} ${item.fuelUnit === 'Kg' ? 'Kg' : 'L'}`,
          String(item.fuelRate),
          String(item.totalCost),
          `${item.mileage} km/${item.fuelUnit === 'Kg' ? 'kg' : 'l'}`,
          String(item.costPerKm),
          item.fuelStation,
          item.notes
        ]
      );
    }
  };

  // Handle PDF/Print simulation by downloading a high-fidelity standalone HTML report that auto-prints
  const handlePrint = () => {
    const coName = db.settings.companyName || 'Express Logistics';
    if (activeTab === 'income') {
      const totalIncome = filteredIncome.reduce((sum, item) => sum + item.tripAmount, 0);
      const totalAdvance = filteredIncome.reduce((sum, item) => sum + item.advance, 0);
      const totalBalance = filteredIncome.reduce((sum, item) => sum + item.balance, 0);

      downloadPrintableReport(
        filteredIncome,
        `Income_Statement_${new Date().toISOString().split('T')[0]}`,
        ['Date', 'Time', 'Vehicle', 'Driver', 'Customer Details', 'From', 'To', 'Trip Amount', 'Advance Paid', 'Balance Left', 'Mode', 'Category', 'Notes'],
        (item) => [
          item.date,
          item.time || 'N/A',
          getVehicleNumber(item.vehicleId),
          getDriverName(item.driverId),
          item.customerName,
          item.fromLocation,
          item.toLocation,
          `${currency}${item.tripAmount}`,
          `${currency}${item.advance}`,
          `${currency}${item.balance}`,
          item.paymentMode,
          item.category,
          item.notes
        ],
        'Income Statement Report',
        coName,
        currency,
        [
          { label: 'Total Inflow (Revenue)', value: `${currency}${totalIncome.toLocaleString()}` },
          { label: 'Total Advance Received', value: `${currency}${totalAdvance.toLocaleString()}` },
          { label: 'Total Outstanding Balance', value: `${currency}${totalBalance.toLocaleString()}` },
          { label: 'Total Shipments/Trips', value: String(filteredIncome.length) }
        ]
      );
    } else if (activeTab === 'expense') {
      const totalExpense = filteredExpense.reduce((sum, item) => sum + item.amount, 0);

      downloadPrintableReport(
        filteredExpense,
        `Expense_Statement_${new Date().toISOString().split('T')[0]}`,
        ['Date', 'Time', 'Vehicle', 'Driver', 'Category', 'Subcategory', 'Amount Paid', 'Notes'],
        (item) => [
          item.date,
          item.time || 'N/A',
          getVehicleNumber(item.vehicleId),
          getDriverName(item.driverId),
          item.category,
          item.subCategory,
          `${currency}${item.amount}`,
          item.notes
        ],
        'Expense Statement Report',
        coName,
        currency,
        [
          { label: 'Total Business Outflow', value: `${currency}${totalExpense.toLocaleString()}` },
          { label: 'Total Expense Vouchers', value: String(filteredExpense.length) }
        ]
      );
    } else {
      const totalFuelCost = filteredFuel.reduce((sum, item) => sum + item.totalCost, 0);
      const totalQuantity = filteredFuel.reduce((sum, item) => sum + item.fuelQuantity, 0);

      downloadPrintableReport(
        filteredFuel,
        `Fuel_Logs_Statement_${new Date().toISOString().split('T')[0]}`,
        ['Date', 'Time', 'Vehicle', 'Odometer Reading', 'Prev Odometer', 'Distance (KM)', 'Qty Filled', 'Rate', 'Total Cost', 'Mileage (KM/L)', 'Cost per KM', 'Station', 'Notes'],
        (item) => [
          item.date,
          item.time || 'N/A',
          getVehicleNumber(item.vehicleId),
          String(item.odometerReading),
          String(item.previousOdometer),
          String(item.distanceTravelled),
          `${item.fuelQuantity} ${item.fuelUnit === 'Kg' ? 'Kg' : 'L'}`,
          `${currency}${item.fuelRate}/${item.fuelUnit === 'Kg' ? 'Kg' : 'L'}`,
          `${currency}${item.totalCost}`,
          `${item.mileage} km/${item.fuelUnit === 'Kg' ? 'kg' : 'l'}`,
          `${currency}${item.costPerKm}/km`,
          item.fuelStation,
          item.notes
        ],
        'Fuel Logs & Mileage Report',
        coName,
        currency,
        [
          { label: 'Total Fuel Outlay', value: `${currency}${totalFuelCost.toLocaleString()}` },
          { label: 'Total Fuel Quantity Purchased', value: `${totalQuantity.toFixed(2)} units` },
          { label: 'Fuel Logs Count', value: String(filteredFuel.length) }
        ]
      );
    }
  };

  return (
    <div className="space-y-6 pb-20 print:p-0 print:m-0 print:bg-white">
      {/* Ledger Headers */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm no-print">
        <div>
          <h2 className="text-xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
            Business Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit and export off-line transaction records.
          </p>
        </div>
        
        {/* Export & Download Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full xl:w-auto">
          <a
            href="/app-debug.apk"
            download="app-debug.apk"
            className="flex-1 sm:flex-none px-3.5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer border border-violet-500/30"
            title="Download Android APK Package (app-debug.apk)"
          >
            <Smartphone className="w-4 h-4 text-violet-200" />
            Download APK
          </a>
          <button
            onClick={() => setIsTrashOpen(true)}
            className="flex-1 sm:flex-none px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 text-rose-500 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-rose-100/50 dark:border-rose-500/10 cursor-pointer"
            title="Open Password Protected Trash Bin"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span className="relative">
              Trash Bin
              {db.trashBin && db.trashBin.length > 0 && (
                <span className="absolute -top-1.5 -right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
              )}
            </span>
          </button>
          <button
            onClick={handleExcelExport}
            className="flex-1 sm:flex-none px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            title="Download formatted Excel (.xls) Statement"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            Export Excel
          </button>
          <button
            onClick={handleCSVExport}
            className="flex-1 sm:flex-none px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-slate-600 cursor-pointer"
            title="Download raw CSV Statement"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none px-3.5 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            title="Print PDF Report"
          >
            <Printer className="w-4 h-4" />
            Save PDF
          </button>
        </div>
      </div>

      {/* Printable Title Block - Hidden in Web View, Visible in Print */}
      <div className="hidden print-only print-container p-6 bg-white border-b-2 border-slate-300">
        <h1 className="text-2xl font-bold font-display text-slate-950">{db.settings.companyName || 'Express Logistics'}</h1>
        <p className="text-sm text-slate-500 mt-1">Generated Transport Statement — Offline Ledger Database</p>
        <p className="text-xs text-slate-400 mt-0.5">Date Preset Filter: {datePreset.toUpperCase()} ({startDate || 'Beginning'} to {endDate || 'Today'})</p>
      </div>

      {/* Main ledger switcher tabs */}
      <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm no-print">
        <button
          onClick={() => { setActiveTab('income'); setSelectedCategory('all'); }}
          className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'income'
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          Income Entries ({filteredIncome.length})
        </button>
        <button
          onClick={() => { setActiveTab('expense'); setSelectedCategory('all'); }}
          className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'expense'
              ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" />
          Expense Entries ({filteredExpense.length})
        </button>
        <button
          onClick={() => { setActiveTab('fuel'); }}
          className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'fuel'
              ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
          }`}
        >
          <Fuel className="w-4 h-4" />
          Fuel Logs ({filteredFuel.length})
        </button>
      </div>

      {/* Search & Advanced filters trigger panel */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm space-y-4 no-print">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder={`Search in ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              showFilters || selectedVehicle !== 'all' || selectedDriver !== 'all' || datePreset !== 'all' || selectedCategory !== 'all'
                ? 'bg-brand/10 border-brand/20 text-brand dark:bg-brand/10 dark:border-brand/25 dark:text-brand'
                : 'bg-slate-50 border-slate-100 dark:bg-slate-700 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {(selectedVehicle !== 'all' || selectedDriver !== 'all' || datePreset !== 'all' || selectedCategory !== 'all') && (
              <span className="w-2 h-2 bg-brand rounded-full" />
            )}
          </button>
        </div>

        {/* Filters drawer body */}
        {showFilters && (
          <div className="pt-4 border-t border-slate-50 dark:border-slate-700/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {/* Vehicle selection */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-400 uppercase tracking-wider block">Filter Vehicle</label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl focus:outline-none text-slate-800 dark:text-white"
              >
                <option value="all">All Vehicles</option>
                {db.vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.number}</option>
                ))}
              </select>
            </div>

            {/* Driver selection */}
            {activeTab !== 'fuel' && (
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-400 uppercase tracking-wider block">Filter Driver</label>
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl focus:outline-none text-slate-800 dark:text-white"
                >
                  <option value="all">All Drivers</option>
                  {db.drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Preset Selection */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-400 uppercase tracking-wider block">Date Range</label>
              <select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl focus:outline-none text-slate-800 dark:text-white"
              >
                <option value="all">All History</option>
                <option value="today">Today</option>
                <option value="weekly">Last 7 Days</option>
                <option value="monthly">This Month</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {/* Custom category filter */}
            {activeTab !== 'fuel' && (
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-400 uppercase tracking-wider block">Primary Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory('all');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl focus:outline-none text-slate-800 dark:text-white"
                >
                  <option value="all">All Categories</option>
                  {db.categories
                    .filter(c => c.type === activeTab)
                    .map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                </select>
              </div>
            )}

            {/* Custom subcategory filter for Expense tab */}
            {activeTab === 'expense' && selectedCategory !== 'all' && (
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-400 uppercase tracking-wider block">Subcategory</label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl focus:outline-none text-slate-800 dark:text-white"
                >
                  <option value="all">All Subcategories</option>
                  {expenseSubcategories.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Custom inputs */}
            {datePreset === 'custom' && (
              <div className="col-span-full grid grid-cols-2 gap-4 mt-2 bg-slate-50 dark:bg-slate-700/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/40">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">From Date</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">To Date</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ledger list view */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden">
        
        {/* Income Table List */}
        {activeTab === 'income' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px] text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-700/50 uppercase text-[10px] tracking-wider">
                  <th className="p-4">Trip Date</th>
                  <th className="p-4">Vehicle & Driver</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Route Info</th>
                  <th className="p-4 text-right">Tally Amount</th>
                  <th className="p-4 no-print"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredIncome.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">No income records registered under active filters.</td>
                  </tr>
                ) : (
                  filteredIncome.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{formatDate(item.date)}</span>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{item.time || '00:00'}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-brand font-mono text-[11px] bg-brand/10 px-2 py-0.5 rounded-full">{getVehicleNumber(item.vehicleId)}</span>
                        <div className="text-slate-400 text-[10px] mt-1">Driver: {getDriverName(item.driverId)}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-100 block">{item.customerName || 'Direct Booking'}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{item.category} • {item.paymentMode}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-slate-700 dark:text-slate-300 block">{item.fromLocation} → {item.toLocation}</span>
                        {item.notes && <span className="text-[10px] text-slate-400 truncate max-w-[150px] block mt-0.5" title={item.notes}>{item.notes}</span>}
                      </td>
                      <td className="p-4 text-right font-mono whitespace-nowrap">
                        <span className="font-bold text-emerald-500 block">+{formatCurrency(item.tripAmount, currency)}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Bal: {formatCurrency(item.balance, currency)}</span>
                      </td>
                      <td className="p-4 text-right no-print">
                        <div className="flex justify-end items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditClick(item, 'income')}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded-lg text-rose-500 transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Expense Table List */}
        {activeTab === 'expense' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px] text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-700/50 uppercase text-[10px] tracking-wider">
                  <th className="p-4">Expense Date</th>
                  <th className="p-4">Vehicle & Driver</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Notes</th>
                  <th className="p-4 text-right">Tally Amount</th>
                  <th className="p-4 no-print"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredExpense.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">No expense records registered under active filters.</td>
                  </tr>
                ) : (
                  filteredExpense.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{formatDate(item.date)}</span>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{item.time || '00:00'}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-brand font-mono text-[11px] bg-brand/10 px-2 py-0.5 rounded-full">{getVehicleNumber(item.vehicleId)}</span>
                        <div className="text-slate-400 text-[10px] mt-1">Person: {getDriverName(item.driverId)}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-rose-500 block">{item.category}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{item.subCategory}</span>
                      </td>
                      <td className="p-4 max-w-xs truncate">
                        <span className="text-slate-600 dark:text-slate-300 leading-normal block whitespace-pre-line">{item.notes || '—'}</span>
                        {item.billPhoto && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-brand mt-1.5 uppercase bg-brand/10 dark:bg-brand/15 px-2 py-0.5 rounded-full">
                            📎 Bill Uploaded
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right font-mono whitespace-nowrap">
                        <span className="font-bold text-rose-500">-{formatCurrency(item.amount, currency)}</span>
                      </td>
                      <td className="p-4 text-right no-print">
                        <div className="flex justify-end items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditClick(item, 'expense')}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded-lg text-rose-500 transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Fuel Table List */}
        {activeTab === 'fuel' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px] text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-700/50 uppercase text-[10px] tracking-wider">
                  <th className="p-4">Refill Date</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Odometer Run</th>
                  <th className="p-4">Qty & Rate</th>
                  <th className="p-4 text-center">Mileage Statistics</th>
                  <th className="p-4 text-right">Cost</th>
                  <th className="p-4 no-print"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredFuel.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">No fuel records registered.</td>
                  </tr>
                ) : (
                  filteredFuel.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{formatDate(item.date)}</span>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{item.time || '00:00'}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-brand font-mono text-[11px] bg-brand/10 px-2 py-0.5 rounded-full">{getVehicleNumber(item.vehicleId)}</span>
                        <div className="text-slate-400 text-[10px] mt-1.5 truncate max-w-[120px]" title={item.fuelStation}>Pump: {item.fuelStation || 'Local Station'}</div>
                      </td>
                      <td className="p-4 font-mono">
                        <span className="text-slate-800 dark:text-slate-200 block">{item.odometerReading} km</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Run: +{item.distanceTravelled} km</span>
                      </td>
                      <td className="p-4 font-mono">
                        <span className="text-slate-800 dark:text-slate-200 block">{item.fuelQuantity} {item.fuelUnit === 'Kg' ? 'Kg' : 'L'}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Rate: {currency}{item.fuelRate}/{item.fuelUnit === 'Kg' ? 'Kg' : 'L'}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full text-[11px] font-mono">
                          {item.mileage} km/{item.fuelUnit === 'Kg' ? 'kg' : 'l'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">Cost: {currency}{item.costPerKm}/km</div>
                      </td>
                      <td className="p-4 text-right font-mono whitespace-nowrap">
                        <span className="font-bold text-rose-500">-{formatCurrency(item.totalCost, currency)}</span>
                        {item.notes && <div className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[100px] block" title={item.notes}>{item.notes}</div>}
                      </td>
                      <td className="p-4 text-right no-print">
                        <div className="flex justify-end items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditClick(item, 'fuel')}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded-lg text-rose-500 transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Custom Confirm & PIN verification dialog overlay */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 border border-slate-100 dark:border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-white">
            <h3 className="font-extrabold text-base font-display text-slate-800 dark:text-white mb-2">
              {confirmDialog.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              {confirmDialog.description}
            </p>

            {confirmDialog.requiresPin && (
              <div className="space-y-2 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-600 mb-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                  Enter 4-Digit Security PIN
                </label>
                <input
                  type="password"
                  placeholder="••••"
                  value={confirmDialog.pinInput}
                  onChange={(e) => setConfirmDialog({ ...confirmDialog, pinInput: e.target.value.replace(/\D/g, '').slice(0, 4), error: '' })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmDialogSubmit();
                    }
                  }}
                  className="w-full text-center px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-lg font-mono font-bold tracking-widest text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand"
                  maxLength={4}
                  autoFocus
                />
                {confirmDialog.error && (
                  <span className="text-[10px] font-semibold text-rose-500 block text-center mt-1">
                    {confirmDialog.error}
                  </span>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-100 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDialogSubmit}
                className="flex-1 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow-md cursor-pointer font-sans"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Record Modal Dialog */}
      {editingItem && (
        <EditRecordModal
          isOpen={true}
          type={editingItem.type}
          item={editingItem.item}
          onClose={() => setEditingItem(null)}
          onSave={(updated) => {
            if (editingItem.type === 'income') editIncome(updated);
            if (editingItem.type === 'expense') editExpense(updated);
            if (editingItem.type === 'fuel') editFuel(updated);
          }}
          db={db}
          currency={currency}
        />
      )}
      <TrashBin isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} />
    </div>
  );
};

// Edit Record Modal Component
interface EditRecordModalProps {
  isOpen: boolean;
  type: 'income' | 'expense' | 'fuel';
  item: any;
  onClose: () => void;
  onSave: (updatedItem: any) => void;
  db: any;
  currency: string;
}

const EditRecordModal: React.FC<EditRecordModalProps> = ({ isOpen, type, item, onClose, onSave, db, currency }) => {
  const [date, setDate] = useState(item.date || '');
  const [time, setTime] = useState(item.time || '');
  const [vehicleId, setVehicleId] = useState(item.vehicleId || '');
  const [driverId, setDriverId] = useState(item.driverId || '');
  const [notes, setNotes] = useState(item.notes || '');

  // Income specific fields
  const [customerName, setCustomerName] = useState(item.customerName || '');
  const [fromLocation, setFromLocation] = useState(item.fromLocation || '');
  const [toLocation, setToLocation] = useState(item.toLocation || '');
  const [tripAmount, setTripAmount] = useState<number>(item.tripAmount || 0);
  const [advance, setAdvance] = useState<number>(item.advance || 0);
  const [paymentMode, setPaymentMode] = useState(item.paymentMode || 'Cash');
  const [category, setCategory] = useState(item.category || '');

  // Expense specific fields
  const [subCategory, setSubCategory] = useState(item.subCategory || '');
  const [amount, setAmount] = useState<number>(item.amount || 0);

  // Fuel specific fields
  const [odometerReading, setOdometerReading] = useState<number>(item.odometerReading || 0);
  const [previousOdometer, setPreviousOdometer] = useState<number>(item.previousOdometer || 0);
  const [fuelQuantity, setFuelQuantity] = useState<number>(item.fuelQuantity || 0);
  const [fuelRate, setFuelRate] = useState<number>(item.fuelRate || 0);
  const [fuelStation, setFuelStation] = useState(item.fuelStation || '');
  const [fuelUnit, setFuelUnit] = useState(item.fuelUnit || 'Liters');
  const [fuelType, setFuelType] = useState(item.fuelType || 'diesel');

  // Sync state if item changes
  React.useEffect(() => {
    if (item) {
      setDate(item.date || '');
      setTime(item.time || '');
      setVehicleId(item.vehicleId || '');
      setDriverId(item.driverId || '');
      setNotes(item.notes || '');

      setCustomerName(item.customerName || '');
      setFromLocation(item.fromLocation || '');
      setToLocation(item.toLocation || '');
      setTripAmount(item.tripAmount || 0);
      setAdvance(item.advance || 0);
      setPaymentMode(item.paymentMode || 'Cash');
      setCategory(item.category || '');

      setSubCategory(item.subCategory || '');
      setAmount(item.amount || 0);

      setOdometerReading(item.odometerReading || 0);
      setPreviousOdometer(item.previousOdometer || 0);
      setFuelQuantity(item.fuelQuantity || 0);
      setFuelRate(item.fuelRate || 0);
      setFuelStation(item.fuelStation || '');
      setFuelUnit(item.fuelUnit || 'Liters');
      setFuelType(item.fuelType || 'diesel');
    }
  }, [item]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const base = {
      ...item,
      date,
      time,
      vehicleId,
      driverId,
      notes: notes.trim(),
    };

    if (type === 'income') {
      onSave({
        ...base,
        customerName: customerName.trim(),
        fromLocation: fromLocation.trim(),
        toLocation: toLocation.trim(),
        tripAmount: Number(tripAmount),
        advance: Number(advance),
        balance: Math.max(0, Number(tripAmount) - Number(advance)),
        paymentMode,
        category,
      });
    } else if (type === 'expense') {
      onSave({
        ...base,
        category,
        subCategory,
        amount: Number(amount),
      });
    } else if (type === 'fuel') {
      onSave({
        ...base,
        odometerReading: Number(odometerReading),
        previousOdometer: Number(previousOdometer),
        fuelQuantity: Number(fuelQuantity),
        fuelRate: Number(fuelRate),
        fuelStation: fuelStation.trim(),
        fuelUnit,
        fuelType,
      });
    }
    onClose();
  };

  const currentCategories = db.categories.filter((c: any) => c.type === type);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 border border-slate-100 dark:border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto text-slate-800 dark:text-white no-scrollbar">
        <div className="flex justify-between items-center pb-3.5 border-b border-slate-100 dark:border-slate-700 mb-4">
          <h3 className="font-extrabold text-base font-display text-brand capitalize flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-brand" />
            Edit {type} Record
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-[10px] font-bold bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 px-2.5 py-1 rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* General Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl font-medium focus:outline-none text-slate-800 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Time</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl font-medium focus:outline-none text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vehicle</label>
              <select
                required
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl font-medium focus:outline-none text-slate-800 dark:text-white"
              >
                <option value="">Select Vehicle</option>
                {db.vehicles.map((v: any) => (
                  <option key={v.id} value={v.id}>{v.number}</option>
                ))}
              </select>
            </div>
            {type !== 'fuel' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Driver / Person</label>
                <select
                  required
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl font-medium focus:outline-none text-slate-800 dark:text-white"
                >
                  <option value="none">None / Direct</option>
                  {db.drivers.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* INCOME TYPE FORM FIELDS */}
          {type === 'income' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Logistics"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl font-medium focus:outline-none text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">From Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Delhi"
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl font-medium focus:outline-none text-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">To Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai"
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl font-medium focus:outline-none text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Primary Category</label>
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl font-medium focus:outline-none text-slate-800 dark:text-white"
                  >
                    <option value="">Select Category</option>
                    {currentCategories.map((c: any) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Mode</label>
                  <select
                    required
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl font-medium focus:outline-none text-slate-800 dark:text-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Fastag Wallet">Fastag Wallet</option>
                    <option value="UPI / QR">UPI / QR</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trip Freight ({currency})</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={tripAmount}
                    onChange={(e) => setTripAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl font-medium focus:outline-none text-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Advance Paid ({currency})</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={tripAmount}
                    value={advance}
                    onChange={(e) => setAdvance(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl font-medium focus:outline-none text-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Calculated Balance Due:</span>
                <span className="text-base font-extrabold text-brand block font-mono">{currency}{Math.max(0, tripAmount - advance)}</span>
              </div>
            </div>
          )}

          {/* EXPENSE TYPE FORM FIELDS */}
          {type === 'expense' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category</label>
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl font-medium focus:outline-none text-slate-800 dark:text-white"
                  >
                    <option value="">Select Category</option>
                    {currentCategories.map((c: any) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Subcategory</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diesel, Parts"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl font-medium focus:outline-none text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Amount Paid ({currency})</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl font-medium focus:outline-none text-slate-800 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* FUEL TYPE FORM FIELDS */}
          {type === 'fuel' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fuel Type</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl font-medium text-slate-800 dark:text-white"
                  >
                    <option value="diesel">Diesel (Standard)</option>
                    <option value="petrol">Petrol (Gasoline)</option>
                    <option value="gas">CNG / LNG (Gas)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Measurement Unit</label>
                  <select
                    value={fuelUnit}
                    onChange={(e) => setFuelUnit(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl font-medium text-slate-800 dark:text-white"
                  >
                    <option value="Liters">Liters (L)</option>
                    <option value="Kg">Kilograms (Kg)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Odometer Reading (KM)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={odometerReading}
                    onChange={(e) => setOdometerReading(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl font-medium focus:outline-none text-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Previous Odometer (KM)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={odometerReading}
                    value={previousOdometer}
                    onChange={(e) => setPreviousOdometer(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl font-medium focus:outline-none text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fuel Quantity ({fuelUnit === 'Kg' ? 'Kg' : 'Liters'})</label>
                  <input
                    type="number"
                    required
                    min={0.1}
                    step="any"
                    value={fuelQuantity}
                    onChange={(e) => setFuelQuantity(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl font-medium focus:outline-none text-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rate per unit ({currency})</label>
                  <input
                    type="number"
                    required
                    min={0.1}
                    step="any"
                    value={fuelRate}
                    onChange={(e) => setFuelRate(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl font-medium focus:outline-none text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fuel Station</label>
                <input
                  type="text"
                  placeholder="e.g. Bharat Petroleum"
                  value={fuelStation}
                  onChange={(e) => setFuelStation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl font-medium focus:outline-none text-slate-800 dark:text-white"
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 grid grid-cols-2 text-center text-[10px]">
                <div>
                  <span className="text-slate-400 block uppercase font-semibold">Calculated Cost:</span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-white block font-mono">{currency}{(fuelQuantity * fuelRate).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-semibold">Distance Run:</span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-white block font-mono">{Math.max(0, odometerReading - previousOdometer)} KM</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes field */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remarks / Notes</label>
            <textarea
              placeholder="Enter remarks or details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl font-medium focus:outline-none text-slate-800 dark:text-white h-16 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-100 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer font-sans"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer font-sans"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
