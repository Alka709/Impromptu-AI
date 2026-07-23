import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function SettingsScreen() {
  const { user, logout } = useOutletContext();
  const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

  const [activeTab, setActiveTab] = useState('Account');
  const [name, setName] = useState(user?.name || '');
  const [photoData, setPhotoData] = useState(user?.photo || null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = React.useRef(null);

  const tabs = ['Account', 'Connected Accounts', 'Danger Zone'];

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setToast({ type: 'error', message: 'File is too large (max 2MB)' });
        setTimeout(() => setToast(null), 3000);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setPhotoData(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      setToast({ type: 'error', message: 'New passwords do not match' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setIsSaving(true);
    try {
      const payload = { name, currentPassword, newPassword };
      if (photoData !== user?.photo) payload.photo = photoData;
      const res = await fetch(`${API_BASE}/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', message: 'Profile updated successfully!' });
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to update profile' });
      }
    } catch {
      setToast({ type: 'error', message: 'An unexpected error occurred' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        logout();
      } else {
        const data = await res.json();
        setToast({ type: 'error', message: data.error || 'Failed to delete account' });
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      setToast({ type: 'error', message: 'An unexpected error occurred' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const inputCls = 'w-full bg-[#FAFAF8] border border-[#ECECEC] rounded-xl px-4 py-3 text-[15px] text-[#111111] font-medium focus:outline-none focus:border-[#111111] transition-colors';
  const disabledInputCls = 'w-full bg-[#F5F5F4] border border-[#ECECEC] rounded-xl px-4 py-3 text-[15px] text-[#888888] font-medium cursor-not-allowed';
  const labelCls = 'block text-xs font-bold text-[#666666] uppercase tracking-widest mb-2';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="relative min-h-screen pb-24 px-6 md:px-10 lg:px-14 py-10"
    >
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-sm font-semibold transition-all ${toast.type === 'success' ? 'bg-[#16A34A] text-white' : 'bg-rose-500 text-white'}`}>
          {toast.type === 'success' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          )}
          {toast.message}
        </div>
      )}

      <div className="max-w-3xl">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-[32px] font-extrabold text-[#111111] tracking-tight">Settings</h1>
          <p className="text-[#666666] text-[15px] mt-1">Manage your account and preferences.</p>
        </div>

        {/* Tab navigation */}
        <nav className="flex gap-1 mb-8 border-b border-[#ECECEC]">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 text-[14px] font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-[#111111] text-[#111111]'
                  : 'border-transparent text-[#888888] hover:text-[#444444]'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div>
          {/* ── Account Tab ── */}
          {activeTab === 'Account' && (
            <motion.section
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white border border-[#ECECEC] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8"
            >
              {/* Avatar row */}
              <div className="flex items-center gap-5 mb-8 pb-8 border-b border-[#F0F0F0]">
                <div className="w-16 h-16 rounded-full bg-[#F5F5F4] border border-[#ECECEC] flex items-center justify-center font-extrabold text-xl text-[#111111] overflow-hidden shrink-0">
                  {photoData ? (
                    <img src={photoData} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[#111111]">{name || 'Your Name'}</p>
                  <p className="text-[13px] text-[#888888]">{user?.email}</p>
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoSelect} />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-[13px] font-semibold text-[#666666] border border-[#ECECEC] bg-white px-3 py-1.5 rounded-xl hover:bg-[#F5F5F4] transition-colors"
                  >
                    Change photo
                  </button>
                </div>
              </div>

              <form className="space-y-8" onSubmit={handleSave}>
                {/* Name + Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelCls}>Full Name</label>
                    <input className={inputCls} type="text" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Email Address</label>
                    <div className="relative">
                      <input className={disabledInputCls} type="email" value={user?.email || ''} disabled />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#16A34A] bg-green-50 px-2 py-1 rounded-lg">
                        {user?.google_id ? 'Google' : 'Verified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Password change */}
                {!user?.google_id && (
                  <div className="space-y-5 pt-6 border-t border-[#F0F0F0]">
                    <div>
                      <h3 className="text-[16px] font-bold text-[#111111] mb-0.5">Change Password</h3>
                      <p className="text-[13px] text-[#888888]">Leave blank if you don't want to change your password.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className={labelCls}>Current Password</label>
                        <input className={inputCls} type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                      </div>
                      <div>
                        <label className={labelCls}>New Password</label>
                        <input className={inputCls} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                      </div>
                      <div>
                        <label className={labelCls}>Confirm Password</label>
                        <input className={inputCls} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-[#F0F0F0]">
                  <button
                    disabled={isSaving}
                    type="submit"
                    className="bg-[#111111] text-white px-7 py-2.5 rounded-xl text-[14px] font-bold hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving && (
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {isSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.section>
          )}

          {/* ── Connected Accounts Tab ── */}
          {activeTab === 'Connected Accounts' && (
            <motion.section
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white border border-[#ECECEC] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8"
              data-purpose="connected-accounts"
            >
              <h2 className="text-[18px] font-bold text-[#111111] mb-6">Connected Accounts</h2>
              <div className="flex flex-col sm:flex-row items-center sm:justify-between p-5 bg-[#FAFAF8] border border-[#ECECEC] rounded-2xl gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-[#ECECEC]">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-[15px] font-semibold text-[#111111]">Google Account</span>
                    <span className="text-[13px] text-[#888888]">Use Google to sign in to ImpromptuAI</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {user?.google_id ? (
                    <>
                      <span className="text-[12px] font-bold text-[#16A34A] bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">Connected</span>
                      <button className="text-[13px] font-semibold text-[#888888] hover:text-[#111111] transition-colors">Disconnect</button>
                    </>
                  ) : (
                    <button className="text-[13px] font-semibold text-[#111111] bg-white border border-[#ECECEC] px-4 py-2 rounded-xl hover:bg-[#F5F5F4] transition-colors">Connect Google</button>
                  )}
                </div>
              </div>
            </motion.section>
          )}

          {/* ── Danger Zone Tab ── */}
          {activeTab === 'Danger Zone' && (
            <motion.section
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white border border-rose-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8"
              data-purpose="danger-zone"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center shrink-0 border border-rose-100">
                  <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-rose-700 mb-1">Delete Account</h2>
                  <p className="text-[14px] text-rose-600/80 leading-relaxed max-w-xl">
                    Permanently delete your account and all associated speaking data, historical sessions, and analytics.{' '}
                    <strong className="font-bold text-rose-700">This action is irreversible.</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="bg-white text-rose-600 border border-rose-200 rounded-xl px-5 py-2.5 text-[14px] font-bold hover:bg-rose-600 hover:text-white transition-all"
              >
                Delete my account
              </button>
            </motion.section>
          )}
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-2xl p-7 max-w-md w-full shadow-2xl border border-[#ECECEC]"
          >
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center mb-5 border border-rose-100">
              <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-[20px] font-bold text-[#111111] mb-1.5">Delete Account?</h3>
            <p className="text-[14px] text-[#666666] mb-6">This action cannot be undone. All your data will be permanently removed.</p>
            <label className="block text-[13px] font-bold text-[#444444] mb-2">Type <span className="text-rose-600">DELETE</span> to confirm</label>
            <input
              type="text"
              value={deleteConfirmationText}
              onChange={e => setDeleteConfirmationText(e.target.value)}
              className="w-full bg-[#FAFAF8] border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[15px] font-bold text-[#111111] focus:outline-none focus:border-rose-400 transition-colors mb-6"
              placeholder="DELETE"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmationText(''); }}
                className="flex-1 py-2.5 px-4 bg-[#F5F5F4] hover:bg-[#EBEBEA] text-[#111111] font-semibold rounded-xl text-[14px] transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationText !== 'DELETE' || isDeleting}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-[14px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
