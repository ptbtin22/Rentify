//
//  ModelTests.swift
//  RentifyTests
//
//  Created by Tin Pham on 25/7/26.
//

import XCTest
import SwiftData
@testable import Rentify

final class ModelTests: XCTestCase {
    
    func testPropertyInitialization() {
        let property = Property(
            name: "Oakridge Apartment",
            address: "789 Elm St",
            propertyType: "Apartment",
            rentAmount: 1400.0,
            bedrooms: 2,
            bathrooms: 1.5,
            isOccupied: false
        )
        
        XCTAssertNotNil(property.id)
        XCTAssertEqual(property.name, "Oakridge Apartment")
        XCTAssertEqual(property.address, "789 Elm St")
        XCTAssertEqual(property.propertyType, "Apartment")
        XCTAssertEqual(property.rentAmount, 1400.0)
        XCTAssertEqual(property.bedrooms, 2)
        XCTAssertEqual(property.bathrooms, 1.5)
        XCTAssertFalse(property.isOccupied)
        XCTAssertTrue(property.leases.isEmpty)
    }
    
    func testTenantInitialization() {
        let tenant = Tenant(
            name: "Alice Johnson",
            email: "alice@example.com",
            phone: "0909112233",
            notes: "Likes gardening"
        )
        
        XCTAssertNotNil(tenant.id)
        XCTAssertEqual(tenant.name, "Alice Johnson")
        XCTAssertEqual(tenant.email, "alice@example.com")
        XCTAssertEqual(tenant.phone, "0909112233")
        XCTAssertEqual(tenant.notes, "Likes gardening")
        XCTAssertTrue(tenant.leases.isEmpty)
    }
    
    func testLeaseInitialization() {
        let lease = Lease(
            startDate: Date(),
            endDate: Calendar.current.date(byAdding: .year, value: 1, to: Date())!,
            monthlyRent: 1500.0,
            securityDeposit: 1500.0,
            status: .pending
        )
        
        XCTAssertNotNil(lease.id)
        XCTAssertEqual(lease.monthlyRent, 1500.0)
        XCTAssertEqual(lease.securityDeposit, 1500.0)
        XCTAssertEqual(lease.status, .pending)
        XCTAssertNil(lease.property)
        XCTAssertNil(lease.tenant)
        XCTAssertTrue(lease.payments.isEmpty)
    }
    
    func testPaymentInitialization() {
        let dueDate = Date()
        let payment = Payment(
            amount: 1500.0,
            dueDate: dueDate,
            status: .pending,
            notes: "First rent payment"
        )
        
        XCTAssertNotNil(payment.id)
        XCTAssertEqual(payment.amount, 1500.0)
        XCTAssertEqual(payment.dueDate, dueDate)
        XCTAssertNil(payment.paymentDate)
        XCTAssertEqual(payment.status, .pending)
        XCTAssertEqual(payment.notes, "First rent payment")
        XCTAssertNil(payment.lease)
    }
}
