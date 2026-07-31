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
    approved: true
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
    approved: true
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
    approved: false // Pending approval by Landlord
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
    approved: boolean = true
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
      approved
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
