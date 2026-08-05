import { beforeEach, describe, expect, it } from '@jest/globals';
import { Database, getLeaseContractPhotos } from '../Database';

describe('Database VI UX extensions', () => {
  beforeEach(() => {
    Database.__resetForTests();
  });

  it('returns fixed landlord profile mock', () => {
    const p = Database.getLandlordProfile();
    expect(p).toEqual({
      name: 'Huỳnh Gia Âu',
      phone: '0987012345',
      zalo: '0935245059',
      email: 'huynhgiaau@gmail.com',
    });
  });

  it('addTenant stores photoUri and zalo', () => {
    const t = Database.addTenant({
      name: 'Nguyễn Văn Test',
      email: 'test@example.com',
      phone: '0911111111',
      photoUri: 'file://avatar.jpg',
      zalo: '0911111111',
    });
    expect(t.photoUri).toBe('file://avatar.jpg');
    expect(t.zalo).toBe('0911111111');
  });

  it('updateProperty sets parkingFee and customFees', () => {
    const props = Database.getProperties();
    const id = props[0].id;
    Database.updateProperty(id, {
      parkingFee: 100000,
      customFees: [{ id: 'cf-1', name: 'Internet', amount: 80000 }],
    });
    const updated = Database.getProperties().find(p => p.id === id)!;
    expect(updated.parkingFee).toBe(100000);
    expect(updated.customFees?.[0].name).toBe('Internet');
  });

  it('updateLeaseContractPhotos sets photos and contractUpdatedAt', () => {
    const lease = Database.getLeases()[0];
    const before = Date.now();
    Database.updateLeaseContractPhotos(lease.id, [
      'https://example.com/p1.jpg',
      'https://example.com/p2.jpg',
    ]);
    const after = Database.getLeases().find(l => l.id === lease.id)!;
    expect(after.contractPhotos).toHaveLength(2);
    expect(after.contractUpdatedAt).toBeTruthy();
    expect(new Date(after.contractUpdatedAt!).getTime()).toBeGreaterThanOrEqual(before);
  });

  it('getLeaseContractPhotos prefers contractPhotos over contractPhoto', () => {
    expect(
      getLeaseContractPhotos({
        id: 'x',
        propertyId: 'p',
        tenantId: 't',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        monthlyRent: 1,
        securityDeposit: 1,
        status: 'active',
        contractPhoto: 'a.jpg',
        contractPhotos: ['b.jpg', 'c.jpg'],
      })
    ).toEqual(['b.jpg', 'c.jpg']);
  });

  it('seed tenants and khu names are Vietnamese (no Jane Tenant / Oakridge)', () => {
    const names = Database.getTenants().map(t => t.name).join(' ');
    expect(names).not.toMatch(/Jane Tenant|John Doe|Alice Smith|Bob Johnson/);
    const khu = Database.getKhuTros().map(k => k.name).join(' ');
    expect(khu).not.toMatch(/Oakridge|Greenway House/);
  });
});
