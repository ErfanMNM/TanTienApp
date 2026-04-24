import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  CheckSquare,
  Clock,
  FileText,
  Flag,
  FolderKanban,
  Home as HomeIcon,
  LayoutList,
  ListTodo,
  LogOut,
  MoreVertical,
  Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  checkAuth,
  createTodo,
  getDataSourceLabel,
  getProjectDetail,
  getProjects,
  getTaskDetail,
  getTasks,
  getTodos,
  login,
  logout,
  updateTodoStatus,
  type ProjectDetail,
  type ProjectItem,
  type TaskDetail,
  type TaskItem,
  type TodoItem,
} from './api/erpnext';
import { cn } from './lib/utils';

type TabKey = 'home' | 'projects' | 'tasks' | 'todos';
type DetailView = { type: 'project'; name: string } | { type: 'task'; name: string };

function formatDate(value: string) {
  if (!value) {
    return 'Chưa có';
  }

  const normalized = value.includes(' ') ? value.replace(' ', 'T') : value;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatProgress(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return new Intl.NumberFormat('vi-VN').format(value);
}

function normalizeDateKey(value: string) {
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
}

function getProjectStatusTone(status: string) {
  if (status === 'Completed') return 'bg-emerald-50 text-emerald-700';
  if (status === 'Cancelled') return 'bg-orange-50 text-orange-700';
  if (status === 'Open') return 'bg-blue-50 text-blue-700';
  return 'bg-gray-100 text-gray-700';
}

function getTaskStatusTone(status: string) {
  if (status === 'Completed') return 'bg-emerald-50 text-emerald-700';
  if (status === 'Open') return 'bg-blue-50 text-blue-700';
  if (status === 'Cancelled') return 'bg-orange-50 text-orange-700';
  return 'bg-gray-100 text-gray-700';
}

function getPriorityTone(priority: string) {
  if (priority === 'High' || priority === 'Highest') {
    return 'bg-orange-50 text-orange-700';
  }

  if (priority === 'Medium') {
    return 'bg-blue-50 text-blue-700';
  }

  return 'bg-gray-100 text-gray-600';
}

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [user, setUser] = useState<string | null>(null);

  const [email, setEmail] = useState('Administrator');
  const [password, setPassword] = useState('admin');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<TabKey>('home');

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);

  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingTodos, setIsLoadingTodos] = useState(false);

  const [projectError, setProjectError] = useState('');
  const [taskError, setTaskError] = useState('');
  const [todoError, setTodoError] = useState('');
  const [detailView, setDetailView] = useState<DetailView | null>(null);
  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null);
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');

  const [isAddMode, setIsAddMode] = useState(false);
  const [newTodoDesc, setNewTodoDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const loggedUser = await checkAuth();
        if (loggedUser) {
          setUser(loggedUser);
        }
      } catch (error) {
        console.error('Auth check failed', error);
      } finally {
        setIsInitializing(false);
      }
    }

    void init();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (activeTab === 'home' && todos.length === 0 && !isLoadingTodos) {
      void fetchTodos();
    }

    if (activeTab === 'projects' && projects.length === 0 && !isLoadingProjects) {
      void fetchProjects();
    }

    if (activeTab === 'tasks' && tasks.length === 0 && !isLoadingTasks) {
      void fetchTasks();
    }

    if (activeTab === 'todos' && todos.length === 0 && !isLoadingTodos) {
      void fetchTodos();
    }
  }, [activeTab, isLoadingProjects, isLoadingTasks, isLoadingTodos, projects.length, tasks.length, todos.length, user]);

  useEffect(() => {
    if (!user || !detailView) {
      return;
    }

    async function fetchDetail() {
      setIsLoadingDetail(true);
      setDetailError('');

      try {
        if (detailView.type === 'project') {
          setProjectDetail(await getProjectDetail(detailView.name));
          setTaskDetail(null);
          return;
        }

        setTaskDetail(await getTaskDetail(detailView.name));
        setProjectDetail(null);
      } catch (error) {
        console.error('Failed to fetch detail', error);
        setDetailError(error instanceof Error ? error.message : 'Không tải được dữ liệu chi tiết.');
      } finally {
        setIsLoadingDetail(false);
      }
    }

    void fetchDetail();
  }, [detailView, user]);

  async function fetchProjects() {
    setIsLoadingProjects(true);
    setProjectError('');

    try {
      setProjects(await getProjects());
    } catch (error) {
      console.error('Failed to fetch projects', error);
      setProjectError(error instanceof Error ? error.message : 'Không tải được danh sách dự án.');
    } finally {
      setIsLoadingProjects(false);
    }
  }

  async function fetchTasks() {
    setIsLoadingTasks(true);
    setTaskError('');

    try {
      setTasks(await getTasks());
    } catch (error) {
      console.error('Failed to fetch tasks', error);
      setTaskError(error instanceof Error ? error.message : 'Không tải được danh sách task.');
    } finally {
      setIsLoadingTasks(false);
    }
  }

  async function fetchTodos() {
    setIsLoadingTodos(true);
    setTodoError('');

    try {
      setTodos(await getTodos());
    } catch (error) {
      console.error('Failed to fetch todos', error);
      setTodoError(error instanceof Error ? error.message : 'Không tải được danh sách todo.');
    } finally {
      setIsLoadingTodos(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const result = await login(email, password);
      setUser(result.user || email);
      setProjects([]);
      setTasks([]);
      setTodos([]);
      closeDetail();
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.',
      );
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } finally {
      setUser(null);
      setProjects([]);
      setTasks([]);
      setTodos([]);
      setProjectError('');
      setTaskError('');
      setTodoError('');
      setActiveTab('home');
      setIsAddMode(false);
      closeDetail();
    }
  }

  function openProjectDetail(name: string) {
    setDetailView({ type: 'project', name });
    setProjectDetail(null);
    setTaskDetail(null);
    setDetailError('');
  }

  function openTaskDetail(name: string) {
    setDetailView({ type: 'task', name });
    setProjectDetail(null);
    setTaskDetail(null);
    setDetailError('');
  }

  function closeDetail() {
    setDetailView(null);
    setProjectDetail(null);
    setTaskDetail(null);
    setDetailError('');
    setIsLoadingDetail(false);
  }

  async function handleToggleStatus(item: TodoItem) {
    const nextStatus = item.status === 'Open' ? 'Closed' : 'Open';

    setTodos((current) =>
      current.map((todo) => (todo.name === item.name ? { ...todo, status: nextStatus } : todo)),
    );

    try {
      await updateTodoStatus(item.name, nextStatus);
    } catch (error) {
      setTodos((current) =>
        current.map((todo) => (todo.name === item.name ? { ...todo, status: item.status } : todo)),
      );
      setTodoError(error instanceof Error ? error.message : 'Không cập nhật được trạng thái todo.');
    }
  }

  async function handleAddTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newTodoDesc.trim()) {
      return;
    }

    setIsAdding(true);

    try {
      await createTodo(newTodoDesc.trim());
      setNewTodoDesc('');
      setIsAddMode(false);
      await fetchTodos();
    } catch (error) {
      setTodoError(error instanceof Error ? error.message : 'Không tạo được todo mới.');
    } finally {
      setIsAdding(false);
    }
  }

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-8 shadow-xl shadow-indigo-100/50"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-sm">
              <LayoutList size={32} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">ERPNext Workspace</h1>
            <p className="mt-2 text-sm text-gray-500">
              Đăng nhập để đồng bộ dữ liệu Project, Task và ToDo từ ERPNext.
            </p>
            <div className="mt-3 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              Nguồn dữ liệu: {getDataSourceLabel()}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-gray-700">
                Tài khoản
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Nhập tài khoản"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
              className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70"
            >
              {isLoggingIn ? 'Đang vào...' : 'Đăng nhập'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  function renderHome() {
    const todayKey = new Date().toISOString().slice(0, 10);
    const openTasks = tasks.filter((item) => item.status !== 'Completed').length;
    const openTodos = todos.filter((item) => item.status === 'Open').length;
    const openAssignedTodos = todos
      .filter((item) => item.status === 'Open')
      .sort((a, b) => normalizeDateKey(a.date).localeCompare(normalizeDateKey(b.date)));
    const overdueTodos = openAssignedTodos.filter((item) => {
      const dateKey = normalizeDateKey(item.date);
      return dateKey && dateKey < todayKey;
    });
    const todayTodos = openAssignedTodos.filter((item) => normalizeDateKey(item.date) === todayKey);
    const upcomingTodos = openAssignedTodos.filter((item) => {
      const dateKey = normalizeDateKey(item.date);
      return dateKey && dateKey > todayKey;
    });

    const todoSections = [
      {
        key: 'today',
        title: 'Hôm nay',
        description: 'Các todo đến hạn trong ngày hôm nay.',
        empty: 'Không có todo đến hạn hôm nay.',
        badgeTone: 'bg-indigo-100 text-indigo-700',
        items: todayTodos,
      },
      {
        key: 'overdue',
        title: 'Quá hạn',
        description: 'Những việc cần xử lý gấp vì đã quá hạn.',
        empty: 'Không có todo quá hạn.',
        badgeTone: 'bg-red-100 text-red-700',
        items: overdueTodos,
      },
      {
        key: 'upcoming',
        title: 'Sắp tới',
        description: 'Các todo đang mở có hạn sau hôm nay.',
        empty: 'Không có todo sắp tới.',
        badgeTone: 'bg-emerald-100 text-emerald-700',
        items: upcomingTodos.slice(0, 5),
      },
    ];

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Xin chào, {user}!</h1>
          <p className="mt-1 text-gray-600">Dữ liệu đang được đồng bộ từ ERPNext gốc.</p>
        </div>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Dự án', value: projects.length, icon: FolderKanban, tone: 'bg-blue-50 text-blue-700' },
            { label: 'Task đang mở', value: openTasks, icon: ListTodo, tone: 'bg-indigo-50 text-indigo-700' },
            { label: 'Todo đang mở', value: openTodos, icon: CheckSquare, tone: 'bg-emerald-50 text-emerald-700' },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className={cn('mb-4 inline-flex rounded-full p-3', card.tone)}>
                <card.icon size={22} />
              </div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">{card.value}</p>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Điều phối công việc</h2>
              <p className="mt-1 text-sm text-gray-500">
                Tổng hợp todo được giao cho bạn theo mức độ ưu tiên thời gian.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void fetchTodos()}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Làm mới
            </button>
          </div>

          {isLoadingTodos ? (
            <div className="rounded-2xl border border-gray-200 bg-white py-12 text-center text-sm text-gray-500 shadow-sm">
              Đang tải danh sách công việc...
            </div>
          ) : openAssignedTodos.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-12 text-center text-sm text-gray-500">
              Hiện chưa có todo nào được giao cho bạn.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-3">
              {todoSections.map((section) => (
                <div key={section.key} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">{section.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{section.description}</p>
                    </div>
                    <span className={cn('inline-flex min-w-8 justify-center rounded-full px-2.5 py-1 text-xs font-bold', section.badgeTone)}>
                      {section.items.length}
                    </span>
                  </div>

                  {section.items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-400">
                      {section.empty}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {section.items.map((item) => (
                        <div
                          key={item.name}
                          className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 transition-colors hover:bg-indigo-50/40"
                        >
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                              <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                            </div>
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold',
                                getPriorityTone(item.priority),
                              )}
                            >
                              <Flag size={12} />
                              {item.priority || 'Medium'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <span>Hạn: {formatDate(item.date)}</span>
                            <span>
                              {item.reference_type && item.reference_name
                                ? `${item.reference_type}: ${item.reference_name}`
                                : 'Không có tham chiếu'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">Tạo nhanh</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Mở dự án', icon: FolderKanban },
              { label: 'Mở task', icon: ListTodo },
              { label: 'Mở todo', icon: CheckSquare },
              { label: 'Báo cáo', icon: FileText },
            ].map((item) => (
              <button
                key={item.label}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
              >
                <div className="rounded-full bg-indigo-50 p-3 text-indigo-600">
                  <item.icon size={24} />
                </div>
                <span className="text-sm font-medium text-gray-800">{item.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  function renderDetailField(label: string, value: string | number | null | undefined) {
    const displayValue = value === null || value === undefined || value === '' ? '-' : value;

    return (
      <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="mt-1 text-sm font-semibold text-gray-800">{displayValue}</p>
      </div>
    );
  }

  function renderDetailShell(title: string, subtitle: string, children: ReactNode) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={closeDetail}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách
        </button>

        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">{subtitle}</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-blue-100">
              Dữ liệu chi tiết được tải bằng cùng API form của ERPNext gốc.
            </p>
          </div>

          <div className="p-5 sm:p-6">
            {isLoadingDetail ? (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <div className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                Đang tải chi tiết...
              </div>
            ) : detailError ? (
              <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle size={16} />
                <span>{detailError}</span>
              </div>
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderProjectDetail() {
    const detail = projectDetail;
    const progress = formatProgress(detail?.percent_complete ?? 0);
    const relatedTodos = todos.filter(
      (todo) => todo.reference_type === 'Project' && todo.reference_name === detailView?.name,
    );

    return renderDetailShell(detail?.project_name || detailView?.name || 'Project', 'Project detail', (
      detail && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-bold', getProjectStatusTone(detail.status))}>
              {detail.status || 'Unknown'}
            </span>
            <span className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold', getPriorityTone(detail.priority))}>
              <Flag size={13} />
              {detail.priority || 'Medium'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
              <Building2 size={13} />
              {detail.customer || detail.company || 'Không có khách hàng'}
            </span>
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Tổng quan</h2>
              <span className="text-xs font-semibold text-gray-500">{progress}% hoàn thành</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-indigo-600" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {renderDetailField('Mã dự án', detail.name)}
              {renderDetailField('Loại dự án', detail.project_type)}
              {renderDetailField('Phương thức tiến độ', detail.percent_complete_method)}
              {renderDetailField('Ngày bắt đầu', formatDate(detail.expected_start_date))}
              {renderDetailField('Deadline', formatDate(detail.expected_end_date))}
              {renderDetailField('Đang hoạt động', detail.is_active)}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                <Building2 size={16} />
                Thông tin liên quan
              </h2>
              <div className="space-y-3">
                {renderDetailField('Khách hàng', detail.customer)}
                {renderDetailField('Công ty', detail.company)}
                {renderDetailField('Phòng ban', detail.department)}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                <FileText size={16} />
                Chi phí
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {renderDetailField('Dự toán', formatNumber(detail.estimated_costing))}
                {renderDetailField('Costing', formatNumber(detail.total_costing_amount))}
                {renderDetailField('Purchase', formatNumber(detail.total_purchase_cost))}
                {renderDetailField('Sales', formatNumber(detail.total_sales_amount))}
                {renderDetailField('Billable', formatNumber(detail.total_billable_amount))}
                {renderDetailField('Billed', formatNumber(detail.total_billed_amount))}
              </div>
            </div>
          </section>

          {detail.notes && (
            <section className="rounded-2xl border border-gray-200 p-5">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-500">Ghi chú</h2>
              <p className="text-sm leading-6 text-gray-700">{detail.notes}</p>
            </section>
          )}

          <section className="rounded-2xl border border-gray-200 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
              <CheckSquare size={16} />
              ToDo liên quan
            </h2>
            {relatedTodos.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa thấy ToDo nào đang tham chiếu project này.</p>
            ) : (
              <div className="space-y-3">
                {relatedTodos.map((todo) => (
                  <div key={todo.name} className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-900">{todo.description}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {todo.name} · Hạn {formatDate(todo.date)} · {todo.status}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            {renderDetailField('Người tạo', detail.owner)}
            {renderDetailField('Tạo lúc', formatDate(detail.creation))}
            {renderDetailField('Cập nhật', formatDate(detail.modified))}
          </section>
        </div>
      )
    ));
  }

  function renderTaskDetail() {
    const detail = taskDetail;
    const progress = formatProgress(detail?.progress ?? 0);
    const relatedTodos = todos.filter(
      (todo) => todo.reference_type === 'Task' && todo.reference_name === detailView?.name,
    );

    return renderDetailShell(detail?.subject || detailView?.name || 'Task', 'Task detail', (
      detail && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-bold', getTaskStatusTone(detail.status))}>
              {detail.status || 'Unknown'}
            </span>
            <span className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold', getPriorityTone(detail.priority))}>
              <Flag size={13} />
              {detail.priority || 'Medium'}
            </span>
            {detail.project && (
              <button
                type="button"
                onClick={() => openProjectDetail(detail.project)}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
              >
                <Briefcase size={13} />
                {detail.project}
              </button>
            )}
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Tiến độ</h2>
              <span className="text-xs font-semibold text-gray-500">{progress}% hoàn thành</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-indigo-600" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {renderDetailField('Mã task', detail.name)}
              {renderDetailField('Project', detail.project || 'Không gắn project')}
              {renderDetailField('Bắt đầu', formatDate(detail.exp_start_date))}
              {renderDetailField('Deadline', formatDate(detail.exp_end_date))}
              {renderDetailField('Expected time', `${formatNumber(detail.expected_time)} giờ`)}
              {renderDetailField('Actual time', `${formatNumber(detail.actual_time)} giờ`)}
              {renderDetailField('Milestone', detail.is_milestone ? 'Có' : 'Không')}
              {renderDetailField('Group task', detail.is_group ? 'Có' : 'Không')}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                <FileText size={16} />
                Mô tả
              </h2>
              <p className="text-sm leading-6 text-gray-700">{detail.description || 'Task này chưa có mô tả.'}</p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                <Clock size={16} />
                Hoàn thành
              </h2>
              <div className="space-y-3">
                {renderDetailField('Người hoàn thành', detail.completed_by)}
                {renderDetailField('Ngày hoàn thành', formatDate(detail.completed_on))}
                {renderDetailField('Công ty', detail.company)}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
              <ListTodo size={16} />
              Phụ thuộc và ToDo
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Task phụ thuộc</p>
                {detail.depends_on.length === 0 ? (
                  <p className="text-sm text-gray-500">Không có task phụ thuộc.</p>
                ) : (
                  <div className="space-y-2">
                    {detail.depends_on.map((dependency, index) => (
                      <div key={dependency.name || dependency.task || index} className="rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                        {dependency.task || dependency.subject || dependency.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">ToDo liên quan</p>
                {relatedTodos.length === 0 ? (
                  <p className="text-sm text-gray-500">Chưa thấy ToDo nào đang tham chiếu task này.</p>
                ) : (
                  <div className="space-y-2">
                    {relatedTodos.map((todo) => (
                      <div key={todo.name} className="rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                        <p className="font-semibold text-gray-900">{todo.description}</p>
                        <p className="mt-1 text-xs text-gray-500">{todo.name} · Hạn {formatDate(todo.date)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            {renderDetailField('Người tạo', detail.owner)}
            {renderDetailField('Tạo lúc', formatDate(detail.creation))}
            {renderDetailField('Cập nhật', formatDate(detail.modified))}
          </section>
        </div>
      )
    ));
  }

  function renderProjects() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Project</h1>
          <button
            type="button"
            onClick={() => void fetchProjects()}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Làm mới
          </button>
        </div>

        {projectError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} />
            <span>{projectError}</span>
          </div>
        )}

        {isLoadingProjects ? (
          <div className="flex items-center justify-center py-20 text-gray-500">Đang tải dự án...</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="border-b border-gray-200 bg-gray-50/80 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-4">Mã dự án</th>
                  <th className="px-5 py-4">Tên dự án</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4">Tiến độ</th>
                  <th className="px-5 py-4">Deadline</th>
                  <th className="px-5 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map((project) => {
                  const progress = formatProgress(project.percent_complete);
                  return (
                    <tr
                      key={project.name}
                      className="cursor-pointer transition-colors hover:bg-indigo-50/30"
                      onClick={() => openProjectDetail(project.name)}
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-500">{project.name}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 font-medium text-gray-900">
                          <Briefcase size={16} className="text-gray-400" />
                          {project.project_name}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', getProjectStatusTone(project.status))}>
                          {project.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-full max-w-[120px] overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-xs font-semibold tabular-nums text-gray-700">{progress}%</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-gray-500">{formatDate(project.expected_end_date)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
                          aria-label={`Xem chi tiết ${project.name}`}
                        >
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  function renderTasks() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Task</h1>
          <button
            type="button"
            onClick={() => void fetchTasks()}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Làm mới
          </button>
        </div>

        {taskError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} />
            <span>{taskError}</span>
          </div>
        )}

        {isLoadingTasks ? (
          <div className="flex items-center justify-center py-20 text-gray-500">Đang tải task...</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="border-b border-gray-200 bg-gray-50/80 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-4">Mã task</th>
                  <th className="px-5 py-4">Nội dung</th>
                  <th className="px-5 py-4">Project</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4">Ưu tiên</th>
                  <th className="px-5 py-4">Hạn chót</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.map((task) => (
                  <tr
                    key={task.name}
                    className="cursor-pointer transition-colors hover:bg-indigo-50/30"
                    onClick={() => openTaskDetail(task.name)}
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-500">{task.name}</td>
                    <td className="px-5 py-4 font-medium text-gray-900">{task.subject}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-gray-500">{task.project || 'Không gắn project'}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', getTaskStatusTone(task.status))}>
                        {task.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className={cn('inline-flex rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wide', getPriorityTone(task.priority))}>
                        {task.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-gray-500">{formatDate(task.exp_end_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  function renderTodos() {
    const openTodos = todos.filter((todo) => todo.status === 'Open');
    const closedTodos = todos.filter((todo) => todo.status === 'Closed');

    return (
      <div className="space-y-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">ToDo</h1>
            <p className="mt-1 text-sm text-gray-600">Đồng bộ theo dữ liệu đang hiện có trên ERPNext.</p>
          </div>
          <button
            type="button"
            onClick={() => void fetchTodos()}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Làm mới
          </button>
        </div>

        {todoError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} />
            <span>{todoError}</span>
          </div>
        )}

        {isLoadingTodos ? (
          <div className="flex flex-col items-center justify-center py-20 text-indigo-600">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent" />
            <p className="text-sm font-medium text-gray-500">Đang đồng bộ dữ liệu...</p>
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-indigo-700">
                  {openTodos.length}
                </span>
                Đang thực hiện
              </h2>

              {openTodos.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center"
                >
                  <div className="mb-3 rounded-full bg-green-100 p-3 text-green-600">
                    <CheckCircle2 size={32} />
                  </div>
                  <p className="text-sm font-medium text-gray-900">Không còn việc tồn đọng.</p>
                </motion.div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="border-b border-gray-200 bg-gray-50/80 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="w-12 px-5 py-4 text-center"></th>
                        <th className="px-5 py-4">Mã todo</th>
                        <th className="px-5 py-4">Nội dung</th>
                        <th className="px-5 py-4">Reference</th>
                        <th className="px-5 py-4">Hạn chót</th>
                        <th className="px-5 py-4">Ưu tiên</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <AnimatePresence>
                        {openTodos.map((item) => (
                          <motion.tr
                            layout
                            key={item.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="group cursor-pointer transition-colors hover:bg-indigo-50/30"
                            onClick={() => void handleToggleStatus(item)}
                          >
                            <td className="px-5 py-4 text-center">
                              <button className="mx-auto flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 border-gray-300 text-transparent transition-colors focus:outline-none group-hover:border-indigo-500">
                                <CheckCircle2 size={16} strokeWidth={3} className="opacity-0 group-hover:opacity-20" />
                              </button>
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-900">{item.name}</td>
                            <td className="px-5 py-4 text-gray-700">{item.description}</td>
                            <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                              {item.reference_type && item.reference_name
                                ? `${item.reference_type}: ${item.reference_name}`
                                : '-'}
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-gray-500">{formatDate(item.date)}</td>
                            <td className="whitespace-nowrap px-5 py-4">
                              <span className={cn('inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold', getPriorityTone(item.priority))}>
                                <Flag size={12} />
                                {item.priority || 'Medium'}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {closedTodos.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-green-100 text-green-700">
                    {closedTodos.length}
                  </span>
                  Hoàn tất gần đây
                </h2>
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white opacity-70 shadow-sm transition-opacity hover:opacity-100">
                  <table className="w-full text-left text-sm text-gray-500">
                    <thead className="border-b border-gray-200 bg-gray-50/80 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <tr>
                        <th className="w-12 px-5 py-4 text-center"></th>
                        <th className="px-5 py-4">Mã todo</th>
                        <th className="px-5 py-4">Nội dung</th>
                        <th className="px-5 py-4">Ngày hoàn thành</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <AnimatePresence>
                        {closedTodos.map((item) => (
                          <motion.tr
                            layout
                            key={item.name}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="group cursor-pointer transition-colors hover:bg-gray-50"
                            onClick={() => void handleToggleStatus(item)}
                          >
                            <td className="px-5 py-4 text-center">
                              <button className="mx-auto flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 border-green-500 bg-green-500 text-white focus:outline-none">
                                <CheckCircle2 size={16} strokeWidth={3} />
                              </button>
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 font-medium line-through">{item.name}</td>
                            <td className="px-5 py-4 line-through">{item.description}</td>
                            <td className="whitespace-nowrap px-5 py-4">{formatDate(item.date)}</td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderContent() {
    if (detailView?.type === 'project') return renderProjectDetail();
    if (detailView?.type === 'task') return renderTaskDetail();
    if (activeTab === 'home') return renderHome();
    if (activeTab === 'projects') return renderProjects();
    if (activeTab === 'tasks') return renderTasks();
    return renderTodos();
  }

  return (
    <div className="flex h-screen w-full flex-col bg-gray-50">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white/80 px-4 shadow-sm backdrop-blur-md sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-sm font-bold text-white shadow-sm">
            {user.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="block text-lg font-semibold tracking-tight text-gray-900">Workspace</span>
            <span className="block text-xs text-gray-500">{getDataSourceLabel()}</span>
          </div>
        </div>

        <button
          onClick={() => void handleLogout()}
          className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title="Đăng xuất"
        >
          <LogOut size={18} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-28 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">{renderContent()}</div>
      </main>

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

      <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-[72px] items-center justify-around border-t border-gray-200 bg-white px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sm:h-20 sm:justify-center sm:gap-12">
        {[
          { key: 'home', label: 'Trang chủ', icon: HomeIcon },
          { key: 'projects', label: 'Project', icon: FolderKanban },
          { key: 'tasks', label: 'Task', icon: ListTodo },
          { key: 'todos', label: 'ToDo', icon: CheckSquare },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => {
              closeDetail();
              setActiveTab(item.key as TabKey);
            }}
            className={cn(
              'flex w-20 flex-col items-center justify-center gap-1 py-2 transition-colors',
              activeTab === item.key ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600',
            )}
          >
            <div className={cn('rounded-full p-1.5 transition-all', activeTab === item.key && 'bg-indigo-50')}>
              <item.icon size={24} strokeWidth={activeTab === item.key ? 2.5 : 2} />
            </div>
            <span className="text-[11px] font-semibold">{item.label}</span>
          </button>
        ))}
      </nav>

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
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] bg-white p-6 pb-8 shadow-2xl sm:bottom-8 sm:left-auto sm:right-8 sm:w-[400px] sm:rounded-[2rem]"
            >
              <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-gray-200 sm:hidden" />
              <h3 className="mb-4 text-xl font-bold text-gray-900">Tạo todo mới</h3>
              <form onSubmit={handleAddTodo} className="flex flex-col gap-6">
                <div>
                  <textarea
                    autoFocus
                    placeholder="Bạn cần làm gì?"
                    value={newTodoDesc}
                    onChange={(event) => setNewTodoDesc(event.target.value)}
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
                    {isAdding ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      'Lưu lại'
                    )}
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
