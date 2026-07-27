//
//  PropertiesView.swift
//  Rentify
//
//  Created by Tin Pham on 21/7/26.
//

import SwiftUI

struct PropertiesView: View {
    @State private var viewModel = PropertiesViewModel(repository: AppDependencyContainer.shared.propertyRepository)
    @State private var isShowingAddSheet = false
    
    var body: some View {
        NavigationStack {
            List {
                if viewModel.properties.isEmpty {
                    ContentUnavailableView(
                        "No Properties",
                        systemImage: "house.lodge",
                        description: Text("Add your first rental property to get started.")
                    )
                } else {
                    ForEach(viewModel.properties) { property in
                        NavigationLink {
                            PropertyDetailView(property: property, viewModel: viewModel)
                        } label: {
                            HStack(spacing: 12) {
                                Image(systemName: property.propertyType == "House" ? "house.fill" : "building.2.fill")
                                    .font(.title2)
                                    .foregroundColor(.blue)
                                    .padding(8)
                                    .background(Color.blue.opacity(0.1))
                                    .cornerRadius(8)
                                
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(property.name)
                                        .font(.headline)
                                    Text(property.address)
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                }
                                
                                Spacer()
                                
                                VStack(alignment: .trailing, spacing: 4) {
                                    Text(property.rentAmount.formatted(.currency(code: "USD")))
                                        .font(.subheadline.bold())
                                    
                                    Text(property.isOccupied ? "Occupied" : "Vacant")
                                        .font(.caption2.bold())
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(property.isOccupied ? Color.green.opacity(0.2) : Color.orange.opacity(0.2))
                                        .foregroundColor(property.isOccupied ? .green : .orange)
                                        .cornerRadius(8)
                                }
                            }
                        }
                    }
                    .onDelete { offsets in
                        Task {
                            await viewModel.deleteProperty(at: offsets)
                        }
                    }
                }
            }
            .navigationTitle("Properties")
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
                AddPropertySheet(viewModel: viewModel)
            }
            .task {
                await viewModel.refresh()
            }
        }
    }
}

struct AddPropertySheet: View {
    @Environment(\.dismiss) private var dismiss
    let viewModel: PropertiesViewModel
    
    @State private var name = ""
    @State private var address = ""
    @State private var propertyType = "Apartment"
    @State private var rentAmount: Double = 1500
    @State private var bedrooms = 2
    @State private var bathrooms: Double = 1.0
    
    let types = ["Apartment", "House", "Condo", "Townhouse"]
    
    var body: some View {
        NavigationStack {
            Form {
                Section("General Information") {
                    TextField("Property Name (e.g. Oakridge Apt 4B)", text: $name)
                    TextField("Address", text: $address)
                    Picker("Property Type", selection: $propertyType) {
                        ForEach(types, id: \.self) { type in
                            Text(type).tag(type)
                        }
                    }
                }
                
                Section("Financials & Size") {
                    HStack {
                        Text("Monthly Rent")
                        Spacer()
                        TextField("Rent", value: $rentAmount, format: .number)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 100)
                    }
                    
                    Stepper("Bedrooms: \(bedrooms)", value: $bedrooms, in: 1...10)
                    Stepper("Bathrooms: \(String(format: "%.1f", bathrooms))", value: $bathrooms, in: 1...10, step: 0.5)
                }
            }
            .navigationTitle("Add Property")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task {
                            await viewModel.addProperty(
                                name: name,
                                address: address,
                                type: propertyType,
                                rent: rentAmount,
                                bedrooms: bedrooms,
                                bathrooms: bathrooms
                            )
                            dismiss()
                        }
                    }
                    .disabled(name.isEmpty || address.isEmpty)
                }
            }
        }
    }
}

struct PropertyDetailView: View {
    let property: Property
    let viewModel: PropertiesViewModel
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        List {
            Section("Details") {
                LabeledContent("Name", value: property.name)
                LabeledContent("Address", value: property.address)
                LabeledContent("Type", value: property.propertyType)
                LabeledContent("Rent", value: property.rentAmount.formatted(.currency(code: "USD")))
                LabeledContent("Bedrooms", value: "\(property.bedrooms)")
                LabeledContent("Bathrooms", value: String(format: "%.1f", property.bathrooms))
                LabeledContent("Status", value: property.isOccupied ? "Occupied" : "Vacant")
            }
            
            if !property.leases.isEmpty {
                Section("Lease History") {
                    ForEach(property.leases) { lease in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(lease.tenant?.name ?? "Unknown Tenant")
                                .font(.headline)
                            Text("\(lease.startDate.formatted(date: .numeric, time: .omitted)) - \(lease.endDate.formatted(date: .numeric, time: .omitted))")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
            
            Section {
                Button(role: .destructive) {
                    Task {
                        await viewModel.deleteProperty(property)
                        dismiss()
                    }
                } label: {
                    Text("Delete Property")
                        .frame(maxWidth: .infinity)
                }
            }
        }
        .navigationTitle(property.name)
        .navigationBarTitleDisplayMode(.inline)
    }
}
