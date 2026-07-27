//
//  LanguageManager.ts
//  Rentify
//
//  Created by Tin Pham on 27/7/26.
//

import { useState, useEffect } from 'react';

export type Language = 'en' | 'vi';

export const translations: Record<string, Record<Language, string>> = {
  subtitle: { en: "Rental management at your fingertips", vi: "Quản lý phòng trọ trong tầm tay" },
  landlord: { en: "Landlord", vi: "Chủ nhà" },
  tenant: { en: "Tenant", vi: "Người thuê" },
  phone_number: { en: "PHONE NUMBER", vi: "SỐ ĐIỆN THOẠI" },
  password: { en: "PASSWORD", vi: "MẬT KHẨU" },
  log_in: { en: "Log In", vi: "Đăng nhập" },
  quick_login: { en: "QUICK LOGIN", vi: "ĐĂNG NHẬP NHANH" },
  log_in_as: { en: "Log in as", vi: "Đăng nhập làm" },
  
  // Onboarding Keys
  ob_title_1: { en: "Smart Operations", vi: "Vận hành thông minh" },
  ob_desc_1: { en: "Automate rent invoices, calculate electric/water meters, and trace active lease details in one clean dashboard.", vi: "Tự động hóa hóa đơn, tính số điện nước và theo dõi thông tin hợp đồng dễ dàng." },
  ob_title_2: { en: "Community Board", vi: "Bảng tin cư dân" },
  ob_desc_2: { en: "Broadcast building rules, maintenance intervals, and updates inside a verified local resident bulletin.", vi: "Xem quy định phòng trọ, lịch bảo trì và trao đổi tin tức nội bộ an toàn." },
  ob_title_3: { en: "Emergency Broadcast", vi: "Thông báo khẩn cấp" },
  ob_desc_3: { en: "Notify residents instantly about maintenance issues, or trigger immediate building fire alerts.", vi: "Nhận thông báo khẩn từ chủ nhà hoặc tự kích hoạt báo động cháy khi phát hiện sự cố." },
  ob_skip: { en: "Skip", vi: "Bỏ qua" },
  ob_next: { en: "Next", vi: "Tiếp tục" },
  ob_start: { en: "Get Started", vi: "Bắt đầu" },
  
  // Errors
  err_phone_empty: { en: "Phone number cannot be empty.", vi: "Số điện thoại không được để trống." },
  err_password_short: { en: "Password must be at least 6 characters long.", vi: "Mật khẩu phải có ít nhất 6 ký tự." },
  err_login_failed: { en: "An error occurred during login.", vi: "Đã xảy ra lỗi khi đăng nhập." },
  err_phone_digits_vi: { en: "Phone number must be exactly 9 digits for +84.", vi: "Số điện thoại phải có đúng 9 chữ số cho +84." },
  err_phone_digits_us: { en: "Phone number must be exactly 10 digits for +1.", vi: "Số điện thoại phải có đúng 10 chữ số cho +1." },
  err_phone_digits_sg: { en: "Phone number must be exactly 8 digits for +65.", vi: "Số điện thoại phải có đúng 8 chữ số cho +65." },

  // Notices
  bulletin_board: { en: "Bulletin Board", vi: "Bảng tin cư dân" },
  announcements: { en: "Announcements", vi: "Thông báo" },
  bulletin_empty: { en: "Bulletin Empty", vi: "Bảng tin trống" },
  bulletin_empty_desc: { en: "There are no community notifications or emergency alerts at the moment.", vi: "Hiện tại không có thông báo cộng đồng hoặc cảnh báo khẩn cấp nào." },
  no_announcements: { en: "No Announcements", vi: "Chưa Có Thông Báo" },
  no_announcements_desc: { en: "Send an announcement or alert to all occupants of this property.", vi: "Gửi thông báo hoặc cảnh báo cho tất cả cư dân trong tòa nhà." },
  sender_prefix: { en: "From: ", vi: "Từ: " },
  report_fire: { en: "Report Fire", vi: "Báo Cháy" },
  confirm_fire_alert: { en: "Confirm Fire Alert", vi: "Xác Nhận Báo Cháy" },
  cancel: { en: "Cancel", vi: "Hủy" },
  delete: { en: "Delete", vi: "Xóa" },
  delete_confirm_desc: { en: "Are you sure you want to delete this notice?", vi: "Bạn có chắc chắn muốn xóa thông báo này không?" },
  activate_alarm: { en: "ACTIVATE ALARM", vi: "KÍCH HOẠT BÁO ĐỘNG" },
  emergency_fire_alert: { en: "EMERGENCY FIRE ALERT", vi: "CẢNH BÁO CHÁY KHẨN CẤP" },
  fire_alert_message: { en: "Resident has triggered an emergency fire alarm. Please evacuate immediately!", vi: "Cư dân đã kích hoạt báo động cháy khẩn cấp. Vui lòng di tản ngay lập tức!" },
  fire_alert_desc: { en: "This will immediately send an emergency evacuation alert to the landlord and all building residents. Only use when there is an active fire.", vi: "Hành động này sẽ gửi cảnh báo di tản khẩn cấp ngay lập tức đến chủ nhà và tất cả cư dân. Chỉ sử dụng khi thực sự có cháy." },
  new_post: { en: "New Post", vi: "Đăng Tin" },
  compose_announcement: { en: "Compose Announcement", vi: "Soạn Thông Báo" },
  alert_level: { en: "Alert Level", vi: "Mức Độ Cảnh Báo" },
  message_content: { en: "Message Content", vi: "Nội Dung Tin Nhắn" },
  type: { en: "Type", vi: "Loại" },
  normal_level: { en: "📢 Normal", vi: "📢 Bình thường" },
  urgent_level: { en: "⚡ Urgent", vi: "⚡ Khẩn cấp" },
  fire_level: { en: "🔥 Fire Alert", vi: "🔥 Cảnh báo cháy" },
  enter_desc: { en: "Enter announcement description...", vi: "Nhập nội dung thông báo..." },
  send: { en: "Send", vi: "Gửi" },
  urgent_notification: { en: "Urgent Notification", vi: "Thông Báo Khẩn" },
  property_notice: { en: "Property Notice", vi: "Thông Báo Tòa Nhà" }
};

let globalLanguage: Language = 'en';
const listeners = new Set<(lang: Language) => void>();

export const getLanguage = (): Language => globalLanguage;

export const setLanguage = (lang: Language) => {
  globalLanguage = lang;
  listeners.forEach(listener => listener(lang));
};

export const useLanguage = () => {
  const [lang, setLang] = useState<Language>(globalLanguage);

  useEffect(() => {
    listeners.add(setLang);
    return () => {
      listeners.delete(setLang);
    };
  }, []);

  const local = (key: string): string => {
    return translations[key]?.[lang] ?? key;
  };

  return { language: lang, setLanguage, local };
};
