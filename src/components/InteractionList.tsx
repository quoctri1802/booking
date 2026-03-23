import React, { useState, useEffect } from 'react';
import { Search, Filter, MessageSquare, Clock, AlertTriangle, HelpCircle, Calendar, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { db, collection, query, orderBy, onSnapshot, deleteDoc, doc, OperationType, handleFirestoreError } from '../firebase';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function InteractionList() {
  const [interactions, setInteractions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'interactions'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInteractions(data);
    });
    return () => unsubscribe();
  }, []);

  const filtered = interactions.filter(i => {
    const matchesSearch = i.userMessage.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         i.aiResponse.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || i.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const deleteInteraction = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
      try {
        await deleteDoc(doc(db, 'interactions', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `interactions/${id}`);
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'emergency': return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'booking': return <Calendar className="w-4 h-4 text-emerald-500" />;
      case 'complaint': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <HelpCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'emergency': return 'Cấp cứu';
      case 'booking': return 'Đặt lịch';
      case 'inquiry': return 'Hỏi đáp';
      case 'complaint': return 'Khiếu nại';
      default: return 'Khác';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Lịch sử tương tác AI</h2>
          <p className="text-slate-500 font-medium">Theo dõi và phân loại các yêu cầu từ bệnh nhân</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="Tìm trong nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 w-full sm:w-64 transition-all shadow-sm"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all shadow-sm font-medium text-slate-700"
          >
            <option value="all">Tất cả phân loại</option>
            <option value="booking">Đặt lịch</option>
            <option value="inquiry">Hỏi đáp</option>
            <option value="emergency">Cấp cứu</option>
            <option value="complaint">Khiếu nại</option>
            <option value="other">Khác</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((i) => (
          <div 
            key={i.id} 
            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all"
          >
            <div 
              className="p-6 flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedId(expandedId === i.id ? null : i.id)}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  i.category === 'emergency' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'
                }`}>
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${
                      i.category === 'emergency' ? 'bg-rose-100 text-rose-700' : 
                      i.category === 'booking' ? 'bg-emerald-100 text-emerald-700' : 
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {getCategoryIcon(i.category)}
                      {getCategoryLabel(i.category)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(parseISO(i.timestamp), 'HH:mm dd/MM/yyyy')}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 truncate pr-4">
                    {i.userMessage}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); deleteInteraction(i.id); }}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                {expandedId === i.id ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
              </div>
            </div>

            {expandedId === i.id && (
              <div className="px-6 pb-6 pt-2 border-t border-slate-50 bg-slate-50/30 animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Bệnh nhân hỏi:</p>
                    <p className="text-sm text-slate-800 leading-relaxed font-medium">{i.userMessage}</p>
                  </div>
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 shadow-sm">
                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-2">AI phản hồi:</p>
                    <p className="text-sm text-slate-800 leading-relaxed font-medium">{i.aiResponse}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-24 text-center bg-white rounded-3xl border border-slate-100">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10 text-slate-200" />
            </div>
            <p className="text-slate-500 font-medium">Không tìm thấy tương tác nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
