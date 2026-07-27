//
//  LeaseStatus.swift
//  Rentify
//
//  Created by Tin Pham on 26/7/26.
//

import Foundation

enum LeaseStatus: String, Codable, CaseIterable {
    case active = "Active"
    case expired = "Expired"
    case terminated = "Terminated"
    case pending = "Pending"
}
