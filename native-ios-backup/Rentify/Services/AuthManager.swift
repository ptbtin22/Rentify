//
//  AuthManager.swift
//  Rentify
//
//  Created by Tin Pham on 21/7/26.
//

import Foundation
import Observation

@Observable
final class AuthManager {
    static let shared = AuthManager()
    
    enum Role: String, Codable {
        case landlord
        case tenant
    }
    
    var isLoggedIn: Bool = false
    var currentRole: Role = .landlord
    
    private init() {
        if let savedRole = UserDefaults.standard.string(forKey: "user_role"),
           let role = Role(rawValue: savedRole) {
            self.isLoggedIn = UserDefaults.standard.bool(forKey: "is_logged_in")
            self.currentRole = role
        }
    }
    
    func login(role: Role) {
        self.isLoggedIn = true
        self.currentRole = role
        UserDefaults.standard.set(true, forKey: "is_logged_in")
        UserDefaults.standard.set(role.rawValue, forKey: "user_role")
    }
    
    func logout() {
        self.isLoggedIn = false
        UserDefaults.standard.removeObject(forKey: "is_logged_in")
        UserDefaults.standard.removeObject(forKey: "user_role")
    }
}
