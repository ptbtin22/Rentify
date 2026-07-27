//
//  LeaseDataSources.swift
//  Rentify
//
//  Created by Tin Pham on 26/7/26.
//

import Foundation
import SwiftData

@MainActor
protocol LeaseLocalDataSourceProtocol {
    func fetchLeases() async throws -> [Lease]
    func createLease(property: Property, tenant: Tenant, startDate: Date, endDate: Date, monthlyRent: Double, securityDeposit: Double) async throws -> Lease
    func terminateLease(_ lease: Lease) async throws
    func deleteLease(_ lease: Lease) async throws
}

@MainActor
final class SwiftDataLeaseLocalDataSource: LeaseLocalDataSourceProtocol {
    private let container: PersistenceContainerProtocol
    
    init(container: PersistenceContainerProtocol) {
        self.container = container
    }
    
    func fetchLeases() async throws -> [Lease] {
        return container.fetchAll()
    }
    
    func createLease(property: Property, tenant: Tenant, startDate: Date, endDate: Date, monthlyRent: Double, securityDeposit: Double) async throws -> Lease {
        let lease = Lease(
            startDate: startDate,
            endDate: endDate,
            monthlyRent: monthlyRent,
            securityDeposit: securityDeposit,
            status: .active,
            property: property,
            tenant: tenant
        )
        container.context.insert(lease)
        property.isOccupied = true
        
        // Auto-generate payment schedules
        let calendar = Calendar.current
        var currentOffset = 0
        var keepGenerating = true
        
        while keepGenerating {
            if let dueDate = calendar.date(byAdding: .month, value: currentOffset, to: startDate) {
                if dueDate <= endDate {
                    let notes = "Rent Invoice - \(dueDate.formatted(date: .abbreviated, time: .omitted))"
                    let payment = Payment(amount: monthlyRent, dueDate: dueDate, status: .pending, notes: notes)
                    container.context.insert(payment)
                    lease.payments.append(payment)
                    currentOffset += 1
                } else {
                    keepGenerating = false
                }
            } else {
                keepGenerating = false
            }
        }
        
        try? container.context.save()
        return lease
    }
    
    func terminateLease(_ lease: Lease) async throws {
        lease.status = .expired
        if let property = lease.property {
            property.isOccupied = false
        }
        try? container.context.save()
    }
    
    func deleteLease(_ lease: Lease) async throws {
        if let property = lease.property {
            property.isOccupied = false
        }
        container.delete(lease)
    }
}

@MainActor
protocol LeaseRemoteDataSourceProtocol {
    func fetchRemoteLeases() async throws -> [Lease]
}

@MainActor
final class APILeaseRemoteDataSource: LeaseRemoteDataSourceProtocol {
    init() {}
    
    func fetchRemoteLeases() async throws -> [Lease] {
        try await Task.sleep(nanoseconds: 100_000_000)
        return []
    }
}
