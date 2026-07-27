//
//  NoticeDataSources.swift
//  Rentify
//
//  Created by Tin Pham on 26/7/26.
//

import Foundation
import SwiftData

@MainActor
protocol NoticeLocalDataSourceProtocol {
    func fetchNotices() async throws -> [Notice]
    func addNotice(type: NoticeType, title: String, body: String, senderName: String) async throws -> Notice
    func deleteNotice(_ notice: Notice) async throws
}

@MainActor
final class SwiftDataNoticeLocalDataSource: NoticeLocalDataSourceProtocol {
    private let container: PersistenceContainerProtocol
    
    init(container: PersistenceContainerProtocol) {
        self.container = container
    }
    
    func fetchNotices() async throws -> [Notice] {
        return container.fetchAll(FetchDescriptor<Notice>(sortBy: [SortDescriptor(\.createdAt, order: .reverse)]))
    }
    
    func addNotice(type: NoticeType, title: String, body: String, senderName: String) async throws -> Notice {
        let notice = Notice(type: type, title: title, body: body, senderName: senderName)
        container.insert(notice)
        return notice
    }
    
    func deleteNotice(_ notice: Notice) async throws {
        container.delete(notice)
    }
}

@MainActor
protocol NoticeRemoteDataSourceProtocol {
    func fetchRemoteNotices() async throws -> [Notice]
}

@MainActor
final class APINoticeRemoteDataSource: NoticeRemoteDataSourceProtocol {
    init() {}
    
    func fetchRemoteNotices() async throws -> [Notice] {
        try await Task.sleep(nanoseconds: 100_000_000)
        return []
    }
}
