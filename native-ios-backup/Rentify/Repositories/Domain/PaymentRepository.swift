//
//  PaymentRepository.swift
//  Rentify
//
//  Created by Tin Pham on 26/7/26.
//

import Foundation

@MainActor
protocol PaymentRepositoryProtocol {
    func fetchPayments() async throws -> [Payment]
    func recordPaymentReceived(payment: Payment) async throws
}

@MainActor
final class PaymentRepository {
    private let localDataSource: PaymentLocalDataSourceProtocol
    private let remoteDataSource: PaymentRemoteDataSourceProtocol
    
    init(localDataSource: PaymentLocalDataSourceProtocol, remoteDataSource: PaymentRemoteDataSourceProtocol) {
        self.localDataSource = localDataSource
        self.remoteDataSource = remoteDataSource
    }
}

// MARK: - PaymentRepositoryProtocol

extension PaymentRepository: PaymentRepositoryProtocol {
    func fetchPayments() async throws -> [Payment] {
        return try await localDataSource.fetchPayments()
    }
    
    func recordPaymentReceived(payment: Payment) async throws {
        try await localDataSource.recordPaymentReceived(payment: payment)
    }
}
