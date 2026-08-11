import { TransportDatabase, Vehicle, Driver, CategoryStructure, IncomeEntry, ExpenseEntry, FuelEntry } from './types';

export const DEFAULT_CATEGORIES: CategoryStructure[] = [
  {
    id: 'inc-freight',
    name: 'Trip Freight',
    type: 'income',
    subcategories: ['Full Load', 'Part Load', 'Daily Contract', 'Container Rent']
  },
  {
    id: 'inc-passenger',
    name: 'Passenger Fare',
    type: 'income',
    subcategories: ['Regular Run', 'Private Booking', 'Event Trip']
  },
  {
    id: 'inc-lease',
    name: 'Vehicle Lease',
    type: 'income',
    subcategories: ['Daily Lease', 'Monthly Rental']
  },
  {
    id: 'inc-other',
    name: 'Other Income',
    type: 'income',
    subcategories: ['Scrap Sale', 'Brokerage Commission', 'General']
  },
  {
    id: 'exp-fuel',
    name: 'Fuel',
    type: 'expense',
    subcategories: ['Diesel', 'Petrol', 'CNG', 'AdBlue / DEF']
  },
  {
    id: 'exp-toll',
    name: 'Toll Tax',
    type: 'expense',
    subcategories: ['National Highway Toll', 'State Highway Toll', 'Expressway Toll']
  },
  {
    id: 'exp-fastag',
    name: 'Fastag',
    type: 'expense',
    subcategories: ['Fastag Recharge', 'Fastag Penalty']
  },
  {
    id: 'exp-salary',
    name: 'Driver Salary',
    type: 'expense',
    subcategories: ['Monthly Salary', 'Daily Wages', 'Trip Allowance', 'Overtime Bonus']
  },
  {
    id: 'exp-maintenance',
    name: 'Maintenance',
    type: 'expense',
    subcategories: ['Scheduled Service', 'Breakdown Repair', 'Spare Parts Replacement']
  },
  {
    id: 'exp-tyre',
    name: 'Tyre',
    type: 'expense',
    subcategories: ['New Tyre Purchase', 'Tyre Retreading', 'Puncture Repair', 'Wheel Alignment']
  },
  {
    id: 'exp-oil',
    name: 'Engine Oil',
    type: 'expense',
    subcategories: ['Oil Change', 'Top Up Extra']
  },
  {
    id: 'exp-service',
    name: 'Service',
    type: 'expense',
    subcategories: ['Authorized Dealer Service', 'Local Garage Wash & Grease']
  },
  {
    id: 'exp-insurance',
    name: 'Insurance',
    type: 'expense',
    subcategories: ['Annual Comprehensive', 'Third Party Liability', 'Goods/Cargo Insurance']
  },
  {
    id: 'exp-rto',
    name: 'RTO',
    type: 'expense',
    subcategories: ['Permit Renewal', 'Fitness Certificate', 'Challan / Police Fine', 'Road Tax']
  },
  {
    id: 'exp-parking',
    name: 'Parking',
    type: 'expense',
    subcategories: ['Night Parking', 'Loading Dock Fee', 'Border Entry Parking']
  },
  {
    id: 'exp-food',
    name: 'Food',
    type: 'expense',
    subcategories: ['Driver Meal Allowance', 'Helper Food', 'Client Dinner']
  },
  {
    id: 'exp-hotel',
    name: 'Hotel',
    type: 'expense',
    subcategories: ['Driver Night Stay', 'Emergency Lodge Lodging']
  },
  {
    id: 'exp-repair',
    name: 'Repair',
    type: 'expense',
    subcategories: ['Body Repair & Paint', 'Electrical Repair', 'Chassis Welding']
  },
  {
    id: 'exp-other',
    name: 'Other',
    type: 'expense',
    subcategories: ['Office Rent', 'Utility Bill', 'Mobile Recharge', 'Sundry Cash']
  }
];

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'v-1',
    number: 'MH-12-QW-9876',
    name: 'Tata Signa 2823',
    type: '10-Wheel Truck',
    owner: 'Ramesh Transport Corp',
    status: 'active',
    assessment: 'Excellent - Fit for Long Haul'
  },
  {
    id: 'v-2',
    number: 'MH-14-GH-1234',
    name: 'Mahindra Bolero Pickup',
    type: 'Mini Truck',
    owner: 'Self',
    status: 'active',
    assessment: 'Good - Local Delivery Only'
  },
  {
    id: 'v-3',
    number: 'DL-01-AB-4321',
    name: 'BharatBenz 3523R',
    type: '12-Wheel Container',
    owner: 'Self',
    status: 'active',
    assessment: 'Good - Needs Wheel Alignment'
  },
  {
    id: 'v-4',
    number: 'GJ-03-XX-5566',
    name: 'Ashok Leyland 4220',
    type: '14-Wheel Tipper',
    owner: 'Sardar Logistics',
    status: 'inactive',
    assessment: 'Under Repair - Gearbox Issue'
  }
];

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'd-1',
    name: 'Suresh Kumar',
    mobile: '+91 98765 43210',
    address: 'Sector 15, Vashi, Navi Mumbai',
    assignedVehicleId: 'v-1',
    status: 'active'
  },
  {
    id: 'd-2',
    name: 'Jagmeet Singh',
    mobile: '+91 91234 56789',
    address: 'Guru Nanak Colony, Amritsar, Punjab',
    assignedVehicleId: 'v-3',
    status: 'active'
  },
  {
    id: 'd-3',
    name: 'Mahesh Patil',
    mobile: '+91 88888 77777',
    address: 'Near RTO Office, Pune, Maharashtra',
    assignedVehicleId: 'v-2',
    status: 'active'
  }
];

// Generate dynamic dates (last 7 days to make reports/charts look brilliant)
const getPastDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export const INITIAL_INCOME: IncomeEntry[] = [
  {
    id: 'inc-1',
    date: getPastDate(0),
    time: '10:30',
    vehicleId: 'v-1',
    driverId: 'd-1',
    customerName: 'Reliance Industries',
    fromLocation: 'Mumbai Port',
    toLocation: 'Pune Logistics Hub',
    tripAmount: 45000,
    advance: 15000,
    balance: 30000,
    paymentMode: 'Bank Transfer',
    category: 'Trip Freight',
    subCategory: 'Full Load',
    notes: 'Transported industrial steel coils. Goods delivered successfully.'
  },
  {
    id: 'inc-2',
    date: getPastDate(1),
    time: '14:15',
    vehicleId: 'v-2',
    driverId: 'd-3',
    customerName: 'Amit Grocery Mart',
    fromLocation: 'Vashi APMC Market',
    toLocation: 'Thane Outlets',
    tripAmount: 12000,
    advance: 12000,
    balance: 0,
    paymentMode: 'UPI',
    category: 'Trip Freight',
    subCategory: 'Part Load',
    notes: 'Fresh vegetables delivery. Full payment settled at unload.'
  },
  {
    id: 'inc-3',
    date: getPastDate(2),
    time: '08:00',
    vehicleId: 'v-3',
    driverId: 'd-2',
    customerName: 'Amazon Logistics',
    fromLocation: 'Delhi Warehouse',
    toLocation: 'Jaipur Fulfillment Center',
    tripAmount: 55000,
    advance: 20000,
    balance: 35000,
    paymentMode: 'Bank Transfer',
    category: 'Trip Freight',
    subCategory: 'Container Rent',
    notes: 'E-commerce goods container load. Scheduled monthly payout.'
  },
  {
    id: 'inc-4',
    date: getPastDate(4),
    time: '11:00',
    vehicleId: 'v-1',
    driverId: 'd-1',
    customerName: 'Godrej & Boyce',
    fromLocation: 'Vikhroli, Mumbai',
    toLocation: 'Nashik Warehouse',
    tripAmount: 38000,
    advance: 10000,
    balance: 28000,
    paymentMode: 'Cash',
    category: 'Trip Freight',
    subCategory: 'Full Load',
    notes: 'Home appliances shipment.'
  },
  {
    id: 'inc-5',
    date: getPastDate(6),
    time: '17:45',
    vehicleId: 'v-2',
    driverId: 'd-3',
    customerName: 'Local Farmer Group',
    fromLocation: 'Karjat Farm',
    toLocation: 'Dadar Mandi',
    tripAmount: 9500,
    advance: 5000,
    balance: 4500,
    paymentMode: 'Cash',
    category: 'Trip Freight',
    subCategory: 'Part Load',
    notes: 'Rice bags distribution.'
  }
];

export const INITIAL_EXPENSES: ExpenseEntry[] = [
  {
    id: 'exp-1',
    date: getPastDate(0),
    time: '07:30',
    vehicleId: 'v-1',
    driverId: 'd-1',
    category: 'Fuel',
    subCategory: 'Diesel',
    amount: 14000,
    notes: 'Filled diesel at HP Pump. Rate: ₹92.5/L',
  },
  {
    id: 'exp-2',
    date: getPastDate(0),
    time: '11:15',
    vehicleId: 'v-1',
    driverId: 'd-1',
    category: 'Toll Tax',
    subCategory: 'National Highway Toll',
    amount: 1250,
    notes: 'Mumbai-Pune Expressway toll gate.'
  },
  {
    id: 'exp-3',
    date: getPastDate(1),
    time: '12:00',
    vehicleId: 'v-2',
    driverId: 'd-3',
    category: 'Fuel',
    subCategory: 'Diesel',
    amount: 3500,
    notes: 'Regular fuel refill at Shell station.'
  },
  {
    id: 'exp-4',
    date: getPastDate(2),
    time: '05:30',
    vehicleId: 'v-3',
    driverId: 'd-2',
    category: 'Fastag',
    subCategory: 'Fastag Recharge',
    amount: 5000,
    notes: 'Recharged SBI Fastag wallet for long trip.'
  },
  {
    id: 'exp-5',
    date: getPastDate(3),
    time: '18:00',
    vehicleId: 'v-1',
    driverId: 'd-1',
    category: 'Driver Salary',
    subCategory: 'Trip Allowance',
    amount: 2500,
    notes: 'Suresh Kumar - trip allowance and food bonus.'
  },
  {
    id: 'exp-6',
    date: getPastDate(5),
    time: '14:00',
    vehicleId: 'v-2',
    driverId: 'd-3',
    category: 'Maintenance',
    subCategory: 'Spare Parts Replacement',
    amount: 4200,
    notes: 'Changed brake pads and wiper blades.'
  }
];

export const INITIAL_FUEL: FuelEntry[] = [
  {
    id: 'fuel-1',
    date: getPastDate(6),
    time: '08:00',
    vehicleId: 'v-1',
    odometerReading: 124500,
    previousOdometer: 124100,
    distanceTravelled: 400,
    fuelQuantity: 100,
    fuelRate: 92.5,
    totalCost: 9250,
    mileage: 4.0,
    costPerKm: 23.13,
    fuelStation: 'Indian Oil Corp, Panvel',
    notes: 'First log for trip MH-12'
  },
  {
    id: 'fuel-2',
    date: getPastDate(3),
    time: '09:30',
    vehicleId: 'v-1',
    odometerReading: 125100,
    previousOdometer: 124500,
    distanceTravelled: 600,
    fuelQuantity: 145,
    fuelRate: 93.0,
    totalCost: 13485,
    mileage: 4.14,
    costPerKm: 22.48,
    fuelStation: 'HP Petrol Pump, Expressway',
    notes: 'Full tank fill. Improved mileage.'
  },
  {
    id: 'fuel-3',
    date: getPastDate(4),
    time: '13:00',
    vehicleId: 'v-2',
    odometerReading: 45300,
    previousOdometer: 44950,
    distanceTravelled: 350,
    fuelQuantity: 32,
    fuelRate: 91.0,
    totalCost: 2912,
    mileage: 10.94,
    costPerKm: 8.32,
    fuelStation: 'Bharat Petroleum, Thane',
    notes: 'City and highway run.'
  }
];

export const INITIAL_DATABASE: TransportDatabase = {
  vehicles: INITIAL_VEHICLES,
  drivers: INITIAL_DRIVERS,
  income: INITIAL_INCOME,
  expenses: INITIAL_EXPENSES,
  fuelRecords: INITIAL_FUEL,
  categories: DEFAULT_CATEGORIES,
  settings: {
    currencySymbol: '₹',
    companyName: 'Express Logistics Inc.',
    companyLogo: '',
    theme: 'light',
    pinLock: false,
    pinCode: '',
    pinRecoveryQuestion: 'First vehicle brand?',
    pinRecoveryAnswer: 'Tata',
    fingerprintLock: false,
    autoBackup: true,
    colorTheme: 'indigo',
    exportFolder: 'Downloads/TransportLedger',
    textStyle: 'sans',
    bgTexture: 'solid',
    decimalPlaces: 2
  },
  trashBin: []
};
