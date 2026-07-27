//
//  TenantMainTabView.swift
//  Rentify
//
//  Created by Tin Pham on 26/7/26.
//

import SwiftUI

struct TenantMainTabView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            TenantPortalView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(0)
            
            TenantNoticesView()
                .tabItem {
                    Label("Bulletin", systemImage: "bell.fill")
                }
                .tag(1)
        }
        .tint(.green)
    }
}

#Preview {
    TenantMainTabView()
}
