//
//  OnboardingView.swift
//  Rentify
//
//  Created by Tin Pham on 26/7/26.
//

import SwiftUI

struct OnboardingStep: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let imageSystemName: String
    let color: Color
}

struct OnboardingView: View {
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false
    @Binding var isPresented: Bool
    @State private var currentTab = 0
    
    var steps: [OnboardingStep] {
        [
            OnboardingStep(
                title: LanguageManager.shared.local("ob_title_1"),
                description: LanguageManager.shared.local("ob_desc_1"),
                imageSystemName: "building.2.fill",
                color: .blue
            ),
            OnboardingStep(
                title: LanguageManager.shared.local("ob_title_2"),
                description: LanguageManager.shared.local("ob_desc_2"),
                imageSystemName: "bell.square.fill",
                color: .green
            ),
            OnboardingStep(
                title: LanguageManager.shared.local("ob_title_3"),
                description: LanguageManager.shared.local("ob_desc_3"),
                imageSystemName: "flame.fill",
                color: .red
            )
        ]
    }
    
    var body: some View {
        VStack {
            // Skip Button Toolbar area
            HStack {
                Spacer()
                Button(LanguageManager.shared.local("ob_skip")) {
                    completeOnboarding()
                }
                .font(.subheadline)
                .foregroundColor(.secondary)
                .padding(.trailing, 24)
                .padding(.top, 12)
                .opacity(currentTab >= steps.count - 1 ? 0.0 : 1.0)
                .disabled(currentTab >= steps.count - 1)
            }
            
            // Paging Slides
            TabView(selection: $currentTab) {
                ForEach(0..<steps.count, id: \.self) { index in
                    VStack(spacing: 24) {
                        Spacer()
                        
                        // Visual circular icon container
                        ZStack {
                            Circle()
                                .fill(steps[index].color.opacity(0.12))
                                .frame(width: 160, height: 160)
                            
                            Image(systemName: steps[index].imageSystemName)
                                .font(.system(size: 70))
                                .foregroundColor(steps[index].color)
                        }
                        
                        VStack(spacing: 12) {
                            Text(steps[index].title)
                                .font(.title.bold())
                                .foregroundColor(Color(.label))
                                .multilineTextAlignment(.center)
                            
                            Text(steps[index].description)
                                .font(.body)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 32)
                                .lineSpacing(4)
                        }
                        
                        Spacer()
                    }
                    .tag(index)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .always))
            .indexViewStyle(.page(backgroundDisplayMode: .always))
            
            // Bottom Button Action
            Button {
                if currentTab < steps.count - 1 {
                    withAnimation {
                        currentTab += 1
                    }
                } else {
                    completeOnboarding()
                }
            } label: {
                Text(currentTab == steps.count - 1 ? LanguageManager.shared.local("ob_start") : LanguageManager.shared.local("ob_next"))
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                    .background(steps[currentTab].color)
                    .clipShape(.rect(corners: .concentric, isUniform: true))
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 24)
        }
        .background(Color(.systemBackground))
        .containerShape(ContainerRelativeShape())
        .ignoresSafeArea(edges: .bottom)
    }
}

// MARK: - Private

extension OnboardingView {
    private func completeOnboarding() {
        hasCompletedOnboarding = true
        isPresented = false
    }
}

#Preview {
    let previewDefaults = UserDefaults(suiteName: "OnboardingPreview")!
    previewDefaults.set(false, forKey: "hasCompletedOnboarding")
    return OnboardingView(isPresented: .constant(true))
        .defaultAppStorage(previewDefaults)
}
