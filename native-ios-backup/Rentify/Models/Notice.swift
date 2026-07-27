//
//  Notice.swift
//  Rentify
//
//  Created by Tin Pham on 26/7/26.
//

import Foundation
import SwiftData

@Model
final class Notice {
    @Attribute(.unique) var id: UUID
    var type: NoticeType
    var title: String
    var body: String
    var createdAt: Date
    var senderName: String
    
    init(id: UUID = UUID(), type: NoticeType = .info, title: String, body: String, createdAt: Date = Date(), senderName: String) {
        self.id = id
        self.type = type
        self.title = title
        self.body = body
        self.createdAt = createdAt
        self.senderName = senderName
    }
}
