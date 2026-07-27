//
//  NoticeTests.swift
//  RentifyTests
//
//  Created by Tin Pham on 26/7/26.
//

import XCTest
import SwiftData
@testable import Rentify

@MainActor
final class NoticeTests: XCTestCase {
    
    var testContainer: SwiftDataPersistenceContainer!
    var noticeRepo: NoticeRepositoryProtocol!
    
    override func setUpWithError() throws {
        super.setUp()
        testContainer = SwiftDataPersistenceContainer(isInMemory: true)
        let local = SwiftDataNoticeLocalDataSource(container: testContainer)
        let remote = APINoticeNoticeRemoteDataSourceMock()
        noticeRepo = NoticeRepository(localDataSource: local, remoteDataSource: remote)
    }
    
    override func tearDownWithError() throws {
        noticeRepo = nil
        testContainer = nil
        super.tearDown()
    }
    
    func testNoticeCRUDOperations() async throws {
        let notice = try await noticeRepo.addNotice(
            type: .info,
            title: "Water Outage",
            body: "Water will be off tomorrow from 9 AM to 11 AM.",
            senderName: "Landlord"
        )
        
        XCTAssertEqual(notice.title, "Water Outage")
        XCTAssertEqual(notice.type, .info)
        XCTAssertEqual(notice.senderName, "Landlord")
        
        let list = try await noticeRepo.fetchNotices()
        XCTAssertEqual(list.count, 1)
        XCTAssertEqual(list.first?.title, "Water Outage")
        
        try await noticeRepo.deleteNotice(notice)
        let emptyList = try await noticeRepo.fetchNotices()
        XCTAssertTrue(emptyList.isEmpty)
    }
    
    func testNoticesViewModelActions() async throws {
        let viewModel = NoticesViewModel(repository: noticeRepo)
        XCTAssertTrue(viewModel.notices.isEmpty)
        
        await viewModel.refresh()
        XCTAssertTrue(viewModel.notices.isEmpty)
        
        await viewModel.addNotice(
            type: .fire,
            title: "EMERGENCY FIRE ALERT",
            body: "Evacuate now!",
            senderName: "Tenant"
        )
        XCTAssertEqual(viewModel.notices.count, 1)
        XCTAssertEqual(viewModel.notices.first?.type, .fire)
        
        if let notice = viewModel.notices.first {
            await viewModel.deleteNotice(notice)
            XCTAssertTrue(viewModel.notices.isEmpty)
        }
    }
}

// MARK: - Mock Remote Data Source

@MainActor
private final class APINoticeNoticeRemoteDataSourceMock: NoticeRemoteDataSourceProtocol {
    func fetchRemoteNotices() async throws -> [Notice] {
        return []
    }
}
