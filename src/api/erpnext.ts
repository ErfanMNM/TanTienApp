export interface TodoItem {
  name: string;
  description: string;
  status: 'Open' | 'Closed';
  date: string;
  priority: string;
  allocated_to: string;
  reference_type: string;
  reference_name: string;
}

export interface ProjectItem {
  name: string;
  project_name: string;
  status: string;
  percent_complete: number;
  expected_start_date: string;
  expected_end_date: string;
}

export interface ProjectDetail extends ProjectItem {
  project_type: string;
  priority: string;
  is_active: string;
  percent_complete_method: string;
  customer: string;
  company: string;
  department: string;
  actual_start_date: string;
  actual_end_date: string;
  estimated_costing: number;
  total_costing_amount: number;
  total_purchase_cost: number;
  total_sales_amount: number;
  total_billable_amount: number;
  total_billed_amount: number;
  notes: string;
  owner: string;
  creation: string;
  modified: string;
}

export interface TaskItem {
  name: string;
  subject: string;
  project: string;
  status: string;
  exp_start_date: string;
  exp_end_date: string;
  priority: string;
}

export interface TaskDetail extends TaskItem {
  description: string;
  type: string;
  is_group: number;
  is_milestone: number;
  progress: number;
  duration: number;
  expected_time: number;
  actual_time: number;
  completed_by: string;
  completed_on: string;
  company: string;
  depends_on: Array<{ task?: string; subject?: string; project?: string; name?: string }>;
  owner: string;
  creation: string;
  modified: string;
}

interface LoginResponse {
  user: string;
  fullName?: string;
  homePage?: string;
}

interface FrappeMessageResponse<T> {
  message: T;
}

interface FrappeResourceResponse<T> {
  data: T;
}

interface FrappeFormLoadResponse {
  docs: Record<string, unknown>[];
}

const dataSource = import.meta.env.VITE_DATA_SOURCE === 'mock' ? 'mock' : 'erpnext';
let csrfToken: string | null = null;

const mockProjects: ProjectItem[] = [
  {
    name: 'PROJ-0003',
    project_name: 'Ngoại quan line nước mắm 4.8L',
    status: 'Open',
    percent_complete: 0,
    expected_start_date: '2026-04-14',
    expected_end_date: '2026-05-31',
  },
  {
    name: 'PROJ-0004',
    project_name: 'QR Code Line Thủy Tinh',
    status: 'Open',
    percent_complete: 0,
    expected_start_date: '2026-04-21',
    expected_end_date: '2026-05-21',
  },
];

const mockTasks: TaskItem[] = [
  {
    name: 'TASK-2026-00114',
    subject: 'Thử lửa',
    project: 'PROJ-0003',
    status: 'Open',
    exp_start_date: '2026-04-24 23:23:25',
    exp_end_date: '2026-04-29 23:23:25',
    priority: 'High',
  },
  {
    name: 'TASK-2026-00113',
    subject: 'Thử app',
    project: '',
    status: 'Open',
    exp_start_date: '',
    exp_end_date: '',
    priority: 'Low',
  },
];

const mockTodos: TodoItem[] = [
  {
    name: 'lv58ta20t9',
    description: 'Ngoại quan line nước mắm 4.8L = Code đi = Đây là lệnh Test',
    status: 'Open',
    date: '2026-04-26',
    priority: 'High',
    allocated_to: 'isbmt999@gmail.com',
    reference_type: 'Project',
    reference_name: 'PROJ-0003',
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function stripHtml(html: unknown) {
  return String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTodo(item: Record<string, unknown>): TodoItem {
  return {
    name: String(item.name ?? ''),
    description: stripHtml(item.description),
    status: item.status === 'Closed' ? 'Closed' : 'Open',
    date: typeof item.date === 'string' ? item.date : '',
    priority: typeof item.priority === 'string' ? item.priority : 'Medium',
    allocated_to: typeof item.allocated_to === 'string' ? item.allocated_to : '',
    reference_type: typeof item.reference_type === 'string' ? item.reference_type : '',
    reference_name: typeof item.reference_name === 'string' ? item.reference_name : '',
  };
}

function normalizeProject(item: Record<string, unknown>): ProjectItem {
  return {
    name: String(item.name ?? ''),
    project_name: String(item.project_name ?? item.name ?? ''),
    status: String(item.status ?? ''),
    percent_complete: Number(item.percent_complete ?? 0),
    expected_start_date: typeof item.expected_start_date === 'string' ? item.expected_start_date : '',
    expected_end_date: typeof item.expected_end_date === 'string' ? item.expected_end_date : '',
  };
}

function normalizeProjectDetail(item: Record<string, unknown>): ProjectDetail {
  return {
    ...normalizeProject(item),
    project_type: typeof item.project_type === 'string' ? item.project_type : '',
    priority: typeof item.priority === 'string' ? item.priority : 'Medium',
    is_active: typeof item.is_active === 'string' ? item.is_active : '',
    percent_complete_method:
      typeof item.percent_complete_method === 'string' ? item.percent_complete_method : '',
    customer: typeof item.customer === 'string' ? item.customer : '',
    company: typeof item.company === 'string' ? item.company : '',
    department: typeof item.department === 'string' ? item.department : '',
    actual_start_date: typeof item.actual_start_date === 'string' ? item.actual_start_date : '',
    actual_end_date: typeof item.actual_end_date === 'string' ? item.actual_end_date : '',
    estimated_costing: Number(item.estimated_costing ?? 0),
    total_costing_amount: Number(item.total_costing_amount ?? 0),
    total_purchase_cost: Number(item.total_purchase_cost ?? 0),
    total_sales_amount: Number(item.total_sales_amount ?? 0),
    total_billable_amount: Number(item.total_billable_amount ?? 0),
    total_billed_amount: Number(item.total_billed_amount ?? 0),
    notes: stripHtml(item.notes),
    owner: typeof item.owner === 'string' ? item.owner : '',
    creation: typeof item.creation === 'string' ? item.creation : '',
    modified: typeof item.modified === 'string' ? item.modified : '',
  };
}

function normalizeTask(item: Record<string, unknown>): TaskItem {
  return {
    name: String(item.name ?? ''),
    subject: String(item.subject ?? ''),
    project: typeof item.project === 'string' ? item.project : '',
    status: String(item.status ?? ''),
    exp_start_date: typeof item.exp_start_date === 'string' ? item.exp_start_date : '',
    exp_end_date: typeof item.exp_end_date === 'string' ? item.exp_end_date : '',
    priority: typeof item.priority === 'string' ? item.priority : 'Medium',
  };
}

function normalizeTaskDetail(item: Record<string, unknown>): TaskDetail {
  const dependsOn = Array.isArray(item.depends_on) ? item.depends_on : [];

  return {
    ...normalizeTask(item),
    description: stripHtml(item.description),
    type: typeof item.type === 'string' ? item.type : '',
    is_group: Number(item.is_group ?? 0),
    is_milestone: Number(item.is_milestone ?? 0),
    progress: Number(item.progress ?? 0),
    duration: Number(item.duration ?? 0),
    expected_time: Number(item.expected_time ?? 0),
    actual_time: Number(item.actual_time ?? 0),
    completed_by: typeof item.completed_by === 'string' ? item.completed_by : '',
    completed_on: typeof item.completed_on === 'string' ? item.completed_on : '',
    company: typeof item.company === 'string' ? item.company : '',
    depends_on: dependsOn.filter(
      (dependency): dependency is TaskDetail['depends_on'][number] =>
        Boolean(dependency) && typeof dependency === 'object',
    ),
    owner: typeof item.owner === 'string' ? item.owner : '',
    creation: typeof item.creation === 'string' ? item.creation : '',
    modified: typeof item.modified === 'string' ? item.modified : '',
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (typeof payload === 'string' && payload.trim()) {
      throw new Error(payload.trim());
    }

    if (payload && typeof payload === 'object') {
      const message =
        (payload as Record<string, unknown>).message ||
        (payload as Record<string, unknown>).error ||
        (payload as Record<string, unknown>).exc;

      if (typeof message === 'string' && message.trim()) {
        throw new Error(message.trim());
      }
    }

    throw new Error(`Request failed with status ${response.status}`);
  }

  return payload as T;
}

async function getCsrfToken() {
  if (csrfToken) {
    return csrfToken;
  }

  const response = await fetch('/api/csrf_token', {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });

  const payload = await parseResponse<{ csrf_token: string }>(response);
  csrfToken = payload.csrf_token;
  return csrfToken;
}

async function request<T>(path: string, init: RequestInit = {}, needsCsrf = false): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (needsCsrf) {
    headers.set('X-Frappe-CSRF-Token', await getCsrfToken());
  }

  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers,
  });

  return parseResponse<T>(response);
}

function buildListPath(doctype: string, fields: string[], limit = 50) {
  const params = new URLSearchParams({
    fields: JSON.stringify(fields),
    order_by: 'modified desc',
    limit_page_length: String(limit),
  });

  return `/api/resource/${encodeURIComponent(doctype)}?${params.toString()}`;
}

function buildTodoListPath(filters?: unknown[]) {
  const params = new URLSearchParams({
    fields: JSON.stringify([
      'name',
      'description',
      'status',
      'date',
      'priority',
      'allocated_to',
      'reference_type',
      'reference_name',
    ]),
    order_by: 'modified desc',
    limit_page_length: '50',
  });

  if (filters) {
    params.set('filters', JSON.stringify(filters));
  }

  return `/api/resource/ToDo?${params.toString()}`;
}

function buildFormLoadPath(doctype: 'Project' | 'Task', name: string) {
  const params = new URLSearchParams({
    doctype,
    name,
  });

  return `/api/method/frappe.desk.form.load.getdoc?${params.toString()}`;
}

function findLoadedDoc(response: FrappeFormLoadResponse, doctype: 'Project' | 'Task', name: string) {
  const doc =
    response.docs.find((item) => item.doctype === doctype && item.name === name) ||
    response.docs.find((item) => item.doctype === doctype) ||
    response.docs[0];

  if (!doc) {
    throw new Error(`Không tìm thấy ${doctype} ${name}.`);
  }

  return doc;
}

export function getDataSourceLabel() {
  return dataSource === 'erpnext' ? 'ERPNext thật' : 'Mock data';
}

export async function checkAuth() {
  if (dataSource === 'mock') {
    await delay(300);
    return null;
  }

  try {
    const response = await request<FrappeMessageResponse<string>>(
      '/api/method/frappe.auth.get_logged_user',
    );
    return response.message || null;
  } catch {
    return null;
  }
}

export async function login(usr: string, pwd: string): Promise<LoginResponse> {
  if (dataSource === 'mock') {
    await delay(400);

    if (pwd === 'error') {
      throw new Error('Sai tài khoản hoặc mật khẩu.');
    }

    return {
      user: usr,
      fullName: usr,
    };
  }

  const response = await request<{
    full_name?: string;
    home_page?: string;
  }>('/api/method/login', {
    method: 'POST',
    body: JSON.stringify({ usr, pwd }),
  });

  csrfToken = null;

  return {
    user: usr,
    fullName: response.full_name,
    homePage: response.home_page,
  };
}

export async function logout() {
  if (dataSource === 'mock') {
    await delay(200);
    return true;
  }

  await request<Record<string, never>>('/api/method/logout');
  csrfToken = null;
  return true;
}

export async function getProjects() {
  if (dataSource === 'mock') {
    await delay(300);
    return [...mockProjects];
  }

  const response = await request<FrappeResourceResponse<Record<string, unknown>[]>>(
    buildListPath('Project', [
      'name',
      'project_name',
      'status',
      'percent_complete',
      'expected_start_date',
      'expected_end_date',
    ]),
  );

  return response.data.map(normalizeProject);
}

export async function getProjectDetail(name: string) {
  if (dataSource === 'mock') {
    await delay(250);
    const project = mockProjects.find((item) => item.name === name);

    if (!project) {
      throw new Error(`Không tìm thấy Project ${name}.`);
    }

    return normalizeProjectDetail({
      ...project,
      project_type: 'Dự án Camera',
      priority: 'Medium',
      is_active: 'Yes',
      percent_complete_method: 'Task Completion',
      customer: 'Masan Bình Dương',
      company: 'Công Ty TNHH TMDV Sản Xuất Kỹ Thuật Cao Tân Tiến',
      owner: 'Administrator',
      creation: '2026-04-14 16:42:51',
      modified: '2026-04-23 23:31:47',
    });
  }

  const response = await request<FrappeFormLoadResponse>(buildFormLoadPath('Project', name));
  return normalizeProjectDetail(findLoadedDoc(response, 'Project', name));
}

export async function getTasks() {
  if (dataSource === 'mock') {
    await delay(300);
    return [...mockTasks];
  }

  const response = await request<FrappeResourceResponse<Record<string, unknown>[]>>(
    buildListPath('Task', [
      'name',
      'subject',
      'project',
      'status',
      'exp_start_date',
      'exp_end_date',
      'priority',
    ]),
  );

  return response.data.map(normalizeTask);
}

export async function getTaskDetail(name: string) {
  if (dataSource === 'mock') {
    await delay(250);
    const task = mockTasks.find((item) => item.name === name);

    if (!task) {
      throw new Error(`Không tìm thấy Task ${name}.`);
    }

    return normalizeTaskDetail({
      ...task,
      description: task.subject,
      progress: 100,
      expected_time: 120,
      company: 'Công Ty TNHH TMDV Sản Xuất Kỹ Thuật Cao Tân Tiến',
      owner: 'Administrator',
      creation: '2026-04-23 16:54:53',
      modified: '2026-04-23 23:24:29',
      depends_on: [],
    });
  }

  const response = await request<FrappeFormLoadResponse>(buildFormLoadPath('Task', name));
  return normalizeTaskDetail(findLoadedDoc(response, 'Task', name));
}

export async function getTodos() {
  if (dataSource === 'mock') {
    await delay(300);
    return [...mockTodos];
  }

  const currentUser = await checkAuth();

  if (currentUser) {
    const assignedResponse = await request<FrappeResourceResponse<Record<string, unknown>[]>>(
      buildTodoListPath([['allocated_to', '=', currentUser]]),
    );

    if (assignedResponse.data.length > 0) {
      return assignedResponse.data.map(normalizeTodo);
    }
  }

  const response = await request<FrappeResourceResponse<Record<string, unknown>[]>>(
    buildTodoListPath(),
  );

  return response.data.map(normalizeTodo);
}

export async function createTodo(description: string) {
  if (dataSource === 'mock') {
    await delay(300);
    const newTodo: TodoItem = {
      name: `TODO-${String(mockTodos.length + 1).padStart(3, '0')}`,
      description,
      status: 'Open',
      date: new Date().toISOString().slice(0, 10),
      priority: 'Medium',
      allocated_to: 'demo@erp.mte.vn',
      reference_type: '',
      reference_name: '',
    };
    mockTodos.unshift(newTodo);
    return newTodo;
  }

  const response = await request<FrappeResourceResponse<Record<string, unknown>>>(
    '/api/resource/ToDo',
    {
      method: 'POST',
      body: JSON.stringify({ description }),
    },
    true,
  );

  return normalizeTodo(response.data);
}

export async function updateTodoStatus(name: string, status: 'Open' | 'Closed') {
  if (dataSource === 'mock') {
    await delay(300);
    const todo = mockTodos.find((item) => item.name === name);

    if (!todo) {
      throw new Error('Không tìm thấy todo cần cập nhật.');
    }

    todo.status = status;
    return todo;
  }

  const response = await request<FrappeResourceResponse<Record<string, unknown>>>(
    `/api/resource/ToDo/${encodeURIComponent(name)}`,
    {
      method: 'PUT',
      body: JSON.stringify({ status }),
    },
    true,
  );

  return normalizeTodo(response.data);
}
