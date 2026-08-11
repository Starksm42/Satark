import React, { createContext, useContext, useState, useEffect } from 'react';
import { TransportDatabase, Vehicle, Driver, IncomeEntry, ExpenseEntry, FuelEntry, AppSettings, TrashItem } from '../types';
import { INITIAL_DATABASE } from '../initialData';

interface TransportContextType {
  db: TransportDatabase;
  setDb: React.Dispatch<React.SetStateAction<TransportDatabase>>;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  editVehicle: (vehicle: Vehicle) => void;
  deleteVehicle: (id: string) => void;
  addDriver: (driver: Omit<Driver, 'id'>) => void;
  editDriver: (driver: Driver) => void;
  deleteDriver: (id: string) => void;
  addIncome: (income: Omit<IncomeEntry, 'id' | 'date' | 'time'>) => void;
  editIncome: (income: IncomeEntry) => void;
  deleteIncome: (id: string) => void;
  addExpense: (expense: Omit<ExpenseEntry, 'id' | 'date' | 'time'>) => void;
  editExpense: (expense: ExpenseEntry) => void;
  deleteExpense: (id: string) => void;
  addFuel: (fuel: Omit<FuelEntry, 'id' | 'date' | 'time' | 'distanceTravelled' | 'totalCost' | 'mileage' | 'costPerKm'> & { date?: string; time?: string }) => void;
  editFuel: (fuel: FuelEntry) => void;
  deleteFuel: (id: string) => void;
  addSubcategory: (categoryId: string, subCategoryName: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetDatabase: (skipConfirm?: boolean) => void;
  isLocked: boolean;
  verifyPIN: (pin: string) => boolean;
  lockApp: () => void;
  unlockApp: () => void;
  setPinCode: (pin: string) => void;
  restoreItem: (trashId: string) => void;
  permanentlyDeleteItem: (trashId: string) => void;
  emptyTrashBin: () => void;
}

const TransportContext = createContext<TransportContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'transport_business_db_v1';

export const TransportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<TransportDatabase>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure settings exist
        if (!parsed.settings) parsed.settings = INITIAL_DATABASE.settings;
        if (!parsed.trashBin) parsed.trashBin = [];
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved transport database. Reloading defaults.");
      }
    }
    return INITIAL_DATABASE;
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    // If PIN lock was active on last save, prompt for PIN
    return db.settings.pinLock && !!db.settings.pinCode;
  });

const THEME_COLORS = {
  indigo: {
    primary: '#4f46e5',
    hover: '#4338ca',
    light: '#e0e7ff',
    lightDarker: '#c7d2fe',
    lightText: '#4f46e5',
    ring: 'rgba(79, 70, 229, 0.2)',
  },
  emerald: {
    primary: '#10b981',
    hover: '#059669',
    light: '#d1fae5',
    lightDarker: '#a7f3d0',
    lightText: '#047857',
    ring: 'rgba(16, 185, 129, 0.2)',
  },
  blue: {
    primary: '#3b82f6',
    hover: '#2563eb',
    light: '#dbeafe',
    lightDarker: '#bfdbfe',
    lightText: '#1d4ed8',
    ring: 'rgba(59, 130, 246, 0.2)',
  },
  rose: {
    primary: '#f43f5e',
    hover: '#e11d48',
    light: '#ffe4e6',
    lightDarker: '#fecdd3',
    lightText: '#be123c',
    ring: 'rgba(244, 63, 94, 0.2)',
  },
  amber: {
    primary: '#f59e0b',
    hover: '#d97706',
    light: '#fef3c7',
    lightDarker: '#fde68a',
    lightText: '#b45309',
    ring: 'rgba(245, 158, 11, 0.2)',
  },
  violet: {
    primary: '#8b5cf6',
    hover: '#7c3aed',
    light: '#ede9fe',
    lightDarker: '#ddd6fe',
    lightText: '#6d28d9',
    ring: 'rgba(139, 92, 246, 0.2)',
  }
};

  // Keep dark/light theme in sync with classlist
  useEffect(() => {
    if (db.settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [db.settings.theme]);

  // Keep color theme CSS variables in sync
  useEffect(() => {
    const themeColor = db.settings.colorTheme || 'indigo';
    const colors = THEME_COLORS[themeColor] || THEME_COLORS.indigo;
    
    const root = document.documentElement;
    root.style.setProperty('--color-brand', colors.primary);
    root.style.setProperty('--color-brand-hover', colors.hover);
    root.style.setProperty('--color-brand-light', colors.light);
    root.style.setProperty('--color-brand-light-darker', colors.lightDarker);
    root.style.setProperty('--color-brand-light-text', colors.lightText);
    root.style.setProperty('--color-brand-ring', colors.ring);
  }, [db.settings.colorTheme]);

  // Auto save to localStorage whenever DB changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
  }, [db]);

  const addVehicle = (vehicle: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: `v-${Date.now()}`
    };
    setDb(prev => ({
      ...prev,
      vehicles: [newVehicle, ...prev.vehicles]
    }));
  };

  const editVehicle = (updated: Vehicle) => {
    setDb(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => v.id === updated.id ? updated : v)
    }));
  };

  const deleteVehicle = (id: string) => {
    setDb(prev => {
      const itemToDelete = prev.vehicles.find(v => v.id === id);
      const newTrash: TrashItem[] = itemToDelete ? [
        {
          id: `trash-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          type: 'vehicle',
          deletedAt: new Date().toISOString(),
          originalData: itemToDelete
        },
        ...(prev.trashBin || [])
      ] : (prev.trashBin || []);

      return {
        ...prev,
        vehicles: prev.vehicles.filter(v => v.id !== id),
        drivers: prev.drivers.map(d => d.assignedVehicleId === id ? { ...d, assignedVehicleId: 'none' } : d),
        trashBin: newTrash
      };
    });
  };

  const addDriver = (driver: Omit<Driver, 'id'>) => {
    const newDriver: Driver = {
      ...driver,
      id: `d-${Date.now()}`
    };
    setDb(prev => ({
      ...prev,
      drivers: [newDriver, ...prev.drivers]
    }));
  };

  const editDriver = (updated: Driver) => {
    setDb(prev => ({
      ...prev,
      drivers: prev.drivers.map(d => d.id === updated.id ? updated : d)
    }));
  };

  const deleteDriver = (id: string) => {
    setDb(prev => {
      const itemToDelete = prev.drivers.find(d => d.id === id);
      const newTrash: TrashItem[] = itemToDelete ? [
        {
          id: `trash-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          type: 'driver',
          deletedAt: new Date().toISOString(),
          originalData: itemToDelete
        },
        ...(prev.trashBin || [])
      ] : (prev.trashBin || []);

      return {
        ...prev,
        drivers: prev.drivers.filter(d => d.id !== id),
        trashBin: newTrash
      };
    });
  };

  const addIncome = (income: Omit<IncomeEntry, 'id' | 'date' | 'time'>) => {
    const now = new Date();
    const newIncome: IncomeEntry = {
      ...income,
      id: `inc-${Date.now()}`,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
    };
    setDb(prev => ({
      ...prev,
      income: [newIncome, ...prev.income]
    }));
  };

  const editIncome = (updated: IncomeEntry) => {
    setDb(prev => ({
      ...prev,
      income: prev.income.map(i => i.id === updated.id ? updated : i)
    }));
  };

  const deleteIncome = (id: string) => {
    setDb(prev => {
      const itemToDelete = prev.income.find(i => i.id === id);
      const newTrash: TrashItem[] = itemToDelete ? [
        {
          id: `trash-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          type: 'income',
          deletedAt: new Date().toISOString(),
          originalData: itemToDelete
        },
        ...(prev.trashBin || [])
      ] : (prev.trashBin || []);

      return {
        ...prev,
        income: prev.income.filter(i => i.id !== id),
        trashBin: newTrash
      };
    });
  };

  const addExpense = (expense: Omit<ExpenseEntry, 'id' | 'date' | 'time'>) => {
    const now = new Date();
    const newExpense: ExpenseEntry = {
      ...expense,
      id: `exp-${Date.now()}`,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
    };
    setDb(prev => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses]
    }));
  };

  const editExpense = (updated: ExpenseEntry) => {
    setDb(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === updated.id ? updated : e)
    }));
  };

  const deleteExpense = (id: string) => {
    setDb(prev => {
      const itemToDelete = prev.expenses.find(e => e.id === id);
      const newTrash: TrashItem[] = itemToDelete ? [
        {
          id: `trash-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          type: 'expense',
          deletedAt: new Date().toISOString(),
          originalData: itemToDelete
        },
        ...(prev.trashBin || [])
      ] : (prev.trashBin || []);

      return {
        ...prev,
        expenses: prev.expenses.filter(e => e.id !== id),
        trashBin: newTrash
      };
    });
  };

  const addFuel = (fuel: Omit<FuelEntry, 'id' | 'date' | 'time' | 'distanceTravelled' | 'totalCost' | 'mileage' | 'costPerKm'> & { date?: string; time?: string }) => {
    const now = new Date();
    const distance = Math.max(0, fuel.odometerReading - fuel.previousOdometer);
    const totalCost = fuel.fuelQuantity * fuel.fuelRate;
    const mileage = fuel.fuelQuantity > 0 ? Number((distance / fuel.fuelQuantity).toFixed(2)) : 0;
    const costPerKm = distance > 0 ? Number((totalCost / distance).toFixed(2)) : 0;

    const newFuel: FuelEntry = {
      ...fuel,
      id: `fuel-${Date.now()}`,
      date: fuel.date || now.toISOString().split('T')[0],
      time: fuel.time || now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      distanceTravelled: distance,
      totalCost,
      mileage,
      costPerKm
    };

    setDb(prev => {
      // Create fuel record
      const updatedFuel = [newFuel, ...prev.fuelRecords];
      
      const unitSym = fuel.fuelUnit || 'Liters';
      const unitLabel = unitSym === 'Kg' ? 'Kg' : 'L';
      const subCategoryLabel = fuel.fuelType === 'gas' ? 'CNG' : 'Diesel';

      // Automatically register a fuel expense in the Expenses table as requested
      const automaticExpense: ExpenseEntry = {
        id: `exp-fuel-${Date.now()}`,
        date: newFuel.date,
        time: newFuel.time,
        vehicleId: fuel.vehicleId,
        driverId: 'none', // Will assign default driver if available or 'none'
        category: 'Fuel',
        subCategory: subCategoryLabel,
        amount: totalCost,
        notes: `Automatic fuel expense: ${fuel.fuelQuantity} ${unitLabel} @ ${fuel.fuelRate}/${db.settings.currencySymbol}. Station: ${fuel.fuelStation || 'N/A'}`
      };

      return {
        ...prev,
        fuelRecords: updatedFuel,
        expenses: [automaticExpense, ...prev.expenses]
      };
    });
  };

  const editFuel = (updated: FuelEntry) => {
    const distance = Math.max(0, updated.odometerReading - updated.previousOdometer);
    const totalCost = updated.fuelQuantity * updated.fuelRate;
    const mileage = updated.fuelQuantity > 0 ? Number((distance / updated.fuelQuantity).toFixed(2)) : 0;
    const costPerKm = distance > 0 ? Number((totalCost / distance).toFixed(2)) : 0;

    const updatedWithCalcs = {
      ...updated,
      distanceTravelled: distance,
      totalCost,
      mileage,
      costPerKm
    };

    setDb(prev => ({
      ...prev,
      fuelRecords: prev.fuelRecords.map(f => f.id === updated.id ? updatedWithCalcs : f)
    }));
  };

  const deleteFuel = (id: string) => {
    setDb(prev => {
      const itemToDelete = prev.fuelRecords.find(f => f.id === id);
      const newTrash: TrashItem[] = itemToDelete ? [
        {
          id: `trash-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          type: 'fuel',
          deletedAt: new Date().toISOString(),
          originalData: itemToDelete
        },
        ...(prev.trashBin || [])
      ] : (prev.trashBin || []);

      return {
        ...prev,
        fuelRecords: prev.fuelRecords.filter(f => f.id !== id),
        trashBin: newTrash
      };
    });
  };

  const restoreItem = (trashId: string) => {
    setDb(prev => {
      const itemToRestore = (prev.trashBin || []).find(t => t.id === trashId);
      if (!itemToRestore) return prev;

      const updatedTrashBin = (prev.trashBin || []).filter(t => t.id !== trashId);
      const { type, originalData } = itemToRestore;

      const updatedDb = {
        ...prev,
        trashBin: updatedTrashBin
      };

      if (type === 'income') {
        updatedDb.income = [originalData, ...prev.income];
      } else if (type === 'expense') {
        updatedDb.expenses = [originalData, ...prev.expenses];
      } else if (type === 'fuel') {
        updatedDb.fuelRecords = [originalData, ...prev.fuelRecords];
      } else if (type === 'vehicle') {
        updatedDb.vehicles = [originalData, ...prev.vehicles];
      } else if (type === 'driver') {
        updatedDb.drivers = [originalData, ...prev.drivers];
      }

      return updatedDb;
    });
  };

  const permanentlyDeleteItem = (trashId: string) => {
    setDb(prev => ({
      ...prev,
      trashBin: (prev.trashBin || []).filter(t => t.id !== trashId)
    }));
  };

  const emptyTrashBin = () => {
    setDb(prev => ({
      ...prev,
      trashBin: []
    }));
  };

  const addSubcategory = (categoryId: string, subCategoryName: string) => {
    setDb(prev => ({
      ...prev,
      categories: prev.categories.map(cat => {
        if (cat.id === categoryId) {
          if (cat.subcategories.includes(subCategoryName)) return cat;
          return {
            ...cat,
            subcategories: [...cat.subcategories, subCategoryName]
          };
        }
        return cat;
      })
    }));
  };

  const updateSettings = (updated: Partial<AppSettings>) => {
    setDb(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...updated
      }
    }));
  };

  const resetDatabase = (skipConfirm: boolean = false) => {
    if (skipConfirm || window.confirm("Are you sure you want to RESET the local database? This deletes all custom entries!")) {
      const freshDb = JSON.parse(JSON.stringify(INITIAL_DATABASE));
      setDb(freshDb);
      setIsLocked(false);
    }
  };

  const verifyPIN = (pin: string): boolean => {
    if (pin === db.settings.pinCode) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const lockApp = () => {
    if (db.settings.pinLock && db.settings.pinCode) {
      setIsLocked(true);
    }
  };

  const unlockApp = () => {
    setIsLocked(false);
  };

  const setPinCode = (pin: string) => {
    updateSettings({ pinCode: pin, pinLock: true });
    setIsLocked(true);
  };

  return (
    <TransportContext.Provider value={{
      db,
      setDb,
      addVehicle,
      editVehicle,
      deleteVehicle,
      addDriver,
      editDriver,
      deleteDriver,
      addIncome,
      editIncome,
      deleteIncome,
      addExpense,
      editExpense,
      deleteExpense,
      addFuel,
      editFuel,
      deleteFuel,
      addSubcategory,
      updateSettings,
      resetDatabase,
      isLocked,
      verifyPIN,
      lockApp,
      unlockApp,
      setPinCode,
      restoreItem,
      permanentlyDeleteItem,
      emptyTrashBin
    }}>
      {children}
    </TransportContext.Provider>
  );
};

export const useTransport = () => {
  const context = useContext(TransportContext);
  if (!context) throw new Error('useTransport must be used within a TransportProvider');
  return context;
};
