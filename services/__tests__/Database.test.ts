import { describe, expect, it } from '@jest/globals';
import { Database } from '../Database';

describe('Database Service Suite', () => {
  it('fetches properties, tenants, leases, and payments initially', () => {
    const properties = Database.getProperties();
    const tenants = Database.getTenants();
    const leases = Database.getLeases();
    const payments = Database.getPayments();

    expect(properties.length).toBeGreaterThan(0);
    expect(tenants.length).toBeGreaterThan(0);
    expect(leases.length).toBeGreaterThan(0);
    expect(payments.length).toBeGreaterThan(0);
  });

  it('adds and deletes a building complex (KhuTro)', () => {
    const initialCount = Database.getKhuTros().length;
    const newKhu = Database.addKhuTro('Test Complex', '123 Test St');
    
    expect(Database.getKhuTros().length).toBe(initialCount + 1);
    expect(newKhu.name).toBe('Test Complex');

    Database.deleteKhuTro(newKhu.id);
    expect(Database.getKhuTros().length).toBe(initialCount);
  });

  it('creates a new tenant profile', () => {
    const initialCount = Database.getTenants().length;
    const newTenant = Database.addTenant({
      name: 'Alice Cooper',
      email: 'alice@cooper.com',
      phone: '84900112233',
      notes: 'Rock star',
      password: 'mypassword'
    });

    expect(Database.getTenants().length).toBe(initialCount + 1);
    expect(newTenant.name).toBe('Alice Cooper');
    expect(newTenant.password).toBe('mypassword');
  });

  it('updates tenant password', () => {
    const tenants = Database.getTenants();
    const target = tenants[0];
    const originalPass = target.password;

    Database.updateTenantPassword(target.id, 'super-secure-pass');
    
    const updated = Database.getTenants().find(t => t.id === target.id);
    expect(updated?.password).toBe('super-secure-pass');

    // Restore
    Database.updateTenantPassword(target.id, originalPass || '123456');
  });

  it('automatically generates monthly payments when creating a lease', () => {
    const initialPaymentsCount = Database.getPayments().length;
    const initialLeasesCount = Database.getLeases().length;

    // Create a mock lease
    const newLease = Database.createLease({
      propertyId: 'prop-2',
      tenantId: 'tenant-2',
      startDate: '2026-08-01',
      endDate: '2027-07-31',
      monthlyRent: 1500,
      securityDeposit: 1500
    });

    expect(Database.getLeases().length).toBe(initialLeasesCount + 1);
    
    // Lease creation automatically generates 3 mock payments/invoices
    expect(Database.getPayments().length).toBe(initialPaymentsCount + 3);

    // Clean up
    Database.deleteLease(newLease.id);
    expect(Database.getLeases().length).toBe(initialLeasesCount);
    expect(Database.getPayments().length).toBe(initialPaymentsCount);
  });
});
