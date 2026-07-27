//
//  PaymentsViewModel.swift
//  Rentify
//
//  Created by Tin Pham on 21/7/26.
//

import Foundation
import SwiftData
import Observation

@Observable
@MainActor
final class PaymentsViewModel {
    private let paymentRepository: PaymentRepositoryProtocol
    private let leaseRepository: LeaseRepositoryProtocol
    
    var payments: [Payment] = []
    var leases: [Lease] = []
    var isLoading = false
    var errorMessage: String? = nil
    
    init(paymentRepository: PaymentRepositoryProtocol, leaseRepository: LeaseRepositoryProtocol) {
        self.paymentRepository = paymentRepository
        self.leaseRepository = leaseRepository
    }
}

// MARK: - Actions

extension PaymentsViewModel {
    func refresh() async {
        isLoading = true
        errorMessage = nil
        do {
            async let fetchedPayments = paymentRepository.fetchPayments()
            async let fetchedLeases = leaseRepository.fetchLeases()
            
            self.payments = try await fetchedPayments
            self.leases = try await fetchedLeases
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    func recordPaymentReceived(payment: Payment) async {
        isLoading = true
        errorMessage = nil
        do {
            try await paymentRepository.recordPaymentReceived(payment: payment)
            await refresh()
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
        }
    }
    
    func createLease(property: Property, tenant: Tenant, startDate: Date, endDate: Date, monthlyRent: Double, securityDeposit: Double) async {
        isLoading = true
        errorMessage = nil
        do {
            _ = try await leaseRepository.createLease(property: property, tenant: tenant, startDate: startDate, endDate: endDate, monthlyRent: monthlyRent, securityDeposit: securityDeposit)
            await refresh()
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
        }
    }
    
    func deleteLease(_ lease: Lease) async {
        isLoading = true
        errorMessage = nil
        do {
            try await leaseRepository.deleteLease(lease)
            await refresh()
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
        }
    }
}
