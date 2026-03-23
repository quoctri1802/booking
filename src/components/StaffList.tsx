import React, { useState } from 'react';
import { Search, Filter, MoreVertical, CheckCircle2, XCircle, User, Phone, Mail, Shield, Plus, UserPlus, Save, Trash2, AlertCircle, Loader2, Briefcase, Building2 } from 'lucide-react';
import { db, doc, updateDoc, deleteDoc, setDoc, collection, OperationType, handleFirestoreError } from '../firebase';
import { format } from 'date-fns';

interface StaffListProps {
  staff: any[];
  isAdmin: boolean;
}

export default function StaffList({ staff, isAdmin }: StaffListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
    department: 'Nội tổng quát',
    position: 'Bác sĩ',
    status: 'active'
  });

  const filtered = staff.filter(s => {
    const matchesSearch = (s.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                         (s.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (s.phone || '').includes(searchTerm);
    const matchesRole = filterRole === 'all' || s.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email) {
      alert('Vui lòng nhập tên và email');
      return;
    }
    setLoading(true);
    try {
      // For users, we might want to use email as ID or a random ID if we don't have the UID yet
      // In a real app, you'd probably link this to Firebase Auth
      const staffId = newStaff.email.replace(/[^a-zA-Z0-9]/g, '_');
      await setDoc(doc(db, 'users', staffId), {
        ...newStaff,
        createdAt: new Date().toISOString()
      });
      setShowAddForm(false);
      setNewStaff({
        name: '',
        email: '',
        phone: '',
        role: 'staff',
        department: 'Nội tổng quát',
        position: 'Bác sĩ',
        status: 'active'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'users');
    } finally {
      setLoading(false);
    }
  };

  const updateStaffStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'users', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
  };

  const deleteStaff = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Quản lý nhân viên</h2>
          <p className="text-slate-500 font-medium">Quản lý đội ngũ y bác sĩ và nhân viên trung tâm</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all font-bold shadow-lg shadow-emerald-100 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm nhân viên</span>
            </button>
          )}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="Tìm theo tên, email, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 w-full sm:w-72 transition-all shadow-sm"
            />
          </div>
          <div className="relative group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="pl-11 pr-8 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 appearance-none transition-all shadow-sm font-medium text-slate-700"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="staff">Nhân viên</option>
            </select>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-emerald-100 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600">
              <UserPlus className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Thêm nhân viên mới</h3>
          </div>
          <form onSubmit={handleAddStaff} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
              <input
                required
                type="text"
                placeholder="Nguyễn Văn A"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-medium"
                value={newStaff.name}
                onChange={e => setNewStaff({...newStaff, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
              <input
                required
                type="email"
                placeholder="email@example.com"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-medium"
                value={newStaff.email}
                onChange={e => setNewStaff({...newStaff, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
              <input
                type="tel"
                placeholder="090..."
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-medium"
                value={newStaff.phone}
                onChange={e => setNewStaff({...newStaff, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Vai trò</label>
              <select
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-medium appearance-none"
                value={newStaff.role}
                onChange={e => setNewStaff({...newStaff, role: e.target.value})}
              >
                <option value="staff">Nhân viên</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Khoa/Phòng ban</label>
              <select
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-medium appearance-none"
                value={newStaff.department}
                onChange={e => setNewStaff({...newStaff, department: e.target.value})}
              >
                <option>Nội tổng quát</option>
                <option>Tim mạch</option>
                <option>Tiêu hóa</option>
                <option>Nhi</option>
                <option>Sản</option>
                <option>Hành chính</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Chức vụ</label>
              <input
                type="text"
                placeholder="Bác sĩ, Điều dưỡng..."
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-medium"
                value={newStaff.position}
                onChange={e => setNewStaff({...newStaff, position: e.target.value})}
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-colors text-sm"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all font-bold shadow-lg shadow-emerald-100 text-sm disabled:bg-slate-300"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Lưu nhân viên</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Nhân viên</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Công việc</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Liên hệ</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Trạng thái</th>
                {isAdmin && <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors shadow-sm ${
                        s.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                      }`}>
                        {s.role === 'admin' ? <Shield className="w-6 h-6" /> : <User className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-tight">{s.name}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                          {s.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{s.department}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                        <Briefcase className="w-3 h-3" />
                        <span>{s.position}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-blue-500" />
                        <span>{s.email}</span>
                      </div>
                      {s.phone && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                          <Phone className="w-3 h-3" />
                          <span>{s.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                      s.status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-slate-50 text-slate-500 ring-1 ring-slate-100'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        s.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}></div>
                      {s.status === 'active' ? 'Đang làm việc' : 'Nghỉ việc'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => updateStaffStatus(s.id, s.status === 'active' ? 'inactive' : 'active')}
                          className={`p-2.5 rounded-xl transition-all shadow-sm ${
                            s.status === 'active' ? 'bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                          }`}
                          title={s.status === 'active' ? 'Đánh dấu nghỉ việc' : 'Đánh dấu đi làm'}
                        >
                          {s.status === 'active' ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => deleteStaff(s.id)}
                          className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm"
                          title="Xóa nhân viên"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-4">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <AlertCircle className="w-12 h-12 opacity-20" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-900">Không tìm thấy nhân viên</p>
                <p className="text-sm font-medium">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
