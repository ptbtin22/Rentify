//
//  LoginView.swift
//  Rentify
//
//  Created by Tin Pham on 21/7/26.
//

import SwiftUI

struct LoginView: View {
    @State private var viewModel = LoginViewModel()
    
    private enum Field: Hashable {
        case phone
        case password
    }
    @FocusState private var focusedField: Field?
    
    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 36) { // Fixed spacing ensures views do not get squeezed together
                    
                    // Logo Section
                    VStack(spacing: 12) {
                        ZCornerLogo(role: viewModel.role)
                            .frame(width: 80, height: 80)
                            .shadow(color: themeColor(viewModel.role).opacity(0.3), radius: 10, x: 0, y: 5)
                            .padding(.top, 30)
                        
                        Text("Rentify")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)
                        
                        Text(LanguageManager.shared.local("subtitle"))
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.secondary)
                    }
                    
                    // Role Picker & Input Fields
                    VStack(spacing: 16) {
                        Picker("Role", selection: $viewModel.role) {
                            Text("🏠 " + LanguageManager.shared.local("landlord")).tag(AuthManager.Role.landlord)
                            Text("👤 " + LanguageManager.shared.local("tenant")).tag(AuthManager.Role.tenant)
                        }
                        .pickerStyle(.segmented)
                        
                        // Phone Input
                        HStack(spacing: 12) {
                            Image(systemName: "phone.fill")
                                .foregroundColor(.secondary)
                                .frame(width: 24)
                            
                            Menu {
                                Button("🇻🇳 VN (+84)") { viewModel.countryCode = "+84" }
                                Button("🇺🇸 US (+1)") { viewModel.countryCode = "+1" }
                                Button("🇸🇬 SG (+65)") { viewModel.countryCode = "+65" }
                            } label: {
                                  HStack(spacing: 4) {
                                      Text(viewModel.countryCode)
                                          .font(.body)
                                          .fontWeight(.semibold)
                                          .foregroundColor(Color(.label))
                                      Image(systemName: "chevron.down")
                                          .font(.caption2)
                                          .foregroundColor(.secondary)
                                  }
                            }
                            
                            Divider()
                                .frame(height: 18)
                            
                            TextField(viewModel.countryCode == "+84" ? "901234567" :
                                        viewModel.countryCode == "+1" ? "5551234567" : "81234567", text: $viewModel.phoneNumber)
                            .focused($focusedField, equals: .phone)
                            .keyboardType(.phonePad)
                            .autocorrectionDisabled()
                            .font(.body)
                            .foregroundColor(Color(.label))
                            .tint(themeColor(viewModel.role))
                            .onChange(of: viewModel.phoneNumber) { oldValue, newValue in
                                var filtered = newValue.filter { $0.isNumber }
                                if viewModel.countryCode == "+84" && filtered.hasPrefix("0") {
                                    filtered = String(filtered.dropFirst())
                                }
                                let limit = viewModel.phoneLengthLimit(for: viewModel.countryCode)
                                if filtered.count > limit {
                                    filtered = String(filtered.prefix(limit))
                                }
                                if filtered != newValue {
                                    viewModel.phoneNumber = filtered
                                }
                            }
                            .onChange(of: viewModel.countryCode) { oldValue, newValue in
                                var current = viewModel.phoneNumber
                                if newValue == "+84" && current.hasPrefix("0") {
                                    current = String(current.dropFirst())
                                }
                                let limit = viewModel.phoneLengthLimit(for: newValue)
                                if current.count > limit {
                                    current = String(current.prefix(limit))
                                }
                                viewModel.phoneNumber = current
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 14)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(.rect(cornerRadius: 14, style: .continuous))
                        .contentShape(Rectangle())
                        .onTapGesture {
                            focusedField = .phone
                        }
                        .overlay(
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .strokeBorder(focusedField == .phone ? themeColor(viewModel.role).opacity(0.8) : Color.clear, lineWidth: 1.5)
                        )
                        .animation(.easeInOut(duration: 0.15), value: focusedField)
                        
                        // Password Input
                        HStack(spacing: 12) {
                            Image(systemName: "lock.fill")
                                .foregroundColor(.secondary)
                                .frame(width: 24)
                            
                            SecureField(LanguageManager.shared.local("password").capitalized, text: $viewModel.password)
                                .focused($focusedField, equals: .password)
                                .font(.body)
                                .foregroundColor(Color(.label))
                                .tint(themeColor(viewModel.role))
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 14)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(.rect(cornerRadius: 14, style: .continuous))
                        .contentShape(Rectangle())
                        .onTapGesture {
                            focusedField = .password
                        }
                        .overlay(
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .strokeBorder(focusedField == .password ? themeColor(viewModel.role).opacity(0.8) : Color.clear, lineWidth: 1.5)
                        )
                        .animation(.easeInOut(duration: 0.15), value: focusedField)
                        
                        if let error = viewModel.errorMessage {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(.red)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.horizontal, 4)
                        }
                    }
                    
                    // Submit Button & Quick Logins
                    VStack(spacing: 12) {
                        Button {
                            Task { await viewModel.login() }
                        } label: {
                            HStack {
                                if viewModel.isLoading {
                                    ProgressView().tint(.white).padding(.trailing, 8)
                                }
                                Text(LanguageManager.shared.local("log_in")).font(.headline)
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 52)
                            .background(themeColor(viewModel.role))
                            .foregroundColor(.white)
                            .clipShape(.rect(cornerRadius: 14, style: .continuous))
                        }
                        .disabled(viewModel.isLoading)
                        
                        // Quick Logins
                        VStack(spacing: 12) {
                            HStack {
                                VStack { Divider() }
                                Text(LanguageManager.shared.local("quick_login"))
                                    .font(.system(size: 9, weight: .bold))
                                    .foregroundColor(.secondary)
                                    .tracking(1)
                                VStack { Divider() }
                            }
                            .padding(.vertical, 10)
                            
                            Button {
                                viewModel.quickLogin(role: .landlord)
                            } label: {
                                HStack {
                                    Text("🏠")
                                    Text(LanguageManager.shared.local("log_in_as"))
                                    Text(LanguageManager.shared.local("landlord"))
                                        .fontWeight(.bold)
                                }
                                .font(.subheadline)
                                .frame(maxWidth: .infinity)
                                .frame(height: 46)
                                .background(Color(.secondarySystemBackground))
                                .foregroundColor(Color(.label))
                                .clipShape(.rect(cornerRadius: 12, style: .continuous))
                            }
                            
                            Button {
                                viewModel.quickLogin(role: .tenant)
                            } label: {
                                HStack {
                                    Text("👤")
                                    Text(LanguageManager.shared.local("log_in_as"))
                                    Text(LanguageManager.shared.local("tenant"))
                                        .fontWeight(.bold)
                                }
                                .font(.subheadline)
                                .frame(maxWidth: .infinity)
                                .frame(height: 46)
                                .background(Color(.secondarySystemBackground))
                                .foregroundColor(Color(.label))
                                .clipShape(.rect(cornerRadius: 12, style: .continuous))
                            }
                        }
                    }
                    .padding(.bottom, 24) // Adds a comfortable scrollable bottom margin
                }
                .padding(.horizontal, 24)
            }
            .background(Color(.systemBackground))
            .onTapGesture {
                focusedField = nil // Dismisses the keyboard when clicking outside the input blocks
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        ForEach(Language.allCases, id: \.self) { lang in
                            Button(lang.displayName) {
                                LanguageManager.shared.currentLanguage = lang
                            }
                        }
                    } label: {
                        HStack(spacing: 4) {
                            Text(LanguageManager.shared.currentLanguage.flagCode)
                                .font(.subheadline)
                                .fontWeight(.semibold)
                            Image(systemName: "globe")
                        }
                        .foregroundColor(themeColor(viewModel.role))
                    }
                }
            }
        }
    }
}

// MARK: - Private

extension LoginView {
    private func themeColor(_ role: AuthManager.Role) -> Color {
        switch role {
        case .landlord: return .blue
        case .tenant: return .green
        }
    }
}

struct ZCornerLogo: View {
    let role: AuthManager.Role
    
    var body: some View {
        RoundedRectangle(cornerRadius: 24, style: .continuous)
            .fill(
                LinearGradient(
                    gradient: role == .landlord
                    ? Gradient(colors: [Color.blue, Color.purple])
                    : Gradient(colors: [Color.green, Color.teal]),
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .overlay(
                Text("R")
                    .font(.system(size: 38, weight: .black, design: .rounded))
                    .foregroundColor(.white)
            )
    }
}

#Preview {
    LoginView()
}
