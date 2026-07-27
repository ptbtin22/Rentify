//
//  NoticeRepository.swift
//  Rentify
//
//  Created by Tin Pham on 26/7/26.
//

import Foundation

@MainActor
protocol NoticeRepositoryProtocol {
    func fetchNotices() async throws -> [Notice]
    func addNotice(type: NoticeType, title: String, body: String, senderName: String) async throws -> Notice
    func deleteNotice(_ notice: Notice) async throws
}

@MainActor
final class NoticeRepository {
    private let localDataSource: NoticeLocalDataSourceProtocol
    private let remoteDataSource: NoticeRemoteDataSourceProtocol
    
    init(localDataSource: NoticeLocalDataSourceProtocol, remoteDataSource: NoticeRemoteDataSourceProtocol) {
        self.localDataSource = localDataSource
        self.remoteDataSource = remoteDataSource
    }
}

// MARK: - NoticeRepositoryProtocol

extension NoticeRepository: NoticeRepositoryProtocol {
    func fetchNotices() async throws -> [Notice] {
        return try await localDataSource.fetchNotices()
    }
    
    func addNotice(type: NoticeType, title: String, body: String, senderName: String) async throws -> Notice {
        return try await localDataSource.addNotice(type: type, title: title, body: body, senderName: senderName)
    }
    
    func deleteNotice(_ notice: Notice) async throws {
        try await localDataSource.deleteNotice(notice)
    }
}
