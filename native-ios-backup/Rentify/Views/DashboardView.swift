//
//  DashboardView.swift
//  Rentify
//
//  Created by Tin Pham on 21/7/26.
//

import SwiftUI
import Charts

struct DashboardView: View {
    @State private var viewModel = DashboardViewModel(
        propertyRepository: AppDependencyContainer.shared.propertyRepository,
        leaseRepository: AppDependencyContainer.shared.leaseRepository,
        paymentRepository: AppDependencyContainer.shared.paymentRepository
    )
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Header Section
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Welcome Back")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Text("Rentify Dashboard")
                            .font(.largeTitle.bold())
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal)
                    .padding(.top)
                    
                    // Metrics Grid
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                        MetricCard(
                            title: "Monthly Revenue",
                            value: viewModel.totalRevenue.formatted(.currency(code: "USD")),
                            icon: "dollarsign.circle.fill",
                            gradient: Gradient(colors: [.blue, .purple])
                        )
                        MetricCard(
                            title: "Unpaid Balance",
                            value: viewModel.unpaidBalance.formatted(.currency(code: "USD")),
                            icon: "exclamationmark.circle.fill",
                            gradient: Gradient(colors: [.orange, .red])
                        )
                        MetricCard(
                            title: "Occupancy Rate",
                            value: String(format: "%.1f%%", viewModel.occupancyRate),
                            icon: "house.fill",
                            gradient: Gradient(colors: [.green, .teal])
                        )
                        MetricCard(
                            title: "Active Leases",
                            value: "\(viewModel.activeLeasesCount)",
                            icon: "doc.text.fill",
                            gradient: Gradient(colors: [.purple, .pink])
                        )
                    }
                    .padding(.horizontal)
                    
                    // Charts Section (If data exists)
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Payment Status Overview")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        if viewModel.payments.isEmpty {
                            VStack(spacing: 12) {
                                Image(systemName: "chart.pie.fill")
                                    .font(.system(size: 40))
                                    .foregroundColor(.secondary.opacity(0.5))
                                Text("No payment data available yet.")
                                    .foregroundColor(.secondary)
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 180)
                            .background(Color(.secondarySystemBackground))
                            .cornerRadius(16)
                            .padding(.horizontal)
                        } else {
                            Chart {
                                ForEach(viewModel.payments) { payment in
                                    BarMark(
                                        x: .value("Date", payment.dueDate, unit: .month),
                                        y: .value("Amount", payment.amount)
                                    )
                                    .foregroundStyle(by: .value("Status", payment.status.rawValue))
                                }
                            }
                            .chartForegroundStyleScale([
                                "Paid": Color.green,
                                "Pending": Color.blue,
                                "Overdue": Color.red
                            ])
                            .frame(height: 180)
                            .padding()
                            .background(Color(.secondarySystemBackground))
                            .cornerRadius(16)
                            .padding(.horizontal)
                        }
                    }
                    
                    // Recent Payments
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Recent Payments")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        if viewModel.payments.isEmpty {
                            VStack {
                                Text("No recent payments logged.")
                                    .foregroundColor(.secondary)
                                    .padding()
                            }
                            .frame(maxWidth: .infinity, alignment: .center)
                            .background(Color(.secondarySystemBackground))
                            .cornerRadius(16)
                            .padding(.horizontal)
                        } else {
                            VStack(spacing: 0) {
                                ForEach(viewModel.payments.prefix(5)) { payment in
                                    HStack {
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(payment.lease?.property?.name ?? "Unknown Property")
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
                        }
                    }
                }
                .padding(.bottom, 20)
            }
            .background(Color(.systemBackground))
            .navigationTitle("Dashboard")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        AuthManager.shared.logout()
                    } label: {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                            .foregroundColor(.red)
                    }
                }
            }
            .task {
                await viewModel.refresh()
            }
        }
    }
}

// MARK: - Private

extension DashboardView {
    private func statusColor(_ status: PaymentStatus) -> Color {
        switch status {
        case .paid: return .green
        case .overdue: return .red
        default: return .orange
        }
    }
}

// MARK: - MetricCard

struct MetricCard: View {
    let title: String
    let value: String
    let icon: String
    let gradient: Gradient
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundStyle(LinearGradient(gradient: gradient, startPoint: .topLeading, endPoint: .bottomTrailing))
                Spacer()
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(value)
                    .font(.title2.bold())
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}
