//
//  LanguageManager.ts
//  Rentify
//
//  Created by Tin Pham on 27/7/26.
//

import { useState, useEffect } from 'react';
import * as Localization from 'expo-localization';

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
  property_notice: { en: "Property Notice", vi: "Thông Báo Tòa Nhà" },
  fire_tap_instruction: { en: "Tap the button below exactly 5 times to confirm and activate the fire alarm.", vi: "Nhấn nút bên dưới đúng 5 lần để xác nhận và kích hoạt báo động cháy." },
  fire_tap_count: { en: "Taps: {count}/5", vi: "Số lần nhấn: {count}/5" },
  fire_tap_warning: { en: "⚠️ ONLY USE IN ACTUAL EMERGENCY FIRE SITUATIONS", vi: "⚠️ CHỈ SỬ DỤNG KHI THỰC SỰ CÓ CHÁY KHẨN CẤP" },
  fire_tap_activate: { en: "CONFIRMING...", vi: "ĐANG KÍCH HOẠT..." },

  // New settings & accessibility translations (Q2, Q3, Q5, Q7)
  properties: { en: "Properties", vi: "Danh Sách Phòng" },
  all_complexes: { en: "All Complexes", vi: "Tất cả khu" },
  add_room: { en: "Add Room", vi: "Thêm phòng" },
  save: { en: "Save", vi: "Lưu" },
  accessibility_settings: { en: "Accessibility & Visuality", vi: "Trực quan & Hỗ trợ" },
  easy_view_mode: { en: "Easy View Mode (Large Text & Easy UI)", vi: "Chế độ Dễ nhìn (Chữ lớn, Trực quan)" },
  language: { en: "Language", vi: "Ngôn ngữ" },
  settings: { en: "Settings", vi: "Cài đặt & Tùy chỉnh" },
  profile: { en: "Personal Profile", vi: "Hồ sơ cá nhân" },
  change_password: { en: "Change Password", vi: "Đổi Mật Khẩu" },
  current_password: { en: "Current Password", vi: "Mật khẩu hiện tại" },
  new_password: { en: "New Password", vi: "Mật khẩu mới" },
  confirm_new_password: { en: "Confirm New Password", vi: "Xác nhận mật khẩu mới" },
  password_changed_success: { en: "Password changed successfully!", vi: "Thay đổi mật khẩu thành công!" },
  cancel_change_password: { en: "Cancel Password Change", vi: "Hủy đổi mật khẩu" },
  proceed_change_password: { en: "Proceed with Password Change", vi: "Tiến hành đổi mật khẩu" },
  please_fill_all_fields: { en: "Please fill in all fields.", vi: "Vui lòng nhập đầy đủ thông tin." },
  post_pending_approval_msg: { en: "Your post has been submitted and is pending review by the landlord.", vi: "Bài viết đã được gửi đi và đang chờ chủ nhà duyệt trước khi hiển thị trên bảng tin." },
  post_title: { en: "Post Title", vi: "Tiêu đề bài viết" },
  enter_title_placeholder: { en: "Enter title...", vi: "Nhập tiêu đề..." },
  attach_media: { en: "Attach Media", vi: "Đính kèm hình ảnh" },
  remove_attachment: { en: "✕ Remove attachment", vi: "✕ Hủy đính kèm" },
  select_mock_image: { en: "📸 Select mock image", vi: "📸 Chọn hình ảnh mẫu" },
  property_manager: { en: "Property Manager", vi: "Quản lý tòa nhà" },
  resident_linked: { en: "Resident", vi: "Cư dân liên kết" },
  past_posts: { en: "PAST POSTS", vi: "LỊCH SỬ TIN ĐÃ ĐĂNG" },
  no_other_posts: { en: "No other posts.", vi: "Không có tin đăng nào khác." },
  unrecorded_electricity: { en: "⚡ UNRECORDED ELECTRICITY", vi: "⚡ CHƯA CHỐT SỐ ĐIỆN" },
  billing_banner_title: { en: "Calculate & Pay this month's invoice", vi: "Tính phí & Thanh toán hóa đơn tháng này" },
  billing_banner_desc: { en: "Snap electricity meter to automatically generate bill via camera", vi: "Chụp ảnh công tơ điện để tự động lập hóa đơn bằng camera" },
  record_now: { en: "Record Now", vi: "Chốt ngay" },
  view_lease: { en: "View Contract", vi: "Xem Hợp Đồng" },
  contact_landlord: { en: "Contact Landlord", vi: "Liên Hệ Chủ Nhà" },
  contact_landlord_title: { en: "Contact Landlord", vi: "Liên Hệ Chủ Nhà" },
  contact_landlord_desc: { en: "Phone: 0901234567\nDo you want to chat on Zalo or make a direct phone call?", vi: "Số điện thoại: 0901234567\nBạn muốn nhắn tin qua Zalo hay gọi điện trực tiếp?" },
  zalo_chat: { en: "Zalo Chat", vi: "Nhắn Zalo" },
  phone_call: { en: "Phone Call", vi: "Gọi Điện" },
  snap_electricity_meter: { en: "Snap Electricity Meter", vi: "Chụp Đồng Hồ Điện" },
  invoice_details: { en: "Invoice Details", vi: "Chi Tiết Hóa Đơn" },
  scan_payment_qr: { en: "Scan QR Payment", vi: "Quét Mã Thanh Toán" },
  ocr_scanning: { en: "Extracting electricity meter index (OCR)...", vi: "Đang trích xuất chỉ số điện (OCR)..." },
  align_meter_desc: { en: "Align the electricity meter inside the frame to scan", vi: "Căn chỉnh chỉ số đồng hồ điện vào khung quét để nhận diện" },
  meter_reading_section: { en: "ELECTRICITY METER & READING", vi: "ĐỒNG HỒ ĐIỆN & CHỈ SỐ" },
  consumption_kwh: { en: "Consumption Index (kWh)", vi: "Chỉ số tiêu dùng (kWh)" },
  enter_meter_kwh: { en: "Enter kWh reading...", vi: "Nhập số kí điện..." },
  monthly_bill_details: { en: "MONTHLY BILL DETAILS", vi: "CHI TIẾT HÓA ĐƠN THÁNG" },
  electricity_bill: { en: "Electricity Fee", vi: "Tiền điện" },
  water_bill: { en: "Water Fee (Fixed)", vi: "Tiền nước (Cố định)" },
  services_bill: { en: "Services & Utilities", vi: "Dịch vụ & Tiện ích" },
  grand_total: { en: "GRAND TOTAL", vi: "TỔNG CỘNG" },
  proceed_to_pay: { en: "Proceed to Payment", vi: "Tiến Hành Thanh Toán" },
  vietqr_transfer: { en: "Transfer via VietQR / MoMo", vi: "Chuyển khoản VietQR / MoMo" },
  vietqr_instruction: { en: "Please scan the QR code below or transfer directly to the bank account listed", vi: "Vui lòng quét mã QR bên dưới hoặc tự chuyển tiền đến thông tin tài khoản bên dưới" },
  payment_amount: { en: "Amount:", vi: "Số tiền:" },
  account_holder: { en: "Account Holder:", vi: "Chủ tài khoản:" },
  account_number: { en: "Account Number:", vi: "Số tài khoản:" },
  transfer_message: { en: "Message:", vi: "Nội dung:" },
  payment_success: { en: "Payment Success", vi: "Thanh toán thành công" },
  payment_success_desc: { en: "Your invoice payment has been recorded successfully!", vi: "Hóa đơn đã được ghi nhận thanh toán thành công!" },
  confirm_transferred: { en: "Confirm Transferred", vi: "Xác Nhận Đã Chuyển Khoản" },
  chat_on_zalo: { en: "💬 Zalo Chat / Contact", vi: "💬 Chat qua Zalo / Liên hệ Zalo" },
  create_lease: { en: "New Lease", vi: "Tạo HĐ" },
  send_reminder: { en: "Remind Fees", vi: "Nhắc Phí" },
  view_reports: { en: "Reports", vi: "Báo Cáo" },
  billing_config: { en: "⚙️ Settings", vi: "⚙️ Cấu hình" },
  notices_approval_requests: { en: "📬 Post Approval Requests", vi: "📬 Yêu Cầu Duyệt Tin Đăng" },
  approve: { en: "Approve", vi: "Duyệt" },
  reject: { en: "Reject", vi: "Từ chối" },
  notification_config_title: { en: "Notification Settings", vi: "Cấu HÌnh Thông Báo" },
  notification_config_success: { en: "Settings Saved", vi: "Cấu hình lưu thành công" },
  notification_config_success_desc: { en: "Billing reminders & contract expiration warning configurations have been saved successfully.", vi: "Hệ thống đã lưu lại các cài đặt thông báo nhắc phí & hết hạn hợp đồng." },
  billing_reminders_config: { en: "BILLING REMINDERS CONFIGURATION", vi: "CẤU HÌNH NHẮC PHÍ ĐỊNH KỲ" },
  billing_day_label: { en: "Billing Reminder Day (Monthly)", vi: "Ngày nhắc phí đầu kỳ (Hằng tháng)" },
  late_billing_days: { en: "Auto-remind late after (days)", vi: "Tự động nhắc trễ sau (ngày)" },
  notification_channels: { en: "Notification Channels:", vi: "Kênh gửi thông báo nhắc phí:" },
  active_rooms_count: { en: "Active rooms:", vi: "Số phòng active:" },
  rooms_unit: { en: "rooms", vi: "phòng" },
  channel_type: { en: "Channel type:", vi: "Kênh gửi tin:" },
  estimated_monthly_channel_cost: { en: "Estimated monthly cost:", vi: "Ước tính phí gửi tin hằng tháng:" },
  lease_expiration_config: { en: "CONTRACT EXPIRATION CONFIGURATION", vi: "CẤU HÌNH HẾT HẠN HỢP ĐỒNG" },
  expiration_warning_days: { en: "Expiration Warning Ahead (Days)", vi: "Số ngày cảnh báo trước hạn" },
  lease_channels: { en: "Contract notification channels:", vi: "Kênh gửi thông báo hợp đồng:" },
  complex_success_title: { en: "Success", vi: "Thành công" },
  complex_success_desc: { en: "New building complex created successfully.", vi: "Đã thêm khu trọ mới thành công." },
  delete_complex_title: { en: "Delete Building Complex", vi: "Xóa Khu Trọ" },
  delete_complex_desc: { en: "Deleting this building complex will also delete all rooms and contracts in it. Do you want to continue?", vi: "Xóa khu trọ này sẽ đồng thời xóa toàn bộ các phòng và hợp đồng nằm trong khu. Bạn có chắc muốn tiếp tục?" },
  manage_complexes_title: { en: "Manage Building Complexes", vi: "Quản lý Khu Trọ" },
  no_complexes_created: { en: "No complexes created yet.", vi: "Chưa có khu trọ nào được tạo." },
  select_complex_label: { en: "Select Complex", vi: "Chọn Khu Trọ" },
  forgot_password: { en: "Forgot Password?", vi: "Quên mật khẩu?" },
  reset_password: { en: "Reset Password", vi: "Khôi phục mật khẩu" },
  send_otp: { en: "Send Verification Code (OTP)", vi: "Gửi mã xác thực (OTP)" },
  enter_otp: { en: "Enter OTP Code", vi: "Nhập mã xác thực" },
  otp_message: { en: "Verification code sent to {phone}. Enter 888888 to verify.", vi: "Mã xác thực đã được gửi đến {phone}. Nhập 888888 để xác nhận." },
  confirm_reset: { en: "Confirm Reset", vi: "Xác nhận đặt lại" },
  reset_success: { en: "Password reset successful! Please log in with your new password.", vi: "Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới." },
  err_invalid_otp: { en: "Invalid OTP code.", vi: "Mã OTP không hợp lệ." },
  err_phone_not_registered: { en: "This phone number is not registered.", vi: "Số điện thoại này chưa được đăng ký trong hệ thống." },
  err_incorrect_password: { en: "Incorrect current password.", vi: "Mật khẩu hiện tại không chính xác." },
  err_password_mismatch: { en: "New passwords do not match.", vi: "Mật khẩu mới không khớp nhau." },
  err_password_too_short: { en: "Password must be at least 6 characters.", vi: "Mật khẩu phải dài ít nhất 6 ký tự." },
  close: { en: "Close", vi: "Đóng" },
  post_history: { en: "Post History", vi: "Lịch sử tin đã đăng" },
  no_posts: { en: "No post history available.", vi: "Không có tin đăng nào khác." },
  landlord_role: { en: "Landlord (Manager)", vi: "Chủ nhà (Quản lý)" },
  tenant_role: { en: "Linked Resident", vi: "Cư dân liên kết" },
  post_details: { en: "Post Details", vi: "Chi Tiết Tin Đăng" },
  landlord_name: { en: "Nguyen Van Landlord", vi: "Nguyễn Văn Chủ Nhà" },
  tenant_name: { en: "Jane Tenant", vi: "Nguyễn Thị Cư Dân" },
  like: { en: "Like", vi: "Thích" },
  comment: { en: "Comment", vi: "Bình luận" },
  comments: { en: "Comments", vi: "Bình luận" },
  send_comment: { en: "Send", vi: "Gửi" },
  write_comment: { en: "Write a comment...", vi: "Viết bình luận..." },
  meter_scan: { en: "Calculate & Pay Rent", vi: "Chốt Số Điện & Thanh Toán" },
  vietqr_payment: { en: "VietQR Payment", vi: "Thanh Toán VietQR" },
  electricity_reading: { en: "Electricity Index consumption (kWh)", vi: "Chỉ số tiêu dùng công tơ điện (kWh)" },
  confirm_payment: { en: "Confirm Transfer Done", vi: "Xác Nhận Đã Chuyển Khoản" },
  ocr_scan_instr: { en: "Align electricity index numbers in frame to capture", vi: "Căn chỉ số điện công tơ vào khung quét" },
  shutter: { en: "Capture Index", vi: "Chụp chỉ số" },
  calculating: { en: "Calculating bill...", vi: "Đang tự động tính hóa đơn..." },
  rent_breakdown: { en: "BILL BREAKDOWN DETAILS", vi: "CHI TIẾT PHÍ THUÊ THÁNG NÀY" },
  electricity: { en: "Electricity cost", vi: "Tiền điện tiêu dùng" },
  water: { en: "Water cost (Flat)", vi: "Tiền nước (Cố định)" },
  service_fee: { en: "Service & Utilities fee", vi: "Dịch vụ & Tiện ích" },
  total_due: { en: "TOTAL RENT PAYMENT", vi: "TỔNG TIỀN PHÒNG THÁNG NÀY" },
  proceed_pay: { en: "Proceed to QR Payment", vi: "Tiến Hành Thanh Toán" },
  config_monetization: { en: "Estimated monthly SaaS notification cost (ZBS Billing):", vi: "Phí dịch vụ gửi tin ước tính hằng tháng (Biểu giá ZBS):" },
  pricing_terms: { en: "* Usage fees will be computed and billed directly to your Zalo Cloud Account (ZCA).", vi: "* Phí sẽ được tính và trừ trực tiếp vào tài khoản Zalo Cloud Account (ZCA) của bạn." },
  manage_complexes: { en: "Manage Complexes", vi: "Quản Lý Khu Trọ" },
  add_complex: { en: "Add Building Complex", vi: "Thêm Khu Trọ Mới" },
  complex_name: { en: "Complex Name (e.g. Oakridge Tower)", vi: "Tên khu trọ (ví dụ: Khu Oakridge)" },
  complex_address: { en: "Complex Address", vi: "Địa chỉ khu trọ" },
  current_complexes: { en: "DANH SÁCH KHU TRỌ HIỆN TẠI", vi: "DANH SÁCH KHU TRỌ HIỆN TẠI" },
  complex: { en: "Complex Group", vi: "Khu trọ" },
  welcome_back: { en: "Welcome Back 👋", vi: "Chào mừng trở lại 👋" },
  dashboard: { en: "Rentify Dashboard", vi: "Bảng điều khiển Rentify" },
  monthly_revenue: { en: "Monthly Revenue", vi: "Doanh thu tháng" },
  unpaid_balance: { en: "Unpaid Balance", vi: "Dư nợ chưa thu" },
  occupancy_rate: { en: "Occupancy Rate", vi: "Tỷ lệ lấp đầy" },
  active_leases: { en: "Active Leases", vi: "Hợp đồng hiệu lực" },
  quick_actions: { en: "Quick Actions", vi: "Thao tác nhanh" },
  payment_overview: { en: "Payment Status Overview", vi: "Tổng quan trạng thái" },
  no_payment_data: { en: "No payment data available yet.", vi: "Chưa có dữ liệu thanh toán." },
  paid: { en: "Paid", vi: "Đã thu" },
  pending: { en: "Pending", vi: "Chờ duyệt" },
  overdue: { en: "Overdue", vi: "Quá hạn" },
  recent_payments: { en: "Recent Payments", vi: "Thanh toán gần đây" },
  no_recent_payments: { en: "No recent payments logged.", vi: "Chưa có giao dịch gần đây." },
  view_profile: { en: "View Profile", vi: "Xem hồ sơ" },
  revenue_reports: { en: "Revenue & Reports", vi: "Doanh thu & Báo cáo" },
  overview_analysis: { en: "Overview Analysis", vi: "Phân tích tổng quan" },
  collected_income: { en: "Collected Income (Paid):", vi: "Số tiền đã thu (Thành công):" },
  outstanding_invoices: { en: "Outstanding Invoices (Pending):", vi: "Số tiền chưa thu (Chờ):" },
  total_projected: { en: "Total Projected Income:", vi: "Tổng doanh thu dự kiến:" },
  monthly_projections: { en: "Monthly Projections", vi: "Dự kiến doanh thu" },
  avg_rent_breakdown: { en: "Average Rent Breakdown", vi: "Cơ cấu giá phòng trung bình" },
  tenants: { en: "Tenants", vi: "Người Thuê" },
  add_tenant: { en: "Add Tenant", vi: "Thêm người thuê" },
  contact_info: { en: "Contact Information", vi: "Thông tin liên hệ" },
  name: { en: "Name", vi: "Họ và Tên" },
  email_optional: { en: "Email (Optional)", vi: "Email (Không bắt buộc)" },
  notes: { en: "Notes", vi: "Ghi chú" },
  add_notes_placeholder: { en: "Add any notes...", vi: "Thêm ghi chú..." },
  contact_details: { en: "Contact Details", vi: "Chi tiết liên hệ" },
  leases: { en: "Leases", vi: "Hợp đồng" },
  no_active_leases: { en: "No active leases logged.", vi: "Chưa có hợp đồng hoạt động." },
  no_tenants: { en: "No Tenants", vi: "Chưa có người thuê" },
  add_first_tenant: { en: "Add your first tenant to get started.", vi: "Thêm người thuê đầu tiên để bắt đầu." },
  leasing: { en: "Leasing", vi: "Đang thuê" },
  inactive: { en: "Inactive", vi: "Chưa thuê" }
};

// Check device language automatically (Q1 requirement)
let deviceLanguage = 'en';
try {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    const langCode = locales[0].languageCode;
    if (langCode === 'vi') {
      deviceLanguage = 'vi';
    }
  }
} catch (e) {
  console.log('Failed to detect device language, defaulting to en', e);
}

let globalLanguage: Language = deviceLanguage as Language;
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
