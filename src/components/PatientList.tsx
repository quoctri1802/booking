import React, { useState } from 'react';
import { Search, Filter, MoreVertical, CheckCircle2, XCircle, Clock, Phone, Calendar, User as UserIcon, Stethoscope, AlertCircle, Trash2, Shield, Plus, UserPlus, Save, Copy, Check, Loader2 } from 'lucide-react';
import { db, doc, updateDoc, deleteDoc, addDoc, collection, OperationType, handleFirestoreError } from '../firebase';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface PatientListProps {
  appointments: any[];
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-400">
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export default function PatientList({ appointments }: PatientListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    patientName: '',
    phone: '',
    patientId: '',
    citizenId: '',
    department: 'Khám Nội',
    appointmentTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    status: 'confirmed'
  });
  const [loading, setLoading] = useState(false);

  const filtered = appointments.filter(a => {
    const matchesSearch = (a.patientName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                         (a.phone || '').includes(searchTerm) ||
                         (a.patientId && a.patientId.includes(searchTerm)) ||
                         (a.citizenId && a.citizenId.includes(searchTerm));
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchesDate = !filterDate || a.appointmentTime.startsWith(filterDate);
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppointment.patientName || !newAppointment.phone || (!newAppointment.patientId && !newAppointment.citizenId)) {
      // We'll rely on the disabled state of the button, but this is a fallback.
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        ...newAppointment,
        createdAt: new Date().toISOString()
      });
      setShowAddForm(false);
      setNewAppointment({
        patientName: '',
        phone: '',
        patientId: '',
        citizenId: '',
        department: 'Khám Nội',
        appointmentTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        status: 'confirmed'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'appointments');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'appointments', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${id}`);
    }
  };

  const deleteAppointment = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch hẹn này?')) {
      try {
        await deleteDoc(doc(db, 'appointments', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `appointments/${id}`);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Quản lý lịch hẹn</h2>
          <p className="text-slate-500 font-medium">Danh sách bệnh nhân đã đặt lịch qua hệ thống AI</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all font-bold shadow-lg shadow-emerald-100 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm lịch hẹn</span>
          </button>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT, Mã BN, CCCD..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 w-full sm:w-72 transition-all shadow-sm"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="relative group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-11 pr-8 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 appearance-none transition-all shadow-sm font-medium text-slate-700"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="confirmed">Chờ khám</option>
              <option value="completed">Đã khám</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
          <div className="relative group">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all shadow-sm font-medium text-slate-700"
            />
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-emerald-100 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600">
              <UserPlus className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Đăng ký khám mới</h3>
          </div>
          <form onSubmit={handleAddAppointment} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tên bệnh nhân</label>
              <input
                required
                type="text"
                placeholder="Nguyễn Văn A"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-medium"
                value={newAppointment.patientName}
                onChange={e => setNewAppointment({...newAppointment, patientName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
              <input
                required
                type="tel"
                placeholder="090..."
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-medium"
                value={newAppointment.phone}
                onChange={e => setNewAppointment({...newAppointment, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Mã số bệnh nhân (nếu có)</label>
              <input
                type="text"
                placeholder="BN12345"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-medium"
                value={newAppointment.patientId}
                onChange={e => setNewAppointment({...newAppointment, patientId: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Số CCCD (nếu có)</label>
              <input
                type="text"
                placeholder="048..."
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-medium"
                value={newAppointment.citizenId}
                onChange={e => setNewAppointment({...newAppointment, citizenId: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Khoa khám</label>
              <select
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-medium appearance-none"
                value={newAppointment.department}
                onChange={e => setNewAppointment({...newAppointment, department: e.target.value})}
              >
                <option>Khám Nội</option>
                <option>Khám Ngoại</option>
                <option>Sản</option>
                <option>Nhi</option>
                <option>Y học cổ truyền</option>
                <option>Tiêm chủng Vaccine dịch vụ</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Thời gian hẹn</label>
              <input
                type="datetime-local"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-medium"
                value={newAppointment.appointmentTime}
                onChange={e => setNewAppointment({...newAppointment, appointmentTime: e.target.value})}
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
                disabled={loading || !newAppointment.patientName || !newAppointment.phone || (!newAppointment.patientId && !newAppointment.citizenId)}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all font-bold shadow-lg shadow-emerald-100 text-sm disabled:bg-slate-300 disabled:shadow-none"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Lưu lịch hẹn</span>
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
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Bệnh nhân</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Định danh (BN/CCCD)</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Khoa & Bác sĩ</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Thời gian hẹn</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Trạng thái</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 group-hover:bg-white transition-colors shadow-sm">
                        <UserIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-tight">{a.patientName}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <p className="text-xs text-slate-500 font-medium">{a.phone}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      {a.patientId && (
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-tight">Mã BN: {a.patientId}</span>
                          <CopyButton text={a.patientId} />
                        </div>
                      )}
                      {a.citizenId && (
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-tight">CCCD: {a.citizenId}</span>
                          <CopyButton text={a.citizenId} />
                        </div>
                      )}
                      {!a.patientId && !a.citizenId && (
                        <span className="text-[11px] text-slate-400 italic">Chưa cung cấp</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-50 p-1 rounded-lg text-blue-600">
                          <Stethoscope className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{a.department}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <Clock className="w-4 h-4 text-emerald-500" />
                        <span>{format(parseISO(a.appointmentTime), 'HH:mm', { locale: vi })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{format(parseISO(a.appointmentTime), 'dd/MM/yyyy', { locale: vi })}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                      a.status === 'confirmed' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' : 
                      a.status === 'completed' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 
                      'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        a.status === 'confirmed' ? 'bg-blue-500' : 
                        a.status === 'completed' ? 'bg-emerald-500' : 
                        'bg-rose-500'
                      }`}></div>
                      {a.status === 'confirmed' ? 'Chờ khám' : 
                       a.status === 'completed' ? 'Đã khám' : 'Đã hủy'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {a.status === 'confirmed' && (
                        <button
                          onClick={() => updateStatus(a.id, 'completed')}
                          className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm"
                          title="Hoàn thành khám"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      )}
                      {a.status !== 'cancelled' && (
                        <button
                          onClick={() => updateStatus(a.id, 'cancelled')}
                          className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm"
                          title="Hủy lịch"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteAppointment(a.id)}
                        className="p-2.5 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-sm"
                        title="Xóa lịch hẹn"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
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
                <p className="text-lg font-bold text-slate-900">Không tìm thấy kết quả</p>
                <p className="text-sm font-medium">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
