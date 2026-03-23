import React from 'react';
import { Users, Calendar, Clock, TrendingUp, Activity, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface DashboardProps {
  appointments: any[];
}

export default function Dashboard({ appointments }: DashboardProps) {
  const todayAppointments = appointments.filter(a => isToday(parseISO(a.appointmentTime)));
  const confirmed = appointments.filter(a => a.status === 'confirmed').length;
  const completed = appointments.filter(a => a.status === 'completed').length;
  const cancelled = appointments.filter(a => a.status === 'cancelled').length;

  const stats = [
    { label: 'Tổng lịch hẹn', value: appointments.length, icon: Calendar, color: 'bg-blue-500', textColor: 'text-blue-600' },
    { label: 'Lịch hôm nay', value: todayAppointments.length, icon: Clock, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
    { label: 'Đã hoàn thành', value: completed, icon: CheckCircle2, color: 'bg-indigo-500', textColor: 'text-indigo-600' },
    { label: 'Đã hủy', value: cancelled, icon: XCircle, color: 'bg-rose-500', textColor: 'text-rose-600' },
  ];

  const departments = appointments.reduce((acc: any, curr) => {
    acc[curr.department] = (acc[curr.department] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Bảng điều khiển</h2>
          <p className="text-slate-500 font-medium">Thống kê hoạt động của trung tâm y tế</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-700">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <span>{format(new Date(), "'Ngày' dd 'tháng' MM, yyyy", { locale: vi })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-2xl text-white shadow-lg shadow-slate-100 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                <TrendingUp className="w-3 h-3" />
                <span>+12%</span>
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Department Distribution */}
        <div className="lg:col-span-1 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900">Phân bổ theo khoa</h3>
          </div>
          <div className="space-y-6">
            {Object.entries(departments).map(([name, count]: any) => (
              <div key={name} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-700">{name}</span>
                  <span className="text-emerald-600">{count}</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${(count / appointments.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {Object.keys(departments).length === 0 && (
              <div className="text-center py-12 text-slate-400 italic text-sm">Chưa có dữ liệu phân bổ</div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900">Hoạt động gần đây</h3>
            </div>
            <button className="text-xs font-bold text-emerald-600 hover:underline">Xem tất cả</button>
          </div>
          <div className="space-y-4">
            {appointments.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-sm transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 border border-slate-100 group-hover:border-emerald-200 transition-colors">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{a.patientName}</p>
                    <p className="text-xs text-slate-500 font-medium">Đặt lịch tại khoa {a.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900">{format(parseISO(a.createdAt), 'HH:mm dd/MM')}</p>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                    a.status === 'confirmed' ? 'bg-blue-100 text-blue-600' : 
                    a.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 
                    'bg-rose-100 text-rose-600'
                  }`}>
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
            {appointments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
                <AlertCircle className="w-10 h-10 opacity-20" />
                <p className="text-sm italic">Chưa có hoạt động nào được ghi nhận</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
