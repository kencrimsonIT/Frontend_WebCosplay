import { useState, useEffect, useRef } from 'react'
import '../styles/Profile.css'
import { useAuth } from '../context/AuthContext'
import { changePassword } from '../api/auth_api'
import { updateProfile, updateAvatar, getAddresses, addAddress, updateAddress, deleteAddress } from '../api/user_api'

function AvatarUpload({ src, name, onFileChange, loading }) {
  const initials = name?.split(' ').map(w => w[0]).slice(-2).join('') || 'U'
  const fileInputRef = useRef(null)

  const handleClick = () => {
    if (!loading) fileInputRef.current?.click()
  }

  return (
    <div className="avatar-upload-wrap">
      <div className="avatar-ring" onClick={handleClick} style={{ cursor: loading ? 'wait' : 'pointer' }}>
        {src
          ? <img src={src} alt={name} className="avatar-img" style={{ opacity: loading ? 0.5 : 1 }} />
          : <span className="avatar-initials">{initials}</span>
        }
        <div className="avatar-edit-overlay">
          {loading ? (
            <div className="spinner-small" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          )}
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*" 
          onChange={onFileChange} 
          disabled={loading}
        />
      </div>
      <div className="avatar-meta">
        <span className="avatar-name">{name}</span>
        <span className="avatar-badge">Thành viên</span>
      </div>
    </div>
  )
}

function AddressCard({ address, onSetDefault, onDelete, loading }) {
  // Handle various JSON naming conventions for booleans from different Jackson configurations
  const isDefault = address.isDefault === true || address.default === true || address.is_default === true;

  return (
    <div className={`address-card ${isDefault ? 'default' : ''}`}>
      <div className="address-card-left">
        <div className="address-label-row">
          <span className="address-icon">📍</span>
          <span className="address-label">{address.label || 'Địa chỉ'}</span>
          {isDefault && <span className="default-badge">Mặc định</span>}
        </div>
        <p className="address-full">{address.fullAddress}</p>
      </div>
      <div className="address-card-actions">
        {!isDefault && (
          <button className="addr-btn addr-btn-default" onClick={() => onSetDefault(address)} disabled={loading}>
            {loading ? '...' : 'Đặt mặc định'}
          </button>
        )}
        <button className="addr-btn addr-btn-delete" onClick={() => onDelete(address.id)} disabled={loading}>
          {loading ? '...' : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          )}
        </button>
      </div>
    </div>
  )
}

function Profile() {
  const { user, updateUser } = useAuth()
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', dob: '' })
  const [addresses, setAddresses] = useState([])
  const [showAddAddr, setShowAddAddr] = useState(false)
  const [newAddr, setNewAddr] = useState({ label: '', fullAddress: '' })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [addrLoading, setAddrLoading] = useState(false)
  const [error, setError] = useState('')

  // Change Password State
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')

  useEffect(() => {
    if (user) {
        setForm({
            name: user.fullName || '',
            email: user.email || '',
            phone: user.phone || '',
            dob: user.birthDate || ''
        });
        
        // If user already has addresses in context, use them initially
        if (user.addresses) {
          setAddresses(user.addresses);
        }
        
        fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const data = await getAddresses();
      setAddresses(data);
      // Sync with global user context
      if (user) {
        updateUser({ ...user, addresses: data });
      }
    } catch (err) {
      console.error("Failed to fetch addresses", err);
    }
  };

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      const updatedUser = await updateProfile({
        fullName: form.name,
        email: form.email,
        phone: form.phone,
        birthDate: form.dob
      })
      updateUser(updatedUser)
      setEditMode(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.error || err.message || 'Cập nhật thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setLoading(true)
    setError('')
    try {
      const updatedUser = await updateAvatar(file)
      updateUser(updatedUser)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.error || err.message || 'Tải ảnh lên thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (address) => {
    setAddrLoading(true);
    try {
      await updateAddress(address.id, {
        fullAddress: address.fullAddress,
        label: address.label,
        isDefault: true
      });
      await fetchAddresses();
    } catch (err) {
      setError(err.error || err.message || 'Không thể đặt mặc định');
    } finally {
      setAddrLoading(false);
    }
  }

  const handleDeleteAddr = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    setAddrLoading(true);
    try {
      await deleteAddress(id);
      await fetchAddresses();
    } catch (err) {
      setError(err.error || err.message || 'Xóa địa chỉ thất bại');
    } finally {
      setAddrLoading(false);
    }
  }

  const handleAddAddr = async () => {
    if (!newAddr.fullAddress) return
    setAddrLoading(true);
    try {
      await addAddress({
        fullAddress: newAddr.fullAddress,
        label: newAddr.label,
        isDefault: addresses.length === 0 // Default if first address
      });
      await fetchAddresses();
      setNewAddr({ label: '', fullAddress: '' });
      setShowAddAddr(false);
    } catch (err) {
      setError(err.error || err.message || 'Thêm địa chỉ thất bại');
    } finally {
      setAddrLoading(false);
    }
  }

  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwForm(prev => ({ ...prev, [name]: value }));
    setPwError('');
    setPwSuccess('');
  }

  const handleUpdatePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmNewPassword) {
      setPwError('Vui lòng điền đầy đủ các trường');
      return;
    }

    if (pwForm.newPassword !== pwForm.confirmNewPassword) {
      setPwError('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    if (pwForm.newPassword.length < 8) {
      setPwError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }

    setPwLoading(true);
    setPwError('');
    setPwSuccess('');

    try {
      await changePassword(pwForm);
      setPwSuccess('Đổi mật khẩu thành công!');
      setPwForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
    } catch (error) {
      setPwError(error.error || error.message || 'Đã có lỗi xảy ra');
    } finally {
      setPwLoading(false);
    }
  }

  if (!user) {
    return (
        <div className="profile-page">
            <div className="profile-header-section" style={{ textAlign: 'center', padding: '100px 24px' }}>
                <h1 className="profile-title">Vui lòng đăng nhập để xem thông tin</h1>
                <p className="profile-subtitle">Bạn cần có tài khoản để quản lý thông tin cá nhân và đơn hàng.</p>
            </div>
        </div>
    )
  }

  return (
    <div className="profile-page">
      {/* Page Title */}
      <div className="profile-header-section">
        <div className="profile-title-row">
          <div className="profile-title-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div>
            <h1 className="profile-title">Tài Khoản Của Tôi</h1>
            <p className="profile-subtitle">Quản lý thông tin cá nhân và địa chỉ giao nhận</p>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        {/* Left: Avatar + Stats */}
        <aside className="profile-sidebar">
          <div className="sidebar-card">
            <AvatarUpload 
              src={user.avatarUrl} 
              name={user.fullName} 
              onFileChange={handleAvatarChange}
              loading={loading}
            />
            <div className="sidebar-divider" />
            <div className="sidebar-stats">
              <div className="stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">Lần thuê</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">Đang thuê</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">5.0★</span>
                <span className="stat-label">Đánh giá</span>
              </div>
            </div>
            <div className="sidebar-divider" />
            <div className="sidebar-menu">
              <a href="/profile" className="sidebar-menu-item active">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Thông tin cá nhân
              </a>
              <a href="/orders" className="sidebar-menu-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Đơn thuê của tôi
              </a>
              <a href="/favorites" className="sidebar-menu-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                Yêu thích
              </a>
            </div>
          </div>
        </aside>

        {/* Right: Form */}
        <div className="profile-main">
          {/* Personal Info Card */}
          <div className="profile-card">
            <div className="card-header">
              <div className="card-header-left">
                <h2 className="card-title">Thông Tin Cá Nhân</h2>
                <p className="card-desc">Cập nhật họ tên, email và số điện thoại của bạn</p>
              </div>
              <button
                className={`btn-edit ${editMode ? 'active' : ''}`}
                onClick={() => { editMode ? handleSave() : setEditMode(true) }}
                disabled={loading}
              >
                {editMode
                  ? <>{loading ? 'Đang lưu...' : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> Lưu</>}</>
                  : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Chỉnh sửa</>
                }
              </button>
            </div>

            {error && (
              <div className="save-toast" style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {saved && (
              <div className="save-toast">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                Thông tin đã được cập nhật!
              </div>
            )}

            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Họ và tên</label>
                {editMode
                  ? <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nhập họ và tên..." disabled={loading} />
                  : <div className="form-value">{user.fullName}</div>
                }
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                {editMode
                  ? <input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} disabled={loading} />
                  : <div className="form-value">{user.email}</div>
                }
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                {editMode
                  ? <input className="form-input" type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} disabled={loading} />
                  : <div className="form-value">{user.phone || 'Chưa cập nhật'}</div>
                }
              </div>
              <div className="form-group">
                <label className="form-label">Ngày sinh</label>
                {editMode
                  ? <input className="form-input" type="date" value={form.dob} onChange={e => setForm(p => ({ ...p, dob: e.target.value }))} disabled={loading} />
                  : <div className="form-value">{user.birthDate ? new Date(user.birthDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</div>
                }
              </div>
            </div>

            {editMode && (
              <div className="form-actions">
                <button className="btn-cancel" onClick={() => { setEditMode(false); setForm({ name: user.fullName, email: user.email, phone: user.phone || '', dob: user.birthDate || '' }) }} disabled={loading}>
                  Hủy
                </button>
                <button className="btn-save-primary" onClick={handleSave} disabled={loading}>
                  {loading ? 'Đang lưu...' : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> Lưu thay đổi</>}
                </button>
              </div>
            )}
          </div>

          {/* Address Card */}
          <div className="profile-card">
            <div className="card-header">
              <div className="card-header-left">
                <h2 className="card-title">Địa Chỉ Nhận Đồ</h2>
                <p className="card-desc">Quản lý địa chỉ giao/nhận trang phục của bạn</p>
              </div>
              <button className="btn-add-addr" onClick={() => setShowAddAddr(v => !v)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Thêm địa chỉ
              </button>
            </div>

            <div className="address-list">
              {addresses.map(addr => (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  onSetDefault={handleSetDefault}
                  onDelete={handleDeleteAddr}
                  loading={addrLoading}
                />
              ))}
              {addresses.length === 0 && !addrLoading && (
                <p className="form-value" style={{ borderStyle: 'dashed', color: 'var(--text-muted)' }}>Chưa có địa chỉ nào được lưu.</p>
              )}
            </div>

            {showAddAddr && (
              <div className="add-addr-form">
                <div className="add-addr-form-grid">
                  <div className="form-group">
                    <label className="form-label">Tên địa chỉ (vd: Nhà riêng)</label>
                    <input className="form-input" value={newAddr.label} onChange={e => setNewAddr(p => ({ ...p, label: e.target.value }))} placeholder="Nhà riêng / Công ty..." disabled={addrLoading} />
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Địa chỉ đầy đủ</label>
                    <input className="form-input" value={newAddr.fullAddress} onChange={e => setNewAddr(p => ({ ...p, fullAddress: e.target.value }))} placeholder="Số nhà, đường, quận, thành phố..." disabled={addrLoading} />
                  </div>
                </div>
                <div className="form-actions">
                  <button className="btn-cancel" onClick={() => setShowAddAddr(false)} disabled={addrLoading}>Hủy</button>
                  <button className="btn-save-primary" onClick={handleAddAddr} disabled={addrLoading}>
                    {addrLoading ? 'Đang thêm...' : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> Thêm địa chỉ</>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Security Card */}
          <div className="profile-card">
            <div className="card-header">
              <div className="card-header-left">
                <h2 className="card-title">Bảo Mật Tài Khoản</h2>
                <p className="card-desc">Thay đổi mật khẩu để bảo vệ tài khoản</p>
              </div>
            </div>

            {pwError && (
              <div className="save-toast" style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {pwError}
              </div>
            )}

            {pwSuccess && (
              <div className="save-toast">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                {pwSuccess}
              </div>
            )}

            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Mật khẩu hiện tại</label>
                <input 
                  className="form-input" 
                  type="password" 
                  name="currentPassword"
                  placeholder="••••••••" 
                  value={pwForm.currentPassword}
                  onChange={handlePwChange}
                  disabled={pwLoading}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mật khẩu mới</label>
                <input 
                  className="form-input" 
                  type="password" 
                  name="newPassword"
                  placeholder="••••••••" 
                  value={pwForm.newPassword}
                  onChange={handlePwChange}
                  disabled={pwLoading}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Xác nhận mật khẩu mới</label>
                <input 
                  className="form-input" 
                  type="password" 
                  name="confirmNewPassword"
                  placeholder="••••••••" 
                  value={pwForm.confirmNewPassword}
                  onChange={handlePwChange}
                  disabled={pwLoading}
                />
              </div>
            </div>
            <div className="form-actions">
              <button 
                className="btn-save-primary" 
                onClick={handleUpdatePassword}
                disabled={pwLoading}
              >
                {pwLoading ? 'Đang xử lý...' : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Đổi mật khẩu
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
