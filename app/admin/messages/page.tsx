'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, Send } from 'lucide-react';
import { AdminNavbar } from '@/components/admin/admin-navbar';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'Dr. Smith',
      content: 'Patient appointment confirmed for tomorrow at 2 PM',
      timestamp: '2 hours ago',
      read: false,
    },
    {
      id: '2',
      sender: 'Lab Assistant',
      content: 'Test results are ready for review',
      timestamp: '4 hours ago',
      read: true,
    },
  ]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleSendReply = () => {
    if (replyText.trim() && selectedMessage) {
      setReplyText('');
      // Handle sending reply
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-64 transition-all duration-300">
        <AdminNavbar />
        <main className="p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Messages</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage your communications</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            {/* Messages List */}
            <div className="md:col-span-1 h-1/3 md:h-full">
              <Card className="h-full">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search messages..."
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      onClick={() => setSelectedMessage(msg)}
                      className={`p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition ${selectedMessage?.id === msg.id
                        ? 'bg-blue-50 dark:bg-slate-800'
                        : ''
                        }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className={`font-semibold ${!msg.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                          {msg.sender}
                        </p>
                        {!msg.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-1"></div>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                        {msg.content}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                        {msg.timestamp}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Message Detail */}
            <div className="md:col-span-2 h-2/3 md:h-full">
              {selectedMessage ? (
                <Card className="h-full flex flex-col">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                      {selectedMessage.sender}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {selectedMessage.timestamp}
                    </p>
                  </div>

                  <div className="flex-1 p-6 overflow-y-auto">
                    <div className="bg-blue-50 dark:bg-slate-800 rounded-lg p-4">
                      <p className="text-slate-900 dark:text-white">
                        {selectedMessage.content}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                      />
                      <Button onClick={handleSendReply}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-slate-500 dark:text-slate-400 mb-2">
                      Select a message to view details
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
