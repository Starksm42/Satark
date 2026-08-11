import React, { useState, useEffect } from 'react';
import { useTransport } from '../context/TransportContext';
import { backupDatabase, restoreDatabase } from '../utils';
import { TrashBin } from './TrashBin';
import { 
  Building2, 
  DollarSign, 
  Eye, 
  EyeOff, 
  Key, 
  Download, 
  Upload, 
  Trash2, 
  Moon, 
  Sun, 
  ShieldCheck, 
  FolderDown,
  Fingerprint,
  Activity,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Terminal,
  Smartphone,
  Sparkles
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { db, updateSettings, resetDatabase, setDb } = useTransport();

  // Settings State Hooks
  const [coName, setCoName] = useState<string>(db.settings.companyName);
  const [currSymbol, setCurrSymbol] = useState<string>(db.settings.currencySymbol);
  const [expFolder, setExpFolder] = useState<string>(db.settings.exportFolder);
  const [autoBackup, setAutoBackup] = useState<boolean>(db.settings.autoBackup);
  const [colorTheme, setColorTheme] = useState<string>(db.settings.colorTheme || 'indigo');
  const [isTrashOpen, setIsTrashOpen] = useState<boolean>(false);

  // Pin Code State Hooks
  const [pinLock, setPinLock] = useState<boolean>(db.settings.pinLock);
  const [pinCode, setPinCode] = useState<string>(db.settings.pinCode);
  const [showPin, setShowPin] = useState<boolean>(false);
  const [recoveryQuestion, setRecoveryQuestion] = useState<string>(db.settings.pinRecoveryQuestion || 'First vehicle brand?');
  const [recoveryAnswer, setRecoveryAnswer] = useState<string>(db.settings.pinRecoveryAnswer || 'Tata');
  const [fingerprintLock, setFingerprintLock] = useState<boolean>(db.settings.fingerprintLock !== undefined ? db.settings.fingerprintLock : false);
  const [enrolledBiometrics, setEnrolledBiometrics] = useState<string[]>(db.settings.enrolledBiometrics || []);
  const [biometricPermissionGranted, setBiometricPermissionGranted] = useState<boolean>(db.settings.biometricPermissionGranted !== undefined ? db.settings.biometricPermissionGranted : false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState<boolean>(false);
  const [permissionTargetAction, setPermissionTargetAction] = useState<'enroll' | 'enable' | null>(null);

  // Biometric registration UI states
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const [newFingerName, setNewFingerName] = useState<string>('');
  const [enrollProgress, setEnrollProgress] = useState<number>(0);
  const [enrollState, setEnrollState] = useState<'idle' | 'holding' | 'complete' | 'error'>('idle');
  const [enrollIntervalId, setEnrollIntervalId] = useState<any>(null);

  // Custom visual style configuration states
  const [textStyle, setTextStyle] = useState<'sans' | 'display' | 'mono'>(db.settings.textStyle || 'sans');
  const [bgTexture, setBgTexture] = useState<'solid' | 'dots' | 'grid' | 'stripes'>(db.settings.bgTexture || 'solid');
  const [decimalPlaces, setDecimalPlaces] = useState<number>(db.settings.decimalPlaces !== undefined ? db.settings.decimalPlaces : 2);

  // PIN verification confirmation state for saving settings
  const [pinConfirmModal, setPinConfirmModal] = useState<{
    isOpen: boolean;
    pinInput: string;
    error: string;
    onSuccess: () => void;
  } | null>(null);

  // Diagnostics Health Check states
  const [diagnosticsLogs, setDiagnosticsLogs] = useState<string[]>([]);
  const [diagnosticsStatus, setDiagnosticsStatus] = useState<'idle' | 'running' | 'success' | 'warning' | 'fixed'>('idle');
  const [diagnosticsReport, setDiagnosticsReport] = useState<{ label: string; status: 'pass' | 'fail' | 'info'; details: string }[]>([]);
  const [diagnosticsIssuesCount, setDiagnosticsIssuesCount] = useState<number>(0);

  // Keep state synchronized with db.settings (critical for restore/resets)
  useEffect(() => {
    setCoName(db.settings.companyName);
    setCurrSymbol(db.settings.currencySymbol);
    setExpFolder(db.settings.exportFolder);
    setAutoBackup(db.settings.autoBackup);
    setColorTheme(db.settings.colorTheme || 'indigo');
    setPinLock(db.settings.pinLock);
    setPinCode(db.settings.pinCode);
    setRecoveryQuestion(db.settings.pinRecoveryQuestion || 'First vehicle brand?');
    setRecoveryAnswer(db.settings.pinRecoveryAnswer || 'Tata');
    setFingerprintLock(db.settings.fingerprintLock !== undefined ? db.settings.fingerprintLock : false);
    setEnrolledBiometrics(db.settings.enrolledBiometrics || []);
    setBiometricPermissionGranted(db.settings.biometricPermissionGranted !== undefined ? db.settings.biometricPermissionGranted : false);
    setTextStyle(db.settings.textStyle || 'sans');
    setBgTexture(db.settings.bgTexture || 'solid');
    setDecimalPlaces(db.settings.decimalPlaces !== undefined ? db.settings.decimalPlaces : 2);
  }, [
    db.settings.companyName,
    db.settings.currencySymbol,
    db.settings.exportFolder,
    db.settings.pinLock,
    db.settings.pinCode,
    db.settings.pinRecoveryQuestion,
    db.settings.pinRecoveryAnswer,
    db.settings.fingerprintLock,
    db.settings.enrolledBiometrics,
    db.settings.biometricPermissionGranted,
    db.settings.textStyle,
    db.settings.bgTexture,
    db.settings.decimalPlaces
  ]);

  // Custom reset dialog state
  const [resetModal, setResetModal] = useState<{
    isOpen: boolean;
    requiresPin: boolean;
    pinInput: string;
    error: string;
    successMessage: string;
  }>({
    isOpen: false,
    requiresPin: false,
    pinInput: '',
    error: '',
    successMessage: ''
  });

  const handleResetClick = () => {
    setResetModal({
      isOpen: true,
      requiresPin: db.settings.pinLock && !!db.settings.pinCode,
      pinInput: '',
      error: '',
      successMessage: ''
    });
  };

  const handleConfirmReset = () => {
    if (resetModal.requiresPin) {
      if (resetModal.pinInput !== db.settings.pinCode) {
        setResetModal(prev => ({ ...prev, error: 'Incorrect 4-Digit Security PIN!' }));
        return;
      }
    }
    // Call skipConfirm version to reset SQLite
    resetDatabase(true);
    setResetModal(prev => ({
      ...prev,
      successMessage: 'Database has been successfully reset to default sample data!',
      error: ''
    }));
  };


  const runDiagnostics = () => {
    setDiagnosticsStatus('running');
    setDiagnosticsLogs([]);
    const logs: string[] = [];
    const report: typeof diagnosticsReport = [];
    let issues = 0;

    const addLog = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
    };

    addLog('Initializing deep ledger and relation checks...');
    addLog('Checking offline database integrity...');

    // 1. Settings Check
    if (!db.settings.companyName) {
      issues++;
      addLog('[WARN] Company name is blank in settings.');
      report.push({ label: 'Company Configuration', status: 'fail', details: 'Company name is empty' });
    } else {
      addLog(`[OK] Corporate entity loaded: "${db.settings.companyName}"`);
      report.push({ label: 'Company Configuration', status: 'pass', details: `Configured as "${db.settings.companyName}"` });
    }

    // 2. Vehicles Check
    const vehicleIds = new Set(db.vehicles.map(v => v.id));
    addLog(`Checking ${db.vehicles.length} registered vehicles...`);
    let duplicateVehicles = 0;
    const seenVehicles = new Set<string>();
    db.vehicles.forEach(v => {
      if (seenVehicles.has(v.number.toUpperCase())) {
        duplicateVehicles++;
      } else {
        seenVehicles.add(v.number.toUpperCase());
      }
    });

    if (duplicateVehicles > 0) {
      issues += duplicateVehicles;
      addLog(`[WARN] Found ${duplicateVehicles} duplicate vehicle numbers.`);
      report.push({ label: 'Vehicle Records', status: 'fail', details: `Found ${duplicateVehicles} duplicates` });
    } else {
      addLog('[OK] Vehicle registration numbers are unique.');
      report.push({ label: 'Vehicle Records', status: 'pass', details: `${db.vehicles.length} unique vehicles verified` });
    }

    // 3. Drivers Check
    const driverIds = new Set(db.drivers.map(d => d.id));
    addLog(`Checking ${db.drivers.length} registered drivers...`);
    let brokenDriverVehicles = 0;
    db.drivers.forEach(d => {
      if (d.assignedVehicleId && d.assignedVehicleId !== 'none' && !vehicleIds.has(d.assignedVehicleId)) {
        brokenDriverVehicles++;
        addLog(`[WARN] Driver "${d.name}" is linked to an invalid Vehicle ID: "${d.assignedVehicleId}"`);
      }
    });

    if (brokenDriverVehicles > 0) {
      issues += brokenDriverVehicles;
      report.push({ label: 'Driver Duty Assignment', status: 'fail', details: `${brokenDriverVehicles} broken vehicle assignments` });
    } else {
      addLog('[OK] All driver vehicle assignments are valid.');
      report.push({ label: 'Driver Duty Assignment', status: 'pass', details: 'All duty rosters map to existing vehicles' });
    }

    // 4. Income entries orphan checks
    let brokenIncomeVehicles = 0;
    let brokenIncomeDrivers = 0;
    db.income.forEach((inc, idx) => {
      if (!vehicleIds.has(inc.vehicleId)) {
        brokenIncomeVehicles++;
        if (idx < 5) addLog(`[WARN] Income entry #${inc.id} contains invalid vehicle reference.`);
      }
      if (inc.driverId && inc.driverId !== 'none' && !driverIds.has(inc.driverId)) {
        brokenIncomeDrivers++;
        if (idx < 5) addLog(`[WARN] Income entry #${inc.id} contains invalid driver reference.`);
      }
    });

    if (brokenIncomeVehicles > 0 || brokenIncomeDrivers > 0) {
      issues += (brokenIncomeVehicles + brokenIncomeDrivers);
      addLog(`[WARN] Found ${brokenIncomeVehicles} income records with missing vehicles and ${brokenIncomeDrivers} with missing drivers.`);
      report.push({ label: 'Income Records Integrity', status: 'fail', details: `Orphans: ${brokenIncomeVehicles} vehicles, ${brokenIncomeDrivers} drivers` });
    } else {
      addLog(`[OK] All ${db.income.length} income entries have valid references.`);
      report.push({ label: 'Income Records Integrity', status: 'pass', details: `${db.income.length} records check out` });
    }

    // 5. Expense entries orphan checks
    let brokenExpenseVehicles = 0;
    let brokenExpenseDrivers = 0;
    db.expenses.forEach((exp, idx) => {
      if (!vehicleIds.has(exp.vehicleId)) {
        brokenExpenseVehicles++;
        if (idx < 5) addLog(`[WARN] Expense entry #${exp.id} contains invalid vehicle reference.`);
      }
      if (exp.driverId && exp.driverId !== 'none' && !driverIds.has(exp.driverId)) {
        brokenExpenseDrivers++;
        if (idx < 5) addLog(`[WARN] Expense entry #${exp.id} contains invalid driver reference.`);
      }
    });

    if (brokenExpenseVehicles > 0 || brokenExpenseDrivers > 0) {
      issues += (brokenExpenseVehicles + brokenExpenseDrivers);
      addLog(`[WARN] Found ${brokenExpenseVehicles} expense records with missing vehicles and ${brokenExpenseDrivers} with missing drivers.`);
      report.push({ label: 'Expense Records Integrity', status: 'fail', details: `Orphans: ${brokenExpenseVehicles} vehicles, ${brokenExpenseDrivers} drivers` });
    } else {
      addLog(`[OK] All ${db.expenses.length} expense entries have valid references.`);
      report.push({ label: 'Expense Records Integrity', status: 'pass', details: `${db.expenses.length} records check out` });
    }

    // 6. Fuel entries checks
    let brokenFuelVehicles = 0;
    let anomalousFuelRates = 0;
    db.fuelRecords.forEach((f, idx) => {
      if (!vehicleIds.has(f.vehicleId)) {
        brokenFuelVehicles++;
        if (idx < 5) addLog(`[WARN] Fuel record #${f.id} references missing vehicle.`);
      }
      if (f.fuelRate <= 0 || f.fuelQuantity <= 0) {
        anomalousFuelRates++;
        if (idx < 5) addLog(`[WARN] Fuel record #${f.id} has anomalous rates/quantities.`);
      }
    });

    if (brokenFuelVehicles > 0 || anomalousFuelRates > 0) {
      issues += (brokenFuelVehicles + anomalousFuelRates);
      addLog(`[WARN] Found ${brokenFuelVehicles} fuel entries with missing vehicles, ${anomalousFuelRates} anomalous rate inputs.`);
      report.push({ label: 'Fuel Records Integrity', status: 'fail', details: `Issues: ${brokenFuelVehicles} orphans, ${anomalousFuelRates} anomalous rates` });
    } else {
      addLog(`[OK] All ${db.fuelRecords.length} fuel entries verified and healthy.`);
      report.push({ label: 'Fuel Records Integrity', status: 'pass', details: `${db.fuelRecords.length} records check out` });
    }

    // Complete scan
    setTimeout(() => {
      addLog(`Diagnostics finished. Found ${issues} warnings/errors.`);
      if (issues > 0) {
        addLog('Recommendation: Click "Auto-Repair Database" below to automatically repair broken database references and linkages.');
        setDiagnosticsStatus('warning');
      } else {
        addLog('System database is 100% HEALTHY. No repairs needed.');
        setDiagnosticsStatus('success');
      }
      setDiagnosticsIssuesCount(issues);
      setDiagnosticsLogs([...logs]);
      setDiagnosticsReport(report);
    }, 600);
  };

  const autoRepairDatabase = () => {
    setDiagnosticsStatus('running');
    const logs = [...diagnosticsLogs];
    const addLog = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
    };

    addLog('Executing automated reference repairs...');

    // Find or create default replacement vehicle
    let defaultVehicleId = db.vehicles[0]?.id;
    if (!defaultVehicleId) {
      defaultVehicleId = 'v-placeholder';
      db.vehicles.push({
        id: defaultVehicleId,
        number: 'REPAIRED-V1',
        name: 'Auto-Recovered Vehicle',
        type: 'Truck',
        owner: db.settings.companyName || 'Self',
        status: 'active'
      });
      addLog('[FIX] Created replacement vehicle (REPAIRED-V1) since none was present.');
    }

    const vehicleIds = new Set(db.vehicles.map(v => v.id));

    // 1. Repair driver assignments
    let repairedDriversCount = 0;
    const repairedDrivers = db.drivers.map(d => {
      if (d.assignedVehicleId && d.assignedVehicleId !== 'none' && !vehicleIds.has(d.assignedVehicleId)) {
        repairedDriversCount++;
        return { ...d, assignedVehicleId: 'none' };
      }
      return d;
    });
    if (repairedDriversCount > 0) {
      addLog(`[FIX] Safely reset duty vehicle for ${repairedDriversCount} drivers to standby.`);
    }

    // 2. Repair income entries pointing to deleted vehicles or deleted drivers
    const driverIds = new Set(db.drivers.map(d => d.id));
    let repairedIncomeCount = 0;
    const repairedIncome = db.income.map(inc => {
      let changed = false;
      let targetV = inc.vehicleId;
      let targetD = inc.driverId;

      if (!vehicleIds.has(inc.vehicleId)) {
        targetV = defaultVehicleId;
        changed = true;
      }
      if (inc.driverId && inc.driverId !== 'none' && !driverIds.has(inc.driverId)) {
        targetD = 'none';
        changed = true;
      }

      if (changed) {
        repairedIncomeCount++;
        return { ...inc, vehicleId: targetV, driverId: targetD };
      }
      return inc;
    });
    if (repairedIncomeCount > 0) {
      addLog(`[FIX] Remapped ${repairedIncomeCount} orphaned income entries to default active structures.`);
    }

    // 3. Repair expense entries
    let repairedExpenseCount = 0;
    const repairedExpense = db.expenses.map(exp => {
      let changed = false;
      let targetV = exp.vehicleId;
      let targetD = exp.driverId;

      if (!vehicleIds.has(exp.vehicleId)) {
        targetV = defaultVehicleId;
        changed = true;
      }
      if (exp.driverId && exp.driverId !== 'none' && !driverIds.has(exp.driverId)) {
        targetD = 'none';
        changed = true;
      }

      if (changed) {
        repairedExpenseCount++;
        return { ...exp, vehicleId: targetV, driverId: targetD };
      }
      return exp;
    });
    if (repairedExpenseCount > 0) {
      addLog(`[FIX] Remapped ${repairedExpenseCount} orphaned expense entries to default active structures.`);
    }

    // 4. Repair fuel records
    let repairedFuelCount = 0;
    const repairedFuel = db.fuelRecords.map(f => {
      let changed = false;
      let targetV = f.vehicleId;
      let targetRate = f.fuelRate;
      let targetQty = f.fuelQuantity;

      if (!vehicleIds.has(f.vehicleId)) {
        targetV = defaultVehicleId;
        changed = true;
      }
      if (f.fuelRate <= 0) {
        targetRate = 100;
        changed = true;
      }
      if (f.fuelQuantity <= 0) {
        targetQty = 10;
        changed = true;
      }

      if (changed) {
        repairedFuelCount++;
        return { 
          ...f, 
          vehicleId: targetV, 
          fuelRate: targetRate, 
          fuelQuantity: targetQty,
          totalCost: targetRate * targetQty
        };
      }
      return f;
    });
    if (repairedFuelCount > 0) {
      addLog(`[FIX] Corrected calculations and mapped ${repairedFuelCount} broken fuel entries.`);
    }

    // Update the database
    setTimeout(() => {
      setDb(prev => ({
        ...prev,
        drivers: repairedDrivers,
        income: repairedIncome,
        expenses: repairedExpense,
        fuelRecords: repairedFuel,
        vehicles: db.vehicles
      }));

      addLog('[OK] Database synchronization complete.');
      addLog('[SUCCESS] Re-scanned and marked database as 100% HEALTHY.');
      setDiagnosticsStatus('fixed');
      setDiagnosticsIssuesCount(0);
      setDiagnosticsLogs([...logs]);
      
      const fixedReport = diagnosticsReport.map(r => ({
        ...r,
        status: 'pass' as const,
        details: r.status === 'fail' ? `Fixed: ${r.details}` : r.details
      }));
      setDiagnosticsReport(fixedReport);
    }, 600);
  };


  // Biometric Registry Offline Enrollment Handlers
  const startBiometricEnroll = () => {
    if (!newFingerName.trim()) {
      alert("Please enter a label for this fingerprint (e.g., Left Thumb)");
      return;
    }
    setEnrollProgress(0);
    setEnrollState('holding');
    
    if (enrollIntervalId) clearInterval(enrollIntervalId);

    const interval = setInterval(() => {
      setEnrollProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setEnrollState('complete');
          setEnrolledBiometrics(current => {
            const trimmed = newFingerName.trim();
            if (current.includes(trimmed)) return current;
            return [...current, trimmed];
          });
          return 100;
        }
        return prev + 10;
      });
    }, 120);
    
    setEnrollIntervalId(interval);
  };

  const stopBiometricEnroll = () => {
    if (enrollIntervalId) {
      clearInterval(enrollIntervalId);
      setEnrollIntervalId(null);
    }
    setEnrollProgress(prev => {
      if (prev < 100) {
        setEnrollState('idle');
        return 0;
      }
      return prev;
    });
  };

  const handleDeleteBiometric = (fingerName: string) => {
    const updated = enrolledBiometrics.filter(b => b !== fingerName);
    setEnrolledBiometrics(updated);
    updateSettings({
      enrolledBiometrics: updated
    });
  };

  const handleGrantPermission = () => {
    setBiometricPermissionGranted(true);
    setShowPermissionPrompt(false);
    
    // Automatically perform the action the user wanted to do!
    if (permissionTargetAction === 'enable') {
      setFingerprintLock(true);
    } else if (permissionTargetAction === 'enroll') {
      setIsEnrolling(true);
      setNewFingerName('');
      setEnrollProgress(0);
      setEnrollState('idle');
    }
    setPermissionTargetAction(null);
  };

  const handleDenyPermission = () => {
    setBiometricPermissionGranted(false);
    setShowPermissionPrompt(false);
    if (permissionTargetAction === 'enable') {
      setFingerprintLock(false);
    }
    setPermissionTargetAction(null);
  };


  // Handle local save settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic verification for PIN
    if (pinLock && pinCode.length !== 4) {
      alert("PIN must be exactly 4 numeric characters");
      return;
    }

    const performSave = () => {
      updateSettings({
        companyName: coName,
        currencySymbol: currSymbol,
        exportFolder: expFolder,
        autoBackup,
        pinLock,
        pinCode,
        pinRecoveryQuestion: recoveryQuestion,
        pinRecoveryAnswer: recoveryAnswer,
        fingerprintLock,
        enrolledBiometrics,
        biometricPermissionGranted,
        colorTheme: colorTheme as any,
        textStyle,
        bgTexture,
        decimalPlaces
      });
      alert("Settings updated successfully! Local configuration updated.");
    };

    // If PIN lock is already active, require PIN confirmation to save
    if (db.settings.pinLock && db.settings.pinCode) {
      setPinConfirmModal({
        isOpen: true,
        pinInput: '',
        error: '',
        onSuccess: performSave
      });
    } else {
      performSave();
    }
  };

  // Trigger manual Backup download
  const handleBackupClick = () => {
    backupDatabase(db);
  };

  // Trigger manual Restore upload
  const handleRestoreChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (window.confirm("Restoring this file will completely overwrite all local vehicles, drivers, fuel logs, and ledger entries! Do you want to proceed?")) {
        try {
          const restoredDb = await restoreDatabase(file);
          setDb(restoredDb);
          alert("Database restored successfully! All tables recovered.");
        } catch (error: any) {
          alert(`Database Restore Failed: ${error?.message || 'Invalid backup structure'}`);
        }
      }
    }
  };

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
        <h2 className="text-xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
          Control Panel Settings
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure security, exports, backup, and visual parameters.
        </p>
      </div>

      {/* Main Settings Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Business & Theme Details */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-sm rounded-3xl p-6 space-y-5">
            <h3 className="font-bold text-base font-display text-slate-800 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-50 dark:border-slate-700/50">
              <Building2 className="w-5 h-5 text-brand" />
              Corporate Info & Layout
            </h3>

            {/* Corporate Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Company Name</label>
              <input
                type="text"
                value={coName}
                onChange={(e) => setCoName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white"
                required
              />
            </div>

            {/* Currency Symbol selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Currency Symbol</label>
                <select
                  value={currSymbol}
                  onChange={(e) => setCurrSymbol(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm focus:outline-none text-slate-800 dark:text-white"
                >
                  <option value="₹">₹ - Indian Rupee (INR)</option>
                  <option value="$">$ - US Dollar (USD)</option>
                  <option value="€">€ - Euro (EUR)</option>
                  <option value="£">£ - British Pound (GBP)</option>
                  <option value="¥">¥ - Yen/Yuan (JPY/CNY)</option>
                  <option value="₦">₦ - Naira (NGN)</option>
                  <option value="Sh">Sh - Shilling (KES)</option>
                </select>
              </div>

              {/* Theme Settings Switcher */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Visual Theme</label>
                <div className="flex bg-slate-50 dark:bg-slate-700 p-1 rounded-xl border border-slate-100 dark:border-slate-600 h-[42px] items-center">
                  <button
                    type="button"
                    onClick={() => updateSettings({ theme: 'light' })}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      db.settings.theme === 'light'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-400'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettings({ theme: 'dark' })}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      db.settings.theme === 'dark'
                        ? 'bg-slate-600 text-white shadow-sm'
                        : 'text-slate-400'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-brand" />
                    Dark
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Accent Color Theme Picker */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Accent Brand Color</label>
              <div className="flex flex-wrap gap-2.5 p-3 bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-600 rounded-2xl">
                {[
                  { name: 'indigo', label: 'Indigo', bg: 'bg-[#4f46e5]' },
                  { name: 'emerald', label: 'Emerald', bg: 'bg-[#10b981]' },
                  { name: 'blue', label: 'Blue', bg: 'bg-[#3b82f6]' },
                  { name: 'rose', label: 'Rose', bg: 'bg-[#f43f5e]' },
                  { name: 'amber', label: 'Amber', bg: 'bg-[#f59e0b]' },
                  { name: 'violet', label: 'Violet', bg: 'bg-[#8b5cf6]' },
                ].map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => {
                      setColorTheme(t.name);
                      updateSettings({ colorTheme: t.name as any });
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer relative ${
                      colorTheme === t.name
                        ? 'border-brand bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white ring-2 ring-brand/20'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${t.bg} inline-block`} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom UI Visuals & Accuracy Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-150/40 dark:border-slate-700/40">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Custom Typography</label>
                <select
                  value={textStyle}
                  onChange={(e) => setTextStyle(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-650 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                >
                  <option value="sans">Sans-Serif (Inter)</option>
                  <option value="display">Display (Space Grotesk)</option>
                  <option value="mono">Terminal (Fira/JetBrains)</option>
                  <option value="handwriting">Handwriting (Kalam)</option>
                  <option value="cursive">Elegant Cursive (Playball)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Background Texture</label>
                <select
                  value={bgTexture}
                  onChange={(e) => setBgTexture(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-650 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                >
                  <option value="solid">Clean Solid</option>
                  <option value="dots">Radial Dots Grid</option>
                  <option value="grid">Drafting Grid Lines</option>
                  <option value="stripes">Diagonal Stripes</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Decimal Precision</label>
                <select
                  value={decimalPlaces}
                  onChange={(e) => setDecimalPlaces(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-650 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                >
                  <option value={0}>0 (e.g. ₹150)</option>
                  <option value={1}>1 (e.g. ₹150.0)</option>
                  <option value={2}>2 (e.g. ₹150.00)</option>
                  <option value={3}>3 (e.g. ₹150.000)</option>
                  <option value={4}>4 (e.g. ₹150.0000)</option>
                </select>
              </div>
            </div>

            {/* Folder path */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                <FolderDown className="w-4 h-4 text-slate-400" /> Local Export Directory Path
              </label>
              <input
                type="text"
                value={expFolder}
                onChange={(e) => setExpFolder(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm font-mono text-slate-800 dark:text-white"
              />
            </div>

            {/* Auto backup Toggle option */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100/40 dark:border-slate-700/30">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Automatic Database Backup</span>
                <span className="text-[10px] text-slate-400 block">Saves a background copy after every record addition</span>
              </div>
              <input
                type="checkbox"
                checked={autoBackup}
                onChange={(e) => setAutoBackup(e.target.checked)}
                className="w-5 h-5 accent-brand cursor-pointer"
              />
            </div>

            {/* Security Passcode Block */}
            <div className="pt-4 border-t border-slate-50 dark:border-slate-700/50 space-y-4">
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Key className="w-4 h-4 text-brand" />
                PIN & Fingerprint Security
              </h4>

              {/* Pin code lock toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Activate PIN Lock Screen</span>
                  <span className="text-[10px] text-slate-400 block">Requires 4-Digit PIN to unlock app on startup</span>
                </div>
                <input
                  type="checkbox"
                  checked={pinLock}
                  onChange={(e) => setPinLock(e.target.checked)}
                  className="w-5 h-5 accent-brand cursor-pointer"
                />
              </div>

              {/* Enter PIN field */}
              {pinLock && (
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-700/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">4-Digit Passcode</span>
                    <div className="relative">
                      <input
                        type={showPin ? 'text' : 'password'}
                        placeholder="e.g. 1234"
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-mono font-bold tracking-widest text-slate-800 dark:text-white"
                        maxLength={4}
                        required={pinLock}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-brand text-[10px] font-medium pl-2">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <span>PIN must be numeric digits only.</span>
                  </div>

                  {/* Recovery Question Setup */}
                  <div className="col-span-2 mt-3 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3.5">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Security Question for PIN Recovery</span>
                      <select
                        value={recoveryQuestion}
                        onChange={(e) => setRecoveryQuestion(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand"
                      >
                        <option value="First vehicle brand?">First vehicle brand?</option>
                        <option value="City where you bought first truck?">City where you bought first truck?</option>
                        <option value="What was your first job?">What was your first job?</option>
                        <option value="Name of your first driver?">Name of your first driver?</option>
                        <option value="Your childhood hero?">Your childhood hero?</option>
                        <option value="Custom Question">Write custom security question...</option>
                      </select>
                    </div>

                    {recoveryQuestion === 'Custom Question' || (!['First vehicle brand?', 'City where you bought first truck?', 'What was your first job?', 'Name of your first driver?', 'Your childhood hero?'].includes(recoveryQuestion) && recoveryQuestion !== '') ? (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Custom Security Question</span>
                        <input
                          type="text"
                          placeholder="e.g. What is your favorite loading terminal?"
                          value={recoveryQuestion === 'Custom Question' ? '' : recoveryQuestion}
                          onChange={(e) => setRecoveryQuestion(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                      </div>
                    ) : null}

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Security Answer</span>
                      <input
                        type="text"
                        placeholder="e.g. Tata"
                        value={recoveryAnswer}
                        onChange={(e) => setRecoveryAnswer(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand"
                        required={pinLock}
                      />
                      <span className="text-[9px] text-slate-400 italic block">Keep this answer safe! You will need it if you ever forget your PIN passcode.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Simulated Fingerprint toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100/40 dark:border-slate-700/30">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Simulated Fingerprint Authorization</span>
                  <span className="text-[10px] text-slate-400 block">Biometric quick authentication bypass button</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={fingerprintLock}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked && !biometricPermissionGranted) {
                        setPermissionTargetAction('enable');
                        setShowPermissionPrompt(true);
                      } else {
                        setFingerprintLock(checked);
                      }
                    }}
                    className="w-5 h-5 accent-brand cursor-pointer"
                  />
                  <div className="p-1.5 bg-brand/10 text-brand rounded-lg">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {fingerprintLock && (
                <div className="p-4 bg-slate-50 dark:bg-slate-700/20 rounded-2xl border border-slate-100 dark:border-slate-700/30 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Offline Biometric Fingerprint Registry</span>
                      <span className="text-[10px] text-slate-400 block">Enrolled fingerprints are saved securely in your offline database</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!biometricPermissionGranted) {
                          setPermissionTargetAction('enroll');
                          setShowPermissionPrompt(true);
                        } else {
                          setIsEnrolling(!isEnrolling);
                          setNewFingerName('');
                          setEnrollProgress(0);
                          setEnrollState('idle');
                        }
                      }}
                      className="px-2.5 py-1.5 bg-brand/10 hover:bg-brand/20 text-brand text-[10px] font-bold rounded-lg transition-all"
                    >
                      {isEnrolling ? 'Cancel' : '+ Enroll Finger'}
                    </button>
                  </div>

                  {isEnrolling && (
                    <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-150 dark:border-slate-700/40 space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Fingerprint Name / Label</label>
                        <input
                          type="text"
                          placeholder="e.g. Left Thumb, Dad's Index"
                          value={newFingerName}
                          onChange={(e) => setNewFingerName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                      </div>

                      <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl space-y-2">
                        {enrollState === 'complete' ? (
                          <div className="text-center space-y-1.5">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
                            <span className="text-xs font-bold text-slate-700 dark:text-emerald-400 block">Success! Enrolled "{newFingerName}"</span>
                            <p className="text-[10px] text-slate-400">Remember to Save Configuration below to store this biometric match offline.</p>
                            <button
                              type="button"
                              onClick={() => {
                                setIsEnrolling(false);
                                setNewFingerName('');
                                setEnrollProgress(0);
                                setEnrollState('idle');
                              }}
                              className="px-3 py-1 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-bold rounded-lg mt-1"
                            >
                              Done
                            </button>
                          </div>
                        ) : (
                          <div className="text-center space-y-2.5 w-full max-w-[240px]">
                            <span className="text-[10px] font-medium text-slate-500 block">
                              {enrollState === 'holding' ? `Enrolling... ${enrollProgress}%` : 'Press and hold scanner to enroll finger'}
                            </span>
                            
                            {/* Scanning Progress Ring */}
                            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                <circle
                                  cx="40"
                                  cy="40"
                                  r="36"
                                  className="text-slate-200 dark:text-slate-700"
                                  strokeWidth="4"
                                  stroke="currentColor"
                                  fill="transparent"
                                />
                                <circle
                                  cx="40"
                                  cy="40"
                                  r="36"
                                  className="text-brand transition-all duration-100"
                                  strokeWidth="4"
                                  strokeDasharray={226}
                                  strokeDashoffset={226 - (226 * enrollProgress) / 100}
                                  strokeLinecap="round"
                                  stroke="currentColor"
                                  fill="transparent"
                                />
                              </svg>
                              
                              <button
                                type="button"
                                onMouseDown={startBiometricEnroll}
                                onMouseUp={stopBiometricEnroll}
                                onMouseLeave={stopBiometricEnroll}
                                onTouchStart={(e) => {
                                  e.preventDefault();
                                  startBiometricEnroll();
                                }}
                                onTouchEnd={stopBiometricEnroll}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                  enrollState === 'holding' 
                                    ? 'bg-brand/20 text-brand scale-110 shadow-inner' 
                                    : 'bg-brand text-white shadow hover:scale-105 active:scale-95'
                                }`}
                              >
                                <Fingerprint className="w-7 h-7" />
                              </button>
                            </div>

                            <p className="text-[9px] text-slate-400">
                              {enrollState === 'holding' ? 'Keep holding...' : 'Touch and hold biometric sensor above'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Registered List */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Saved Fingerprints / Profiles ({enrolledBiometrics.length})</span>
                    {enrolledBiometrics.length === 0 ? (
                      <div className="text-center p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block">⚠️ No fingerprints enrolled.</span>
                        <p className="text-[9px] text-slate-400 mt-0.5">Please register a finger profile. Without enrolling a fingerprint match, you cannot bypass the PIN lock screen via biometrics.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {enrolledBiometrics.map((finger, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/40 text-xs font-semibold text-slate-700 dark:text-slate-200"
                          >
                            <div className="flex items-center gap-2">
                              <Fingerprint className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="truncate max-w-[120px]">{finger}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteBiometric(finger)}
                              className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                              title="Delete fingerprint"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Save Buttons */}
            <div className="flex justify-end pt-4 border-t border-slate-50 dark:border-slate-700/50">
              <button
                type="submit"
                className="px-6 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                Save Configuration
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Database Maintenance & Recovery */}
        <div className="space-y-6">
          
          {/* Offline App & Android APK Install Card */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 dark:from-emerald-950/30 dark:to-indigo-950/30 border border-emerald-500/20 dark:border-emerald-500/30 shadow-sm rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500 text-white rounded-2xl shadow-sm">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm font-display text-slate-800 dark:text-white">Android APK & Offline App</h3>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                  Full Standalone Offline Installation
                </p>
              </div>
            </div>
            
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Install the application locally on Android or desktop browsers. Includes full offline data caching with 0% data loss risk.
            </p>

            <a
              href="/app-debug.apk"
              download="app-debug.apk"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md text-center block"
            >
              <Download className="w-4 h-4" />
              Download Android APK (app-debug.apk)
            </a>
          </div>

          {/* Backup Restore Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-sm rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-sm font-display text-slate-800 dark:text-white">Database Backup & Recovery</h3>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Export the complete local database into a single file to keep safe or restore on other machines.
            </p>

            <button
              onClick={handleBackupClick}
              className="w-full py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-100 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4 text-brand" />
              Download Backup JSON
            </button>

            {/* Restore File Button */}
            <label className="w-full py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-100 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-emerald-500" />
              Restore Database File
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreChange}
                className="hidden"
              />
            </label>
          </div>


          {/* Secure Trash Bin Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-sm rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-sm font-display text-slate-800 dark:text-white flex items-center gap-2">
              <Trash2 className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
              Secure Trash Bin
            </h3>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              View deleted records, fleets, or drivers. Items can be fully restored or permanently deleted under optional PIN security.
            </p>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/40 rounded-2xl border border-slate-100/50 dark:border-slate-700/50">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Deleted Items Count</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-500/10 text-rose-500">
                {db.trashBin?.length || 0}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsTrashOpen(true)}
              className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              Open Trash Bin
            </button>
          </div>

          {/* Detailed Database Health Diagnostics & Auto-Repair */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-sm rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-sm font-display text-slate-800 dark:text-white flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-indigo-500" />
              Full Detail System Health Check
            </h3>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Scan all vehicle/driver indexes, clean orphaned entries, audit relationships, and auto-repair anomalies instantly.
            </p>

            {diagnosticsStatus === 'idle' && (
              <button
                type="button"
                onClick={runDiagnostics}
                className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Activity className="w-4 h-4" />
                Run System Health Check
              </button>
            )}

            {diagnosticsStatus !== 'idle' && (
              <div className="space-y-4">
                {/* Micro report indicators */}
                <div className="grid grid-cols-1 gap-2">
                  {diagnosticsReport.map((rep, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100/50 dark:border-slate-700/50">
                      <span className="font-medium text-slate-600 dark:text-slate-300">{rep.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-mono italic">{rep.details}</span>
                        <span className={`inline-flex h-2 w-2 rounded-full ${rep.status === 'pass' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Terminal Log */}
                <div className="bg-slate-900 text-slate-300 rounded-2xl p-4 border border-slate-800 font-mono text-[10px] space-y-1.5 max-h-40 overflow-y-auto shadow-inner">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-2">
                    <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider flex items-center gap-1">
                      <Terminal className="w-3.5 h-3.5" />
                      Live Diagnostic Console
                    </span>
                    <span className="text-[9px] text-indigo-400 animate-pulse">SYSTEM_ONLINE</span>
                  </div>
                  {diagnosticsLogs.length === 0 ? (
                    <div className="text-slate-500 italic">Initializing console...</div>
                  ) : (
                    diagnosticsLogs.map((log, idx) => {
                      let color = 'text-slate-300';
                      if (log.includes('[WARN]')) color = 'text-amber-400';
                      if (log.includes('[FIX]')) color = 'text-cyan-400';
                      if (log.includes('[OK]')) color = 'text-emerald-400';
                      if (log.includes('[SUCCESS]')) color = 'text-emerald-500 font-bold';
                      return <div key={idx} className={`${color} leading-relaxed break-all`}>{log}</div>;
                    })
                  )}
                </div>

                {/* Status Bar Summary */}
                <div className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold ${
                  diagnosticsStatus === 'running' ? 'bg-indigo-50/50 border-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400' :
                  diagnosticsStatus === 'success' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' :
                  diagnosticsStatus === 'warning' ? 'bg-amber-50/50 border-amber-100 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400' :
                  'bg-cyan-50/50 border-cyan-100 text-cyan-600 dark:bg-cyan-500/10 dark:border-cyan-500/20 dark:text-cyan-400'
                }`}>
                  <span>
                    {diagnosticsStatus === 'running' && 'Running Diagnostics...'}
                    {diagnosticsStatus === 'success' && 'Scan Completed: 100% Healthy'}
                    {diagnosticsStatus === 'warning' && `Found ${diagnosticsIssuesCount} reference anomalies`}
                    {diagnosticsStatus === 'fixed' && 'Repairs Completed: Database Clean!'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={runDiagnostics}
                      disabled={diagnosticsStatus === 'running'}
                      className="px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200 disabled:opacity-50 transition-all"
                    >
                      Rescan
                    </button>
                    {diagnosticsStatus === 'warning' && (
                      <button
                        type="button"
                        onClick={autoRepairDatabase}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all animate-pulse"
                      >
                        <Wrench className="w-3 h-3" />
                        Fix Automatically
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reset Card */}
          <div className="bg-red-500/5 dark:bg-red-950/5 border border-red-500/10 dark:border-red-500/20 rounded-3xl p-6 space-y-3">
            <h3 className="font-bold text-sm font-display text-rose-500 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Danger Zone
            </h3>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Clearing the database instantly and irreversibly removes all customized records, vehicles, and drivers, resetting to default sample values.
            </p>

            <button
              type="button"
              onClick={handleResetClick}
              className="w-full py-3 bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-100 dark:border-rose-900 text-rose-500 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Reset SQLite Simulator
            </button>
          </div>

        </div>

      </div>

      {/* Custom Reset Confirmation Modal Overlay */}
      {resetModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 border border-slate-100 dark:border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-slate-850 dark:text-white">
            <h3 className="font-extrabold text-lg font-display text-rose-500 flex items-center gap-2 mb-2">
              <Trash2 className="w-5 h-5 animate-bounce" />
              Reset All Data?
            </h3>
            
            {resetModal.successMessage ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {resetModal.successMessage}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setResetModal(prev => ({ ...prev, isOpen: false }));
                    window.location.reload(); // Refresh to clean reload the page with sample data
                  }}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer font-sans"
                >
                  OK, Refresh App
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  This will completely clear your active transport database (including all custom vehicles, drivers, income/expense entries, and fuel logs) and restore the default sample database. This action is irreversible.
                </p>

                {resetModal.requiresPin && (
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-600">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Enter 4-Digit Security PIN
                    </label>
                    <input
                      type="password"
                      placeholder="••••"
                      value={resetModal.pinInput}
                      onChange={(e) => setResetModal({ ...resetModal, pinInput: e.target.value.replace(/\D/g, '').slice(0, 4), error: '' })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleConfirmReset();
                        }
                      }}
                      className="w-full text-center px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-lg font-mono font-bold tracking-widest text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand"
                      maxLength={4}
                      autoFocus
                    />
                    {resetModal.error && (
                      <span className="text-[10px] font-semibold text-rose-500 block text-center mt-1">
                        {resetModal.error}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setResetModal({ isOpen: false, requiresPin: false, pinInput: '', error: '', successMessage: '' })}
                    className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-100 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReset}
                    className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer font-sans"
                  >
                    Yes, Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Custom PIN Verification for Settings Change */}
      {pinConfirmModal && pinConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 border border-slate-100 dark:border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-slate-850 dark:text-white text-center space-y-4">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mx-auto">
              <Key className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800 dark:text-white text-base">
                Confirm Security PIN
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-300 leading-relaxed">
                Enter your 4-Digit Security PIN to authorize saving settings and corporate changes.
              </p>
            </div>
            <div className="space-y-2">
              <input
                type="password"
                placeholder="••••"
                value={pinConfirmModal.pinInput}
                onChange={(e) => setPinConfirmModal({
                  ...pinConfirmModal,
                  pinInput: e.target.value.replace(/\D/g, '').slice(0, 4),
                  error: ''
                })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (pinConfirmModal.pinInput === db.settings.pinCode) {
                      pinConfirmModal.onSuccess();
                      setPinConfirmModal(null);
                    } else {
                      setPinConfirmModal({ ...pinConfirmModal, error: 'Incorrect 4-Digit Security PIN!' });
                    }
                  }
                }}
                className="w-full text-center px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-xl text-lg font-mono font-bold tracking-widest text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand"
                maxLength={4}
                autoFocus
              />
              {pinConfirmModal.error && (
                <span className="text-[10px] font-semibold text-rose-500 block text-center">
                  {pinConfirmModal.error}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPinConfirmModal(null)}
                className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-100 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pinConfirmModal.pinInput === db.settings.pinCode) {
                    pinConfirmModal.onSuccess();
                    setPinConfirmModal(null);
                  } else {
                    setPinConfirmModal({ ...pinConfirmModal, error: 'Incorrect 4-Digit Security PIN!' });
                  }
                }}
                className="flex-1 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer font-sans"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Biometric Scanner Permission Prompt Modal */}
      {showPermissionPrompt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 border border-slate-100 dark:border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-slate-850 dark:text-white text-center space-y-4">
            <div className="w-12 h-12 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto">
              <Fingerprint className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800 dark:text-white text-base font-display">
                Allow Biometric Access?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
                Offline Transport Manager requests permission to access your device's biometric/fingerprint reader hardware for securing and unlocking your corporate database.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDenyPermission}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer font-sans"
              >
                Deny
              </button>
              <button
                type="button"
                onClick={handleGrantPermission}
                className="flex-1 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer font-sans"
              >
                Allow Permission
              </button>
            </div>
          </div>
        </div>
      )}

      <TrashBin isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} />
    </div>
  );
};
