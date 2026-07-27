//
//  PersistenceContainerProtocol.swift
//  Rentify
//
//  Created by Tin Pham on 26/7/26.
//

import Foundation
import SwiftData

@MainActor
protocol PersistenceContainerProtocol {
    var context: ModelContext { get }
    var container: ModelContainer { get }
}

extension PersistenceContainerProtocol {
    func fetchAll<T: PersistentModel>(_ descriptor: FetchDescriptor<T> = FetchDescriptor<T>()) -> [T] {
        do {
            return try context.fetch(descriptor)
        } catch {
            print("[Persistence Container] Error fetching \(T.self) locally: \(error)")
            return []
        }
    }
    
    func insert<T: PersistentModel>(_ model: T) {
        context.insert(model)
        try? context.save()
    }
    
    func delete<T: PersistentModel>(_ model: T) {
        context.delete(model)
        try? context.save()
    }
}
