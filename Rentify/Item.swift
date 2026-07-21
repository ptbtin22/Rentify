//
//  Item.swift
//  Rentify
//
//  Created by Tin Pham on 21/7/26.
//

import Foundation
import SwiftData

@Model
final class Item {
    var timestamp: Date
    
    init(timestamp: Date) {
        self.timestamp = timestamp
    }
}
