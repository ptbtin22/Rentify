//
//  TenantsView.swift
//  Rentify
//
//  Created by Tin Pham on 21/7/26.
//

import SwiftUI

struct TenantsView: View {
    @State private var viewModel = TenantsViewModel(repository: AppDependencyContainer.shared.tenantRepository)
    @State private var isShowingAddSheet = false
    
    var body: some View {
        NavigationStack {
            List {
                if viewModel.tenants.isEmpty {
                    ContentUnavailableView(
                        "No Tenants",
                        systemImage: "person.3.fill",
                        description: Text("Add your first tenant to get started.")
                    )
                } else {
                    ForEach(viewModel.tenants) { tenant in
                        NavigationLink {
                            TenantDetailView(tenant: tenant, viewModel: viewModel)
                        } label: {
                            HStack(spacing: 12) {
                                Image(systemName: "person.crop.circle.fill")
                                    .font(.title2)
                                    .foregroundColor(.purple)
                                    .padding(8)
                                    .background(Color.purple.opacity(0.1))
                                    .cornerRadius(8)
                                
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(tenant.name)
                                        .font(.headline)
                                    Text(tenant.email)
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                }
                                
                                Spacer()
                                
                                if !tenant.leases.isEmpty {
                                    Text("Leasing")
                                        .font(.caption2.bold())
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(Color.green.opacity(0.2))
                                        .foregroundColor(.green)
                                        .cornerRadius(8)
                                } else {
                                    Text("Inactive")
                                        .font(.caption2.bold())
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(Color.secondary.opacity(0.2))
                                        .foregroundColor(.secondary)
                                        .cornerRadius(8)
                                }
                            }
                        }
                    }
                    .onDelete { offsets in
                        Task {
                            await viewModel.deleteTenant(at: offsets)
                        }
                    }
                }
            }
            .navigationTitle("Tenants")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        isShowingAddSheet = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title3)
                    }
                }
            }
            .sheet(isPresented: $isShowingAddSheet) {
                AddTenantSheet(viewModel: viewModel)
            }
            .task {
                await viewModel.refresh()
            }
        }
    }
}

struct AddTenantSheet: View {
    @Environment(\.dismiss) private var dismiss
    let viewModel: TenantsViewModel
    
    @State private var name = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var notes = ""
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Contact Information") {
                    TextField("Name", text: $name)
                    TextField("Email", text: $email)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                    TextField("Phone", text: $phone)
                        .keyboardType(.phonePad)
                }
                
                Section("Notes") {
                    TextField("Add any notes", text: $notes, axis: .vertical)
                        .lineLimit(3...5)
                }
            }
            .navigationTitle("Add Tenant")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task {
                            await viewModel.addTenant(name: name, email: email, phone: phone, notes: notes)
                            dismiss()
                        }
                    }
                    .disabled(name.isEmpty || email.isEmpty)
                }
            }
        }
    }
}

struct TenantDetailView: View {
    let tenant: Tenant
    let viewModel: TenantsViewModel
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        List {
            Section("Contact Details") {
                LabeledContent("Name", value: tenant.name)
                LabeledContent("Email", value: tenant.email)
                LabeledContent("Phone", value: tenant.phone)
                if !tenant.notes.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Notes")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(tenant.notes)
                    }
                }
            }
            
            if !tenant.leases.isEmpty {
                Section("Leases") {
                    ForEach(tenant.leases) { lease in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(lease.property?.name ?? "Unknown Property")
                                .font(.headline)
                            Text("\(lease.startDate.formatted(date: .abbreviated, time: .omitted)) - \(lease.endDate.formatted(date: .abbreviated, time: .omitted))")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
            
            Section {
                Button(role: .destructive) {
                    Task {
                        await viewModel.deleteTenant(tenant)
                        dismiss()
                    }
                } label: {
                    Text("Delete Tenant")
                        .frame(maxWidth: .infinity)
                }
            }
        }
        .navigationTitle(tenant.name)
        .navigationBarTitleDisplayMode(.inline)
    }
}
