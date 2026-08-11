import React, { useState, useMemo, useEffect } from 'react';
import { useTransport } from '../context/TransportContext';
import { calculateFuel } from '../utils';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Fuel, 
  Camera, 
  Plus, 
  CheckCircle,
  Truck,
  User,
  MapPin,
  CircleDollarSign,
  Undo
} from 'lucide-react';
import { motion } from 'motion/react';

export const AddEntry: React.FC<{ 
  onNavigateToTab: (tab: string) => void;
  initialType?: 'income' | 'expense' | 'fuel';
}> = ({ onNavigateToTab, initialType }) => {
  const { db, addIncome, addExpense, addFuel, addSubcategory } = useTransport();
  const currency = db.settings.currencySymbol;

  // Tabs for Entry Type
  const [entryType, setEntryType] = useState<'income' | 'expense' | 'fuel'>(initialType || 'income');

  // Sync state if initialType changes (e.g., when clicking quick actions repeatedly)
  useEffect(() => {
    if (initialType) {
      setEntryType(initialType);
    }
  }, [initialType]);
  
  // Success state handler for custom user feedback
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  // 1. INCOME FORM STATES
  const [incVehicle, setIncVehicle] = useState<string>('');
  const [incDriver, setIncDriver] = useState<string>('');
  const [incCustomer, setIncCustomer] = useState<string>('');
  const [incFrom, setIncFrom] = useState<string>('');
  const [incTo, setIncTo] = useState<string>('');
  const [incAmount, setIncAmount] = useState<number>(0);
  const [incAdvance, setIncAdvance] = useState<number>(0);
  const [incPaymentMode, setIncPaymentMode] = useState<'Cash' | 'Bank Transfer' | 'UPI' | 'Card' | 'Cheque'>('Cash');
  const [incCategory, setIncCategory] = useState<string>('Trip Freight');
  const [incSubcategory, setIncSubcategory] = useState<string>('Full Load');
  const [incNotes, setIncNotes] = useState<string>('');

  // Auto calculate balance for income
  const incBalance = useMemo(() => {
    return Math.max(0, incAmount - incAdvance);
  }, [incAmount, incAdvance]);

  // 2. EXPENSE FORM STATES
  const [expVehicle, setExpVehicle] = useState<string>('');
  const [expDriver, setExpDriver] = useState<string>('');
  const [expCategory, setExpCategory] = useState<string>('Fuel');
  const [expSubcategory, setExpSubcategory] = useState<string>('Diesel');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expNotes, setExpNotes] = useState<string>('');
  const [expBillPhoto, setExpBillPhoto] = useState<string>('');

  // 3. FUEL FORM STATES
  const [fuelVehicle, setFuelVehicle] = useState<string>('');
  const [fuelOdometer, setFuelOdometer] = useState<number>(0);
  const [fuelPrevOdometer, setFuelPrevOdometer] = useState<number>(0);
  const [fuelQuantity, setFuelQuantity] = useState<number>(0);
  const [fuelRate, setFuelRate] = useState<number>(0);
  const [fuelStation, setFuelStation] = useState<string>('');
  const [fuelNotes, setFuelNotes] = useState<string>('');
  const [fuelType, setFuelType] = useState<'liquid' | 'gas'>('liquid');
  const [fuelUnit, setFuelUnit] = useState<'Liters' | 'Kg'>('Liters');

  // Sync unit based on selected fuel type
  useEffect(() => {
    if (fuelType === 'gas') {
      setFuelUnit('Kg');
    } else {
      setFuelUnit('Liters');
    }
  }, [fuelType]);

  // Handle dynamic custom subcategories
  const [newSubcatName, setNewSubcatName] = useState<string>('');
  const [addingSubcatFor, setAddingSubcatFor] = useState<string | null>(null);

  // Set default vehicle & driver on load
  useEffect(() => {
    if (db.vehicles.length > 0) {
      const firstVehicle = db.vehicles[0].id;
      setIncVehicle(firstVehicle);
      setExpVehicle(firstVehicle);
      setFuelVehicle(firstVehicle);
    }
    if (db.drivers.length > 0) {
      const firstDriver = db.drivers[0].id;
      setIncDriver(firstDriver);
      setExpDriver(firstDriver);
    }
  }, [db]);

  // Watch selected category changes and pick first available subcategory
  useEffect(() => {
    const cat = db.categories.find(c => c.name === incCategory && c.type === 'income');
    if (cat && cat.subcategories.length > 0) {
      setIncSubcategory(cat.subcategories[0]);
    }
  }, [incCategory, db.categories]);

  useEffect(() => {
    const cat = db.categories.find(c => c.name === expCategory && c.type === 'expense');
    if (cat && cat.subcategories.length > 0) {
      setExpSubcategory(cat.subcategories[0]);
    }
  }, [expCategory, db.categories]);

  // Filter categories lists
  const incomeCategories = useMemo(() => db.categories.filter(c => c.type === 'income'), [db.categories]);
  const expenseCategories = useMemo(() => db.categories.filter(c => c.type === 'expense'), [db.categories]);

  const activeIncomeSubcategories = useMemo(() => {
    const cat = db.categories.find(c => c.name === incCategory && c.type === 'income');
    return cat ? cat.subcategories : [];
  }, [db.categories, incCategory]);

  const activeExpenseSubcategories = useMemo(() => {
    const cat = db.categories.find(c => c.name === expCategory && c.type === 'expense');
    return cat ? cat.subcategories : [];
  }, [db.categories, expCategory]);

  // Auto calculate Mileage & Trip Costs for visual fuel log calculator
  const liveFuelCalcs = useMemo(() => {
    return calculateFuel(fuelOdometer, fuelPrevOdometer, fuelQuantity, fuelRate);
  }, [fuelOdometer, fuelPrevOdometer, fuelQuantity, fuelRate]);

  // Handle photo upload convert to base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setExpBillPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSubcatSubmit = (categoryId: string) => {
    if (!newSubcatName.trim()) return;
    addSubcategory(categoryId, newSubcatName.trim());
    
    // Auto select newly created subcategory
    if (entryType === 'income') {
      setIncSubcategory(newSubcatName.trim());
    } else if (entryType === 'expense') {
      setExpSubcategory(newSubcatName.trim());
    }

    setNewSubcatName('');
    setAddingSubcatFor(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (entryType === 'income') {
      if (!incVehicle || !incDriver || !incCustomer) {
        alert("Please assign a Vehicle, Driver, and Customer Name.");
        return;
      }
      addIncome({
        vehicleId: incVehicle,
        driverId: incDriver,
        customerName: incCustomer,
        fromLocation: incFrom || 'Base Yard',
        toLocation: incTo || 'Client Site',
        tripAmount: incAmount,
        advance: incAdvance,
        balance: incBalance,
        paymentMode: incPaymentMode,
        category: incCategory,
        subCategory: incSubcategory,
        notes: incNotes
      });
      setSuccessMsg("Income Entry Saved! Trip ledger has been updated offline.");
    } else if (entryType === 'expense') {
      if (!expVehicle || !expDriver || !expAmount) {
        alert("Please ensure Vehicle, Driver, and Expense Amount are filled.");
        return;
      }
      addExpense({
        vehicleId: expVehicle,
        driverId: expDriver,
        category: expCategory,
        subCategory: expSubcategory,
        amount: expAmount,
        notes: expNotes,
        billPhoto: expBillPhoto
      });
      setSuccessMsg("Expense Entry Saved! Outflow ledger logged in SQLite Simulator.");
    } else {
      if (!fuelVehicle || !fuelOdometer || !fuelQuantity || !fuelRate) {
        alert("Please fill out all Fuel parameters correctly.");
        return;
      }
      addFuel({
        vehicleId: fuelVehicle,
        odometerReading: fuelOdometer,
        previousOdometer: fuelPrevOdometer,
        fuelQuantity,
        fuelRate,
        fuelStation: fuelStation || 'Local Fuel Station',
        notes: fuelNotes,
        fuelType,
        fuelUnit
      });
      setSuccessMsg("Fuel Log Recorded! Automated expense generated for fuel cost.");
    }

    // Trigger beautiful success prompt
    setShowSuccess(true);
    
    // Clear inputs
    setIncCustomer('');
    setIncFrom('');
    setIncTo('');
    setIncAmount(0);
    setIncAdvance(0);
    setIncNotes('');
    
    setExpAmount(0);
    setExpNotes('');
    setExpBillPhoto('');

    setFuelOdometer(0);
    setFuelPrevOdometer(0);
    setFuelQuantity(0);
    setFuelRate(0);
    setFuelStation('');
    setFuelNotes('');
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] p-6 text-center select-none bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-sm max-w-lg mx-auto">
        <div className="p-5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full mb-6">
          <CheckCircle className="w-16 h-16" />
        </div>
        <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Record Saved Successfully!</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">
          {successMsg}
        </p>
        
        <div className="flex gap-4 w-full mt-8">
          <button
            onClick={() => setShowSuccess(false)}
            className="flex-1 px-4 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all border border-slate-100 dark:border-slate-600 cursor-pointer"
          >
            Log Another Entry
          </button>
          <button
            onClick={() => onNavigateToTab('records')}
            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            Go to Ledger
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 select-none">
      {/* Header bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
        <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white">
          Add Ledger Entry
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Automatic date and time timestamping applied.
        </p>
      </div>

      {/* Mode selectors */}
      <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <button
          onClick={() => setEntryType('income')}
          className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            entryType === 'income'
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          Trip Income
        </button>
        <button
          onClick={() => setEntryType('expense')}
          className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            entryType === 'expense'
              ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" />
          Fleet Expense
        </button>
        <button
          onClick={() => setEntryType('fuel')}
          className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            entryType === 'fuel'
              ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
          }`}
        >
          <Fuel className="w-4 h-4" />
          Fuel Entry
        </button>
      </div>

      {/* Main Entry Forms Card */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-sm rounded-3xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* A. INCOME ENTRY FORM */}
          {entryType === 'income' && (
            <>
              {/* Vehicle Select */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Vehicle</label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={incVehicle}
                      onChange={(e) => setIncVehicle(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm focus:outline-none"
                    >
                      {db.vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.number}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Driver Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Driver</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={incDriver}
                      onChange={(e) => setIncDriver(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm focus:outline-none"
                    >
                      {db.drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Customer Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Reliance, Amazon Logistics, Local Mandi"
                  value={incCustomer}
                  onChange={(e) => setIncCustomer(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm"
                  required
                />
              </div>

              {/* Locations */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> From Location
                  </label>
                  <input
                    type="text"
                    placeholder="Source city/yard..."
                    value={incFrom}
                    onChange={(e) => setIncFrom(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> To Location
                  </label>
                  <input
                    type="text"
                    placeholder="Destination city/dock..."
                    value={incTo}
                    onChange={(e) => setIncTo(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Category</label>
                  <select
                    value={incCategory}
                    onChange={(e) => setIncCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm focus:outline-none"
                  >
                    {incomeCategories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Subcategory */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Sub Category</label>
                  <div className="flex gap-2">
                    <select
                      value={incSubcategory}
                      onChange={(e) => setIncSubcategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm focus:outline-none"
                    >
                      {activeIncomeSubcategories.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                    
                    {/* Inline custom addition button */}
                    <button
                      type="button"
                      onClick={() => setAddingSubcatFor(db.categories.find(c => c.name === incCategory && c.type === 'income')?.id || null)}
                      className="p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-indigo-500 rounded-xl hover:bg-slate-100 cursor-pointer"
                      title="Add Custom Subcategory"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Inline category addition popup */}
              {addingSubcatFor && (
                <div className="p-3 bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 flex gap-2.5 items-center">
                  <input
                    type="text"
                    placeholder="New Custom Subcategory Name..."
                    value={newSubcatName}
                    onChange={(e) => setNewSubcatName(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSubcatSubmit(addingSubcatFor)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingSubcatFor(null)}
                    className="text-slate-400 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Trip Amount, Advance, Balance */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-2xl border border-slate-100/40 dark:border-slate-700/30">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Trip Amount ({currency})</span>
                  <input
                    type="number"
                    value={incAmount || ''}
                    onChange={(e) => setIncAmount(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-lg text-xs font-bold font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Advance Paid ({currency})</span>
                  <input
                    type="number"
                    value={incAdvance || ''}
                    onChange={(e) => setIncAdvance(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-lg text-xs font-bold font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Balance Left ({currency})</span>
                  <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
                    {incBalance}
                  </div>
                </div>
              </div>

              {/* Payment mode select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Payment Mode</label>
                <div className="flex flex-wrap gap-2">
                  {(['Cash', 'Bank Transfer', 'UPI', 'Card', 'Cheque'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setIncPaymentMode(mode)}
                      className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        incPaymentMode === mode
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-700 border-slate-100 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* B. EXPENSE ENTRY FORM */}
          {entryType === 'expense' && (
            <>
              {/* Vehicle Select */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Vehicle</label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={expVehicle}
                      onChange={(e) => setExpVehicle(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm focus:outline-none"
                    >
                      {db.vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.number}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Driver Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Person / Driver</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={expDriver}
                      onChange={(e) => setExpDriver(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm focus:outline-none"
                    >
                      {db.drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Expense Category</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm focus:outline-none"
                  >
                    {expenseCategories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Subcategory */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Expense Subcategory</label>
                  <div className="flex gap-2">
                    <select
                      value={expSubcategory}
                      onChange={(e) => setExpSubcategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm focus:outline-none"
                    >
                      {activeExpenseSubcategories.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                    
                    {/* Inline custom addition button */}
                    <button
                      type="button"
                      onClick={() => setAddingSubcatFor(db.categories.find(c => c.name === expCategory && c.type === 'expense')?.id || null)}
                      className="p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-indigo-500 rounded-xl hover:bg-slate-100 cursor-pointer"
                      title="Add Custom Subcategory"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Inline subcat popover */}
              {addingSubcatFor && (
                <div className="p-3 bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 flex gap-2.5 items-center">
                  <input
                    type="text"
                    placeholder="New Custom Subcategory Name..."
                    value={newSubcatName}
                    onChange={(e) => setNewSubcatName(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSubcatSubmit(addingSubcatFor)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingSubcatFor(null)}
                    className="text-slate-400 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Expense Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <CircleDollarSign className="w-4 h-4 text-indigo-500" /> Expense Amount ({currency})
                </label>
                <input
                  type="number"
                  placeholder="e.g. 4500"
                  value={expAmount || ''}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm font-bold font-mono focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Bill Photo Upload - Base64 converter */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Bill Photo (Optional)</label>
                <div className="flex items-center gap-4">
                  <label className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 border border-dashed border-slate-200 dark:border-slate-600 rounded-xl flex items-center gap-2 cursor-pointer transition-colors text-xs text-slate-600 dark:text-slate-300">
                    <Camera className="w-4 h-4 text-indigo-500" />
                    Upload Bill Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {expBillPhoto && (
                    <div className="relative w-12 h-12 rounded-lg border overflow-hidden shrink-0">
                      <img src={expBillPhoto} alt="Bill receipt" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setExpBillPhoto('')}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center text-[8px] font-bold"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* C. FUEL ENTRY FORM */}
          {entryType === 'fuel' && (
            <>
              {/* Fuel Type Switcher */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Fuel / Gas Type</label>
                <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-100/60 dark:border-slate-700 h-[42px] items-center">
                  <button
                    type="button"
                    onClick={() => setFuelType('liquid')}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer transition-all ${
                      fuelType === 'liquid'
                        ? 'bg-brand text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Liquid (Diesel / Petrol)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFuelType('gas')}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer transition-all ${
                      fuelType === 'gas'
                        ? 'bg-brand text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Gas (CNG / LPG)
                  </button>
                </div>
              </div>

              {/* Vehicle Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Select Fueling Vehicle</label>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={fuelVehicle}
                    onChange={(e) => setFuelVehicle(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm focus:outline-none"
                  >
                    {db.vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.number}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Odometer Reads */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Odometer Reading (KM)</label>
                  <input
                    type="number"
                    placeholder="e.g. 125100"
                    value={fuelOdometer || ''}
                    onChange={(e) => setFuelOdometer(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-xs font-mono"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Previous Odometer (KM)</label>
                  <input
                    type="number"
                    placeholder="e.g. 124500"
                    value={fuelPrevOdometer || ''}
                    onChange={(e) => setFuelPrevOdometer(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* Fuel Quantity & Rate */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Quantity ({fuelUnit === 'Kg' ? 'Kg' : 'Litres'})</label>
                  <input
                    type="number"
                    placeholder={fuelUnit === 'Kg' ? 'e.g. 15' : 'e.g. 145'}
                    value={fuelQuantity || ''}
                    onChange={(e) => setFuelQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-xs font-mono"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Rate (per {fuelUnit === 'Kg' ? 'Kg' : 'Litre'})</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 93.00"
                    value={fuelRate || ''}
                    onChange={(e) => setFuelRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-xs font-mono"
                    required
                  />
                </div>
              </div>

              {/* Realtime calculations display box */}
              <div className="bg-brand/5 p-4 rounded-2xl border border-brand/20 dark:border-brand/20 grid grid-cols-2 gap-3 text-[11px]">
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold block uppercase text-[9px]">Distance Travelled</span>
                  <span className="text-slate-700 dark:text-slate-200 font-bold font-mono">{liveFuelCalcs.distanceTravelled} KM</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold block uppercase text-[9px]">Fueling Total cost</span>
                  <span className="text-slate-700 dark:text-slate-200 font-bold font-mono">{currency}{liveFuelCalcs.totalCost}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold block uppercase text-[9px]">Calculated Mileage</span>
                  <span className="text-emerald-500 font-bold font-mono">{liveFuelCalcs.mileage} KM/{fuelUnit === 'Kg' ? 'Kg' : 'L'}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold block uppercase text-[9px]">Cost Per Kilometer</span>
                  <span className="text-slate-700 dark:text-slate-200 font-bold font-mono">{currency}{liveFuelCalcs.costPerKm}/KM</span>
                </div>
              </div>

              {/* Fuel Station Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Fuel Station Name</label>
                <input
                  type="text"
                  placeholder="e.g. HP Pump Panvel Expressway"
                  value={fuelStation}
                  onChange={(e) => setFuelStation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm"
                />
              </div>
            </>
          )}

          {/* Notes area */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Notes / Observations</label>
            <textarea
              placeholder="Record any special trip notes, transit remarks, helper status..."
              value={entryType === 'income' ? incNotes : entryType === 'expense' ? expNotes : fuelNotes}
              onChange={(e) => {
                if (entryType === 'income') setIncNotes(e.target.value);
                else if (entryType === 'expense') setExpNotes(e.target.value);
                else setFuelNotes(e.target.value);
              }}
              rows={2}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm resize-none"
            />
          </div>

          {/* Form Actions Submit */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => onNavigateToTab('dashboard')}
              className="flex-1 px-4 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-100 dark:border-slate-600 text-slate-600 dark:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              Save To SQLite DB
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
