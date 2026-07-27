//
//  Property.swift
//  Rentify
//
//  Created by Tin Pham on 21/7/26.
//

import Foundation
import SwiftData

@Model
final class Property {
    @Attribute(.unique) var id: UUID
    var name: String
    var address: String
    var propertyType: String // e.g., Apartment, House, Condo
    var rentAmount: Double
    var bedrooms: Int
    var bathrooms: Double
    var isOccupied: Bool
    
    @Relationship(deleteRule: .cascade, inverse: \Lease.property)
    var leases: [Lease] = []
    
    init(id: UUID = UUID(), name: String, address: String, propertyType: String, rentAmount: Double, bedrooms: Int, bathrooms: Double, isOccupied: Bool = false) {
        self.id = id
        self.name = name
        self.address = address
        self.propertyType = propertyType
        self.rentAmount = rentAmount
        self.bedrooms = bedrooms
        self.bathrooms = bathrooms
        self.isOccupied = isOccupied
    }
}
