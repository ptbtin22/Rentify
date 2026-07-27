//
//  TenantNoticesView.swift
//  Rentify
//
//  Created by Tin Pham on 26/7/26.
//

import SwiftUI

struct TenantNoticesView: View {
    @State private var viewModel = NoticesViewModel(repository: AppDependencyContainer.shared.noticeRepository)
    @State private var isShowingFireConfirmation = false
    
    var body: some View {
        NavigationStack {
            List {
                if viewModel.notices.isEmpty {
                    ContentUnavailableView(
                        LanguageManager.shared.local("bulletin_empty"),
                        systemImage: "bell.slash",
                        description: Text(LanguageManager.shared.local("bulletin_empty_desc"))
                    )
                } else {
                    ForEach(viewModel.notices) { notice in
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text(notice.type == .fire ? "🔥" : notice.type == .urgent ? "⚡" : "📢")
                                    .font(.title2)
                                
                                Text(notice.title)
                                    .font(.headline)
                                    .foregroundColor(notice.type == .fire ? .red : .primary)
                                
                                Spacer()
                                
                                Text(notice.createdAt.formatted(.dateTime.hour().minute()))
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                            }
                            
                            Text(notice.body)
                                .font(.body)
                                .foregroundColor(notice.type == .fire ? .red : .primary)
                            
                            HStack {
                                Text(LanguageManager.shared.local("sender_prefix") + (notice.senderName == "Tenant" ? LanguageManager.shared.local("tenant") : notice.senderName == "Landlord" ? LanguageManager.shared.local("landlord") : notice.senderName))
                                    .font(.caption2.bold())
                                    .foregroundColor(.secondary)
                                
                                Spacer()
                                
                                Text(notice.type.rawValue.uppercased())
                                    .font(.system(size: 8, weight: .bold))
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3)
                                    .background(backgroundColor(for: notice.type))
                                    .foregroundColor(textColor(for: notice.type))
                                    .cornerRadius(6)
                            }
                        }
                        .padding()
                        .background(cellBackgroundColor(for: notice.type))
                        .cornerRadius(16)
                        .listRowSeparator(.hidden)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(borderColor(for: notice.type), lineWidth: notice.type == .info ? 0 : 1.5)
                        )
                        .padding(.vertical, 4)
                    }
                }
            }
            .listStyle(.plain)
            .navigationTitle(LanguageManager.shared.local("bulletin_board"))
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(role: .destructive) {
                        isShowingFireConfirmation = true
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "flame.fill")
                            Text(LanguageManager.shared.local("report_fire"))
                                .font(.subheadline.bold())
                        }
                        .foregroundColor(.red)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(Color.red.opacity(0.1))
                        .cornerRadius(12)
                    }
                }
            }
            .alert(LanguageManager.shared.local("confirm_fire_alert"), isPresented: $isShowingFireConfirmation) {
                Button(LanguageManager.shared.local("cancel"), role: .cancel) {}
                Button(LanguageManager.shared.local("activate_alarm"), role: .destructive) {
                    Task {
                        await viewModel.addNotice(
                            type: .fire,
                            title: LanguageManager.shared.local("emergency_fire_alert"),
                            body: LanguageManager.shared.local("fire_alert_message"),
                            senderName: "Tenant"
                        )
                    }
                }
            } message: {
                Text(LanguageManager.shared.local("fire_alert_desc"))
            }
            .task {
                await viewModel.refresh()
            }
        }
    }
    
    private func cellBackgroundColor(for type: NoticeType) -> Color {
        switch type {
        case .fire: return Color.red.opacity(0.08)
        case .urgent: return Color.orange.opacity(0.08)
        case .info: return Color(.secondarySystemBackground)
        }
    }
    
    private func borderColor(for type: NoticeType) -> Color {
        switch type {
        case .fire: return .red
        case .urgent: return .orange
        case .info: return .clear
        }
    }
    
    private func backgroundColor(for type: NoticeType) -> Color {
        switch type {
        case .fire: return Color.red.opacity(0.15)
        case .urgent: return Color.orange.opacity(0.15)
        case .info: return Color.blue.opacity(0.15)
        }
    }
    
    private func textColor(for type: NoticeType) -> Color {
        switch type {
        case .fire: return .red
        case .urgent: return .orange
        case .info: return .blue
        }
    }
}

#Preview {
    TenantNoticesView()
}
