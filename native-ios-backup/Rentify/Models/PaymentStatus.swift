//
//  PaymentStatus.swift
//  Rentify
//
//  Created by Tin Pham on 26/7/26.
//

import Foundation

enum PaymentStatus: String, Codable, CaseIterable {
    case paid = "Paid"
    case overdue = "Overdue"
    case pending = "Pending"
    case cancelled = "Cancelled"
}
