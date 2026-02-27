'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bell, Lock, Users, HardDrive, LogOut, Save, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { AdminNavbar } from '@/components/admin/admin-navbar'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { useStore } from '@/lib/store'
import { API_BASE_URL } from '@/lib/api_config'

type Tab = 'general' | 'security' | 'notifications' | 'storage'

interface Toast { message: string; type: 'success' | 'error' }

export default function SettingsPage() {
  const { authToken, logout } = useStore()
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [toast, setToast] = useState<Toast | null>(null)

  // ── General state ──────────────────────────────────────────────
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    phone: '',
    city: '',
  })
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)

  // ── Security state ─────────────────────────────────────────────
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false })
  const [savingPw, setSavingPw] = useState(false)

  // ── Notification prefs (local storage) ────────────────────────
  const [notifPrefs, setNotifPrefs] = useState({
    pushNotifications: true,
    emailAlerts: true,
    appointmentReminders: true,
    reportReady: true,
  })

  // ─── Load profile + notif prefs on mount ──────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('adminNotifPrefs')
    if (saved) setNotifPrefs(JSON.parse(saved))
  }, [])

  useEffect(() => {
    if (!authToken) return
    const fetchProfile = async () => {
      setLoadingProfile(true)
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/profile`, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
        if (res.ok) {
          const data = await res.json()
          setProfile({ username: data.username || '', email: data.email || '', phone: data.phone || '', city: data.city || '' })
        }
      } catch { /* silent */ }
      finally { setLoadingProfile(false) }
    }
    fetchProfile()
  }, [authToken])

  // ─── Helpers ──────────────────────────────────────────────────
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ─── Handlers ─────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!profile.username.trim() || !profile.email.trim()) {
      showToast('Name and email are required.', 'error'); return
    }
    setSavingProfile(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(profile)
      })
      const data = await res.json()
      if (res.ok) showToast('Profile saved successfully!', 'success')
      else showToast(data.error || 'Failed to save profile.', 'error')
    } catch { showToast('Network error. Please try again.', 'error') }
    finally { setSavingProfile(false) }
  }

  const handleChangePassword = async () => {
    if (!passwords.current_password || !passwords.new_password || !passwords.confirm_password) {
      showToast('Please fill in all password fields.', 'error'); return
    }
    setSavingPw(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(passwords)
      })
      const data = await res.json()
      if (res.ok) {
        showToast('Password changed successfully!', 'success')
        setPasswords({ current_password: '', new_password: '', confirm_password: '' })
      } else {
        showToast(data.error || 'Failed to change password.', 'error')
      }
    } catch { showToast('Network error. Please try again.', 'error') }
    finally { setSavingPw(false) }
  }

  const handleSaveNotifications = () => {
    localStorage.setItem('adminNotifPrefs', JSON.stringify(notifPrefs))
    showToast('Notification preferences saved!', 'success')
  }

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout()
      window.location.href = '/admin/login'
    }
  }

  // ─── Sidebar nav items ────────────────────────────────────────
  const navItems: { id: Tab; label: string; Icon: any }[] = [
    { id: 'general', label: 'General', Icon: Users },
    { id: 'notifications', label: 'Notifications', Icon: Bell },
    { id: 'security', label: 'Security', Icon: Lock },
    { id: 'storage', label: 'Storage', Icon: HardDrive },
  ]

  const pwField = (
    field: 'current' | 'new' | 'confirm',
    label: string,
    key: keyof typeof passwords
  ) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
      <div className="relative">
        <Input
          type={showPw[field] ? 'text' : 'password'}
          value={passwords[key]}
          onChange={e => setPasswords({ ...passwords, [key]: e.target.value })}
          placeholder={label}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {showPw[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-64 transition-all duration-300">
        <AdminNavbar />
        <main className="p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">

          {/* Toast */}
          {toast && (
            <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium transition-all ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
              }`}>
              {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {toast.message}
            </div>
          )}

          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Settings</h1>
              <p className="text-slate-600 dark:text-slate-400">Manage your account and preferences</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* ── Sidebar Nav ── */}
              <div className="md:col-span-1">
                <Card>
                  <nav className="space-y-1 p-3">
                    {navItems.map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === id
                            ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    ))}
                  </nav>
                </Card>
              </div>

              {/* ── Content ── */}
              <div className="md:col-span-3 space-y-6">

                {/* ── GENERAL TAB ── */}
                {activeTab === 'general' && (
                  <Card className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">General Settings</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Update your admin profile information</p>
                    {loadingProfile ? (
                      <div className="text-slate-400 py-8 text-center">Loading...</div>
                    ) : (
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Display Name (Lab Name)
                          </label>
                          <Input
                            value={profile.username}
                            onChange={e => setProfile({ ...profile, username: e.target.value })}
                            placeholder="e.g. Rahila Diagnostic Labs"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Email Address
                          </label>
                          <Input
                            type="email"
                            value={profile.email}
                            onChange={e => setProfile({ ...profile, email: e.target.value })}
                            placeholder="admin@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Phone Number
                          </label>
                          <Input
                            value={profile.phone}
                            onChange={e => setProfile({ ...profile, phone: e.target.value })}
                            placeholder="+92 300 1234567"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            City / Address
                          </label>
                          <Input
                            value={profile.city}
                            onChange={e => setProfile({ ...profile, city: e.target.value })}
                            placeholder="Islamabad"
                          />
                        </div>
                        <Button
                          onClick={handleSaveProfile}
                          disabled={savingProfile}
                          className="bg-blue-900 hover:bg-blue-800 flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          {savingProfile ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    )}
                  </Card>
                )}

                {/* ── NOTIFICATIONS TAB ── */}
                {activeTab === 'notifications' && (
                  <Card className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Notification Preferences</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Control which notifications you receive</p>
                    <div className="space-y-4">
                      {([
                        ['pushNotifications', 'Enable push notifications', 'Receive real-time alerts in the browser'],
                        ['emailAlerts', 'Receive email alerts', 'Get notified by email for important events'],
                        ['appointmentReminders', 'Appointment reminders', 'Reminders before scheduled appointments'],
                        ['reportReady', 'Report ready notifications', 'Alert when a lab report is uploaded'],
                      ] as [keyof typeof notifPrefs, string, string][]).map(([key, title, desc]) => (
                        <label key={key} className="flex items-start gap-4 cursor-pointer p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <input
                            type="checkbox"
                            checked={notifPrefs[key]}
                            onChange={e => setNotifPrefs({ ...notifPrefs, [key]: e.target.checked })}
                            className="mt-0.5 w-4 h-4 accent-blue-700 rounded"
                          />
                          <div>
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{title}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                    <Button
                      onClick={handleSaveNotifications}
                      className="mt-6 bg-blue-900 hover:bg-blue-800 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Preferences
                    </Button>
                  </Card>
                )}

                {/* ── SECURITY TAB ── */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <Card className="p-6">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Change Password</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Keep your account secure with a strong password</p>
                      <div className="space-y-4">
                        {pwField('current', 'Current Password', 'current_password')}
                        {pwField('new', 'New Password', 'new_password')}
                        {pwField('confirm', 'Confirm New Password', 'confirm_password')}
                        {passwords.new_password && passwords.new_password.length < 6 && (
                          <p className="text-xs text-red-500">Password must be at least 6 characters.</p>
                        )}
                        {passwords.new_password && passwords.confirm_password && passwords.new_password !== passwords.confirm_password && (
                          <p className="text-xs text-red-500">Passwords do not match.</p>
                        )}
                        <Button
                          onClick={handleChangePassword}
                          disabled={savingPw}
                          className="bg-blue-900 hover:bg-blue-800 flex items-center gap-2"
                        >
                          <Lock className="w-4 h-4" />
                          {savingPw ? 'Updating...' : 'Change Password'}
                        </Button>
                      </div>
                    </Card>

                    {/* Danger Zone */}
                    <Card className="p-6 border-red-200 dark:border-red-900">
                      <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-1">Danger Zone</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Irreversible and destructive actions</p>
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          onClick={handleLogout}
                          className="w-full justify-start border-slate-300 hover:border-red-300 hover:text-red-600"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout from all devices
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}

                {/* ── STORAGE TAB ── */}
                {activeTab === 'storage' && (
                  <Card className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Storage</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">File storage information for uploaded reports</p>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200">Uploaded Reports</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">PDFs and image reports stored on server</div>
                        </div>
                        <HardDrive className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                        Storage analytics coming soon. Reports are stored securely on the backend server.
                      </div>
                    </div>
                  </Card>
                )}

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
