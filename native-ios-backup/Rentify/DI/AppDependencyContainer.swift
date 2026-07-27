//
//  AppDependencyContainer.swift
//  Rentify
//
//  Created by Tin Pham on 26/7/26.
//

import Foundation

@MainActor
final class AppDependencyContainer {
    static let shared = AppDependencyContainer()
    
    let persistenceContainer: PersistenceContainerProtocol
    
    // MARK: - Lazy Repository Instantiations
    
    private(set) lazy var propertyRepository: PropertyRepositoryProtocol = {
        let propertyLocal = SwiftDataPropertyLocalDataSource(container: persistenceContainer)
        let propertyRemote = APIPropertyRemoteDataSource()
        return PropertyRepository(localDataSource: propertyLocal, remoteDataSource: propertyRemote)
    }()
    
    private(set) lazy var tenantRepository: TenantRepositoryProtocol = {
        let tenantLocal = SwiftDataTenantLocalDataSource(container: persistenceContainer)
        let tenantRemote = APITenantRemoteDataSource()
        return TenantRepository(localDataSource: tenantLocal, remoteDataSource: tenantRemote)
    }()
    
    private(set) lazy var leaseRepository: LeaseRepositoryProtocol = {
        let leaseLocal = SwiftDataLeaseLocalDataSource(container: persistenceContainer)
        let leaseRemote = APILeaseRemoteDataSource()
        return LeaseRepository(localDataSource: leaseLocal, remoteDataSource: leaseRemote)
    }()
    
    private(set) lazy var paymentRepository: PaymentRepositoryProtocol = {
        let paymentLocal = SwiftDataPaymentLocalDataSource(container: persistenceContainer)
        let paymentRemote = APIPaymentRemoteDataSource()
        return PaymentRepository(localDataSource: paymentLocal, remoteDataSource: paymentRemote)
    }()
    
    private(set) lazy var noticeRepository: NoticeRepositoryProtocol = {
        let noticeLocal = SwiftDataNoticeLocalDataSource(container: persistenceContainer)
        let noticeRemote = APINoticeRemoteDataSource()
        return NoticeRepository(localDataSource: noticeLocal, remoteDataSource: noticeRemote)
    }()
    
    // MARK: - Initializer
    
    init(isInMemory: Bool = false) {
        self.persistenceContainer = SwiftDataPersistenceContainer(isInMemory: isInMemory)
    }
}
