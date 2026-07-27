//
//  NoticeRepository.ts
//  Rentify
//
//  Created by Tin Pham on 27/7/26.
//

export type NoticeType = 'info' | 'urgent' | 'fire';

export interface Notice {
  id: string;
  type: NoticeType;
  title: string;
  body: string;
  senderName: string;
  createdAt: Date;
}

let mockNotices: Notice[] = [
  {
    id: '1',
    type: 'info',
    title: 'Property Notice',
    body: 'Elevator maintenance scheduled for tomorrow between 9 AM and 12 PM.',
    senderName: 'Landlord',
    createdAt: new Date(Date.now() - 2 * 3600000)
  },
  {
    id: '2',
    type: 'urgent',
    title: 'Urgent Notification',
    body: 'Please check your water meters and report readings by the end of this week.',
    senderName: 'Landlord',
    createdAt: new Date(Date.now() - 5 * 3600000)
  }
];

const listeners = new Set<(notices: Notice[]) => void>();

const notifySubscribers = () => {
  listeners.forEach(listener => listener([...mockNotices]));
};

export const NoticeRepository = {
  fetchNotices: async (): Promise<Notice[]> => {
    // Simulate short network delay
    await new Promise(resolve => setTimeout(resolve, 150));
    return [...mockNotices].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },
  
  addNotice: async (type: NoticeType, title: string, body: string, senderName: string): Promise<Notice> => {
    await new Promise(resolve => setTimeout(resolve, 150));
    const newNotice: Notice = {
      id: Math.random().toString(36).substring(7),
      type,
      title,
      body,
      senderName,
      createdAt: new Date()
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
  
  subscribe: (listener: (notices: Notice[]) => void) => {
    listeners.add(listener);
    // Initial emission
    listener([...mockNotices].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    return () => {
      listeners.delete(listener);
    };
  }
};
