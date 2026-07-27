//
//  NoticeType.swift
//  Rentify
//
//  Created by Tin Pham on 26/7/26.
//

import Foundation

enum NoticeType: String, Codable, CaseIterable {
    case info = "Info"
    case urgent = "Urgent"
    case fire = "Fire"
}
