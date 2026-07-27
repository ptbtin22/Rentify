//
//  NoticesViewModel.swift
//  Rentify
//
//  Created by Tin Pham on 26/7/26.
//

import Foundation
import SwiftData
import Observation

@Observable
@MainActor
final class NoticesViewModel {
    private let repository: NoticeRepositoryProtocol
    
    var notices: [Notice] = []
    var isLoading = false
    var errorMessage: String? = nil
    
    init(repository: NoticeRepositoryProtocol) {
        self.repository = repository
    }
}

// MARK: - Actions

extension NoticesViewModel {
    func refresh() async {
        isLoading = true
        errorMessage = nil
        do {
            notices = try await repository.fetchNotices()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    func addNotice(type: NoticeType, title: String, body: String, senderName: String) async {
        isLoading = true
        errorMessage = nil
        do {
            _ = try await repository.addNotice(type: type, title: title, body: body, senderName: senderName)
            await refresh()
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
        }
    }
    
    func deleteNotice(_ notice: Notice) async {
        isLoading = true
        errorMessage = nil
        do {
            try await repository.deleteNotice(notice)
            await refresh()
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
        }
    }
}
