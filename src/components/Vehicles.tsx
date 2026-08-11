import React, { useState, useMemo } from 'react';
import { useTransport } from '../context/TransportContext';
import { Vehicle } from '../types';
import { Search, Plus, Edit, Trash2, Truck, User, CheckCircle2, AlertCircle } from 'lucide-react';

export const Vehicles: React.FC = () => {
  const { db, addVehicle, editVehicle, deleteVehicle } = useTransport();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'absent'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

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
  const [vNumber, setVNumber] = useState<string>('');
  const [vName, setVName] = useState<string>('');
  const [vType, setVType] = useState<string>('Truck');
  const [vOwner, setVOwner] = useState<string>('');
  const [vStatus, setVStatus] = useState<'active' | 'inactive' | 'absent'>('active');
  const [vAssessment, setVAssessment] = useState<string>('');

  // Types list
  const vehicleTypes = ['Truck', 'Mini Truck', 'Tipper', 'Bus', 'Container', 'Tanker', 'Van', 'Other'];

  const uniqueTypes = useMemo(() => {
    const typesSet = new Set<string>();
    db.vehicles.forEach(v => {
      if (v.type) {
        typesSet.add(v.type);
      }
    });
    // Add standard preset types (excluding 'Other' for cleaner filtering)
    vehicleTypes.forEach(t => {
      if (t !== 'Other') {
        typesSet.add(t);
      }
    });
    return Array.from(typesSet).sort();
  }, [db.vehicles]);

  const filteredVehicles = useMemo(() => {
    return db.vehicles.filter(v => {
      const matchesSearch = 
        v.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.owner.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        filterStatus === 'all' || v.status === filterStatus;

      const matchesType = 
        filterType === 'all' || v.type === filterType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [db.vehicles, searchTerm, filterStatus, filterType]);

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setVNumber('');
    setVName('');
    setVType('Truck');
    setVOwner(db.settings.companyName || 'Self');
    setVStatus('active');
    setVAssessment('Excellent Condition');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    const isPinActive = db.settings.pinLock && !!db.settings.pinCode;
    if (isPinActive) {
      setConfirmDialog({
        isOpen: true,
        title: 'Unlock Vehicle Edit',
        description: `Please enter your 4-Digit Security PIN to edit vehicle "${v.number}".`,
        requiresPin: true,
        pinInput: '',
        error: '',
        onConfirm: () => {
          setEditingVehicle(v);
          setVNumber(v.number);
          setVName(v.name);
          setVType(v.type);
          setVOwner(v.owner);
          setVStatus(v.status);
          setVAssessment(v.assessment || '');
          setIsModalOpen(true);
        }
      });
    } else {
      setEditingVehicle(v);
      setVNumber(v.number);
      setVName(v.name);
      setVType(v.type);
      setVOwner(v.owner);
      setVStatus(v.status);
      setVAssessment(v.assessment || '');
      setIsModalOpen(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vNumber || !vName) {
      alert("Please fill in Vehicle Number and Vehicle Name");
      return;
    }

    if (editingVehicle) {
      editVehicle({
        id: editingVehicle.id,
        number: vNumber.toUpperCase(),
        name: vName,
        type: vType,
        owner: vOwner,
        status: vStatus,
        assessment: vAssessment
      });
    } else {
      addVehicle({
        number: vNumber.toUpperCase(),
        name: vName,
        type: vType,
        owner: vOwner,
        status: vStatus,
        assessment: vAssessment
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, num: string) => {
    const isPinActive = db.settings.pinLock && !!db.settings.pinCode;
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Vehicle?',
      description: `Are you sure you want to move vehicle "${num}" to the Trash Bin? All drivers linked to this vehicle will be unassigned.`,
      requiresPin: isPinActive,
      pinInput: '',
      error: '',
      onConfirm: () => {
        deleteVehicle(id);
      }
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
            Manage Vehicles
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Registered: <span className="font-semibold font-mono text-indigo-500">{db.vehicles.length} vehicles</span>
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Vehicle
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by number, model, owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        {/* Vehicle Type Filter Dropdown */}
        <div className="flex items-center bg-slate-50 dark:bg-slate-700/40 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 self-start md:self-auto">
          <span className="text-xs font-semibold text-slate-400 mr-2 whitespace-nowrap">Class:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
          >
            <option value="all">All Vehicle Types</option>
            {uniqueTypes.map((type) => (
              <option key={type} value={type} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">
                {type}
              </option>
            ))}
          </select>
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

      {/* Vehicles Grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVehicles.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
            No matching vehicles found. Click "Add Vehicle" to create one.
          </div>
        ) : (
          filteredVehicles.map((v) => {
            const isVehicleActive = v.status === 'active';
            return (
              <div
                key={v.id}
                className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-sm rounded-3xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Status Bar Indicator */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${v.status === 'active' ? 'bg-emerald-500' : v.status === 'absent' ? 'bg-amber-500' : 'bg-slate-400'}`} />

                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {v.type}
                      </span>
                      <h3 className="text-lg font-bold font-display text-slate-800 dark:text-white">
                        {v.number}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {v.name}
                      </p>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                      v.status === 'active'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500'
                        : v.status === 'absent'
                        ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500'
                        : 'bg-slate-50 dark:bg-slate-500/10 text-slate-400'
                    }`}>
                      {v.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {v.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Owner: <strong className="text-slate-700 dark:text-slate-100">{v.owner}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-slate-400" />
                      <span>Fleet Class: <strong className="text-slate-700 dark:text-slate-100">{v.type}</strong></span>
                    </div>
                    {v.assessment && (
                      <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-750/30 p-2 rounded-xl border border-slate-100 dark:border-slate-700/40 mt-1">
                        <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Vehicle Assessment</span>
                          <span className="font-medium text-slate-700 dark:text-slate-200">{v.assessment}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit & Delete Actions */}
                <div className="flex justify-end gap-2.5 mt-5 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                  <button
                    onClick={() => handleOpenEdit(v)}
                    className="p-2 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl text-slate-500 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Edit Vehicle Details"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(v.id, v.number)}
                    className="p-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl text-rose-500 transition-colors cursor-pointer"
                    title="Delete Vehicle"
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
                {editingVehicle ? 'Edit Vehicle Details' : 'Register New Vehicle'}
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
                  Vehicle Number (Required)
                </label>
                <input
                  type="text"
                  placeholder="e.g. MH-12-QW-9876"
                  value={vNumber}
                  onChange={(e) => setVNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Vehicle Brand & Model (Required)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tata Signa, Bolero Pickup"
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleTypes.includes(vType) ? vType : 'Other'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Other') {
                        setVType('');
                      } else {
                        setVType(val);
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none"
                  >
                    {vehicleTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    {!vehicleTypes.includes(vType) && vType !== '' && (
                      <option value={vType}>{vType}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Active Status
                  </label>
                  <select
                    value={vStatus}
                    onChange={(e) => setVStatus(e.target.value as 'active' | 'inactive' | 'absent')}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="absent">Absent / Off-duty</option>
                  </select>
                </div>
              </div>

              {(!vehicleTypes.includes(vType) || vType === '') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Custom Vehicle Type / Fleet Class
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10-Wheel Truck, Heavy Tipper, Trailer"
                    value={vType}
                    onChange={(e) => setVType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Owner Name / Business Division
                </label>
                <input
                  type="text"
                  placeholder="e.g. Self, Sardar Logistics"
                  value={vOwner}
                  onChange={(e) => setVOwner(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Vehicle Assessment / Health Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Excellent condition, Fitness valid until 2027"
                  value={vAssessment}
                  onChange={(e) => setVAssessment(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
