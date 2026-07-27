//
//  Tenant.swift
//  Rentify
//
//  Created by Tin Pham on 21/7/26.
//

import Foundation
import SwiftData

@Model
final class Tenant {
    @Attribute(.unique) var id: UUID
    var name: String
    var email: String
    var phone: String
    var notes: String
    
    @Relationship(deleteRule: .cascade, inverse: \Lease.tenant)
    var leases: [Lease] = []
    
    init(id: UUID = UUID(), name: String, email: String, phone: String, notes: String = "") {
        self.id = id
        self.name = name
        self.email = email
        self.phone = phone
        self.notes = notes
    }
}
