//
//  NoticeRepository.ts
//  Rentify
//
//  Created by Tin Pham on 27/7/26.
//

export type NoticeType = 'info' | 'urgent' | 'fire';

export interface Comment {
  id: string;
  senderName: string;
  body: string;
  createdAt: Date;
}

export interface Notice {
  id: string;
  type: NoticeType;
  title: string;
  body: string;
  senderName: string;
  createdAt: Date;
  likes: number;
  comments: Comment[];
  mediaUri?: string;
  likedByMe?: boolean;
  approved: boolean; // Moderator flag (Q8 requirement)
  khuTroId?: string; // Target building complex (A2)
}

let mockNotices: Notice[] = [
  {
    id: '1',
    type: 'info',
    title: 'Property Notice - Bảo trì định kỳ thang máy',
    body: 'Elevator maintenance scheduled for tomorrow between 9 AM and 12 PM. Vui lòng di chuyển bằng cầu thang bộ trong thời gian này.',
    senderName: 'Landlord',
    createdAt: new Date(Date.now() - 2 * 3600000),
    likes: 5,
    comments: [
      { id: 'c-1', senderName: 'Cư dân - Phòng 102', body: 'Cảm ơn ban quản lý đã thông báo trước.', createdAt: new Date(Date.now() - 1 * 3600000) }
    ],
    mediaUri: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600',
    approved: true,
    khuTroId: 'khu-1'
  },
  {
    id: '2',
    type: 'urgent',
    title: 'Urgent Notification - Yêu cầu chốt số nước sạch',
    body: 'Please check your water meters and report readings by the end of this week. Hạn cuối là Chủ Nhật 20h00.',
    senderName: 'Landlord',
    createdAt: new Date(Date.now() - 5 * 3600000),
    likes: 2,
    comments: [],
    approved: true,
    khuTroId: 'khu-1'
  },
  {
    id: '3',
    type: 'info',
    title: 'Hỏi về phí gửi xe máy thêm',
    body: 'Mọi người cho mình hỏi phí gửi xe máy tháng này có tăng không ạ? Mình thấy trong hóa đơn ghi $60k.',
    senderName: 'Cư dân - Phòng 102',
    createdAt: new Date(Date.now() - 1 * 3600000),
    likes: 0,
    comments: [],
    approved: false, // Pending approval by Landlord
    khuTroId: 'khu-1'
  },
  {
    id: '4',
    type: 'info',
    title: 'Tìm chủ xe máy biển số 59X-XXXX',
    body: 'Có ai biết chủ chiếc Vision đỏ đậu chắn lối ra vào không ạ? Vui lòng dời xe giúp mình.',
    senderName: 'John Doe',
    createdAt: new Date(Date.now() - 24 * 3600000),
    likes: 3,
    comments: [],
    approved: true,
    khuTroId: 'khu-1'
  },
  {
    id: '5',
    type: 'info',
    title: 'Pass lại nồi cơm điện',
    body: 'Mình dư dùng một nồi cơm điện Toshiba 1.8L còn rất mới, pass lại giá 300k. Ai cần liên hệ mình nhé.',
    senderName: 'Alice Smith',
    createdAt: new Date(Date.now() - 48 * 3600000),
    likes: 8,
    comments: [
      { id: 'c-2', senderName: 'Bob Johnson', body: 'Cho mình xin hình thật với ạ.', createdAt: new Date(Date.now() - 47 * 3600000) }
    ],
    approved: true,
    khuTroId: 'khu-1'
  },
  {
    id: '6',
    type: 'info',
    title: 'Gợi ý dọn dẹp hành lang',
    body: 'Mình thấy dạo này hành lang chung hơi bụi, mọi người có ý định góp tiền thuê người dọn thêm một buổi cuối tuần không?',
    senderName: 'Bob Johnson',
    createdAt: new Date(Date.now() - 72 * 3600000),
    likes: 12,
    comments: [],
    approved: true,
    khuTroId: 'khu-1'
  }
];

const listeners = new Set<(notices: Notice[]) => void>();

const notifySubscribers = () => {
  listeners.forEach(listener => listener(
    [...mockNotices].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  ));
};

export const NoticeRepository = {
  fetchNotices: async (): Promise<Notice[]> => {
    // Simulate short network delay
    await new Promise(resolve => setTimeout(resolve, 150));
    return [...mockNotices].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },
  
  addNotice: async (
    type: NoticeType,
    title: string,
    body: string,
    senderName: string,
    createdAt: Date = new Date(),
    mediaUri?: string,
    approved: boolean = true,
    khuTroId?: string
  ): Promise<Notice> => {
    await new Promise(resolve => setTimeout(resolve, 150));
    const newNotice: Notice = {
      id: Math.random().toString(36).substring(7),
      type,
      title,
      body,
      senderName,
      createdAt,
      likes: 0,
      comments: [],
      mediaUri,
      likedByMe: false,
      approved,
      khuTroId
    };
    mockNotices.push(newNotice);
    notifySubscribers();
    return newNotice;
  },
  
  deleteNotice: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 150));
    mockNotices = mockNotices.filter(notice => notice.id !== id);
    notifySubscribers();
  },
  
  getNotices: (): Notice[] => {
    return [...mockNotices].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  approveNotice: (id: string) => {
    mockNotices = mockNotices.map(notice => {
      if (notice.id === id) {
        return {
          ...notice,
          approved: true
        };
      }
      return notice;
    });
    notifySubscribers();
  },

  likeNotice: (id: string) => {
    mockNotices = mockNotices.map(notice => {
      if (notice.id === id) {
        const liked = !notice.likedByMe;
        return {
          ...notice,
          likedByMe: liked,
          likes: liked ? notice.likes + 1 : Math.max(0, notice.likes - 1)
        };
      }
      return notice;
    });
    notifySubscribers();
  },

  addComment: (noticeId: string, senderName: string, body: string) => {
    mockNotices = mockNotices.map(notice => {
      if (notice.id === noticeId) {
        const newComment: Comment = {
          id: 'c-' + Math.random().toString(36).substring(7),
          senderName,
          body,
          createdAt: new Date()
        };
        return {
          ...notice,
          comments: [...notice.comments, newComment]
        };
      }
      return notice;
    });
    notifySubscribers();
  },

  subscribe: (listener: (notices: Notice[]) => void) => {
    listeners.add(listener);
    // Initial emission
    listener([...mockNotices].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    return () => {
      listeners.delete(listener);
    };
  }
};
