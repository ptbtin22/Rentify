//
//  SwiftDataPersistenceContainer.swift
//  Rentify
//
//  Created by Tin Pham on 26/7/26.
//

import Foundation
import SwiftData

@MainActor
final class SwiftDataPersistenceContainer: PersistenceContainerProtocol {
    static let shared = SwiftDataPersistenceContainer()
    
    let container: ModelContainer
    let context: ModelContext
    
    // MARK: - Initializers
    
    init(isInMemory: Bool = false) {
        let schema = Schema([
            Property.self,
            Tenant.self,
            Lease.self,
            Payment.self,
            Notice.self
        ])
        let modelConfiguration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: isInMemory)
        do {
            container = try ModelContainer(for: schema, configurations: [modelConfiguration])
            context = container.mainContext
        } catch {
            fatalError("Failed to initialize ModelContainer: \(error.localizedDescription)")
        }
    }
}
