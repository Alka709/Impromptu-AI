import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

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
      reader.onloadend = () => {
        setPhotoData(reader.result);
      };
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
      if (photoData !== user?.photo) {
        payload.photo = photoData;
      }
      const res = await fetch(`${API_BASE}/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', message: 'Profile updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to update profile' });
      }
    } catch (err) {
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
        credentials: 'include'
      });
      if (res.ok) {
        logout();
      } else {
        const data = await res.json();
        setToast({ type: 'error', message: data.error || 'Failed to delete account' });
        setIsDeleting(false);
        setShowDeleteModal(false);
      }
    } catch (err) {
      setToast({ type: 'error', message: 'An unexpected error occurred' });
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="relative min-h-screen pb-24">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-xl flex items-center gap-3 transition-all animate-fade-in-down ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.type === 'success' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          )}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}


      
      <div className="max-w-4xl mx-auto py-8 md:py-12 px-4 md:px-8">
        <h2 className="text-4xl font-extrabold text-zinc-900 tracking-tight mb-8">Settings</h2>
        
        <nav className="flex flex-wrap gap-4 md:gap-8 border-b border-zinc-200 mb-8" data-purpose="tab-navigation">
          {tabs.map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-1 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab 
                ? 'border-indigo-600 text-indigo-600 font-bold' 
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="space-y-6">
          {activeTab === 'Account' && (
            <section className="bg-white rounded-3xl border border-zinc-100 p-10 shadow-sm animate-fade-in">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 mb-10 text-center sm:text-left">
                <div className="w-20 h-20 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-extrabold text-2xl text-indigo-600 shadow-sm overflow-hidden shrink-0">
                  {photoData ? (
                    <img src={photoData} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div>
                   <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoSelect} />
                   <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm font-bold text-zinc-600 border border-zinc-200 px-4 py-2 rounded-full hover:bg-zinc-50 hover:text-indigo-600 transition-colors">Change Photo</button>
                </div>
              </div>
              
              <hr className="mb-10 border-zinc-100"/>
              
              <form className="space-y-10" onSubmit={handleSave}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Full Name</label>
                    <input 
                      className="w-full rounded-xl border-zinc-200 bg-zinc-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base py-3 px-4 border transition-all font-medium text-zinc-900" 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Email Address</label>
                    <div className="relative">
                      <input 
                        className="w-full rounded-xl border-zinc-200 bg-zinc-100 text-zinc-500 text-base py-3 px-4 pr-24 border cursor-not-allowed font-medium" 
                        type="email" 
                        value={user?.email || ''} 
                        disabled
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 flex items-center bg-emerald-50 px-2 py-1 rounded-md">
                        <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        {user?.google_id ? 'Google' : 'Verified'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {!user?.google_id && (
                  <div className="space-y-6 pt-6 border-t border-zinc-100">
                    <div>
                      <h4 className="text-lg font-bold text-zinc-900 mb-1">Change Password</h4>
                      <p className="text-sm text-zinc-500 font-medium">Leave blank if you don't want to change your password.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Current Password</label>
                        <input 
                          className="w-full rounded-xl border-zinc-200 bg-zinc-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 py-3 px-4 border transition-all" 
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">New Password</label>
                        <input 
                          className="w-full rounded-xl border-zinc-200 bg-zinc-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 py-3 px-4 border transition-all" 
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Confirm Password</label>
                        <input 
                          className="w-full rounded-xl border-zinc-200 bg-zinc-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 py-3 px-4 border transition-all" 
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end pt-6 border-t border-zinc-100">
                  <button 
                    disabled={isSaving}
                    className={`bg-indigo-600 text-white px-8 py-3.5 rounded-full font-bold shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all active:scale-95 flex items-center gap-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`} 
                    type="submit"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Saving...
                      </>
                    ) : 'Save Changes'}
                  </button>
                </div>
              </form>
            </section>
          )}
          
          {activeTab === 'Connected Accounts' && (
            <section className="bg-white rounded-3xl border border-zinc-100 p-10 shadow-sm animate-fade-in" data-purpose="connected-accounts">
              <h4 className="text-lg font-bold text-zinc-900 mb-6">Connected Accounts</h4>
              <div className="flex flex-col sm:flex-row items-center sm:justify-between p-6 bg-zinc-50 border border-zinc-100 rounded-2xl gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-zinc-100">
                    <svg className="w-6 h-6" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                  </div>
                  <div>
                    <span className="block text-base font-bold text-zinc-900">Google Account</span>
                    <span className="text-sm text-zinc-500 font-medium">Use Google to sign in to ImpromptuAI</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {user?.google_id ? (
                    <>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">Connected</span>
                      <button className="text-sm font-bold text-zinc-400 hover:text-zinc-700 transition-colors">Disconnect</button>
                    </>
                  ) : (
                    <button className="text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full hover:bg-indigo-100 transition-colors">Connect Google</button>
                  )}
                </div>
              </div>
            </section>
          )}
          
          {activeTab === 'Danger Zone' && (
            <section className="bg-rose-50/50 rounded-3xl border-2 border-rose-100 p-10 animate-fade-in" data-purpose="danger-zone">
              <div className="mb-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-rose-100 shrink-0">
                  <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-rose-700 mb-2">Delete Account</h4>
                  <p className="text-sm text-rose-600/80 font-medium leading-relaxed max-w-2xl">
                    Permanently delete your account and all associated speaking data, historical sessions, and analytics. 
                    <strong className="block mt-1 font-bold text-rose-700">This action is irreversible.</strong>
                  </p>
                </div>
              </div>
              <div className="pl-16">
                <button onClick={() => setShowDeleteModal(true)} className="bg-white text-rose-600 border border-rose-200 shadow-sm rounded-full px-6 py-3 text-sm font-bold hover:bg-rose-600 hover:text-white transition-all active:scale-95">
                  Yes, delete my account
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 mb-2">Delete Account?</h3>
            <p className="text-zinc-500 mb-6 font-medium">This action cannot be undone. All your data will be permanently removed.</p>
            
            <label className="block text-sm font-bold text-zinc-700 mb-2">Type <span className="text-rose-600">DELETE</span> to confirm</label>
            <input 
              type="text" 
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              className="w-full rounded-xl border-zinc-200 bg-zinc-50 py-3 px-4 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all font-bold text-zinc-900 mb-8"
              placeholder="DELETE"
            />
            
            <div className="flex gap-4">
              <button 
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmationText(''); }}
                className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold rounded-full transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationText !== 'DELETE' || isDeleting}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
