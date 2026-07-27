//
//  RentifyApp.swift
//  Rentify
//
//  Created by Tin Pham on 21/7/26.
//

import SwiftUI
import SwiftData

@main
struct RentifyApp: App {
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false
    @State private var authManager = AuthManager.shared
    
    @State private var showOnboarding = false
    
    var body: some Scene {
        WindowGroup {
            Group {
                if authManager.isLoggedIn {
                    if authManager.currentRole == .landlord {
                        MainTabView()
                    } else {
                        TenantMainTabView()
                    }
                } else {
                    LoginView()
                }
            }
            .fullScreenCover(isPresented: $showOnboarding) {
                OnboardingView(isPresented: $showOnboarding)
            }
            .onAppear {
                NotificationManager.shared.requestPermissions()
                if !hasCompletedOnboarding {
                    showOnboarding = true
                }
            }
        }
        .modelContainer(SwiftDataPersistenceContainer.shared.container)
    }
}
