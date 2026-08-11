/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TransportProvider, useTransport } from './context/TransportContext';
import { PINLockScreen } from './components/PINLockScreen';
import { Dashboard } from './components/Dashboard';
import { Vehicles } from './components/Vehicles';
import { Drivers } from './components/Drivers';
import { Records } from './components/Records';
import { AddEntry } from './components/AddEntry';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';

import { 
  Home, 
  FileText, 
  Plus, 
  BarChart2, 
  Settings as SettingsIcon,
  Truck, 
  Users,
  Smartphone,
  Maximize,
  WifiOff,
  Battery,
  User,
  LogOut,
  Moon,
  Sun,
  Download,
  DownloadCloud,
  CheckCircle2,
  X
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { db, isLocked, lockApp, updateSettings } = useTransport();
  
  // Tab states: 'dashboard', 'records', 'vehicles', 'drivers', 'analytics', 'settings', 'add'
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [addEntryPreset, setAddEntryPreset] = useState<'income' | 'expense' | 'fuel'>('income');

  // Simulated Device Toggle
  const [isPhoneMock, setIsPhoneMock] = useState<boolean>(true);

  // APK & Offline Install Modal State
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  // Dynamic status bar clock helper
  const [statusBarTime, setStatusBarTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setStatusBarTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  // Quick navigation to add entry sheet
  const handleNavigateToAdd = (preset: 'income' | 'expense' | 'fuel') => {
    setAddEntryPreset(preset);
    setActiveTab('add');
  };

  const handleToggleTheme = () => {
    const nextTheme = db.settings.theme === 'light' ? 'dark' : 'light';
    updateSettings({ theme: nextTheme });
  };

  const handlePrintLedger = () => {
    const wasMock = isPhoneMock;
    if (wasMock) {
      setIsPhoneMock(false);
      setTimeout(() => {
        window.print();
        setIsPhoneMock(true);
      }, 300);
    } else {
      window.print();
    }
  };

  // Render correct sub-page
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigateToAdd={handleNavigateToAdd} onNavigateToTab={setActiveTab} />;
      case 'records':
        return <Records onPrint={handlePrintLedger} />;
      case 'vehicles':
        return <Vehicles />;
      case 'drivers':
        return <Drivers />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      case 'add':
        return <AddEntry onNavigateToTab={setActiveTab} initialType={addEntryPreset} />;
      default:
        return <Dashboard onNavigateToAdd={handleNavigateToAdd} onNavigateToTab={setActiveTab} />;
    }
  };

  // If app PIN Lock is active and locked, enforce PIN wall first
  if (isLocked) {
    return <PINLockScreen />;
  }

  const textStyleClass = 
    db.settings.textStyle === 'mono' ? 'font-mono' :
    db.settings.textStyle === 'display' ? 'font-display' :
    db.settings.textStyle === 'handwriting' ? 'font-handwriting font-medium' :
    db.settings.textStyle === 'cursive' ? 'font-cursive text-[105%]' : 'font-sans';

  const bgTextureClass = 
    db.settings.bgTexture === 'dots' ? 'texture-dots' :
    db.settings.bgTexture === 'grid' ? 'texture-grid' :
    db.settings.bgTexture === 'stripes' ? 'texture-stripes' : 'texture-solid';

  return (
    <div className={`min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 ${textStyleClass} transition-colors duration-200`}>
      
      {/* Top Application Header bar (Desktop & Web Utilities) */}
      <header className="no-print bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-40 px-6 py-3.5 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand flex items-center justify-center text-white font-extrabold font-display shadow-md">
            {(db.settings.companyName || 'Transport Ledger').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="font-extrabold text-base font-display tracking-tight text-slate-900 dark:text-white">
              {db.settings.companyName || 'Transport Ledger'}
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              SQLite Local Offline Storage
            </span>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2">
          {/* APK & Offline Install Button */}
          <button
            onClick={() => setShowInstallModal(true)}
            className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-800/60 transition-all text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 cursor-pointer shadow-sm"
            title="Download Android APK / Offline App Install"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-bounce" />
            <span className="hidden sm:inline">Install App / APK</span>
          </button>

          {/* Toggle Device Frame */}
          <button
            onClick={() => setIsPhoneMock(!isPhoneMock)}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 transition-all text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
            title={isPhoneMock ? "Expand to Full Screen Web layout" : "Simulate Android Device Frame"}
          >
            {isPhoneMock ? <Maximize className="w-4 h-4 text-brand" /> : <Smartphone className="w-4 h-4 text-brand" />}
            <span className="hidden sm:inline text-slate-600 dark:text-slate-300">
              {isPhoneMock ? "Full Screen Web" : "Simulate Android"}
            </span>
          </button>

          {/* Theme toggler */}
          <button
            onClick={handleToggleTheme}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 transition-all cursor-pointer"
            title="Toggle theme"
          >
            {db.settings.theme === 'light' ? <Moon className="w-4 h-4 text-slate-500" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* PIN Lock Trigger */}
          {db.settings.pinLock && (
            <button
              onClick={lockApp}
              className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 text-rose-500 border border-rose-100/50 dark:border-rose-500/10 transition-all cursor-pointer"
              title="Lock Database Database"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Body Layout Engine */}
      <main className="px-4 py-6 max-w-7xl w-full mx-auto flex justify-center items-start">
        
        {/* Desktop Left Rail Navigation (Only rendered when Mock device is toggled off) */}
        {!isPhoneMock && (
          <div className="hidden lg:flex flex-col w-64 mr-6 gap-3 shrink-0 no-print">
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full px-4 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-left flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-brand text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <Home className="w-4 h-4" />
              Tally Dashboard
            </button>

            <button
              onClick={() => setActiveTab('records')}
              className={`w-full px-4 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-left flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'records'
                  ? 'bg-brand text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              Audit Ledger
            </button>

            <button
              onClick={() => handleNavigateToAdd('income')}
              className={`w-full px-4 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-left flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'add'
                  ? 'bg-brand text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <Plus className="w-4 h-4" />
              Add Ledger Entry
            </button>

            <button
              onClick={() => setActiveTab('vehicles')}
              className={`w-full px-4 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-left flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'vehicles'
                  ? 'bg-brand text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <Truck className="w-4 h-4" />
              Manage Fleets
            </button>

            <button
              onClick={() => setActiveTab('drivers')}
              className={`w-full px-4 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-left flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'drivers'
                  ? 'bg-brand text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Manage Drivers
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full px-4 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-left flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-brand text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Tally Analytics
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full px-4 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-left flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-brand text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              Ledger Settings
            </button>

          </div>
        )}

        {/* Conditional Android Mock Container */}
        <div className={`transition-all duration-300 ${
          isPhoneMock 
            ? 'w-full max-w-[430px] h-[860px] bg-slate-900 border-[10px] border-slate-900 rounded-[50px] shadow-2xl relative overflow-hidden flex flex-col no-print' 
            : 'flex-1 min-w-0 h-auto'
        }`}>
          
          {/* Simulated Android Status Bar */}
          {isPhoneMock && (
            <div className="bg-slate-900 text-white text-[10px] px-6 py-2.5 flex justify-between items-center font-mono select-none font-bold shrink-0">
              <span>{statusBarTime || '10:40'}</span>
              
              {/* Dynamic Camera Notch circle */}
              <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full border-2 border-slate-900" />

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-0.5 text-slate-300" title="Offline Mode - Secure local db">
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[8px] uppercase font-bold text-rose-400">Offline</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-[9px]">99%</span>
                  <Battery className="w-4 h-4 text-emerald-400" />
                </span>
              </div>
            </div>
          )}

          {/* Core Content View Screen */}
          <div className={`${
            isPhoneMock 
              ? `flex-1 bg-slate-50 dark:bg-slate-950 overflow-y-auto px-4 pt-4 pb-24 rounded-t-[36px] no-scrollbar ${bgTextureClass}` 
              : `w-full ${bgTextureClass}`
          }`}>
            {renderTabContent()}
          </div>

          {/* 1. Simulated Android Floating Add Button (FAB) */}
          {isPhoneMock && activeTab !== 'add' && (
            <button
              onClick={() => handleNavigateToAdd('income')}
              className="absolute right-6 bottom-20 w-14 h-14 bg-brand hover:bg-brand-hover active:scale-95 text-white rounded-full flex items-center justify-center shadow-lg transition-transform cursor-pointer z-30"
              title="Add New Entry"
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </button>
          )}

          {/* 2. Simulated Android Device Bottom Navigation */}
          {isPhoneMock && (
            <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800/80 px-4 py-3 flex justify-around items-center z-20 shadow-lg">
              
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'dashboard' ? 'text-brand font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Home className="w-5 h-5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Tally</span>
              </button>

              <button
                onClick={() => setActiveTab('records')}
                className={`flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'records' ? 'text-brand font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Ledger</span>
              </button>

              <button
                onClick={() => setActiveTab('vehicles')}
                className={`flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'vehicles' ? 'text-brand font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Truck className="w-5 h-5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Fleets</span>
              </button>

              <button
                onClick={() => setActiveTab('drivers')}
                className={`flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'drivers' ? 'text-brand font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Drivers</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'settings' ? 'text-brand font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <SettingsIcon className="w-5 h-5" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">More</span>
              </button>

            </div>
          )}

        </div>

      </main>

      {/* APK & Offline PWA Installation Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-6">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold font-display text-lg text-slate-800 dark:text-white">
                    Offline App Installation & APK
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Use full offline functionality on any phone, tablet or PC
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Option 1: Direct Android APK */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-emerald-500 text-white rounded-xl text-xs font-black">APK</span>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white">Android Debug APK Package</h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-full">
                  Direct Download
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Download the Android package file directly to install on your mobile device for native offline access without browser address bar.
              </p>
              <a
                href="/app-debug.apk"
                download="app-debug.apk"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-center block"
              >
                <Download className="w-4 h-4" />
                Download Android APK (app-debug.apk)
              </a>
            </div>

            {/* Option 2: Progressive Web App (PWA) Offline */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-indigo-600 text-white rounded-xl text-xs font-black">PWA</span>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white">Browser Offline Web App (PWA)</h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-full">
                  Instant
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tap <strong>'Add to Home Screen'</strong> or <strong>'Install App'</strong> in your mobile/desktop browser menu. The Service Worker caches all database interfaces locally.
              </p>
              <div className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Service Worker & Manifest Cache Active</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowInstallModal(false)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <TransportProvider>
      <MainAppContent />
    </TransportProvider>
  );
}
