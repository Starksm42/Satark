export interface Vehicle {
  id: string;
  number: string;
  name: string;
  type: string; // e.g. Truck, Tipper, Container, Bus, Van, etc.
  owner: string;
  status: 'active' | 'inactive' | 'absent';
  assessment?: string;
}

export interface Driver {
  id: string;
  name: string;
  mobile: string;
  address: string;
  assignedVehicleId: string; // ID of the vehicle, or 'none'
  status?: 'active' | 'inactive' | 'absent';
}

export interface IncomeEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  vehicleId: string;
  driverId: string;
  customerName: string;
  fromLocation: string;
  toLocation: string;
  tripAmount: number;
  advance: number;
  balance: number;
  paymentMode: 'Cash' | 'Bank Transfer' | 'UPI' | 'Card' | 'Cheque';
  category: string;
  subCategory: string;
  notes: string;
}

export interface ExpenseEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  vehicleId: string;
  driverId: string;
  category: string; // e.g. Fuel, Toll, Maintenance, etc.
  subCategory: string;
  amount: number;
  notes: string;
  billPhoto?: string; // Base64 image string
}

export interface FuelEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  vehicleId: string;
  odometerReading: number;
  previousOdometer: number;
  distanceTravelled: number;
  fuelQuantity: number; // Liters or Kg
  fuelRate: number; // Rate per liter or kg
  totalCost: number;
  mileage: number; // KM/L or KM/Kg
  costPerKm: number; // Cost per KM
  fuelStation: string;
  notes: string;
  fuelType?: 'liquid' | 'gas'; // liquid (Diesel/Petrol) or gas (CNG)
  fuelUnit?: 'Liters' | 'Kg'; // Liters (L) or Kilograms (Kg)
}

export interface CategoryStructure {
  id: string;
  name: string;
  type: 'income' | 'expense';
  subcategories: string[];
}

export interface AppSettings {
  currencySymbol: string;
  companyName: string;
  companyLogo?: string; // Base64
  theme: 'light' | 'dark';
  colorTheme?: 'indigo' | 'emerald' | 'blue' | 'rose' | 'amber' | 'violet'; // Customs color themes
  pinLock: boolean;
  pinCode: string;
  pinRecoveryQuestion?: string; // Recovery Security Question
  pinRecoveryAnswer?: string; // Recovery Security Question Answer
  fingerprintLock: boolean;
  autoBackup: boolean;
  exportFolder: string;
  textStyle?: 'sans' | 'display' | 'mono' | 'handwriting' | 'cursive';
  bgTexture?: 'solid' | 'dots' | 'grid' | 'stripes';
  decimalPlaces?: number;
  enrolledBiometrics?: string[];
  biometricPermissionGranted?: boolean;
}

export interface TrashItem {
  id: string;
  type: 'income' | 'expense' | 'fuel' | 'vehicle' | 'driver';
  deletedAt: string;
  originalData: any;
}

export interface TransportDatabase {
  vehicles: Vehicle[];
  drivers: Driver[];
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
  fuelRecords: FuelEntry[];
  categories: CategoryStructure[];
  settings: AppSettings;
  trashBin: TrashItem[];
}
