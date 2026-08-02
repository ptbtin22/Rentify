//
//  Database.ts
//  Rentify
//
//  Created by Tin Pham on 27/7/26.
//

export type PropertyType = 'Apartment' | 'House' | 'Condo' | 'Townhouse';
export type LeaseStatus = 'active' | 'pending' | 'terminated';
export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue';

export interface KhuTro {
  id: string;
  name: string;
  address: string;
  remindDay?: number;
}

export interface Property {
  id: string;
  khuTroId: string; // Parent building complex
  name: string;
  address: string;
  propertyType: PropertyType;
  rentAmount: number;
  bedrooms: number;
  bathrooms: number;
  isOccupied: boolean;
  electricityRate: number; // e.g. price per kWh
  waterRate: number;       // e.g. flat rate or per m3
  serviceFee: number;      // e.g. flat monthly parking/maintenance fee
  remindDay?: number;
}

export interface AppConfig {
  remindDay: number;
  lateDays: number;
  leaseWarningDays: number;
  billingChannels: string[];
  leaseChannels: string[];
}

let appConfig: AppConfig = {
  remindDay: 1,
  lateDays: 3,
  leaseWarningDays: 14,
  billingChannels: ['Zalo', 'SMS'],
  leaseChannels: ['Zalo', 'Email']
};

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  password?: string; // Stored password (initially temp)
}

export interface Lease {
  id: string;
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  status: LeaseStatus;
  tenantPhoto?: string;   // Image URI reference
  contractPhoto?: string; // Image URI reference
}

export interface Payment {
  id: string;
  leaseId: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: PaymentStatus;
  notes: string;
}

// Initial Mock Data with full breakdown configurations
let khuTros: KhuTro[] = [
  { id: 'khu-1', name: 'Oakridge Apartment', address: '456 Greenway Blvd' },
  { id: 'khu-2', name: 'Greenway House', address: '128 Pinecrest Ave' }
];

let properties: Property[] = [
  {
    id: 'prop-1',
    khuTroId: 'khu-1',
    name: 'Phòng 202',
    address: '456 Greenway Blvd, Room 202',
    propertyType: 'Apartment',
    rentAmount: 1200,
    bedrooms: 2,
    bathrooms: 1,
    isOccupied: true,
    electricityRate: 3500,
    waterRate: 100000,
    serviceFee: 50000
  },
  {
    id: 'prop-2',
    khuTroId: 'khu-2',
    name: 'Căn A',
    address: '128 Pinecrest Ave',
    propertyType: 'House',
    rentAmount: 2500,
    bedrooms: 4,
    bathrooms: 2,
    isOccupied: false,
    electricityRate: 4000,
    waterRate: 120000,
    serviceFee: 60000
  },
  {
    id: 'prop-3',
    khuTroId: 'khu-1',
    name: 'Phòng 104',
    address: '456 Greenway Blvd, Room 104',
    propertyType: 'Apartment',
    rentAmount: 1100,
    bedrooms: 1,
    bathrooms: 1,
    isOccupied: true,
    electricityRate: 3500,
    waterRate: 100000,
    serviceFee: 50000
  }
];

let tenants: Tenant[] = [
  {
    id: 'tenant-1',
    name: 'Jane Tenant',
    email: 'jane@example.com',
    phone: '901234567',
    notes: 'Likes quiet hours.',
    password: '123456'
  },
  {
    id: 'tenant-2',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '987654321',
    notes: 'Interested in house viewings.',
    password: '123456'
  }
];

// Mocking multiple active leases for Jane Tenant (tenant-1) to verify Room Switcher
let leases: Lease[] = [
  {
    id: 'lease-1',
    propertyId: 'prop-1',
    tenantId: 'tenant-1',
    startDate: '2026-08-01',
    endDate: '2027-07-31',
    monthlyRent: 1200,
    securityDeposit: 1200,
    status: 'active',
    tenantPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    contractPhoto: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300'
  },
  {
    id: 'lease-2',
    propertyId: 'prop-3',
    tenantId: 'tenant-1',
    startDate: '2026-09-01',
    endDate: '2027-08-31',
    monthlyRent: 1100,
    securityDeposit: 1100,
    status: 'active',
    tenantPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    contractPhoto: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300'
  }
];

let payments: Payment[] = [
  {
    id: 'pay-1',
    leaseId: 'lease-1',
    amount: 1200,
    dueDate: '2026-08-01',
    paymentDate: '2026-08-01',
    status: 'Paid',
    notes: 'August Rent'
  },
  {
    id: 'pay-2',
    leaseId: 'lease-1',
    amount: 1200,
    dueDate: '2026-09-01',
    status: 'Pending',
    notes: 'September Rent'
  },
  {
    id: 'pay-3',
    leaseId: 'lease-1',
    amount: 1200,
    dueDate: '2026-10-01',
    status: 'Pending',
    notes: 'October Rent'
  },
  {
    id: 'pay-4',
    leaseId: 'lease-2',
    amount: 1100,
    dueDate: '2026-09-01',
    paymentDate: '2026-09-01',
    status: 'Paid',
    notes: 'September Rent'
  },
  {
    id: 'pay-5',
    leaseId: 'lease-2',
    amount: 1100,
    dueDate: '2026-10-01',
    status: 'Pending',
    notes: 'October Rent'
  }
];

// Listeners for reactivity
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

let activeTenantLeaseId: string | null = null;
let fireSoundEnabled = true;

export const Database = {
  getProperties: () => properties,
  getTenants: () => tenants,
  getLeases: () => leases,
  getPayments: () => payments,
  getAppConfig: () => appConfig,
  updateAppConfig: (newConfig: Partial<AppConfig>) => {
    appConfig = { ...appConfig, ...newConfig };
    notify();
  },
  
  getActiveTenantLeaseId: () => activeTenantLeaseId,
  setActiveTenantLeaseId: (id: string | null) => {
    activeTenantLeaseId = id;
    notify();
  },
  isFireSoundEnabled: () => fireSoundEnabled,
  setFireSoundEnabled: (enabled: boolean) => {
    fireSoundEnabled = enabled;
    notify();
  },
  
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },

  // Property Actions
  addProperty: (property: Omit<Property, 'id' | 'isOccupied'>) => {
    const newProperty: Property = {
      ...property,
      id: 'prop-' + Math.random().toString(36).substring(7),
      isOccupied: false
    };
    properties.push(newProperty);
    notify();
    return newProperty;
  },

  deleteProperty: (id: string) => {
    properties = properties.filter(p => p.id !== id);
    // Delete linked leases and payments
    const linkedLeases = leases.filter(l => l.propertyId === id);
    linkedLeases.forEach(l => Database.deleteLease(l.id));
    notify();
  },

  // Tenant Actions
  addTenant: (tenant: Omit<Tenant, 'id'>) => {
    const newTenant: Tenant = {
      ...tenant,
      id: 'tenant-' + Math.random().toString(36).substring(7)
    };
    tenants.push(newTenant);
    notify();
    return newTenant;
  },

  updateTenantPassword: (id: string, newPass: string) => {
    tenants = tenants.map(t => t.id === id ? { ...t, password: newPass } : t);
    notify();
  },

  deleteTenant: (id: string) => {
    tenants = tenants.filter(t => t.id !== id);
    const linkedLeases = leases.filter(l => l.tenantId === id);
    linkedLeases.forEach(l => Database.deleteLease(l.id));
    notify();
  },

  // Lease Actions
  createLease: (lease: Omit<Lease, 'id' | 'status'>) => {
    const newLease: Lease = {
      ...lease,
      id: 'lease-' + Math.random().toString(36).substring(7),
      status: 'active'
    };
    
    // Set property as occupied
    properties = properties.map(p => p.id === lease.propertyId ? { ...p, isOccupied: true } : p);
    leases.push(newLease);

    // Generate 3 mock payments automatically for this new lease
    const start = new Date(lease.startDate);
    for (let i = 0; i < 3; i++) {
      const dueDate = new Date(start);
      dueDate.setMonth(start.getMonth() + i);
      const invoiceMonth = dueDate.toLocaleString('default', { month: 'long' });
      payments.push({
        id: 'pay-' + Math.random().toString(36).substring(7),
        leaseId: newLease.id,
        amount: lease.monthlyRent,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'Pending',
        notes: `${invoiceMonth} Rent`
      });
    }

    notify();
    return newLease;
  },

  deleteLease: (id: string) => {
    const lease = leases.find(l => l.id === id);
    if (lease) {
      // Mark property as vacant
      properties = properties.map(p => p.id === lease.propertyId ? { ...p, isOccupied: false } : p);
    }
    leases = leases.filter(l => l.id !== id);
    payments = payments.filter(p => p.leaseId !== id);
    notify();
  },

  // Payment Actions
  recordPaymentReceived: (paymentId: string) => {
    payments = payments.map(p =>
      p.id === paymentId
        ? { ...p, status: 'Paid' as const, paymentDate: new Date().toISOString().split('T')[0] }
        : p
    );
    notify();
  },

  updatePaymentAmountAndStatus: (paymentId: string, amount: number, status: 'Paid' | 'Pending') => {
    payments = payments.map(p =>
      p.id === paymentId
        ? {
            ...p,
            amount,
            status,
            paymentDate: status === 'Paid' ? new Date().toISOString().split('T')[0] : p.paymentDate
          }
        : p
    );
    notify();
  },

  // KhuTro Actions
  getKhuTros: () => {
    return khuTros;
  },

  addKhuTro: (name: string, address: string, remindDay?: number) => {
    const newKhu: KhuTro = {
      id: 'khu-' + Math.random().toString(36).substring(7),
      name,
      address,
      remindDay
    };
    khuTros.push(newKhu);
    notify();
    return newKhu;
  },

  deleteKhuTro: (id: string) => {
    khuTros = khuTros.filter(k => k.id !== id);
    // Delete linked properties
    const linkedProps = properties.filter(p => p.khuTroId === id);
    linkedProps.forEach(p => Database.deleteProperty(p.id));
    notify();
  }
};
