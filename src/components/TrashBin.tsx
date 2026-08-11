import React, { useState, useMemo } from 'react';
import { useTransport } from '../context/TransportContext';
import { TrashItem } from '../types';
import { 
  Trash2, 
  X, 
  RotateCcw, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  Fuel, 
  Truck, 
  User, 
  Lock
} from 'lucide-react';

interface TrashBinProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrashBin: React.FC<TrashBinProps> = ({ isOpen, onClose }) => {
  const { db, restoreItem, permanentlyDeleteItem, emptyTrashBin } = useTransport();
  const currency = db.settings.currencySymbol;

  // PIN Lock authentication states
  const hasPin = db.settings.pinLock && !!db.settings.pinCode;
  const [isUnlocked, setIsUnlocked] = useState<boolean>(!hasPin);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  
  // Simple, declarative states for custom confirmation overlays
  const [showEmptyConfirm, setShowEmptyConfirm] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Reset lock state and inputs whenever the modal opens or settings change
  React.useEffect(() => {
    if (isOpen) {
      const pinActive = db.settings.pinLock && !!db.settings.pinCode;
      setIsUnlocked(!pinActive);
      setPinInput('');
      setPinError('');
    }
  }, [isOpen, db.settings.pinLock, db.settings.pinCode]);

  // UI state for search and tabs
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'transactions' | 'fleets'>('all');

  // Keypad helper
  const handleKeyClick = (num: string) => {
    setPinError('');
    if (pinInput.length < 4) {
      const nextPin = pinInput + num;
      setPinInput(nextPin);
      
      // Auto-unlock when 4 digits are typed
      if (nextPin === db.settings.pinCode) {
        setIsUnlocked(true);
        setPinInput('');
      } else if (nextPin.length === 4) {
        setPinError('Incorrect 4-Digit PIN! Try again.');
        setPinInput('');
      }
    }
  };

  const handleBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  const handleResetPinInput = () => {
    setPinInput('');
    setPinError('');
  };

  // Helper formatting for currency
  const formatValue = (amount: any) => {
    const val = Number(amount) || 0;
    const dec = db.settings.decimalPlaces !== undefined ? db.settings.decimalPlaces : 2;
    return val.toLocaleString('en-IN', {
      maximumFractionDigits: dec,
      minimumFractionDigits: dec,
    });
  };

  // Filter items in the trash bin
  const filteredItems = useMemo(() => {
    const trash = db.trashBin || [];
    
    return trash.filter(item => {
      // Tab filter
      if (activeTab === 'transactions') {
        if (!['income', 'expense', 'fuel'].includes(item.type)) return false;
      } else if (activeTab === 'fleets') {
        if (!['vehicle', 'driver'].includes(item.type)) return false;
      }

      // Search filter
      if (!searchTerm) return true;

      const term = searchTerm.toLowerCase();
      const d = item.originalData;

      if (item.type === 'income') {
        return (d.customerName || '').toLowerCase().includes(term) ||
               (d.category || '').toLowerCase().includes(term) ||
               (d.fromLocation || '').toLowerCase().includes(term) ||
               (d.toLocation || '').toLowerCase().includes(term);
      } else if (item.type === 'expense') {
        return (d.category || '').toLowerCase().includes(term) ||
               (d.subCategory || '').toLowerCase().includes(term) ||
               (d.notes || '').toLowerCase().includes(term);
      } else if (item.type === 'fuel') {
        return (d.fuelStation || '').toLowerCase().includes(term) ||
               (d.notes || '').toLowerCase().includes(term);
      } else if (item.type === 'vehicle') {
        return (d.number || '').toLowerCase().includes(term) ||
               (d.name || '').toLowerCase().includes(term) ||
               (d.type || '').toLowerCase().includes(term);
      } else if (item.type === 'driver') {
        return (d.name || '').toLowerCase().includes(term) ||
               (d.mobile || '').toLowerCase().includes(term) ||
               (d.address || '').toLowerCase().includes(term);
      }

      return false;
    });
  }, [db.trashBin, activeTab, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg h-[680px] flex flex-col border border-slate-100 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header Area */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base font-display text-slate-900 dark:text-white">
                Trash Bin Locker
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                Password protected recovery bin
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PIN VERIFICATION WALL */}
        {!isUnlocked ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 select-none bg-slate-50 dark:bg-slate-900">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-500 shadow-sm">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">
                Security PIN Required
              </h4>
              <p className="text-[11px] text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                Enter your 4-Digit Security PIN code to access and manage the trash records.
              </p>
            </div>

            {/* Circles for entered digits */}
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((idx) => (
                <div 
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                    pinInput.length > idx 
                      ? 'bg-brand border-brand scale-110 shadow-sm' 
                      : 'border-slate-300 dark:border-slate-600 bg-transparent'
                  }`}
                />
              ))}
            </div>

            {pinError ? (
              <span className="text-[11px] font-bold text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full text-center">
                {pinError}
              </span>
            ) : (
              <div className="h-5" />
            )}

            {/* Simulated Numeric Keypad Grid */}
            <div className="grid grid-cols-3 gap-x-6 gap-y-3 w-full max-w-[240px] mx-auto pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyClick(num)}
                  className="w-14 h-14 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 hover:border-brand/40 dark:hover:border-brand/40 text-xl font-extrabold font-mono transition-all active:scale-90 flex items-center justify-center cursor-pointer shadow-sm"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleResetPinInput}
                className="w-14 h-14 rounded-full text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center cursor-pointer active:scale-95 transition-all"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('0')}
                className="w-14 h-14 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 hover:border-brand/40 dark:hover:border-brand/40 text-xl font-extrabold font-mono transition-all active:scale-90 flex items-center justify-center cursor-pointer shadow-sm"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="w-14 h-14 rounded-full text-slate-500 dark:text-slate-400 hover:text-brand hover:bg-brand/10 flex items-center justify-center cursor-pointer active:scale-95 text-lg font-bold transition-all"
                title="Backspace"
              >
                ←
              </button>
            </div>
          </div>
        ) : (
          /* TRASH BIN INNER WORKINGS */
          <>
            {/* Filter Tabs & Search Panel */}
            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 space-y-3 shrink-0">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search in trash items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sub tabs switcher */}
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 py-1.5 rounded-md text-center transition-all cursor-pointer ${
                    activeTab === 'all' 
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  All Items ({db.trashBin?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`flex-1 py-1.5 rounded-md text-center transition-all cursor-pointer ${
                    activeTab === 'transactions' 
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Ledgers
                </button>
                <button
                  onClick={() => setActiveTab('fleets')}
                  className={`flex-1 py-1.5 rounded-md text-center transition-all cursor-pointer ${
                    activeTab === 'fleets' 
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Fleets/Drivers
                </button>
              </div>
            </div>

            {/* List scroll view */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {filteredItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 flex items-center justify-center">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">
                    Trash Bin is Empty
                  </h4>
                  <p className="text-[10px] text-slate-400 max-w-[180px] leading-relaxed">
                    Any deleted vehicles, drivers, income, expense, or fuel logs will be kept safe here.
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const d = item.originalData;
                  const dateFormatted = item.deletedAt ? new Date(item.deletedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A';

                  return (
                    <div 
                      key={item.id} 
                      className="p-3 bg-white dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 flex justify-between items-center shadow-xs transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        {/* Icon identifier */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          item.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' :
                          item.type === 'expense' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500' :
                          item.type === 'fuel' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' :
                          item.type === 'vehicle' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500' :
                          'bg-violet-50 dark:bg-violet-500/10 text-violet-500'
                        }`}>
                          {item.type === 'income' && <ArrowUpRight className="w-4 h-4" />}
                          {item.type === 'expense' && <ArrowDownRight className="w-4 h-4" />}
                          {item.type === 'fuel' && <Fuel className="w-4 h-4" />}
                          {item.type === 'vehicle' && <Truck className="w-4 h-4" />}
                          {item.type === 'driver' && <User className="w-4 h-4" />}
                        </div>

                        {/* Text */}
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-800 dark:text-white truncate max-w-[180px]">
                            {item.type === 'income' && (d.customerName || 'Direct Booking')}
                            {item.type === 'expense' && d.category}
                            {item.type === 'fuel' && d.fuelStation}
                            {item.type === 'vehicle' && d.number}
                            {item.type === 'driver' && d.name}
                          </h4>
                          <span className="text-[9px] text-slate-400 block truncate mt-0.5">
                            {item.type === 'income' && `${d.category} • From ${d.fromLocation || 'N/A'}`}
                            {item.type === 'expense' && `${d.subCategory || 'General'} • ${d.notes || 'No notes'}`}
                            {item.type === 'fuel' && `${d.fuelQuantity} L • ${d.notes || 'No notes'}`}
                            {item.type === 'vehicle' && `${d.type} • ${d.name}`}
                            {item.type === 'driver' && `${d.mobile || 'No mobile'}`}
                          </span>
                          <span className="text-[8px] text-slate-400 italic font-mono block mt-0.5">
                            Deleted: {dateFormatted}
                          </span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1">
                        {/* Numerical value */}
                        <div className="text-right mr-2 select-text">
                          {(item.type === 'income' || item.type === 'expense' || item.type === 'fuel') && (
                            <span className={`font-mono text-xs font-bold block ${
                              item.type === 'income' ? 'text-emerald-500' : 'text-slate-700 dark:text-slate-300'
                            }`}>
                              {item.type === 'income' ? '+' : '-'}{currency}{formatValue(item.type === 'income' ? d.tripAmount : (item.type === 'expense' ? d.amount : d.totalCost))}
                            </span>
                          )}
                          {(item.type === 'vehicle' || item.type === 'driver') && (
                            <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider block bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                              {item.type}
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              restoreItem(item.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 text-emerald-500 hover:text-emerald-600 transition-all cursor-pointer"
                            title="Restore Item"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setItemToDelete(item.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 transition-all cursor-pointer"
                            title="Permanently Delete"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer and Empty Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex justify-between items-center shrink-0">
              <button
                onClick={() => setIsUnlocked(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                title="Lock Bin with PIN passcode"
              >
                <Lock className="w-3.5 h-3.5" />
                Lock Bin
              </button>

              {db.trashBin && db.trashBin.length > 0 && (
                <button
                  onClick={() => {
                    setShowEmptyConfirm(true);
                  }}
                  className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Empty Trash Bin
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Custom Confirmation Modal Overlay for emptying trash */}
      {showEmptyConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800 dark:text-white text-base">
                Empty Trash Bin?
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-350 leading-relaxed">
                CRITICAL WARNING: Are you sure you want to completely empty the Trash Bin? This will permanently and irreversibly erase ALL deleted records.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEmptyConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  emptyTrashBin();
                  setShowEmptyConfirm(false);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal Overlay for deleting single item */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <X className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800 dark:text-white text-base">
                Permanently Delete?
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-350 leading-relaxed">
                Are you absolutely sure you want to permanently delete this item? This action is irreversible and cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  permanentlyDeleteItem(itemToDelete);
                  setItemToDelete(null);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
