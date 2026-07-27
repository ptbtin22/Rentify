//
//  TenantRepository.swift
//  Rentify
//
//  Created by Tin Pham on 26/7/26.
//

import Foundation

@MainActor
protocol TenantRepositoryProtocol {
    func fetchTenants() async throws -> [Tenant]
    func addTenant(name: String, email: String, phone: String, notes: String) async throws -> Tenant
    func deleteTenant(_ tenant: Tenant) async throws
}

extension TenantRepositoryProtocol {
    func addTenant(name: String, email: String, phone: String) async throws -> Tenant {
        return try await addTenant(name: name, email: email, phone: phone, notes: "")
    }
}

@MainActor
final class TenantRepository {
    private let localDataSource: TenantLocalDataSourceProtocol
    private let remoteDataSource: TenantRemoteDataSourceProtocol
    
    init(localDataSource: TenantLocalDataSourceProtocol, remoteDataSource: TenantRemoteDataSourceProtocol) {
        self.localDataSource = localDataSource
        self.remoteDataSource = remoteDataSource
    }
}

// MARK: - TenantRepositoryProtocol

extension TenantRepository: TenantRepositoryProtocol {
    func fetchTenants() async throws -> [Tenant] {
        return try await localDataSource.fetchTenants()
    }
    
    func addTenant(name: String, email: String, phone: String, notes: String) async throws -> Tenant {
        return try await localDataSource.addTenant(name: name, email: email, phone: phone, notes: notes)
    }
    
    func deleteTenant(_ tenant: Tenant) async throws {
        try await localDataSource.deleteTenant(tenant)
    }
}
