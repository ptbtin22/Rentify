//
//  PaymentsView.swift
//  Rentify
//
//  Created by Tin Pham on 21/7/26.
//

import SwiftUI

struct PaymentsView: View {
    @State private var viewModel = PaymentsViewModel(
        paymentRepository: AppDependencyContainer.shared.paymentRepository,
        leaseRepository: AppDependencyContainer.shared.leaseRepository
    )
    @State private var selectedStatusFilter: PaymentStatus? = nil
    @State private var isShowingAddLeaseSheet = false
    
    var filteredPayments: [Payment] {
        if let filter = selectedStatusFilter {
            return viewModel.payments.filter { $0.status == filter }
        } else {
            return viewModel.payments
        }
    }
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Filter Segmented Control
                Picker("Filter", selection: $selectedStatusFilter) {
                    Text("All").tag(nil as PaymentStatus?)
                    ForEach(PaymentStatus.allCases, id: \.self) { status in
                        Text(status.rawValue).tag(status as PaymentStatus?)
                    }
                }
                .pickerStyle(.segmented)
                .padding()
                
                List {
                    if filteredPayments.isEmpty {
                        ContentUnavailableView(
                            "No Payments",
                            systemImage: "creditcard.and.123",
                            description: Text("No payments found for status: \(selectedStatusFilter?.rawValue ?? "All"). Create a new lease to set up rent payments.")
                        )
                    } else {
                        ForEach(filteredPayments) { payment in
                            HStack(spacing: 12) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(payment.lease?.property?.name ?? "Unknown Property")
                                        .font(.headline)
                                    Text("Tenant: \(payment.lease?.tenant?.name ?? "Unknown")")
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                    Text("Due: \(payment.dueDate.formatted(date: .abbreviated, time: .omitted))")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                
                                Spacer()
                                
                                VStack(alignment: .trailing, spacing: 6) {
                                    Text(payment.amount.formatted(.currency(code: "USD")))
                                        .font(.body.bold())
                                    
                                    Text(payment.status.rawValue)
                                        .font(.caption2.bold())
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(statusBackgroundColor(payment.status))
                                        .foregroundColor(statusForegroundColor(payment.status))
                                        .cornerRadius(8)
                                }
                            }
                            .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                                if payment.status != .paid {
                                    Button {
                                        Task {
                                            await viewModel.recordPaymentReceived(payment: payment)
                                        }
                                    } label: {
                                        Label("Record Paid", systemImage: "checkmark.circle.fill")
                                    }
                                    .tint(.green)
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Payments & Leases")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        isShowingAddLeaseSheet = true
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "doc.badge.plus")
                            Text("New Lease")
                                .font(.subheadline)
                        }
                    }
                }
            }
            .sheet(isPresented: $isShowingAddLeaseSheet) {
                AddLeaseSheet(viewModel: viewModel)
            }
            .task {
                await viewModel.refresh()
            }
        }
    }
    
    private func statusBackgroundColor(_ status: PaymentStatus) -> Color {
        switch status {
        case .paid: return .green.opacity(0.2)
        case .overdue: return .red.opacity(0.2)
        default: return .blue.opacity(0.2)
        }
    }
    
    private func statusForegroundColor(_ status: PaymentStatus) -> Color {
        switch status {
        case .paid: return .green
        case .overdue: return .red
        default: return .blue
        }
    }
}

struct AddLeaseSheet: View {
    @Environment(\.dismiss) private var dismiss
    let viewModel: PaymentsViewModel
    
    @State private var properties: [Property] = []
    @State private var tenants: [Tenant] = []
    
    @State private var selectedProperty: Property?
    @State private var selectedTenant: Tenant?
    @State private var startDate = Date()
    @State private var endDate = Calendar.current.date(byAdding: .year, value: 1, to: Date()) ?? Date()
    @State private var monthlyRent: Double = 0.0
    @State private var securityDeposit: Double = 0.0
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Property & Tenant") {
                    if properties.isEmpty {
                        Text("Add a property first in the Properties tab.")
                            .foregroundColor(.red)
                    } else {
                        Picker("Property", selection: $selectedProperty) {
                            Text("Select Property").tag(nil as Property?)
                            ForEach(properties) { property in
                                Text("\(property.name) (\(property.isOccupied ? "Occupied" : "Vacant"))")
                                    .tag(property as Property?)
                            }
                        }
                    }
                    
                    if tenants.isEmpty {
                        Text("Add a tenant first in the Tenants tab.")
                            .foregroundColor(.red)
                    } else {
                        Picker("Tenant", selection: $selectedTenant) {
                            Text("Select Tenant").tag(nil as Tenant?)
                            ForEach(tenants) { tenant in
                                Text(tenant.name).tag(tenant as Tenant?)
                            }
                        }
                    }
                }
                
                Section("Lease Terms") {
                    DatePicker("Start Date", selection: $startDate, displayedComponents: .date)
                    DatePicker("End Date", selection: $endDate, displayedComponents: .date)
                    
                    HStack {
                        Text("Monthly Rent")
                        Spacer()
                        TextField("Rent", value: $monthlyRent, format: .number)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 100)
                    }
                    
                    HStack {
                        Text("Security Deposit")
                        Spacer()
                        TextField("Deposit", value: $securityDeposit, format: .number)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 100)
                    }
                }
            }
            .navigationTitle("New Lease")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        if let property = selectedProperty, let tenant = selectedTenant {
                            Task {
                                await viewModel.createLease(
                                    property: property,
                                    tenant: tenant,
                                    startDate: startDate,
                                    endDate: endDate,
                                    monthlyRent: monthlyRent == 0.0 ? property.rentAmount : monthlyRent,
                                    securityDeposit: securityDeposit
                                )
                                dismiss()
                            }
                        }
                    }
                    .disabled(selectedProperty == nil || selectedTenant == nil || endDate <= startDate)
                }
            }
            .task {
                let container = AppDependencyContainer.shared.persistenceContainer
                let propertyRepo = PropertyRepository(
                    localDataSource: SwiftDataPropertyLocalDataSource(container: container),
                    remoteDataSource: APIPropertyRemoteDataSource()
                )
                let tenantRepo = TenantRepository(
                    localDataSource: SwiftDataTenantLocalDataSource(container: container),
                    remoteDataSource: APITenantRemoteDataSource()
                )
                
                do {
                    properties = try await propertyRepo.fetchProperties()
                    tenants = try await tenantRepo.fetchTenants()
                    
                    if let vacant = properties.first(where: { !$0.isOccupied }) {
                        selectedProperty = vacant
                        monthlyRent = vacant.rentAmount
                        securityDeposit = vacant.rentAmount
                    } else {
                        selectedProperty = properties.first
                        if let first = properties.first {
                            monthlyRent = first.rentAmount
                            securityDeposit = first.rentAmount
                        }
                    }
                    selectedTenant = tenants.first
                } catch {
                    print("Error loading sheet details: \(error)")
                }
            }
            .onChange(of: selectedProperty) { _, newValue in
                if let prop = newValue {
                    monthlyRent = prop.rentAmount
                    securityDeposit = prop.rentAmount
                }
            }
        }
    }
}
