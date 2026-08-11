import React, { useState, useMemo } from 'react';
import { useTransport } from '../context/TransportContext';
import { Driver } from '../types';
import { Search, Plus, Edit, Trash2, User, Phone, MapPin, Truck, Key } from 'lucide-react';

export const Drivers: React.FC = () => {
  const { db, addDriver, editDriver, deleteDriver } = useTransport();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'absent'>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Custom Confirm & PIN verification dialog overlay state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    requiresPin: boolean;
    pinInput: string;
    error: string;
    onConfirm: () => void;
  } | null>(null);

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

  // Form states
  const [dName, setDName] = useState<string>('');
  const [dMobile, setDMobile] = useState<string>('');
  const [dAddress, setDAddress] = useState<string>('');
  const [dAssignedVehicle, setDAssignedVehicle] = useState<string>('none');
  const [dStatus, setDStatus] = useState<'active' | 'inactive' | 'absent'>('active');

  const filteredDrivers = useMemo(() => {
    return db.drivers.filter(d => {
      const matchesSearch = 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.mobile.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.address.toLowerCase().includes(searchTerm.toLowerCase());
      
      const currentStatus = d.status || 'active';
      const matchesStatus = filterStatus === 'all' || currentStatus === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [db.drivers, searchTerm, filterStatus]);

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setDName('');
    setDMobile('');
    setDAddress('');
    setDAssignedVehicle('none');
    setDStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: Driver) => {
    const isPinActive = db.settings.pinLock && !!db.settings.pinCode;
    if (isPinActive) {
      setConfirmDialog({
        isOpen: true,
        title: 'Unlock Driver Edit',
        description: `Please enter your 4-Digit Security PIN to edit driver "${d.name}".`,
        requiresPin: true,
        pinInput: '',
        error: '',
        onConfirm: () => {
          setEditingDriver(d);
          setDName(d.name);
          setDMobile(d.mobile);
          setDAddress(d.address);
          setDAssignedVehicle(d.assignedVehicleId || 'none');
          setDStatus(d.status || 'active');
          setIsModalOpen(true);
        }
      });
    } else {
      setEditingDriver(d);
      setDName(d.name);
      setDMobile(d.mobile);
      setDAddress(d.address);
      setDAssignedVehicle(d.assignedVehicleId || 'none');
      setDStatus(d.status || 'active');
      setIsModalOpen(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dName || !dMobile) {
      alert("Driver Name and Mobile Number are required");
      return;
    }

    if (editingDriver) {
      editDriver({
        id: editingDriver.id,
        name: dName,
        mobile: dMobile,
        address: dAddress,
        assignedVehicleId: dAssignedVehicle,
        status: dStatus
      });
    } else {
      addDriver({
        name: dName,
        mobile: dMobile,
        address: dAddress,
        assignedVehicleId: dAssignedVehicle,
        status: dStatus
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    const isPinActive = db.settings.pinLock && !!db.settings.pinCode;
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Driver?',
      description: `Are you sure you want to move driver "${name}" to the Trash Bin?`,
      requiresPin: isPinActive,
      pinInput: '',
      error: '',
      onConfirm: () => {
        deleteDriver(id);
      }
    });
  };

  // Helper to find vehicle details
  const getVehicleNumber = (vehicleId: string): string => {
    const v = db.vehicles.find(item => item.id === vehicleId);
    return v ? `${v.number} (${v.name})` : 'Unassigned';
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
            Manage Drivers & Staff
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Registered: <span className="font-semibold font-mono text-indigo-500">{db.drivers.length} drivers</span>
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Driver
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search drivers by name, mobile, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        {/* Status Toggle Switcher */}
        <div className="flex bg-slate-50 dark:bg-slate-700/40 p-1 rounded-xl border border-slate-100 dark:border-slate-700 self-start md:self-auto">
          {(['all', 'active', 'inactive', 'absent'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                filterStatus === status
                  ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {status === 'absent' ? 'Absent' : status === 'inactive' ? 'Inactive' : status === 'active' ? 'Active' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Drivers List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDrivers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
            No drivers found. Click "Add Driver" to create a profile.
          </div>
        ) : (
          filteredDrivers.map((d) => {
            const hasVehicle = d.assignedVehicleId && d.assignedVehicleId !== 'none';
            const driverStatus = d.status || 'active';
            return (
              <div
                key={d.id}
                className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-sm rounded-3xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Status Bar Indicator */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${driverStatus === 'active' ? 'bg-emerald-500' : driverStatus === 'absent' ? 'bg-amber-500' : 'bg-slate-400'}`} />

                <div>
                  <div className="flex justify-between items-start mb-4 pt-1">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl ${
                        driverStatus === 'active' 
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' 
                          : driverStatus === 'absent' 
                          ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' 
                          : 'bg-slate-50 dark:bg-slate-500/10 text-slate-400'
                      }`}>
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-800 dark:text-white font-display">
                          {d.name}
                        </h3>
                        <a 
                          href={`tel:${d.mobile}`} 
                          className="text-xs text-slate-400 hover:text-indigo-500 transition-colors flex items-center gap-1 mt-0.5 font-mono"
                        >
                          <Phone className="w-3 h-3" />
                          {d.mobile}
                        </a>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      driverStatus === 'active'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500'
                        : driverStatus === 'absent'
                        ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500'
                        : 'bg-slate-50 dark:bg-slate-500/10 text-slate-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${driverStatus === 'active' ? 'bg-emerald-500 animate-pulse' : driverStatus === 'absent' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                      {driverStatus.toUpperCase()}
                    </span>
                  </div>

                  {/* Details block */}
                  <div className="space-y-3 pt-3 border-t border-slate-50 dark:border-slate-700/40 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{d.address || 'Address not listed'}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Truck className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="flex items-center gap-1.5 flex-wrap">
                        Duty Vehicle: 
                        <span className={`inline-flex items-center font-semibold rounded-full px-2 py-0.5 text-[10px] ${
                          hasVehicle 
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 border border-indigo-100 dark:border-indigo-500/20' 
                            : 'bg-slate-50 dark:bg-slate-700 text-slate-400'
                        }`}>
                          {getVehicleNumber(d.assignedVehicleId)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit & Delete Actions */}
                <div className="flex justify-end gap-2.5 mt-5 pt-3 border-t border-slate-50 dark:border-slate-700/40">
                  <button
                    onClick={() => handleOpenEdit(d)}
                    className="p-2 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl text-slate-500 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Edit Driver"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(d.id, d.name)}
                    className="p-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl text-rose-500 transition-colors cursor-pointer"
                    title="Delete Driver"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
            {/* Modal Title */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold font-display text-slate-800 dark:text-white text-lg">
                {editingDriver ? 'Edit Driver Details' : 'Register New Driver'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Driver Full Name (Required)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jagmeet Singh"
                  value={dName}
                  onChange={(e) => setDName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Mobile Number (Required)
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={dMobile}
                  onChange={(e) => setDMobile(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Duty Vehicle Assignment
                  </label>
                  <select
                    value={dAssignedVehicle}
                    onChange={(e) => setDAssignedVehicle(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="none">Unassigned / Standby Duty</option>
                    {db.vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.number} - {v.name} {v.status !== 'active' ? `(${v.status.toUpperCase()})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Presence Status
                  </label>
                  <select
                    value={dStatus}
                    onChange={(e) => setDStatus(e.target.value as 'active' | 'inactive' | 'absent')}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="active">Active / On-Duty</option>
                    <option value="inactive">Inactive / Standby</option>
                    <option value="absent">Absent / Sick Leave</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Driver Home Address
                </label>
                <textarea
                  placeholder="Residential Address..."
                  value={dAddress}
                  onChange={(e) => setDAddress(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition-colors"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirm & PIN verification dialog overlay */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-[32px] max-w-sm w-full p-6 border border-slate-100 dark:border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-white">
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
                  <span className="text-[10px] font-bold text-rose-500 block text-center mt-1 bg-rose-500/10 px-2 py-0.5 rounded-md">
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
    </div>
  );
};
