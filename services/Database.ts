//
//  Database.ts
//  Rentify
//
//  Created by Tin Pham on 27/7/26.
//

import { getMockContractPhotoUris } from './contractAssets';

/** 6 trang hợp đồng demo (contract-1…6.jpeg) — dùng khi xem hợp đồng. */
const DEMO_CONTRACT_PHOTOS = getMockContractPhotoUris();

export type PropertyType = 'Apartment' | 'House' | 'Condo' | 'Townhouse';
export type LeaseStatus = 'active' | 'pending' | 'terminated';
export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue';

export interface KhuTro {
  id: string;
  name: string;
  address: string;
  remindDay?: number;
}

export interface LandlordProfile {
  name: string;
  phone: string;
  zalo: string;
  email: string;
}

export interface CustomFee {
  id: string;
  name: string;
  amount: number;
}

const landlordProfile: LandlordProfile = {
  name: 'Huỳnh Gia Âu',
  phone: '0987012345',
  zalo: '0935245059',
  email: 'huynhgiaau@gmail.com',
};

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
  parkingFee?: number;
  customFees?: CustomFee[];
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
  photoUri?: string;
  zalo?: string;
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
  contractPhotos?: string[];
  contractUpdatedAt?: string;
}

export function getLeaseContractPhotos(lease: Lease): string[] {
  if (lease.contractPhotos && lease.contractPhotos.length > 0) return lease.contractPhotos;
  if (lease.contractPhoto) return [lease.contractPhoto];
  return [];
}

export interface Payment {
  id: string;
  leaseId: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: PaymentStatus;
  notes: string;
  /** Meter evidence captured when tenant paid via OCR flow (Paid only). */
  previousMeterKwh?: number;
  currentMeterKwh?: number;
  /** Remote URI if any; otherwise UI falls back to local demo meter photo. */
  meterPhotoUri?: string;
}

// Initial Mock Data with full breakdown configurations
let khuTros: KhuTro[] = [
  { id: 'khu-1', name: 'Khu Trọ Đường Xanh', address: '456 Đường Xanh, Q.1, TP.HCM' },
  { id: 'khu-2', name: 'Nhà Trọ Đường Thông', address: '128 Đường Thông, Q.3, TP.HCM' }
];

let properties: Property[] = [
  {
    id: 'prop-1',
    khuTroId: 'khu-1',
    name: 'Phòng 202',
    address: '456 Đường Xanh, Phòng 202, Q.1, TP.HCM',
    propertyType: 'Apartment',
    rentAmount: 3500000,
    bedrooms: 2,
    bathrooms: 1,
    isOccupied: true,
    electricityRate: 3500,      // VND per kWh
    waterRate: 100000,           // VND flat per month
    serviceFee: 50000,           // VND flat per month
    parkingFee: 150000,
    customFees: [{ id: 'cf-seed-1', name: 'Internet', amount: 80000 }]
  },
  {
    id: 'prop-2',
    khuTroId: 'khu-2',
    name: 'Căn A',
    address: '128 Đường Thông, Q.3, TP.HCM',
    propertyType: 'House',
    rentAmount: 6000000,
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
    address: '456 Đường Xanh, Phòng 104, Q.1, TP.HCM',
    propertyType: 'Apartment',
    rentAmount: 2800000,
    bedrooms: 1,
    bathrooms: 1,
    isOccupied: true,
    electricityRate: 3500,
    waterRate: 100000,
    serviceFee: 50000
  },
  {
    id: 'prop-4',
    khuTroId: 'khu-1',
    name: 'Phòng 105',
    address: '456 Đường Xanh, Phòng 105, Q.1, TP.HCM',
    propertyType: 'Apartment',
    rentAmount: 3000000,
    bedrooms: 1,
    bathrooms: 1,
    isOccupied: true,
    electricityRate: 3500,
    waterRate: 100000,
    serviceFee: 50000
  },
  {
    id: 'prop-5',
    khuTroId: 'khu-1',
    name: 'Phòng 203',
    address: '456 Đường Xanh, Phòng 203, Q.1, TP.HCM',
    propertyType: 'Apartment',
    rentAmount: 3200000,
    bedrooms: 1,
    bathrooms: 1,
    isOccupied: true,
    electricityRate: 3500,
    waterRate: 100000,
    serviceFee: 50000
  },
  {
    id: 'prop-6',
    khuTroId: 'khu-1',
    name: 'Phòng 205',
    address: '456 Đường Xanh, Phòng 205, Q.1, TP.HCM',
    propertyType: 'Apartment',
    rentAmount: 3500000,
    bedrooms: 2,
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
    name: 'Nguyễn Thị An',
    email: 'nguyenthian@gmail.com',
    phone: '0901234567',
    zalo: '0901234567',
    notes: 'Thích yên tĩnh.',
    password: '123456',
    photoUri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
  },
  {
    id: 'tenant-2',
    name: 'Trần Văn Bình',
    email: 'tranvanbinh@gmail.com',
    phone: '0977654321',
    zalo: '0977654321',
    notes: 'Muốn xem nhà thêm.',
    password: '123456',
    photoUri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150'
  },
  {
    id: 'tenant-3',
    name: 'Lê Thị Chi',
    email: 'lethichi@gmail.com',
    phone: '0912345678',
    zalo: '0912345678',
    password: '123456',
    photoUri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150'
  },
  {
    id: 'tenant-4',
    name: 'Phạm Văn Dũng',
    email: 'phamvandung@gmail.com',
    phone: '0987654321',
    zalo: '0987654321',
    password: '123456',
    photoUri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
  }
];

// Mocking multiple active leases for Nguyễn Thị An (tenant-1) to verify Room Switcher
let leases: Lease[] = [
  {
    id: 'lease-1',
    propertyId: 'prop-1',
    tenantId: 'tenant-1',
    startDate: '2026-06-01',
    endDate: '2026-08-25',   // Expiring soon (< 30 days) for demo
    monthlyRent: 3500000,
    securityDeposit: 3500000,
    status: 'active',
    tenantPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    contractPhoto: DEMO_CONTRACT_PHOTOS[0],
    contractPhotos: [...DEMO_CONTRACT_PHOTOS],
    contractUpdatedAt: '2026-06-01T08:00:00.000Z',
  },
  {
    id: 'lease-2',
    propertyId: 'prop-3',
    tenantId: 'tenant-1',
    startDate: '2026-07-01',
    endDate: '2027-06-30',
    monthlyRent: 2800000,
    securityDeposit: 2800000,
    status: 'active',
    tenantPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    contractPhoto: DEMO_CONTRACT_PHOTOS[0],
    contractPhotos: [...DEMO_CONTRACT_PHOTOS],
    contractUpdatedAt: '2026-07-01T08:00:00.000Z',
  },
  {
    id: 'lease-3',
    propertyId: 'prop-4',
    tenantId: 'tenant-2',
    startDate: '2026-08-01',
    endDate: '2027-08-01',
    monthlyRent: 3000000,
    securityDeposit: 3000000,
    status: 'active',
    tenantPhoto: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150',
    contractPhoto: DEMO_CONTRACT_PHOTOS[0],
    contractPhotos: [...DEMO_CONTRACT_PHOTOS],
  },
  {
    id: 'lease-4',
    propertyId: 'prop-5',
    tenantId: 'tenant-3',
    startDate: '2025-01-01',
    endDate: '2026-12-31',
    monthlyRent: 3200000,
    securityDeposit: 3200000,
    status: 'active',
    contractPhoto: DEMO_CONTRACT_PHOTOS[0],
    contractPhotos: [...DEMO_CONTRACT_PHOTOS],
  },
  {
    id: 'lease-5',
    propertyId: 'prop-6',
    tenantId: 'tenant-4',
    startDate: '2026-03-01',
    endDate: '2027-03-01',
    monthlyRent: 3500000,
    securityDeposit: 3500000,
    status: 'active',
    contractPhoto: DEMO_CONTRACT_PHOTOS[0],
    contractPhotos: [...DEMO_CONTRACT_PHOTOS],
  }
];

let payments: Payment[] = [
  // lease-1 (Phòng 202 · Nguyễn Thị An)
  {
    id: 'pay-1',
    leaseId: 'lease-1',
    amount: 3500000,
    dueDate: '2026-06-01',
    paymentDate: '2026-06-02',
    status: 'Paid',
    notes: 'Tháng 6/2026',
    previousMeterKwh: 1590,
    currentMeterKwh: 1754,
  },
  {
    id: 'pay-2',
    leaseId: 'lease-1',
    amount: 3500000,
    dueDate: '2026-07-01',
    paymentDate: '2026-07-03',
    status: 'Paid',
    notes: 'Tháng 7/2026',
    // Chốt tháng 7 = chỉ số đầu tháng 8 (tháng trước khi thanh toán tháng 8)
    previousMeterKwh: 20480,
    currentMeterKwh: 20620,
  },
  {
    id: 'pay-3',
    leaseId: 'lease-1',
    amount: 3500000,
    dueDate: '2026-08-01',
    status: 'Pending',
    notes: 'Tháng 8/2026'
    // Khi thanh toán: 020620 → 020748 (xem meterUtils)
  },
  // lease-2 (Phòng 104 · Nguyễn Thị An)
  {
    id: 'pay-4',
    leaseId: 'lease-2',
    amount: 2800000,
    dueDate: '2026-07-01',
    paymentDate: '2026-07-02',
    status: 'Paid',
    notes: 'Tháng 7/2026',
    previousMeterKwh: 20480,
    currentMeterKwh: 20620,
  },
  {
    id: 'pay-5',
    leaseId: 'lease-2',
    amount: 2800000,
    dueDate: '2026-08-01',
    status: 'Pending',
    notes: 'Tháng 8/2026'
  },
  // lease-3 (Phòng 105 · Trần Văn Bình) — HĐ bắt đầu 01/08/2026
  {
    id: 'pay-6',
    leaseId: 'lease-3',
    amount: 3000000,
    dueDate: '2026-08-01',
    status: 'Pending',
    notes: 'Tháng 8/2026'
  },
  // lease-4 (Phòng 203 · Lê Thị Chi)
  {
    id: 'pay-7',
    leaseId: 'lease-4',
    amount: 3200000,
    dueDate: '2026-06-01',
    paymentDate: '2026-06-01',
    status: 'Paid',
    notes: 'Tháng 6/2026',
    previousMeterKwh: 2100,
    currentMeterKwh: 2248,
  },
  {
    id: 'pay-8',
    leaseId: 'lease-4',
    amount: 3200000,
    dueDate: '2026-07-01',
    paymentDate: '2026-07-05',
    status: 'Paid',
    notes: 'Tháng 7/2026',
    previousMeterKwh: 2248,
    currentMeterKwh: 2390,
  },
  {
    id: 'pay-9',
    leaseId: 'lease-4',
    amount: 3200000,
    dueDate: '2026-08-01',
    status: 'Pending',
    notes: 'Tháng 8/2026'
  },
  // lease-5 (Phòng 205 · Phạm Văn Dũng)
  {
    id: 'pay-10',
    leaseId: 'lease-5',
    amount: 3500000,
    dueDate: '2026-06-01',
    paymentDate: '2026-06-03',
    status: 'Paid',
    notes: 'Tháng 6/2026',
    previousMeterKwh: 1914,
    currentMeterKwh: 2074,
  },
  {
    id: 'pay-11',
    leaseId: 'lease-5',
    amount: 3500000,
    dueDate: '2026-07-01',
    paymentDate: '2026-07-01',
    status: 'Paid',
    notes: 'Tháng 7/2026',
    previousMeterKwh: 1750,
    currentMeterKwh: 1910,
  },
  {
    id: 'pay-12',
    leaseId: 'lease-5',
    amount: 3500000,
    dueDate: '2026-08-01',
    paymentDate: '2026-08-04',
    status: 'Paid',
    notes: 'Tháng 8/2026',
    previousMeterKwh: 1914,
    currentMeterKwh: 2074,
  }
];

/** Deep-clone helper for test isolation (JSON-safe seed data only). */
function cloneSeed<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/** Frozen snapshot of initial Vietnamese seed — test-only reset source. */
const SEED_SNAPSHOT = {
  landlordProfile: cloneSeed(landlordProfile),
  appConfig: cloneSeed(appConfig),
  khuTros: cloneSeed(khuTros),
  properties: cloneSeed(properties),
  tenants: cloneSeed(tenants),
  leases: cloneSeed(leases),
  payments: cloneSeed(payments),
  activeTenantLeaseId: null as string | null,
  fireSoundEnabled: true,
};

// Listeners for reactivity
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

let activeTenantLeaseId: string | null = null;
let fireSoundEnabled = true;

export const Database = {
  /** Test-only: restore in-memory state to initial VI seed. */
  __resetForTests: () => {
    Object.assign(landlordProfile, cloneSeed(SEED_SNAPSHOT.landlordProfile));
    appConfig = cloneSeed(SEED_SNAPSHOT.appConfig);
    khuTros = cloneSeed(SEED_SNAPSHOT.khuTros);
    properties = cloneSeed(SEED_SNAPSHOT.properties);
    tenants = cloneSeed(SEED_SNAPSHOT.tenants);
    leases = cloneSeed(SEED_SNAPSHOT.leases);
    payments = cloneSeed(SEED_SNAPSHOT.payments);
    activeTenantLeaseId = SEED_SNAPSHOT.activeTenantLeaseId;
    fireSoundEnabled = SEED_SNAPSHOT.fireSoundEnabled;
  },

  getProperties: () => properties,
  getTenants: () => tenants,
  getLeases: () => leases,
  getPayments: () => payments,
  getLandlordProfile: () => landlordProfile,
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

  updateProperty: (id: string, partial: Partial<Omit<Property, 'id'>>) => {
    properties = properties.map(p => (p.id === id ? { ...p, ...partial } : p));
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

  updateTenant: (id: string, partial: Partial<Omit<Tenant, 'id'>>) => {
    tenants = tenants.map(t => (t.id === id ? { ...t, ...partial } : t));
    notify();
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
    const contractPhotos =
      lease.contractPhotos && lease.contractPhotos.length > 0
        ? lease.contractPhotos
        : lease.contractPhoto
          ? [lease.contractPhoto]
          : [];
    const newLease: Lease = {
      ...lease,
      contractPhotos,
      contractPhoto: contractPhotos[0],
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

  updateLeaseContractPhotos: (leaseId: string, uris: string[]) => {
    leases = leases.map(l =>
      l.id === leaseId
        ? {
            ...l,
            contractPhotos: uris,
            contractPhoto: uris[0],
            contractUpdatedAt: new Date().toISOString(),
          }
        : l
    );
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

  updatePaymentAmountAndStatus: (
    paymentId: string,
    amount: number,
    status: 'Paid' | 'Pending',
    meterEvidence?: {
      previousMeterKwh: number;
      currentMeterKwh: number;
      meterPhotoUri?: string;
    }
  ) => {
    payments = payments.map(p =>
      p.id === paymentId
        ? {
            ...p,
            amount,
            status,
            paymentDate: status === 'Paid' ? new Date().toISOString().split('T')[0] : p.paymentDate,
            ...(meterEvidence
              ? {
                  previousMeterKwh: meterEvidence.previousMeterKwh,
                  currentMeterKwh: meterEvidence.currentMeterKwh,
                  meterPhotoUri: meterEvidence.meterPhotoUri,
                }
              : {}),
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
