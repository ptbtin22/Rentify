//
//  Payment.swift
//  Rentify
//
//  Created by Tin Pham on 21/7/26.
//

import Foundation
import SwiftData

@Model
final class Payment {
    @Attribute(.unique) var id: UUID
    var amount: Double
    var dueDate: Date
    var paymentDate: Date?
    var status: PaymentStatus
    var notes: String
    
    var lease: Lease?
    
    init(id: UUID = UUID(), amount: Double, dueDate: Date, paymentDate: Date? = nil, status: PaymentStatus = .pending, notes: String = "", lease: Lease? = nil) {
        self.id = id
        self.amount = amount
        self.dueDate = dueDate
        self.paymentDate = paymentDate
        self.status = status
        self.notes = notes
        self.lease = lease
    }
}
