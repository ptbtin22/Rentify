//
//  TenantsViewModel.swift
//  Rentify
//
//  Created by Tin Pham on 21/7/26.
//

import Foundation
import SwiftData
import Observation

@Observable
@MainActor
final class TenantsViewModel {
    private let repository: TenantRepositoryProtocol
    
    var tenants: [Tenant] = []
    var isLoading = false
    var errorMessage: String? = nil
    
    init(repository: TenantRepositoryProtocol) {
        self.repository = repository
    }
}

// MARK: - Actions

extension TenantsViewModel {
    func refresh() async {
        isLoading = true
        errorMessage = nil
        do {
            tenants = try await repository.fetchTenants()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    func addTenant(name: String, email: String, phone: String, notes: String = "") async {
        isLoading = true
        errorMessage = nil
        do {
            _ = try await repository.addTenant(name: name, email: email, phone: phone, notes: notes)
            await refresh()
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
        }
    }
    
    func deleteTenant(at offsets: IndexSet) async {
        isLoading = true
        errorMessage = nil
        do {
            for index in offsets {
                if index < tenants.count {
                    try await repository.deleteTenant(tenants[index])
                }
            }
            await refresh()
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
        }
    }
    
    func deleteTenant(_ tenant: Tenant) async {
        isLoading = true
        errorMessage = nil
        do {
            try await repository.deleteTenant(tenant)
            await refresh()
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
        }
    }
}
