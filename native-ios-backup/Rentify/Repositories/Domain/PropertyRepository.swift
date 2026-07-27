//
//  PropertyRepository.swift
//  Rentify
//
//  Created by Tin Pham on 26/7/26.
//

import Foundation

@MainActor
protocol PropertyRepositoryProtocol {
    func fetchProperties() async throws -> [Property]
    func addProperty(name: String, address: String, type: String, rent: Double, bedrooms: Int, bathrooms: Double) async throws -> Property
    func deleteProperty(_ property: Property) async throws
}

@MainActor
final class PropertyRepository {
    private let localDataSource: PropertyLocalDataSourceProtocol
    private let remoteDataSource: PropertyRemoteDataSourceProtocol
    
    init(localDataSource: PropertyLocalDataSourceProtocol, remoteDataSource: PropertyRemoteDataSourceProtocol) {
        self.localDataSource = localDataSource
        self.remoteDataSource = remoteDataSource
    }
}

// MARK: - PropertyRepositoryProtocol

extension PropertyRepository: PropertyRepositoryProtocol {
    func fetchProperties() async throws -> [Property] {
        // Try caching logic, remote fetch or local fallback
        return try await localDataSource.fetchProperties()
    }
    
    func addProperty(name: String, address: String, type: String, rent: Double, bedrooms: Int, bathrooms: Double) async throws -> Property {
        return try await localDataSource.addProperty(
            name: name,
            address: address,
            propertyType: type,
            rentAmount: rent,
            bedrooms: bedrooms,
            bathrooms: bathrooms
        )
    }
    
    func deleteProperty(_ property: Property) async throws {
        try await localDataSource.deleteProperty(property)
    }
}
