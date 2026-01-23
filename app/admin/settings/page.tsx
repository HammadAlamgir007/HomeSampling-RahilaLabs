'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, Lock, Users, HardDrive, LogOut } from 'lucide-react';
import { AdminNavbar } from '@/components/admin/admin-navbar';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    labName: 'Rahila Diagnostic Labs',
    email: 'admin@rahila-labs.com',
    phone: '+1 (555) 123-4567',
    address: '123 Medical Street, Healthcare City',
    notifications: true,
    emailAlerts: true,
    darkMode: false,
  });

  const [saved, setSaved] = useState(false);

  const handleSaveSettings = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 ml-64">
        <AdminNavbar />
        <main className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Settings</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage your account and preferences</p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Settings Menu */}
            <div className="col-span-1">
              <Card>
                <nav className="space-y-2 p-4">
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-medium">
                    <Users className="h-5 w-5" />
                    General
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition">
                    <Lock className="h-5 w-5" />
                    Security
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition">
                    <HardDrive className="h-5 w-5" />
                    Storage
                  </button>
                </nav>
              </Card>
            </div>

            {/* Settings Content */}
            <div className="col-span-2 space-y-6">
              {/* General Settings */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                  General Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Lab Name
                    </label>
                    <Input
                      value={settings.labName}
                      onChange={(e) =>
                        setSettings({ ...settings, labName: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={settings.email}
                      onChange={(e) =>
                        setSettings({ ...settings, email: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Phone
                    </label>
                    <Input
                      value={settings.phone}
                      onChange={(e) =>
                        setSettings({ ...settings, phone: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Address
                    </label>
                    <Input
                      value={settings.address}
                      onChange={(e) =>
                        setSettings({ ...settings, address: e.target.value })
                      }
                    />
                  </div>
                </div>
              </Card>

              {/* Notification Settings */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                  Notification Preferences
                </h2>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) =>
                        setSettings({ ...settings, notifications: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <span className="text-slate-700 dark:text-slate-300">
                      Enable push notifications
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailAlerts}
                      onChange={(e) =>
                        setSettings({ ...settings, emailAlerts: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <span className="text-slate-700 dark:text-slate-300">
                      Receive email alerts
                    </span>
                  </label>
                </div>
              </Card>

              {/* Danger Zone */}
              <Card className="p-6 border-red-200 dark:border-red-900">
                <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-6">
                  Danger Zone
                </h2>

                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout from all devices
                  </Button>
                  <Button variant="destructive" className="w-full justify-start">
                    Delete Account
                  </Button>
                </div>
              </Card>

              {/* Save Button */}
              <div className="flex gap-3">
                <Button onClick={handleSaveSettings} className="flex-1">
                  Save Changes
                </Button>
                {saved && (
                  <div className="flex items-center gap-2 px-4 rounded-lg bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-400">
                    ✓ Saved
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
