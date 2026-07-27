//
//  PropertiesViewModel.swift
//  Rentify
//
//  Created by Tin Pham on 21/7/26.
//

import Foundation
import SwiftData
import Observation

@Observable
@MainActor
final class PropertiesViewModel {
    private let repository: PropertyRepositoryProtocol
    
    var properties: [Property] = []
    var isLoading = false
    var errorMessage: String? = nil
    
    init(repository: PropertyRepositoryProtocol) {
        self.repository = repository
    }
}

// MARK: - Actions

extension PropertiesViewModel {
    func refresh() async {
        isLoading = true
        errorMessage = nil
        do {
            properties = try await repository.fetchProperties()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    func addProperty(name: String, address: String, type: String, rent: Double, bedrooms: Int, bathrooms: Double) async {
        isLoading = true
        errorMessage = nil
        do {
            _ = try await repository.addProperty(name: name, address: address, type: type, rent: rent, bedrooms: bedrooms, bathrooms: bathrooms)
            await refresh()
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
        }
    }
    
    func deleteProperty(at offsets: IndexSet) async {
        isLoading = true
        errorMessage = nil
        do {
            for index in offsets {
                if index < properties.count {
                    try await repository.deleteProperty(properties[index])
                }
            }
            await refresh()
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
        }
    }
    
    func deleteProperty(_ property: Property) async {
        isLoading = true
        errorMessage = nil
        do {
            try await repository.deleteProperty(property)
            await refresh()
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
        }
    }
}
