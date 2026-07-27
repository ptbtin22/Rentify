//
//  Lease.swift
//  Rentify
//
//  Created by Tin Pham on 21/7/26.
//

import Foundation
import SwiftData

@Model
final class Lease {
    @Attribute(.unique) var id: UUID
    var startDate: Date
    var endDate: Date
    var monthlyRent: Double
    var securityDeposit: Double
    var status: LeaseStatus
    
    var property: Property?
    var tenant: Tenant?
    
    @Relationship(deleteRule: .cascade, inverse: \Payment.lease)
    var payments: [Payment] = []
    
    init(id: UUID = UUID(), startDate: Date, endDate: Date, monthlyRent: Double, securityDeposit: Double, status: LeaseStatus = .pending, property: Property? = nil, tenant: Tenant? = nil) {
        self.id = id
        self.startDate = startDate
        self.endDate = endDate
        self.monthlyRent = monthlyRent
        self.securityDeposit = securityDeposit
        self.status = status
        self.property = property
        self.tenant = tenant
    }
}
