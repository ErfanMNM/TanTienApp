export interface TodoItem {
  name: string;
  description: string;
  status: 'Open' | 'Closed';
  date: string;
  priority: string;
  allocated_to: string;
}

const mockTodos: TodoItem[] = [
  { name: 'TODO-001', description: 'Hoàn thiện giao diện FE', status: 'Open', date: '2026-04-23', priority: 'High', allocated_to: 'thuctrandona@gmail.com' },
  { name: 'TODO-002', description: 'Gửi báo cáo tuần cho ban giám đốc', status: 'Open', date: '2026-04-24', priority: 'Medium', allocated_to: 'thuctrandona@gmail.com' },
  { name: 'TODO-003', description: 'Đánh giá KPI nhân viên Q2', status: 'Closed', date: '2026-04-20', priority: 'High', allocated_to: 'thuctrandona@gmail.com' },
  { name: 'TODO-004', description: 'Họp lên kế hoạch marketing', status: 'Open', date: '2026-04-25', priority: 'Low', allocated_to: 'thuctrandona@gmail.com' },
  { name: 'TODO-005', description: 'Phê duyệt chi phí IT mới', status: 'Closed', date: '2026-04-21', priority: 'Highest', allocated_to: 'thuctrandona@gmail.com' },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const checkAuth = async () => {
  await delay(800);
  return null; // Start as guest
};

export const login = async (usr: string, pwd: string) => {
  await delay(1200);
  if (pwd === 'error') {
    throw new Error('Sai tài khoản hoặc mật khẩu.');
  }
  return { message: "Logged in" };
};

export const logout = async () => {
  await delay(500);
  return true;
};

export const getTodos = async () => {
  await delay(1500);
  return [...mockTodos];
};

export const createTodo = async (description: string) => {
  await delay(800);
  const newTodo: TodoItem = {
    name: `TODO-00${mockTodos.length + 1}`,
    description,
    status: 'Open',
    date: new Date().toISOString().split('T')[0],
    priority: 'Medium',
    allocated_to: 'thuctrandona@gmail.com'
  };
  mockTodos.unshift(newTodo);
  return newTodo;
};

export const updateTodoStatus = async (name: string, status: 'Open' | 'Closed') => {
  await delay(600);
  const todo = mockTodos.find(t => t.name === name);
  if (todo) {
    todo.status = status;
  }
  return todo;
};

