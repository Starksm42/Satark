import React, { useState, useEffect } from 'react';
import { useTransport } from '../context/TransportContext';
import { Lock, Delete, ShieldAlert, Fingerprint, HelpCircle, KeyRound, CheckCircle2, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export const PINLockScreen: React.FC = () => {
  const { verifyPIN, db, updateSettings, unlockApp } = useTransport();
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  
  // Recovery Mode States
  const [showRecovery, setShowRecovery] = useState<boolean>(false);
  const [recoveryInput, setRecoveryInput] = useState<string>('');
  const [recoveryError, setRecoveryError] = useState<string>('');
  const [recoverySuccess, setRecoverySuccess] = useState<boolean>(false);
  const [revealedPin, setRevealedPin] = useState<string>('');
  const [showRevealedPin, setShowRevealedPin] = useState<boolean>(false);
  const [recoveryTab, setRecoveryTab] = useState<'question' | 'biometric'>('question');

  // Biometric Scanning States
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [showBiometricSelect, setShowBiometricSelect] = useState<boolean>(false);
  const [targetFinger, setTargetFinger] = useState<string>('');

  const startRecoveryBiometricScan = (fingerName: string) => {
    setTargetFinger(fingerName);
    setIsScanning(true);
    setScanState('scanning');
    
    // Simulate biometric match checks offline
    setTimeout(() => {
      setScanState('success');
      
      setTimeout(() => {
        setIsScanning(false);
        setScanState('idle');
        setRecoverySuccess(true);
        setRevealedPin(db.settings.pinCode || '');
        // Turn off PIN lock to recover access ("forget pin")
        updateSettings({
          pinLock: false,
          pinCode: ''
        });
      }, 1000);
    }, 1500);
  };

  const handleKeyPress = (num: string) => {
    setError(false);
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        // Auto check pin
        setTimeout(() => {
          const success = verifyPIN(newPin);
          if (!success) {
            setError(true);
            setPin('');
          }
        }, 200);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleFingerprint = () => {
    if (!db.settings.fingerprintLock) {
      alert("Simulated Fingerprint bypass is disabled. Please enable it in Settings -> PIN & Fingerprint Security.");
      return;
    }
    
    const enrolled = db.settings.enrolledBiometrics || [];
    if (enrolled.length === 0) {
      alert("No fingerprints enrolled yet. Please log in using your PIN passcode, then register/enroll a fingerprint in Settings -> PIN & Fingerprint Security.");
      return;
    }

    setShowBiometricSelect(true);
  };

  const startVerificationScan = (fingerName: string) => {
    setTargetFinger(fingerName);
    setIsScanning(true);
    setScanState('scanning');
    
    // Simulate biometric match checks offline
    setTimeout(() => {
      setScanState('success');
      
      setTimeout(() => {
        setIsScanning(false);
        setScanState('idle');
        setShowBiometricSelect(false);
        unlockApp();
      }, 1000);
    }, 1500);
  };

  // Verify PIN recovery answer
  const handleVerifyRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    
    const dbAnswer = db.settings.pinRecoveryAnswer || 'Tata';
    const cleanInput = recoveryInput.trim().toLowerCase();
    const cleanDbAnswer = dbAnswer.trim().toLowerCase();

    if (cleanInput === cleanDbAnswer) {
      setRecoverySuccess(true);
      setRevealedPin(db.settings.pinCode);
      // Turn off PIN lock to recover the user's database access permanently
      updateSettings({
        pinLock: false,
        pinCode: ''
      });
    } else {
      setRecoveryError('Incorrect security answer. Please try again.');
    }
  };

  const handleResetAndUnlock = () => {
    // Force unlock
    unlockApp();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900 text-white font-sans">
      <div className="w-full max-w-sm px-6 text-center flex flex-col items-center">
        
        {!showRecovery ? (
          <>
            {/* Standard PIN Lock Screen */}
            <div className={`p-5 rounded-full mb-6 transition-all duration-300 ${error ? 'bg-red-500/20 text-red-400 animate-bounce' : 'bg-brand/10 text-brand'}`}>
              <Lock className="w-12 h-12" />
            </div>

            {/* Header Text */}
            <h2 className="text-2xl font-bold font-display tracking-tight text-white mb-2">
              {db.settings.companyName || 'Offline Transport Manager'}
            </h2>
            <p className="text-slate-400 text-sm mb-8">
              Enter 4-Digit Security PIN to Access Database
            </p>

            {/* PIN Indicators */}
            <div className="flex gap-4 mb-10 justify-center">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    pin.length > index
                      ? 'bg-brand border-brand scale-110 shadow-[0_0_8px_rgba(var(--color-brand),0.5)]'
                      : 'border-slate-600 bg-transparent'
                  }`}
                  style={{
                    backgroundColor: pin.length > index ? 'var(--color-brand)' : 'transparent',
                    borderColor: pin.length > index ? 'var(--color-brand)' : '#475569'
                  }}
                />
              ))}
            </div>

            {/* Error State */}
            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-2 rounded-xl mb-6 text-sm font-medium">
                <ShieldAlert className="w-4 h-4" />
                Incorrect Security PIN. Try Again.
              </div>
            )}

            {/* Number Pad Grid */}
            <div className="grid grid-cols-3 gap-4 w-full px-4 mb-6">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  onClick={() => handleKeyPress(num)}
                  className="w-16 h-16 rounded-full border border-slate-700/50 bg-slate-800 hover:bg-slate-700 text-white text-2xl font-extrabold transition-all active:scale-90 flex items-center justify-center cursor-pointer mx-auto shadow-md hover:border-brand/40 hover:text-brand"
                >
                  {num}
                </button>
              ))}
              
              {/* Fingerprint / Utility */}
              <button
                onClick={handleFingerprint}
                className={`w-16 h-16 rounded-full text-xs flex flex-col items-center justify-center cursor-pointer transition-all active:scale-90 mx-auto border shadow-md ${
                  db.settings.fingerprintLock
                    ? 'bg-slate-800 hover:bg-slate-700 text-brand hover:text-brand-hover border-slate-700/50 hover:border-brand/40'
                    : 'bg-slate-850 text-slate-500 border-slate-800/80 opacity-50 hover:opacity-100 hover:bg-slate-800 hover:border-slate-700'
                }`}
                title={db.settings.fingerprintLock ? "Simulate Fingerprint Scan" : "Biometrics disabled. Click to configure."}
              >
                <Fingerprint className="w-6 h-6" />
                <span className="text-[9px] mt-0.5 font-bold">Bio</span>
              </button>

              {/* Zero */}
              <button
                onClick={() => handleKeyPress('0')}
                className="w-16 h-16 rounded-full border border-slate-700/50 bg-slate-800 hover:bg-slate-700 text-white text-2xl font-extrabold transition-all active:scale-90 flex items-center justify-center cursor-pointer mx-auto shadow-md hover:border-brand/40 hover:text-brand"
              >
                0
              </button>

              {/* Backspace */}
              <button
                onClick={handleBackspace}
                className="w-16 h-16 rounded-full bg-slate-800/40 hover:bg-slate-700 border border-slate-700/50 text-slate-400 hover:text-brand flex items-center justify-center cursor-pointer transition-all active:scale-90 mx-auto hover:border-brand/40 shadow-sm"
              >
                <Delete className="w-6 h-6" />
              </button>
            </div>

            {/* PIN Recovery Trigger option */}
            <button
              onClick={() => {
                setShowRecovery(true);
                setRecoveryInput('');
                setRecoveryError('');
                setRecoverySuccess(false);
              }}
              className="text-xs text-brand hover:underline font-semibold flex items-center gap-1.5 mt-2 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Forgot PIN? Recover Access
            </button>

            {/* Quick Hint for Testers */}
            {db.settings.pinCode && (
              <p className="text-[11px] text-slate-500 italic mt-6">
                Security hint: Active PIN is <span className="font-mono text-slate-400 font-semibold">{db.settings.pinCode}</span>
              </p>
            )}
          </>
        ) : (
          <>
            {/* PIN Recovery Flow Screen */}
            <div className="w-full bg-slate-800 border border-slate-700 p-6 rounded-3xl shadow-xl text-left space-y-5">
              
              <div className="flex items-center gap-2 pb-3 border-b border-slate-700">
                <button
                  onClick={() => setShowRecovery(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="font-bold font-display text-base text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-brand" />
                  PIN Passcode Recovery
                </h3>
              </div>

              {!recoverySuccess ? (
                <div className="space-y-4">
                  {/* Recovery Tabs */}
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700/80 mb-1">
                    <button
                      type="button"
                      onClick={() => setRecoveryTab('question')}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                        recoveryTab === 'question'
                          ? 'bg-brand text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Security Question
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecoveryTab('biometric')}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                        recoveryTab === 'biometric'
                          ? 'bg-brand text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Fingerprint className="w-3 h-3" />
                      Biometric Match
                    </button>
                  </div>

                  {recoveryTab === 'question' ? (
                    <form onSubmit={handleVerifyRecovery} className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Your Security Question:</span>
                        <p className="text-sm font-semibold text-slate-200 mt-1 leading-relaxed">
                          {db.settings.pinRecoveryQuestion || 'First vehicle brand?'}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Your Recovery Answer:</label>
                        <input
                          type="text"
                          required
                          placeholder="Enter security answer..."
                          value={recoveryInput}
                          onChange={(e) => setRecoveryInput(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-brand"
                        />
                      </div>

                      {recoveryError && (
                        <p className="text-xs text-red-400 font-semibold flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          {recoveryError}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95 text-center block"
                      >
                        Verify Security Answer
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center p-3 bg-slate-900/40 border border-slate-700/60 rounded-2xl space-y-1">
                        <span className="text-xs font-bold text-slate-200 block">Biometric PIN Reset & Bypass</span>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Match any of your enrolled fingerprints offline to instantly disable app lock and reset/forget your PIN.
                        </p>
                      </div>

                      {(!db.settings.fingerprintLock) ? (
                        <div className="text-center p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                          <span className="text-[10px] text-amber-500 font-bold block">⚠️ Simulated Fingerprint Disabled</span>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            Biometric Quick Login is currently disabled. Please use the Security Question or enter your correct PIN.
                          </p>
                        </div>
                      ) : (!db.settings.enrolledBiometrics || db.settings.enrolledBiometrics.length === 0) ? (
                        <div className="text-center p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                          <span className="text-[10px] text-amber-500 font-bold block">⚠️ No Enrolled Fingerprints Found</span>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            You haven't saved any offline fingerprints yet. You must first unlock using your PIN or Security Question, then register fingerprints in settings.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Fingerprint to Verify offline:</span>
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {db.settings.enrolledBiometrics.map((finger, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => startRecoveryBiometricScan(finger)}
                                className="w-full flex items-center justify-between px-3.5 py-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 hover:border-brand/40 rounded-xl text-xs font-semibold text-slate-200 transition-all active:scale-98 text-left cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <Fingerprint className="w-4 h-4 text-emerald-400" />
                                  <span>{finger}</span>
                                </div>
                                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">Saved Offline</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 text-center py-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">Security Verification Success!</h4>
                    <p className="text-[11px] text-slate-400">
                      Security PIN Lock has been disabled from your settings ("forgot pin").
                    </p>
                  </div>

                  {revealedPin && (
                    <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-700 flex flex-col items-center space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Your Previous PIN was:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-extrabold text-emerald-400 tracking-widest">
                          {showRevealedPin ? revealedPin : '••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowRevealedPin(!showRevealedPin)}
                          className="text-slate-400 hover:text-slate-200"
                        >
                          {showRevealedPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleResetAndUnlock}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95 text-center block"
                  >
                    Unlock & Enter Dashboard
                  </button>
                </div>
              )}

              <div className="pt-2 border-t border-slate-700/60 text-center">
                <button
                  onClick={() => setShowRecovery(false)}
                  className="text-[10px] text-slate-400 hover:text-white"
                >
                  Return to Keypad
                </button>
              </div>

            </div>
          </>
        )}
        
      </div>

      {/* Biometric Match Selector Modal */}
      {showBiometricSelect && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md text-white p-6 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-5">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-2">
                <Fingerprint className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base font-display">Offline Biometric Unlock</h3>
              <p className="text-xs text-slate-400">Select an enrolled fingerprint to match and unlock</p>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {(db.settings.enrolledBiometrics || []).map((finger, idx) => (
                <button
                  key={idx}
                  onClick={() => startVerificationScan(finger)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-brand/40 rounded-xl text-xs font-semibold text-slate-200 transition-all active:scale-98 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Fingerprint className="w-4 h-4 text-emerald-400" />
                    <span>{finger}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">Enrolled</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowBiometricSelect(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              Cancel & Use PIN
            </button>
          </div>
        </div>
      )}

      {/* Premium In-App Biometric Overlay */}
      {isScanning && (
        <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md animate-fade-in text-white p-4">
          <div className="w-full max-w-xs p-6 rounded-3xl border border-slate-800 bg-slate-900/90 text-center flex flex-col items-center space-y-5 shadow-2xl relative overflow-hidden">
            
            {/* Ambient scanner light glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl transition-colors duration-500 -z-10 ${
              scanState === 'success' ? 'bg-emerald-500/15' : 'bg-brand/15'
            }`} />

            <div className="space-y-1">
              <h3 className="font-bold text-base font-display tracking-tight text-slate-100">Biometric Verification</h3>
              <p className="text-[10px] text-brand font-semibold">Matching "{targetFinger}" fingerprint offline</p>
            </div>

            {/* Scanning graphic with laser effect */}
            <div className="relative p-5 bg-slate-800/50 rounded-2xl border border-slate-700/50 shadow-inner flex items-center justify-center w-28 h-28">
              <div className="relative">
                <Fingerprint className={`w-16 h-16 transition-all duration-300 ${
                  scanState === 'success' ? 'text-emerald-400 scale-105' : 'text-brand'
                }`} />
                
                {/* Simulated scanning laser line */}
                {scanState === 'scanning' && (
                  <div className="absolute left-0 right-0 h-[2px] bg-brand shadow-[0_0_8px_var(--color-brand)] animate-[bounce_1.5s_infinite] pointer-events-none" />
                )}
              </div>
            </div>

            <div className="space-y-1">
              {scanState === 'scanning' && (
                <p className="text-xs font-semibold text-brand animate-pulse">
                  Scanning fingerprint...
                </p>
              )}
              {scanState === 'success' && (
                <p className="text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Access Granted
                </p>
              )}
              <p className="text-[9px] text-slate-500 italic">
                {scanState === 'scanning' ? 'Verify identity securely' : 'Authentication successful!'}
              </p>
            </div>

            <button
              onClick={() => {
                setIsScanning(false);
                setScanState('idle');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
