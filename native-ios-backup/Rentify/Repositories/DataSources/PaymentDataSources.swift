//
//  PaymentDataSources.swift
//  Rentify
//
//  Created by Tin Pham on 26/7/26.
//

import Foundation
import SwiftData

@MainActor
protocol PaymentLocalDataSourceProtocol {
    func fetchPayments() async throws -> [Payment]
    func recordPaymentReceived(payment: Payment) async throws
}

@MainActor
final class SwiftDataPaymentLocalDataSource: PaymentLocalDataSourceProtocol {
    private let container: PersistenceContainerProtocol
    
    init(container: PersistenceContainerProtocol) {
        self.container = container
    }
    
    func fetchPayments() async throws -> [Payment] {
        return container.fetchAll()
    }
    
    func recordPaymentReceived(payment: Payment) async throws {
        payment.status = .paid
        payment.paymentDate = Date()
        try? container.context.save()
    }
}

@MainActor
protocol PaymentRemoteDataSourceProtocol {
    func fetchRemotePayments() async throws -> [Payment]
}

@MainActor
final class APIPaymentRemoteDataSource: PaymentRemoteDataSourceProtocol {
    init() {}
    
    func fetchRemotePayments() async throws -> [Payment] {
        try await Task.sleep(nanoseconds: 100_000_000)
        return []
    }
}
