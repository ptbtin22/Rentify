//
//  TenantPortalView.swift
//  Rentify
//
//  Created by Tin Pham on 21/7/26.
//

import SwiftUI
import SwiftData

struct TenantPortalView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var tenants: [Tenant]
    @Query private var leases: [Lease]
    
    // Find first active tenant lease, or fallback to mock
    var activeLease: Lease? {
        leases.first(where: { $0.status == .active })
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    
                    // Welcome Header
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Welcome Back 👋")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Text(activeLease?.tenant?.name ?? "Jane Tenant")
                            .font(.largeTitle.bold())
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal)
                    .padding(.top)
                    
                    // Active Lease Contract Card
                    VStack(alignment: .leading, spacing: 16) {
                        HStack {
                            Image(systemName: "doc.text.fill")
                                .font(.title2)
                                .foregroundColor(.green)
                            Text("Active Lease Agreement")
                                .font(.headline)
                            Spacer()
                            Text("ACTIVE")
                                .font(.caption.bold())
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.green.opacity(0.15))
                                .foregroundColor(.green)
                                .cornerRadius(6)
                        }
                        
                        Divider()
                        
                        VStack(alignment: .leading, spacing: 12) {
                            LabeledPortalContent(
                                label: "Rental Address",
                                value: activeLease?.property?.address ?? "456 Greenway Blvd, Room 202"
                            )
                            LabeledPortalContent(
                                label: "Monthly Rent",
                                value: (activeLease?.monthlyRent ?? 1200.0).formatted(.currency(code: "USD"))
                            )
                            LabeledPortalContent(
                                label: "Security Deposit",
                                value: (activeLease?.securityDeposit ?? 1200.0).formatted(.currency(code: "USD"))
                            )
                            LabeledPortalContent(
                                label: "Lease Duration",
                                value: activeLease != nil
                                    ? "\(activeLease!.startDate.formatted(date: .abbreviated, time: .omitted)) - \(activeLease!.endDate.formatted(date: .abbreviated, time: .omitted))"
                                    : "Aug 1, 2026 - Jul 31, 2027"
                            )
                        }
                    }
                    .padding()
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(16)
                    .padding(.horizontal)
                    
                    // Payment Schedule Log
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Your Rent Payments")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        if let lease = activeLease, !lease.payments.isEmpty {
                            VStack(spacing: 0) {
                                ForEach(lease.payments.sorted(by: { $0.dueDate < $1.dueDate })) { payment in
                                    HStack {
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(payment.notes.isEmpty ? "Rent Invoice" : payment.notes)
                                                .font(.body.bold())
                                            Text("Due: \(payment.dueDate.formatted(date: .abbreviated, time: .omitted))")
                                                .font(.caption)
                                                .foregroundColor(.secondary)
                                        }
                                        Spacer()
                                        VStack(alignment: .trailing, spacing: 4) {
                                            Text(payment.amount.formatted(.currency(code: "USD")))
                                                .font(.body.bold())
                                            Text(payment.status.rawValue)
                                                .font(.caption.bold())
                                                .foregroundColor(statusColor(payment.status))
                                        }
                                    }
                                    .padding()
                                    Divider()
                                }
                            }
                            .background(Color(.secondarySystemBackground))
                            .cornerRadius(16)
                            .padding(.horizontal)
                        } else {
                            // Mock Payments for Demo
                            VStack(spacing: 0) {
                                MockPaymentRow(title: "August Rent", dueDate: "Aug 1, 2026", amount: 1200, status: "Paid", color: .green)
                                MockPaymentRow(title: "September Rent", dueDate: "Sep 1, 2026", amount: 1200, status: "Pending", color: .blue)
                                MockPaymentRow(title: "October Rent", dueDate: "Oct 1, 2026", amount: 1200, status: "Pending", color: .blue)
                            }
                            .background(Color(.secondarySystemBackground))
                            .cornerRadius(16)
                            .padding(.horizontal)
                        }
                    }
                }
                .padding(.bottom, 20)
            }
            .background(Color(.systemBackground))
            .navigationTitle("Tenant Portal")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        AuthManager.shared.logout()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                            Text("Logout")
                        }
                        .foregroundColor(.red)
                    }
                }
            }
        }
    }
    
    private func statusColor(_ status: PaymentStatus) -> Color {
        switch status {
        case .paid: return .green
        case .overdue: return .red
        default: return .blue
        }
    }
}

struct LabeledPortalContent: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack(alignment: .top) {
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(width: 110, alignment: .leading)
            Text(value)
                .font(.caption.bold())
                .foregroundColor(Color(.label))
            Spacer()
        }
    }
}

struct MockPaymentRow: View {
    let title: String
    let dueDate: String
    let amount: Double
    let status: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 0) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.body.bold())
                    Text("Due: \(dueDate)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 4) {
                    Text(amount.formatted(.currency(code: "USD")))
                        .font(.body.bold())
                    Text(status)
                        .font(.caption.bold())
                        .foregroundColor(color)
                }
            }
            .padding()
            Divider()
        }
    }
}

#Preview {
    TenantPortalView()
}
