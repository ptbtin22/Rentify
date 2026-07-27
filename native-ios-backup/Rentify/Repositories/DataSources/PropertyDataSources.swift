//
//  PropertyDataSources.swift
//  Rentify
//
//  Created by Tin Pham on 26/7/26.
//

import Foundation
import SwiftData

@MainActor
protocol PropertyLocalDataSourceProtocol {
    func fetchProperties() async throws -> [Property]
    func addProperty(name: String, address: String, propertyType: String, rentAmount: Double, bedrooms: Int, bathrooms: Double) async throws -> Property
    func deleteProperty(_ property: Property) async throws
}

@MainActor
final class SwiftDataPropertyLocalDataSource: PropertyLocalDataSourceProtocol {
    private let container: PersistenceContainerProtocol
    
    init(container: PersistenceContainerProtocol) {
        self.container = container
    }
    
    func fetchProperties() async throws -> [Property] {
        return container.fetchAll()
    }
    
    func addProperty(name: String, address: String, propertyType: String, rentAmount: Double, bedrooms: Int, bathrooms: Double) async throws -> Property {
        let property = Property(
            name: name,
            address: address,
            propertyType: propertyType,
            rentAmount: rentAmount,
            bedrooms: bedrooms,
            bathrooms: bathrooms
        )
        container.insert(property)
        return property
    }
    
    func deleteProperty(_ property: Property) async throws {
        container.delete(property)
    }
}

@MainActor
protocol PropertyRemoteDataSourceProtocol {
    func fetchRemoteProperties() async throws -> [Property]
}

@MainActor
final class APIPropertyRemoteDataSource: PropertyRemoteDataSourceProtocol {
    init() {}
    
    func fetchRemoteProperties() async throws -> [Property] {
        // Mock network delay
        try await Task.sleep(nanoseconds: 100_000_000) // 0.1s
        return []
    }
}
