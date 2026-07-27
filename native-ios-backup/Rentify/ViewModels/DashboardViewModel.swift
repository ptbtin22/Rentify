//
//  DashboardViewModel.swift
//  Rentify
//
//  Created by Tin Pham on 21/7/26.
//

import Foundation
import SwiftData
import Observation

@Observable
@MainActor
final class DashboardViewModel {
    private let propertyRepository: PropertyRepositoryProtocol
    private let leaseRepository: LeaseRepositoryProtocol
    private let paymentRepository: PaymentRepositoryProtocol
    
    // View States
    var isLoading = false
    var errorMessage: String? = nil
    
    // Data
    private(set) var properties: [Property] = []
    private(set) var leases: [Lease] = []
    private(set) var payments: [Payment] = []
    
    // Pre-calculated metrics
    private(set) var totalRevenue: Double = 0.0
    private(set) var unpaidBalance: Double = 0.0
    private(set) var activeLeasesCount: Int = 0
    private(set) var occupancyRate: Double = 0.0
    
    init(
        propertyRepository: PropertyRepositoryProtocol,
        leaseRepository: LeaseRepositoryProtocol,
        paymentRepository: PaymentRepositoryProtocol
    ) {
        self.propertyRepository = propertyRepository
        self.leaseRepository = leaseRepository
        self.paymentRepository = paymentRepository
    }
}

// MARK: - Actions

extension DashboardViewModel {
    func refresh() async {
        isLoading = true
        errorMessage = nil
        
        do {
            async let fetchedProperties = propertyRepository.fetchProperties()
            async let fetchedLeases = leaseRepository.fetchLeases()
            async let fetchedPayments = paymentRepository.fetchPayments()
            
            self.properties = try await fetchedProperties
            self.leases = try await fetchedLeases
            self.payments = try await fetchedPayments
            
            calculateMetrics()
        } catch {
            self.errorMessage = "Failed to load dashboard data: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    private func calculateMetrics() {
        totalRevenue = payments
            .filter { $0.status == .paid }
            .reduce(0) { $0 + $1.amount }
        
        unpaidBalance = payments
            .filter { $0.status == .overdue || $0.status == .pending }
            .reduce(0) { $0 + $1.amount }
        
        activeLeasesCount = leases
            .filter { $0.status == .active }
            .count
        
        if properties.isEmpty {
            occupancyRate = 0.0
        } else {
            let occupied = properties.filter { $0.isOccupied }.count
            occupancyRate = (Double(occupied) / Double(properties.count)) * 100.0
        }
    }
}
