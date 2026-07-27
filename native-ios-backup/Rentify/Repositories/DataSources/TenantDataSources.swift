//
//  TenantDataSources.swift
//  Rentify
//
//  Created by Tin Pham on 26/7/26.
//

import Foundation
import SwiftData

@MainActor
protocol TenantLocalDataSourceProtocol {
    func fetchTenants() async throws -> [Tenant]
    func addTenant(name: String, email: String, phone: String, notes: String) async throws -> Tenant
    func deleteTenant(_ tenant: Tenant) async throws
}

@MainActor
final class SwiftDataTenantLocalDataSource: TenantLocalDataSourceProtocol {
    private let container: PersistenceContainerProtocol
    
    init(container: PersistenceContainerProtocol) {
        self.container = container
    }
    
    func fetchTenants() async throws -> [Tenant] {
        return container.fetchAll()
    }
    
    func addTenant(name: String, email: String, phone: String, notes: String) async throws -> Tenant {
        let tenant = Tenant(name: name, email: email, phone: phone, notes: notes)
        container.insert(tenant)
        return tenant
    }
    
    func deleteTenant(_ tenant: Tenant) async throws {
        container.delete(tenant)
    }
}

@MainActor
protocol TenantRemoteDataSourceProtocol {
    func fetchRemoteTenants() async throws -> [Tenant]
}

@MainActor
final class APITenantRemoteDataSource: TenantRemoteDataSourceProtocol {
    init() {}
    
    func fetchRemoteTenants() async throws -> [Tenant] {
        try await Task.sleep(nanoseconds: 100_000_000)
        return []
    }
}
