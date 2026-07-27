//
//  LoginViewModel.swift
//  Rentify
//
//  Created by Tin Pham on 21/7/26.
//

import Foundation
import Observation

@Observable
@MainActor
final class LoginViewModel {
    var role: AuthManager.Role = .landlord
    var countryCode = "+84"
    var phoneNumber = ""
    var password = ""
    
    var isLoading = false
    var errorMessage: String? = nil
    
    func phoneLengthLimit(for code: String) -> Int {
        switch code {
        case "+84": return 9   // Vietnam: 9 digits (excl. leading 0)
        case "+1": return 10   // USA: 10 digits
        case "+65": return 8   // Singapore: 8 digits
        default: return 10
        }
    }
}

// MARK: - Actions

extension LoginViewModel {
    func login() async {
        errorMessage = nil
        
        let limit = phoneLengthLimit(for: countryCode)
        guard !phoneNumber.isEmpty else {
            errorMessage = LanguageManager.shared.local("err_phone_empty")
            return
        }
        
        guard phoneNumber.count == limit else {
            if countryCode == "+84" {
                errorMessage = LanguageManager.shared.local("err_phone_digits_vi")
            } else if countryCode == "+1" {
                errorMessage = LanguageManager.shared.local("err_phone_digits_us")
            } else {
                errorMessage = LanguageManager.shared.local("err_phone_digits_sg")
            }
            return
        }
        
        guard password.count >= 6 else {
            errorMessage = LanguageManager.shared.local("err_password_short")
            return
        }
        
        isLoading = true
        
        // Simulating network delay using Swift Concurrency
        do {
            try await Task.sleep(for: .seconds(1))
            AuthManager.shared.login(role: role)
        } catch {
            errorMessage = LanguageManager.shared.local("err_login_failed")
        }
        
        isLoading = false
    }
    
    func quickLogin(role: AuthManager.Role) {
        errorMessage = nil
        AuthManager.shared.login(role: role)
    }
}
