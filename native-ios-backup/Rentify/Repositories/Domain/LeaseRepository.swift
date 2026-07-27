//
//  LeaseRepository.swift
//  Rentify
//
//  Created by Tin Pham on 26/7/26.
//

import Foundation

@MainActor
protocol LeaseRepositoryProtocol {
    func fetchLeases() async throws -> [Lease]
    func createLease(property: Property, tenant: Tenant, startDate: Date, endDate: Date, monthlyRent: Double, securityDeposit: Double) async throws -> Lease
    func terminateLease(_ lease: Lease) async throws
    func deleteLease(_ lease: Lease) async throws
}

@MainActor
final class LeaseRepository {
    private let localDataSource: LeaseLocalDataSourceProtocol
    private let remoteDataSource: LeaseRemoteDataSourceProtocol
    
    init(localDataSource: LeaseLocalDataSourceProtocol, remoteDataSource: LeaseRemoteDataSourceProtocol) {
        self.localDataSource = localDataSource
        self.remoteDataSource = remoteDataSource
    }
}

// MARK: - LeaseRepositoryProtocol

extension LeaseRepository: LeaseRepositoryProtocol {
    func fetchLeases() async throws -> [Lease] {
        return try await localDataSource.fetchLeases()
    }
    
    func createLease(property: Property, tenant: Tenant, startDate: Date, endDate: Date, monthlyRent: Double, securityDeposit: Double) async throws -> Lease {
        return try await localDataSource.createLease(
            property: property,
            tenant: tenant,
            startDate: startDate,
            endDate: endDate,
            monthlyRent: monthlyRent,
            securityDeposit: securityDeposit
        )
    }
    
    func terminateLease(_ lease: Lease) async throws {
        try await localDataSource.terminateLease(lease)
    }
    
    func deleteLease(_ lease: Lease) async throws {
        try await localDataSource.deleteLease(lease)
    }
}
