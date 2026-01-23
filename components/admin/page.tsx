"use client"

import { AdminNavbar } from "@/components/admin/admin-navbar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Save, Bell, Shield, Globe, Mail, Lock, User, Building } from "lucide-react"
import { useState } from "react"

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    labName: "Rahila Labs",
    email: "admin@rahilalabs.com",
    phone: "+92-XXX-XXXXXXX",
    address: "123 Main Street, Karachi, Pakistan",
    workingHours: "9:00 AM - 6:00 PM",
    timezone: "Asia/Karachi",
    currency: "PKR",
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    reportReadyAlerts: true,
    paymentNotifications: true,
  })

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
  })

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 ml-64">
        <AdminNavbar />
        <main className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your lab settings and preferences</p>
            </div>

            {/* General Settings */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <CardTitle>General Settings</CardTitle>
                </div>
                <CardDescription>Basic lab information and contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Lab Name</label>
                    <Input
                      value={settings.labName}
                      onChange={(e) => setSettings({ ...settings, labName: e.target.value })}
                      className="bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Email</label>
                    <Input
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      className="bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Phone</label>
                    <Input
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      className="bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Working Hours</label>
                    <Input
                      value={settings.workingHours}
                      onChange={(e) => setSettings({ ...settings, workingHours: e.target.value })}
                      className="bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Address</label>
                  <Input
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="bg-white dark:bg-slate-800"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Timezone</label>
                    <Input
                      value={settings.timezone}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Currency</label>
                    <Input
                      value={settings.currency}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      className="bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
                <Button className="bg-blue-900 hover:bg-blue-800 flex items-center gap-2 w-full md:w-auto">
                  <Save className="w-4 h-4" />
                  Save General Settings
                </Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <CardTitle>Notification Settings</CardTitle>
                </div>
                <CardDescription>Configure how you receive alerts and updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Email Notifications</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Receive notifications via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-900"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">SMS Notifications</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Receive notifications via SMS</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.smsNotifications}
                      onChange={(e) => setNotifications({ ...notifications, smsNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-900"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Appointment Reminders</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Send reminders before appointments</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.appointmentReminders}
                      onChange={(e) => setNotifications({ ...notifications, appointmentReminders: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-900"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Report Ready Alerts</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Notify when reports are ready</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.reportReadyAlerts}
                      onChange={(e) => setNotifications({ ...notifications, reportReadyAlerts: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-900"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Payment Notifications</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Alert on payment received</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.paymentNotifications}
                      onChange={(e) => setNotifications({ ...notifications, paymentNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-900"></div>
                  </label>
                </div>
                <Button className="bg-blue-900 hover:bg-blue-800 flex items-center gap-2 w-full md:w-auto">
                  <Save className="w-4 h-4" />
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <CardTitle>Security Settings</CardTitle>
                </div>
                <CardDescription>Manage your account security and privacy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Two-Factor Authentication</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Add an extra layer of security</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={security.twoFactorAuth}
                      onChange={(e) => setSecurity({ ...security, twoFactorAuth: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-900"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Session Timeout</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Auto-logout after inactivity (minutes)</p>
                  </div>
                  <Input
                    type="number"
                    value={security.sessionTimeout}
                    onChange={(e) => setSecurity({ ...security, sessionTimeout: parseInt(e.target.value) })}
                    className="w-24 bg-white dark:bg-slate-800"
                  />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Password Expiry</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Days before password expires</p>
                  </div>
                  <Input
                    type="number"
                    value={security.passwordExpiry}
                    onChange={(e) => setSecurity({ ...security, passwordExpiry: parseInt(e.target.value) })}
                    className="w-24 bg-white dark:bg-slate-800"
                  />
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <Button variant="outline" className="w-full md:w-auto flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full md:w-auto flex items-center gap-2 text-red-600 hover:text-red-700">
                    <User className="w-4 h-4" />
                    Delete Account
                  </Button>
                </div>
                <Button className="bg-blue-900 hover:bg-blue-800 flex items-center gap-2 w-full md:w-auto">
                  <Save className="w-4 h-4" />
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

