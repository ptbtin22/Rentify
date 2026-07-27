//
//  MainTabView.swift
//  Rentify
//
//  Created by Tin Pham on 21/7/26.
//

import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "square.grid.2x2.fill")
                }
                .tag(0)
            
            PropertiesView()
                .tabItem {
                    Label("Properties", systemImage: "building.2.fill")
                }
                .tag(1)
            
            TenantsView()
                .tabItem {
                    Label("Tenants", systemImage: "person.2.fill")
                }
                .tag(2)
            
            PaymentsView()
                .tabItem {
                    Label("Payments", systemImage: "creditcard.fill")
                }
                .tag(3)
            
            LandlordNoticesView()
                .tabItem {
                    Label("Notices", systemImage: "bell.fill")
                }
                .tag(4)
        }
        .tint(.blue)
    }
}

#Preview {
    MainTabView()
}
