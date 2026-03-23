import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Bot, User as UserIcon, Calendar, Phone, UserPlus, Stethoscope, Loader2, CheckCircle2, Shield, Check, CheckCheck } from 'lucide-react';
import { db, addDoc, collection, OperationType, handleFirestoreError } from '../firebase';
import VoiceButton from './VoiceButton';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";

const KNOWLEDGE_BASE = `
  Bạn là trợ lý ảo thông minh của Trung tâm Y tế Khu vực Liên Chiểu (Đà Nẵng).
  Nhiệm vụ của bạn là hỗ trợ bệnh nhân tìm hiểu thông tin, giải đáp thắc mắc y tế cơ bản và đặt lịch khám một cách tận tâm.

  THÔNG TIN CHI TIẾT KHOA PHÒNG & DỊCH VỤ:
  - Khám Nội: 
    + Dịch vụ: Khám sức khỏe định kỳ, tầm soát ung thư cơ bản, điều trị các bệnh lý nội khoa mãn tính (tiểu đường, cao huyết áp, mỡ máu).
  - Khám Ngoại: 
    + Dịch vụ: Khám và tư vấn phẫu thuật, xử lý vết thương, các bệnh lý ngoại khoa.
  - Sản: 
    + Dịch vụ: Khám phụ khoa, tầm soát ung thư cổ tử cung (Pap smear), quản lý thai nghén trọn gói.
  - Nhi: 
    + Dịch vụ: Khám dinh dưỡng, tư vấn tiêm chủng, điều trị các bệnh lý hô hấp, tiêu hóa ở trẻ em.
  - Y học cổ truyền:
    + Dịch vụ: Châm cứu, bấm huyệt, điều trị bằng thuốc đông y, phục hồi chức năng.
  - Tiêm chủng Vaccine dịch vụ:
    + Dịch vụ: Tiêm chủng các loại vaccine cho trẻ em và người lớn, tư vấn tiêm chủng.
  - Khoa Cấp cứu: Trực 24/7, xử lý các tình huống khẩn cấp, tai nạn, ngộ độc.

  HƯỚNG DẪN TRƯỚC KHI KHÁM (QUAN TRỌNG):
  - Khám tổng quát/Tiêu hóa: Nên nhịn ăn ít nhất 6-8 tiếng trước khi đến để kết quả xét nghiệm máu và nội soi chính xác nhất.
  - Khám Sản/Phụ khoa: Không nên sử dụng dung dịch vệ sinh hoặc quan hệ tình dục trong vòng 24h trước khi khám.
  - Giấy tờ cần mang: CCCD (bắt buộc), Thẻ BHYT (nếu có), Sổ khám bệnh cũ hoặc kết quả xét nghiệm gần nhất.

  PHONG CÁCH PHỤC VỤ & ĐẠO ĐỨC:
  - Luôn thể hiện sự thấu hiểu và đồng cảm. Ví dụ: "Tôi rất tiếc khi nghe bạn đang gặp phải tình trạng này...", "Tôi hiểu sự lo lắng của bạn...".
  - Sử dụng ngôn ngữ chuyên nghiệp nhưng dễ hiểu, tránh lạm dụng thuật ngữ y khoa quá phức tạp.
  - Tuyệt đối không chẩn đoán bệnh cụ thể hoặc kê đơn thuốc. Chỉ gợi ý hướng khám và khoa phù hợp.
  - Nếu bệnh nhân hỏi về chi phí, hãy trả lời: "Chi phí khám bệnh tại trung tâm được niêm yết theo quy định của Bộ Y tế. Bạn có thể thanh toán bằng tiền mặt hoặc thẻ BHYT để được hưởng chế độ giảm trừ đúng quy định."

  CẢNH BÁO CẤP CỨU:
  - Nếu phát hiện từ khóa nguy kịch: "đau ngực dữ dội", "khó thở nặng", "liệt nửa người", "mất ngôn ngữ đột ngột", "co giật", "chảy máu không cầm được", hãy NGAY LẬP TỨC dừng việc đặt lịch và yêu cầu bệnh nhân gọi 115 hoặc đến thẳng khoa Cấp cứu.

  THÔNG TIN CHUNG:
  - Giờ làm việc: Sáng 7:00 - 11:30, Chiều 13:30 - 17:00 (Thứ 2 - Thứ 6). Thứ 7 & CN chỉ trực cấp cứu.
  - Địa chỉ: 525 Tôn Đức Thắng, Hòa Khánh, Đà Nẵng.

  HƯỚNG DẪN ĐẶT LỊCH:
  - Bạn cần thu thập: Tên bệnh nhân, Ngày tháng năm sinh, Số điện thoại, Triệu chứng/Lý do khám, Thời gian mong muốn.
  - YÊU CẦU ĐỊNH DANH:
    + Nếu là bệnh nhân cũ: Yêu cầu cung cấp **Mã số bệnh nhân**.
    + Nếu là bệnh nhân mới: Yêu cầu cung cấp **Số căn cước công dân (CCCD)**.
  - Hãy gợi ý khoa phù hợp dựa trên triệu chứng bệnh nhân mô tả và cung cấp thêm các hướng dẫn chuẩn bị (nhịn ăn nếu cần).
  - Khi đã đủ thông tin, hãy nói: "Tôi đã ghi nhận thông tin đặt lịch của bạn. Vui lòng xác nhận lại các thông tin bên dưới để tôi hoàn tất thủ tục."
`;

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
  status?: 'sending' | 'sent' | 'read';
  timestamp?: string;
}

function TypingIndicator() {
  return (
    <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-300">
      <div className="flex gap-2 sm:gap-3 max-w-[80%]">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm">
          <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}

export default function ChatUI() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getGenAI = () => {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY chưa được thiết lập. Vui lòng kiểm tra biến môi trường trong Settings.");
    }
    return new GoogleGenAI({ apiKey });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const extractBookingData = async (history: Message[]): Promise<any> => {
    try {
      const genAI = getGenAI();
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: "user", parts: [{ text: `Dựa trên lịch sử trò chuyện, hãy trích xuất thông tin đặt lịch khám bệnh dưới dạng JSON với các trường: patientName, dob (định dạng YYYY-MM-DD), phone, department, appointmentTime (định dạng YYYY-MM-DDTHH:mm), patientId (Mã số bệnh nhân nếu là BN cũ), citizenId (Số CCCD nếu là BN mới). Nếu thiếu thông tin nào hãy để null. Chỉ trả về JSON.\n\nLịch sử:\n${JSON.stringify(history)}` }] }
        ],
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text);
    } catch (e) {
      return null;
    }
  };

  const categorizeInquiry = async (userMsg: string, aiResp: string): Promise<string> => {
    try {
      const genAI = getGenAI();
      const model = genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: "user", parts: [{ text: `Phân loại hội thoại sau vào một trong các nhãn: booking, inquiry, emergency, complaint, other. Chỉ trả về duy nhất nhãn đó.\nUser: ${userMsg}\nAI: ${aiResp}` }] }
        ],
      });
      const result = await model;
      const category = result.text.trim().toLowerCase();
      const validCategories = ["booking", "inquiry", "emergency", "complaint", "other"];
      return validCategories.includes(category) ? category : "other";
    } catch (e) {
      return "other";
    }
  };

  const logInteraction = async (userMsg: string, aiResp: string) => {
    try {
      const category = await categorizeInquiry(userMsg, aiResp);
      await addDoc(collection(db, 'interactions'), {
        userMessage: userMsg,
        aiResponse: aiResp,
        category: category,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to log interaction:", error);
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const timestamp = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', parts: [{ text: messageText }], status: 'sent', timestamp }
    ];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const genAI = getGenAI();
      
      // Simulate "Read" status when bot starts processing
      setTimeout(() => {
        setMessages(prev => prev.map((m, idx) => 
          idx === prev.length - 1 && m.role === 'user' ? { ...m, status: 'read' } : m
        ));
      }, 500);

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: "user", parts: [{ text: KNOWLEDGE_BASE }] },
          ...messages,
          { role: "user", parts: [{ text: messageText }] }
        ],
      });

      const aiText = response.text;
      const aiTimestamp = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const updatedMessages: Message[] = [...newMessages.map((m, idx) => 
        idx === newMessages.length - 1 && m.role === 'user' ? { ...m, status: 'read' } : m
      ), { role: 'model', parts: [{ text: aiText }], timestamp: aiTimestamp }];
      setMessages(updatedMessages);
      
      // Log interaction
      logInteraction(messageText, aiText);

      if (aiText.toLowerCase().includes('xác nhận') && aiText.toLowerCase().includes('lịch hẹn')) {
        const extracted = await extractBookingData(updatedMessages);
        if (extracted && extracted.patientName && extracted.phone) {
          setBookingData({
            ...extracted,
            appointmentTime: extracted.appointmentTime || new Date(Date.now() + 86400000).toISOString().slice(0, 16),
            status: 'confirmed'
          });
          setShowBookingModal(true);
        }
      }
    } catch (error: any) {
      console.error("Chat Error:", error);
      setError(error.message || "Đã có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const confirmBooking = async () => {
    if (!bookingData.patientId && !bookingData.citizenId) {
      // In a real app, we'd show a toast or inline error. 
      // For now, we'll just log and prevent submission if both are missing.
      console.error("Missing patient identification");
      return;
    }
    try {
      setLoading(true);
      // 1. Call backend to create Google Calendar event
      const bookResponse = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      const bookData = await bookResponse.json();

      // 2. Save to Firestore
      const appointment = {
        ...bookingData,
        googleEventId: bookData.googleEventId,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'appointments'), appointment);
      
      setMessages([...messages, { 
        role: 'model', 
        parts: [{ text: `✅ **Đặt lịch thành công!**\n\nLịch hẹn của bạn đã được ghi nhận vào hệ thống.\n\n- **Bệnh nhân:** ${bookingData.patientName}\n- **Khoa:** ${bookingData.department}\n- **Bác sĩ:** ${bookingData.doctor || 'Chưa chọn'}\n- **Thời gian:** ${new Date(bookingData.appointmentTime).toLocaleString('vi-VN')}\n\nChúng tôi sẽ gửi tin nhắn nhắc nhở trước 24h.` }] 
      }]);
      
      setShowBookingModal(false);
      setBookingData(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'appointments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white sm:rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative">
      {/* Chat Header */}
      <div className="bg-emerald-600 p-3 sm:p-4 flex items-center gap-2 sm:gap-3 text-white shadow-md z-10">
        <div className="bg-white/20 p-1.5 sm:p-2 rounded-xl backdrop-blur-sm">
          <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-base sm:text-lg leading-tight truncate">Tổng đài AI Liên Chiểu</h2>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-300 rounded-full animate-pulse"></span>
            <p className="text-[10px] sm:text-xs text-emerald-50 font-medium truncate">Sẵn sàng hỗ trợ 24/7</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 bg-slate-50/50"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 sm:space-y-6 max-w-md mx-auto p-4">
            <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-xl shadow-emerald-100/50 border border-emerald-50 w-full">
              <Bot className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-500 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2">Chào mừng bạn!</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Tôi là trợ lý ảo của Trung tâm Y tế Quận Liên Chiểu. Tôi có thể giúp bạn tìm hiểu về khoa phòng, giờ khám và đặt lịch hẹn nhanh chóng.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full">
              {['Đặt lịch khám', 'Đau dạ dày', 'Khám thai', 'Sốt cao'].map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q === 'Đặt lịch khám' ? q : `Tôi muốn đặt lịch khám vì ${q.toLowerCase()}`)}
                  className="px-3 py-2.5 sm:px-4 sm:py-3 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-semibold text-slate-700 transition-all shadow-sm text-left flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0"></div>
                  <span className="truncate">{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div 
            key={i} 
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`flex gap-2 sm:gap-3 max-w-[90%] sm:max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-600 border border-emerald-100'
              }`}>
                {m.role === 'user' ? <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <Bot className="w-4 h-4 sm:w-5 sm:h-5" />}
              </div>
              <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm relative ${
                m.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
              }`}>
                <div className="prose prose-xs sm:prose-sm max-w-none prose-slate">
                   <ReactMarkdown>{m.parts[0].text}</ReactMarkdown>
                </div>
                <div className={`flex items-center justify-end gap-1 mt-1 opacity-70 text-[9px] sm:text-[10px] ${m.role === 'user' ? 'text-emerald-50' : 'text-slate-400'}`}>
                  <span>{m.timestamp}</span>
                  {m.role === 'user' && (
                    <span>
                      {m.status === 'read' ? (
                        <CheckCheck className="w-3 h-3" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2 shadow-sm">
              <Shield className="w-4 h-4" />
              {error}
            </div>
          </div>
        )}
        {loading && <TypingIndicator />}
      </div>

      {/* Input Area */}
      <div className="p-2 sm:p-4 bg-white border-t border-slate-100 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3 bg-slate-50 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-slate-200 focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-50 transition-all">
          <VoiceButton onResult={(text) => handleSend(text)} />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Nhập tin nhắn..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-xs sm:text-sm py-1.5 sm:py-2 px-1 sm:px-2 text-slate-800 placeholder:text-slate-400 font-medium"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="p-2.5 sm:p-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg sm:rounded-xl transition-all shadow-lg shadow-emerald-100 disabled:shadow-none shrink-0"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && bookingData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="bg-emerald-600 p-4 sm:p-6 text-white relative shrink-0">
              <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-10">
                <Calendar className="w-16 h-16 sm:w-24 sm:h-24" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-1">Xác nhận lịch hẹn</h3>
              <p className="text-emerald-50 text-[10px] sm:text-sm opacity-90">Vui lòng kiểm tra lại thông tin bên dưới</p>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="bg-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-sm text-emerald-600">
                    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bệnh nhân</p>
                    <input 
                      className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                      value={bookingData.patientName}
                      onChange={e => setBookingData({...bookingData, patientName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="bg-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-sm text-emerald-600">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ngày sinh</p>
                    <input 
                      type="date"
                      className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                      value={bookingData.dob || ''}
                      onChange={e => setBookingData({...bookingData, dob: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="bg-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-sm text-emerald-600">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Số điện thoại</p>
                    <input 
                      className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                      value={bookingData.phone}
                      onChange={e => setBookingData({...bookingData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="bg-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-sm text-emerald-600">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mã số BN / CCCD</p>
                    <input 
                      className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                      placeholder="Nhập mã BN hoặc CCCD"
                      value={bookingData.patientId || bookingData.citizenId || ''}
                      onChange={e => {
                        const val = e.target.value;
                        if (val.length === 12) {
                          setBookingData({...bookingData, citizenId: val, patientId: null});
                        } else {
                          setBookingData({...bookingData, patientId: val, citizenId: null});
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="bg-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-sm text-emerald-600">
                    <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Khoa khám</p>
                    <select 
                      className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none appearance-none"
                      value={bookingData.department}
                      onChange={e => setBookingData({...bookingData, department: e.target.value})}
                    >
                      <option>Khám Nội</option>
                      <option>Khám Ngoại</option>
                      <option>Sản</option>
                      <option>Nhi</option>
                      <option>Y học cổ truyền</option>
                      <option>Tiêm chủng Vaccine dịch vụ</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="bg-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-sm text-emerald-600">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thời gian</p>
                    <input 
                      type="datetime-local"
                      className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                      value={bookingData.appointmentTime}
                      onChange={e => setBookingData({...bookingData, appointmentTime: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2 shrink-0">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 border border-slate-200 text-slate-600 font-bold rounded-xl sm:rounded-2xl hover:bg-slate-50 transition-colors text-xs sm:text-sm"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmBooking}
                  disabled={loading || (!bookingData.patientId && !bookingData.citizenId)}
                  className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 bg-emerald-600 text-white font-bold rounded-xl sm:rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 text-xs sm:text-sm disabled:bg-slate-300 disabled:shadow-none"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
