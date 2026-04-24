import { useEffect, useState } from 'react';
import { checkAuth, login, logout, getTodos, createTodo, updateTodoStatus, type TodoItem } from './api/erpnext';
import { LogOut, Loading, Plus, CheckCircle2, Circle, Clock, LayoutList, Calendar, Flag, AlertCircle, Home as HomeIcon, FolderKanban, ListTodo, CheckSquare, FileText, Briefcase, PlayCircle } from 'lucide-react';
import { cn } from './lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [user, setUser] = useState<string | null>(null);
  
  const [email, setEmail] = useState('demo@erp.mte.vn');
  const [password, setPassword] = useState('demo123');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Tabs
  const [activeTab, setActiveTab] = useState<'home' | 'projects' | 'tasks' | 'todos'>('home');

  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isLoadingTodos, setIsLoadingTodos] = useState(false);

  // New Todo State
  const [isAddMode, setIsAddMode] = useState(false);
  const [newTodoDesc, setNewTodoDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const loggedUser = await checkAuth();
        if (loggedUser) setUser(loggedUser);
      } catch (err) {
        console.error("Auth check failed", err);
      } finally {
        setIsInitializing(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (user && activeTab === 'todos' && todos.length === 0) {
      fetchTodos();
    }
  }, [user, activeTab]);

  const fetchTodos = async () => {
    setIsLoadingTodos(true);
    try {
      const data = await getTodos();
      setTodos(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingTodos(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      await login(email, password);
      setUser(email);
    } catch (err: any) {
      setLoginError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setTodos([]);
  };

  const handleToggleStatus = async (item: TodoItem) => {
    const newStatus = item.status === 'Open' ? 'Closed' : 'Open';
    // Optimistic update
    setTodos(todos.map(t => t.name === item.name ? { ...t, status: newStatus } : t));
    try {
      await updateTodoStatus(item.name, newStatus);
    } catch (err) {
      // Revert if failed
      setTodos(todos.map(t => t.name === item.name ? { ...t, status: item.status } : t));
      console.error("Failed to update status", err);
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoDesc.trim()) return;
    setIsAdding(true);
    try {
      await createTodo(newTodoDesc);
      setNewTodoDesc('');
      setIsAddMode(false);
      fetchTodos();
    } catch (err) {
      console.error("Failed to add todo", err);
    } finally {
      setIsAdding(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent shadow-md" />
          <span className="mt-4 text-sm font-medium tracking-wide text-gray-500">Khởi động hệ thống...</span>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 px-4 font-sans sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-8 shadow-xl shadow-indigo-100/50"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-sm">
              <LayoutList size={32} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">ERPNext Tasks</h1>
            <p className="mt-2 text-sm text-gray-500">
              Mô phỏng trải nghiệm giao diện
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tài khoản</label>
              <input
                type="text"
                placeholder="Nhập email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Mật khẩu</label>
              <input
                type="password"
                placeholder="Nhập mật khẩu (khác 'error')"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                required
              />
            </div>

            <AnimatePresence>
              {loginError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    <AlertCircle size={16} />
                    <span>{loginError}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70 transition-all"
            >
              {isLoggingIn ? 'Đang vào...' : 'Đăng Nhập'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Render specific tab content
  const renderContent = () => {
    if (activeTab === 'home') {
      return (
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Xin chào, Kỹ sư! 👋</h1>
            <p className="mt-1 text-gray-600">Những gì bạn cần truy cập nhanh đều ở đây.</p>
          </div>

          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Tạo Nhanh (Form)</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Tạo Dự Án', icon: FolderKanban, color: 'text-blue-600', bg: 'bg-blue-50', border: 'hover:border-blue-300' },
                { label: 'Giao Việc (Task)', icon: ListTodo, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'hover:border-indigo-300' },
                { label: 'Tạo Todo', icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'hover:border-emerald-300' },
                { label: 'Viết Báo Cáo', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50', border: 'hover:border-purple-300' },
              ].map((shortcut, i) => (
                <button
                  key={i}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md",
                    shortcut.border
                  )}
                >
                  <div className={cn("rounded-full p-3", shortcut.bg, shortcut.color)}>
                    <shortcut.icon size={26} strokeWidth={2} />
                  </div>
                  <span className="text-sm font-medium text-gray-800">{shortcut.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">Lịch Trình Hôm Nay</h2>
            <div className="flex flex-col items-center justify-center py-6 text-gray-400">
              <Calendar size={48} className="mb-3 opacity-20" />
              <p className="text-sm">Không có cuộc họp nào trong ngày.</p>
            </div>
          </section>
        </div>
      );
    }

    if (activeTab === 'projects') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dự án</h1>
            <button className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100">
              <Plus size={16} /> Mới
            </button>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: 'Dự án Alpha', status: 'Đang triển khai', id: 'PRJ-24-001', progress: 65, color: 'bg-indigo-600' },
              { title: 'Tích hợp hệ thống ERP', status: 'Khởi tạo', id: 'PRJ-24-002', progress: 15, color: 'bg-blue-500' },
              { title: 'Bảo trì App Client', status: 'Hoàn thiện', id: 'PRJ-23-095', progress: 95, color: 'bg-emerald-500' },
            ].map(proj => (
              <div key={proj.id} className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase size={18} className="text-gray-400" />
                    <h3 className="font-semibold text-gray-900">{proj.title}</h3>
                  </div>
                  <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">{proj.id}</span>
                </div>
                <div className="mt-4 mb-1 flex items-center justify-between text-xs text-gray-500">
                  <span>{proj.status}</span>
                  <span>{proj.progress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className={cn("h-full rounded-full", proj.color)} style={{ width: `${proj.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'tasks') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Task Nhóm</h1>
            <button className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100">
              <Plus size={16} /> Giao việc
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            {[
              { task: 'Hoàn thiện API thanh toán', project: 'Dự án Alpha', assignee: 'Tuấn', due: 'Ngày mai', status: 'Đang làm' },
              { task: 'Cập nhật tài liệu UI', project: 'App Client', assignee: 'Hương', due: 'Thứ 6', status: 'Cần duyệt' },
              { task: 'Sửa lỗi màn hình Login', project: 'Hệ thống ERP', assignee: 'Bạn', due: 'Hôm nay', status: 'Đang làm' },
            ].map((t, i) => (
              <div key={i} className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-hover hover:border-indigo-300 hover:bg-indigo-50/10 hover:shadow-md">
                <div>
                  <h3 className="font-medium text-gray-900">{t.task}</h3>
                  <div className="mt-1 flex gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><FolderKanban size={12}/> {t.project}</span>
                    <span className="flex items-center gap-1"><Circle size={12}/> {t.assignee}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={cn(
                    "rounded px-2 py-0.5 text-xs font-medium",
                    t.status === 'Đang làm' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                  )}>{t.status}</span>
                  <span className="text-xs font-medium text-gray-400">{t.due}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'todos') {
      const openTodos = todos.filter(t => t.status === 'Open');
      const closedTodos = todos.filter(t => t.status === 'Closed');

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Todo Cá Nhân</h1>
              <p className="mt-1 text-sm text-gray-600">Quản lý những việc cần làm của riêng bạn.</p>
            </div>
          </div>

          {isLoadingTodos ? (
            <div className="flex flex-col items-center justify-center py-20 text-indigo-600">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent mb-4" />
              <p className="text-sm font-medium text-gray-500">Đang đồng bộ dữ liệu...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Open Todos */}
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-indigo-700">{openTodos.length}</span>
                  Đang diễn ra
                </h2>
                
                {openTodos.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center"
                  >
                    <div className="mb-3 rounded-full bg-green-100 p-3 text-green-600">
                      <CheckCircle2 size={32} />
                    </div>
                    <p className="text-sm font-medium text-gray-900">Không còn việc bị tồn đọng!</p>
                  </motion.div>
                ) : (
                  <motion.div layout className="flex flex-col gap-3">
                    <AnimatePresence>
                      {openTodos.map((item) => (
                        <motion.div 
                          layout
                          key={item.name} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="group relative flex cursor-pointer items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
                          onClick={() => handleToggleStatus(item)}
                        >
                          <button className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 border-gray-300 text-transparent transition-colors group-hover:border-indigo-500 focus:outline-none">
                            <CheckCircle2 size={16} strokeWidth={3} className="opacity-0 group-hover:opacity-20" />
                          </button>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-medium text-gray-900">{item.description}</h3>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-gray-500">
                              <span className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-gray-600">
                                <span>{item.name}</span>
                              </span>
                              {item.date && (
                                <span className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  {item.date}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </section>

              {/* Closed Todos */}
              {closedTodos.length > 0 && (
                <section>
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-green-100 text-green-700">{closedTodos.length}</span>
                    Hoàn tất gần đây
                  </h2>
                  <motion.div layout className="flex flex-col gap-3 opacity-60 transition-opacity hover:opacity-100">
                    <AnimatePresence>
                      {closedTodos.map((item) => (
                        <motion.div 
                          layout
                          key={item.name} 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="group flex cursor-pointer items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-all hover:bg-gray-50"
                          onClick={() => handleToggleStatus(item)}
                        >
                          <button className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 border-green-500 bg-green-500 text-white focus:outline-none">
                            <CheckCircle2 size={16} strokeWidth={3} />
                          </button>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-medium text-gray-500 line-through">{item.description}</h3>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </section>
              )}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-gray-50 font-sans">
      {/* App Bar */}
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md sm:px-6 lg:px-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-sm font-bold text-white shadow-sm">
            {user.charAt(0).toUpperCase()}
          </div>
          <span className="text-lg font-semibold tracking-tight text-gray-900">Workspace</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          title="Đăng xuất"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Main Content List */}
      <main className="flex-1 overflow-y-auto px-4 pb-28 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
           {renderContent()}
        </div>
      </main>

      {/* Floating Action Button (Only show on Todos temporarily for the mockup or everywhere if applicable) */}
      <AnimatePresence>
        {activeTab === 'todos' && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddMode(true)}
            className="fixed bottom-24 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 focus:outline-none sm:bottom-8 sm:right-8"
          >
            <Plus size={28} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-[72px] items-center justify-around border-t border-gray-200 bg-white px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sm:h-20 sm:justify-center sm:gap-12">
        <button 
          onClick={() => setActiveTab('home')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 w-20 py-2 transition-colors",
            activeTab === 'home' ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
          )}
        >
          <div className={cn("rounded-full p-1.5 transition-all", activeTab === 'home' ? "bg-indigo-50" : "")}>
             <HomeIcon size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          </div>
          <span className="text-[11px] font-semibold">Trang chủ</span>
        </button>
        <button 
          onClick={() => setActiveTab('projects')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 w-20 py-2 transition-colors",
            activeTab === 'projects' ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
          )}
        >
          <div className={cn("rounded-full p-1.5 transition-all", activeTab === 'projects' ? "bg-indigo-50" : "")}>
             <FolderKanban size={24} strokeWidth={activeTab === 'projects' ? 2.5 : 2} />
          </div>
          <span className="text-[11px] font-semibold">Dự án</span>
        </button>
        <button 
          onClick={() => setActiveTab('tasks')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 w-20 py-2 transition-colors",
            activeTab === 'tasks' ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
          )}
        >
          <div className={cn("rounded-full p-1.5 transition-all", activeTab === 'tasks' ? "bg-indigo-50" : "")}>
             <ListTodo size={24} strokeWidth={activeTab === 'tasks' ? 2.5 : 2} />
          </div>
          <span className="text-[11px] font-semibold">Task</span>
        </button>
        <button 
          onClick={() => setActiveTab('todos')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 w-20 py-2 transition-colors",
            activeTab === 'todos' ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
          )}
        >
          <div className={cn("rounded-full p-1.5 transition-all", activeTab === 'todos' ? "bg-indigo-50" : "")}>
             <CheckSquare size={24} strokeWidth={activeTab === 'todos' ? 2.5 : 2} />
          </div>
          <span className="text-[11px] font-semibold">Todo</span>
        </button>
      </nav>

      {/* Add Mode Overlay */}
      <AnimatePresence>
        {isAddMode && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => setIsAddMode(false)}
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] bg-white p-6 pb-8 shadow-2xl sm:left-auto sm:right-8 sm:bottom-8 sm:w-[400px] sm:rounded-[2rem]"
            >
              <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-gray-200 sm:hidden" />
              <h3 className="mb-4 text-xl font-bold text-gray-900">Tạo Todo mới</h3>
              <form onSubmit={handleAddTodo} className="flex flex-col gap-6">
                <div>
                  <textarea
                    autoFocus
                    placeholder="Bạn cần làm gì...?"
                    value={newTodoDesc}
                    onChange={(e) => setNewTodoDesc(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-xl border-none bg-gray-50 p-4 text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddMode(false)}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={!newTodoDesc.trim() || isAdding}
                    className="flex w-24 items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {isAdding ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Lưu lại'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
