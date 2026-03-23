import React, { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, User, loginWithGoogle, logout, db, collection, onSnapshot, query, orderBy } from './firebase';
import Sidebar from './components/Sidebar';
import ChatUI from './components/ChatUI';
import Dashboard from './components/Dashboard';
import PatientList from './components/PatientList';
import InteractionList from './components/InteractionList';
import StaffList from './components/StaffList';
import { LogIn, LogOut, User as UserIcon, Activity, Shield, Menu, X } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard' | 'patients' | 'interactions' | 'users'>('chat');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUserRole(userSnap.data().role);
        } else {
          // Create default user entry
          // Default admin is quoctri1802@gmail.com based on rules
          const role = user.email === 'quoctri1802@gmail.com' ? 'admin' : 'staff';
          await setDoc(userRef, {
            email: user.email,
            name: user.displayName,
            role: role,
            status: 'active',
            createdAt: new Date().toISOString()
          });
          setUserRole(role);
        }
      } else {
        setUserRole(null);
      }
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAppointments(data);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user && (userRole === 'admin' || userRole === 'staff')) {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStaff(data);
      });
      return () => unsubscribe();
    }
  }, [user, userRole]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar - Only for Staff/Admin */}
      {user && (
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={logout}
          user={{ ...user, role: userRole }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0 z-30">
          <div className="flex items-center gap-2 sm:gap-3">
            {user && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-slate-500 hover:text-slate-900 lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
            <div className="bg-emerald-500 p-1.5 sm:p-2 rounded-lg">
              <Activity className="text-white w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold text-slate-900 leading-tight truncate">
                TTYT Liên Chiểu
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider truncate">
                Tổng đài AI & Quản lý
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {!user ? (
              <button
                onClick={loginWithGoogle}
                className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all font-medium shadow-sm text-xs sm:text-sm"
              >
                <LogIn className="w-3.5 h-3.5 sm:w-4 h-4" />
                <span className="hidden xs:inline">Đăng nhập</span>
                <span className="xs:hidden">Login</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-semibold text-slate-900">{user.displayName}</p>
                  <p className="text-xs text-slate-500">Nhân viên y tế</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon className="text-slate-500 w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-50">
          <div className="max-w-7xl mx-auto h-full">
            {!user || activeTab === 'chat' ? (
              <ChatUI />
            ) : activeTab === 'dashboard' ? (
              <Dashboard appointments={appointments} />
            ) : activeTab === 'patients' ? (
              <PatientList appointments={appointments} />
            ) : activeTab === 'interactions' ? (
              <InteractionList />
            ) : (
              <StaffList staff={staff} isAdmin={userRole === 'admin'} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
