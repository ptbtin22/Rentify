//
//  AuthManagerTests.swift
//  RentifyTests
//
//  Created by Tin Pham on 25/7/26.
//

import XCTest
@testable import Rentify

final class AuthManagerTests: XCTestCase {
    
    override func setUp() {
        super.setUp()
        // Reset UserDefaults before each test to guarantee isolated behavior
        UserDefaults.standard.removeObject(forKey: "is_logged_in")
        UserDefaults.standard.removeObject(forKey: "user_role")
        AuthManager.shared.logout()
    }
    
    override func tearDown() {
        UserDefaults.standard.removeObject(forKey: "is_logged_in")
        UserDefaults.standard.removeObject(forKey: "user_role")
        AuthManager.shared.logout()
        super.tearDown()
    }
    
    func testAuthManagerInitialState() {
        let auth = AuthManager.shared
        XCTAssertFalse(auth.isLoggedIn)
    }
    
    func testAuthManagerLandlordLogin() {
        let auth = AuthManager.shared
        
        auth.login(role: .landlord)
        XCTAssertTrue(auth.isLoggedIn)
        XCTAssertEqual(auth.currentRole, .landlord)
        
        // Assert storage state
        XCTAssertTrue(UserDefaults.standard.bool(forKey: "is_logged_in"))
        XCTAssertEqual(UserDefaults.standard.string(forKey: "user_role"), "landlord")
    }
    
    func testAuthManagerTenantLogin() {
        let auth = AuthManager.shared
        
        auth.login(role: .tenant)
        XCTAssertTrue(auth.isLoggedIn)
        XCTAssertEqual(auth.currentRole, .tenant)
        
        // Assert storage state
        XCTAssertTrue(UserDefaults.standard.bool(forKey: "is_logged_in"))
        XCTAssertEqual(UserDefaults.standard.string(forKey: "user_role"), "tenant")
    }
    
    func testAuthManagerLogoutClearsState() {
        let auth = AuthManager.shared
        
        auth.login(role: .landlord)
        XCTAssertTrue(auth.isLoggedIn)
        
        auth.logout()
        XCTAssertFalse(auth.isLoggedIn)
        
        // Assert storage keys removed
        XCTAssertFalse(UserDefaults.standard.bool(forKey: "is_logged_in"))
        XCTAssertNil(UserDefaults.standard.string(forKey: "user_role"))
    }
    
    @MainActor
    func testLoginViewModelPhoneValidationAndLimits() async {
        let vm = LoginViewModel()
        
        // Default (Vietnam +84, 9 digits limit)
        XCTAssertEqual(vm.countryCode, "+84")
        XCTAssertEqual(vm.phoneLengthLimit(for: "+84"), 9)
        
        // Validation check for empty
        await vm.login()
        XCTAssertEqual(vm.errorMessage, "Phone number cannot be empty.")
        
        // Validation check for short number
        vm.phoneNumber = "90123"
        await vm.login()
        XCTAssertEqual(vm.errorMessage, "Phone number must be exactly 9 digits for +84.")
        
        // Other codes
        XCTAssertEqual(vm.phoneLengthLimit(for: "+1"), 10)
        XCTAssertEqual(vm.phoneLengthLimit(for: "+65"), 8)
    }
    
    @MainActor
    func testLanguageManagerSystemFallback() {
        UserDefaults.standard.removeObject(forKey: "selected_language")
        let manager = LanguageManager.shared
        XCTAssertNotNil(manager.currentLanguage)
        let skip = manager.local("ob_skip")
        XCTAssertTrue(skip == "Skip" || skip == "Bỏ qua")
    }
}
