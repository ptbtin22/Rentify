//
//  ViewModelTests.swift
//  RentifyTests
//
//  Created by Tin Pham on 25/7/26.
//

import XCTest
import SwiftData
@testable import Rentify

@MainActor
final class ViewModelTests: XCTestCase {
    
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
    
    func testDashboardViewModelInitialState() {
        let vm = DashboardViewModel(
            propertyRepository: propertyRepo,
            leaseRepository: leaseRepo,
            paymentRepository: paymentRepo
        )
        
        XCTAssertEqual(vm.totalRevenue, 0.0)
        XCTAssertEqual(vm.unpaidBalance, 0.0)
        XCTAssertEqual(vm.activeLeasesCount, 0)
        XCTAssertEqual(vm.occupancyRate, 0.0)
    }
    
    func testDashboardViewModelRecalculatesMetrics() async throws {
        let vm = DashboardViewModel(
            propertyRepository: propertyRepo,
            leaseRepository: leaseRepo,
            paymentRepository: paymentRepo
        )
        
        // Add 1 property
        let property = try await propertyRepo.addProperty(name: "Apt 1", address: "123 St", type: "Condo", rent: 1000.0, bedrooms: 1, bathrooms: 1.0)
        await vm.refresh()
        
        XCTAssertEqual(vm.properties.count, 1)
        XCTAssertEqual(vm.occupancyRate, 0.0) // vacant
        
        // Add tenant & lease
        let tenant = try await tenantRepo.addTenant(name: "John", email: "j@j.com", phone: "12")
        _ = try await leaseRepo.createLease(property: property, tenant: tenant, startDate: Date(), endDate: Date(), monthlyRent: 1000.0, securityDeposit: 1000.0)
        await vm.refresh()
        
        XCTAssertEqual(vm.activeLeasesCount, 1)
        XCTAssertEqual(vm.occupancyRate, 100.0) // occupied
        XCTAssertEqual(vm.unpaidBalance, 1000.0) // 1 pending payment
        XCTAssertEqual(vm.totalRevenue, 0.0) // no paid payments
        
        // Pay the rent
        let payments = try await paymentRepo.fetchPayments()
        if let payment = payments.first {
            try await paymentRepo.recordPaymentReceived(payment: payment)
        }
        await vm.refresh()
        
        XCTAssertEqual(vm.unpaidBalance, 0.0)
        XCTAssertEqual(vm.totalRevenue, 1000.0)
    }
    
    func testPropertiesViewModelCRUD() async throws {
        let vm = PropertiesViewModel(repository: propertyRepo)
        XCTAssertTrue(vm.properties.isEmpty)
        
        await vm.addProperty(name: "Penthouse", address: "High St", type: "Apartment", rent: 5000.0, bedrooms: 3, bathrooms: 3.0)
        XCTAssertEqual(vm.properties.count, 1)
        XCTAssertEqual(vm.properties.first?.name, "Penthouse")
        
        await vm.deleteProperty(at: IndexSet(integer: 0))
        XCTAssertTrue(vm.properties.isEmpty)
    }
    
    func testTenantsViewModelCRUD() async throws {
        let vm = TenantsViewModel(repository: tenantRepo)
        XCTAssertTrue(vm.tenants.isEmpty)
        
        await vm.addTenant(name: "Bob", email: "bob@bob.com", phone: "321", notes: "Prefers texts")
        XCTAssertEqual(vm.tenants.count, 1)
        XCTAssertEqual(vm.tenants.first?.name, "Bob")
        
        await vm.deleteTenant(at: IndexSet(integer: 0))
        XCTAssertTrue(vm.tenants.isEmpty)
    }
    
    func testPaymentsViewModelOperations() async throws {
        let vm = PaymentsViewModel(paymentRepository: paymentRepo, leaseRepository: leaseRepo)
        XCTAssertTrue(vm.payments.isEmpty)
        XCTAssertTrue(vm.leases.isEmpty)
        
        let property = try await propertyRepo.addProperty(name: "Room 1", address: "Road 1", type: "Condo", rent: 500.0, bedrooms: 1, bathrooms: 1.0)
        let tenant = try await tenantRepo.addTenant(name: "Sam", email: "s@s.com", phone: "1")
        
        await vm.createLease(property: property, tenant: tenant, startDate: Date(), endDate: Date(), monthlyRent: 500.0, securityDeposit: 500.0)
        XCTAssertEqual(vm.leases.count, 1)
        XCTAssertEqual(vm.payments.count, 1)
        
        if let payment = vm.payments.first {
            await vm.recordPaymentReceived(payment: payment)
            XCTAssertEqual(payment.status, .paid)
        }
        
        if let lease = vm.leases.first {
            await vm.deleteLease(lease)
            XCTAssertTrue(vm.leases.isEmpty)
        }
    }
}
