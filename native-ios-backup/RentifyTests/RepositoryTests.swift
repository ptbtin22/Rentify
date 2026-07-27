//
//  RepositoryTests.swift
//  RentifyTests
//
//  Created by Tin Pham on 25/7/26.
//

import XCTest
import SwiftData
@testable import Rentify

@MainActor
final class RepositoryTests: XCTestCase {
    
    var testContainer: SwiftDataPersistenceContainer!
    var propertyRepo: PropertyRepositoryProtocol!
    var tenantRepo: TenantRepositoryProtocol!
    var leaseRepo: LeaseRepositoryProtocol!
    var paymentRepo: PaymentRepositoryProtocol!
    
    override func setUpWithError() throws {
        super.setUp()
        testContainer = SwiftDataPersistenceContainer(isInMemory: true)
        
        let propertyLocal = SwiftDataPropertyLocalDataSource(container: testContainer)
        propertyRepo = PropertyRepository(localDataSource: propertyLocal, remoteDataSource: APIPropertyRemoteDataSource())
        
        let tenantLocal = SwiftDataTenantLocalDataSource(container: testContainer)
        tenantRepo = TenantRepository(localDataSource: tenantLocal, remoteDataSource: APITenantRemoteDataSource())
        
        let leaseLocal = SwiftDataLeaseLocalDataSource(container: testContainer)
        leaseRepo = LeaseRepository(localDataSource: leaseLocal, remoteDataSource: APILeaseRemoteDataSource())
        
        let paymentLocal = SwiftDataPaymentLocalDataSource(container: testContainer)
        paymentRepo = PaymentRepository(localDataSource: paymentLocal, remoteDataSource: APIPaymentRemoteDataSource())
    }
    
    override func tearDownWithError() throws {
        propertyRepo = nil
        tenantRepo = nil
        leaseRepo = nil
        paymentRepo = nil
        testContainer = nil
        super.tearDown()
    }
    
    func testPropertyCRUDOperations() async throws {
        let property = try await propertyRepo.addProperty(
            name: "Loft Room 3B",
            address: "123 Parkway Ave",
            type: "Apartment",
            rent: 1200.0,
            bedrooms: 1,
            bathrooms: 1.0
        )
        
        XCTAssertEqual(property.name, "Loft Room 3B")
        
        let list = try await propertyRepo.fetchProperties()
        XCTAssertEqual(list.count, 1)
        XCTAssertEqual(list.first?.name, "Loft Room 3B")
        
        try await propertyRepo.deleteProperty(property)
        let emptyList = try await propertyRepo.fetchProperties()
        XCTAssertTrue(emptyList.isEmpty)
    }
    
    func testTenantCRUDOperations() async throws {
        let tenant = try await tenantRepo.addTenant(
            name: "John Doe",
            email: "john@example.com",
            phone: "0900111222",
            notes: "Pays rent early"
        )
        
        XCTAssertEqual(tenant.name, "John Doe")
        
        let list = try await tenantRepo.fetchTenants()
        XCTAssertEqual(list.count, 1)
        XCTAssertEqual(list.first?.email, "john@example.com")
        
        try await tenantRepo.deleteTenant(tenant)
        let emptyList = try await tenantRepo.fetchTenants()
        XCTAssertTrue(emptyList.isEmpty)
    }
    
    func testCreateLeaseChangesOccupancyAndGeneratesPayments() async throws {
        let property = try await propertyRepo.addProperty(
            name: "Lakeside Villa",
            address: "456 Lake View",
            type: "House",
            rent: 3000.0,
            bedrooms: 4,
            bathrooms: 3.5
        )
        
        let tenant = try await tenantRepo.addTenant(
            name: "Emma Stone",
            email: "emma@example.com",
            phone: "0988777666"
        )
        
        let startDate = Date()
        // 3 months lease
        let endDate = Calendar.current.date(byAdding: .month, value: 2, to: startDate)!
        
        let lease = try await leaseRepo.createLease(
            property: property,
            tenant: tenant,
            startDate: startDate,
            endDate: endDate,
            monthlyRent: 3000.0,
            securityDeposit: 3000.0
        )
        
        XCTAssertEqual(lease.status, .active)
        XCTAssertTrue(property.isOccupied)
        XCTAssertEqual(property.leases.count, 1)
        XCTAssertEqual(tenant.leases.count, 1)
        
        let payments = try await paymentRepo.fetchPayments()
        // Should contain 3 payments: month 0, month 1, month 2
        XCTAssertEqual(payments.count, 3)
        XCTAssertEqual(payments.first?.amount, 3000.0)
        XCTAssertEqual(payments.first?.lease?.id, lease.id)
    }
    
    func testTerminateLeaseFreesProperty() async throws {
        let property = try await propertyRepo.addProperty(name: "Room A", address: "St A", type: "Condo", rent: 800.0, bedrooms: 1, bathrooms: 1.0)
        let tenant = try await tenantRepo.addTenant(name: "Tenant A", email: "a@a.com", phone: "123")
        let lease = try await leaseRepo.createLease(property: property, tenant: tenant, startDate: Date(), endDate: Date(), monthlyRent: 800.0, securityDeposit: 800.0)
        
        XCTAssertTrue(property.isOccupied)
        XCTAssertEqual(lease.status, .active)
        
        try await leaseRepo.terminateLease(lease)
        XCTAssertFalse(property.isOccupied)
        XCTAssertEqual(lease.status, .expired)
    }
    
    func testDeleteLeaseFreesProperty() async throws {
        let property = try await propertyRepo.addProperty(name: "Room B", address: "St B", type: "Condo", rent: 800.0, bedrooms: 1, bathrooms: 1.0)
        let tenant = try await tenantRepo.addTenant(name: "Tenant B", email: "b@b.com", phone: "123")
        let lease = try await leaseRepo.createLease(property: property, tenant: tenant, startDate: Date(), endDate: Date(), monthlyRent: 800.0, securityDeposit: 800.0)
        
        XCTAssertTrue(property.isOccupied)
        
        try await leaseRepo.deleteLease(lease)
        XCTAssertFalse(property.isOccupied)
        let list = try await leaseRepo.fetchLeases()
        XCTAssertTrue(list.isEmpty)
    }
    
    func testRecordPaymentReceived() async throws {
        let property = try await propertyRepo.addProperty(name: "Room C", address: "St C", type: "Condo", rent: 800.0, bedrooms: 1, bathrooms: 1.0)
        let tenant = try await tenantRepo.addTenant(name: "Tenant C", email: "c@c.com", phone: "123")
        let lease = try await leaseRepo.createLease(property: property, tenant: tenant, startDate: Date(), endDate: Date(), monthlyRent: 800.0, securityDeposit: 800.0)
        
        let payments = try await paymentRepo.fetchPayments()
        guard let payment = payments.first else {
            XCTFail("No payments found for lease.")
            return
        }
        
        XCTAssertEqual(payment.status, .pending)
        XCTAssertNil(payment.paymentDate)
        
        try await paymentRepo.recordPaymentReceived(payment: payment)
        XCTAssertEqual(payment.status, .paid)
        XCTAssertNotNil(payment.paymentDate)
    }
}
