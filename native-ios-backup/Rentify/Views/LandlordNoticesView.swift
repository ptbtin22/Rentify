//
//  LandlordNoticesView.swift
//  Rentify
//
//  Created by Tin Pham on 26/7/26.
//

import SwiftUI

struct LandlordNoticesView: View {
    @State private var viewModel = NoticesViewModel(repository: AppDependencyContainer.shared.noticeRepository)
    @State private var isShowingComposeSheet = false
    
    var body: some View {
        NavigationStack {
            List {
                if viewModel.notices.isEmpty {
                    ContentUnavailableView(
                        LanguageManager.shared.local("no_announcements"),
                        systemImage: "bell.slash.fill",
                        description: Text(LanguageManager.shared.local("no_announcements_desc"))
                    )
                } else {
                    ForEach(viewModel.notices) { notice in
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Text(notice.type == .fire ? "🔥" : notice.type == .urgent ? "⚡" : "📢")
                                    .font(.title3)
                                
                                Text(notice.title)
                                    .font(.headline)
                                    .foregroundColor(textColor(for: notice.type))
                                
                                Spacer()
                                
                                Text(notice.createdAt.formatted(.dateTime.hour().minute()))
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                            }
                            
                            Text(notice.body)
                                .font(.subheadline)
                                .foregroundColor(.primary)
                                .lineLimit(3)
                            
                            HStack {
                                Text(LanguageManager.shared.local("sender_prefix") + (notice.senderName == "Tenant" ? LanguageManager.shared.local("tenant") : notice.senderName == "Landlord" ? LanguageManager.shared.local("landlord") : notice.senderName))
                                    .font(.caption2.bold())
                                    .foregroundColor(.secondary)
                                
                                Spacer()
                                
                                Text(notice.type.rawValue.uppercased())
                                    .font(.system(size: 9, weight: .bold))
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3)
                                    .background(backgroundColor(for: notice.type))
                                    .foregroundColor(textColor(for: notice.type))
                                    .cornerRadius(6)
                            }
                        }
                        .padding(.vertical, 4)
                        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                            Button(role: .destructive) {
                                Task {
                                    await viewModel.deleteNotice(notice)
                                }
                            } label: {
                                Label(LanguageManager.shared.local("delete"), systemImage: "trash")
                            }
                        }
                    }
                }
            }
            .navigationTitle(LanguageManager.shared.local("announcements"))
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        isShowingComposeSheet = true
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "square.and.pencil")
                            Text(LanguageManager.shared.local("new_post"))
                                .font(.subheadline)
                        }
                    }
                }
            }
            .sheet(isPresented: $isShowingComposeSheet) {
                ComposeNoticeSheet(viewModel: viewModel)
            }
            .task {
                await viewModel.refresh()
            }
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

struct ComposeNoticeSheet: View {
    @Environment(\.dismiss) private var dismiss
    let viewModel: NoticesViewModel
    
    @State private var selectedType: NoticeType = .info
    @State private var bodyText = ""
    
    var body: some View {
        NavigationStack {
            Form {
                Section(LanguageManager.shared.local("alert_level")) {
                    Picker(LanguageManager.shared.local("type"), selection: $selectedType) {
                        Text(LanguageManager.shared.local("normal_level")).tag(NoticeType.info)
                        Text(LanguageManager.shared.local("urgent_level")).tag(NoticeType.urgent)
                        Text(LanguageManager.shared.local("fire_level")).tag(NoticeType.fire)
                    }
                    .pickerStyle(.segmented)
                }
                
                Section(LanguageManager.shared.local("message_content")) {
                    TextEditor(text: $bodyText)
                        .frame(height: 150)
                        .overlay(
                            Group {
                                if bodyText.isEmpty {
                                    Text(LanguageManager.shared.local("enter_desc"))
                                        .foregroundColor(.secondary)
                                        .padding(.horizontal, 4)
                                        .padding(.vertical, 8)
                                        .allowsHitTesting(false)
                                }
                            },
                            alignment: .topLeading
                        )
                }
            }
            .navigationTitle(LanguageManager.shared.local("compose_announcement"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(LanguageManager.shared.local("cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(LanguageManager.shared.local("send")) {
                        Task {
                            let title = selectedType == .fire ? LanguageManager.shared.local("emergency_fire_alert") : selectedType == .urgent ? LanguageManager.shared.local("urgent_notification") : LanguageManager.shared.local("property_notice")
                            await viewModel.addNotice(
                                type: selectedType,
                                title: title,
                                body: bodyText,
                                senderName: "Landlord"
                            )
                            dismiss()
                        }
                    }
                    .disabled(bodyText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }
}

#Preview {
    LandlordNoticesView()
}
