// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper function to build API URLs
export const getApiUrl = (endpoint) => {
  // Make sure endpoint starts with a slash if it doesn't already
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${formattedEndpoint}`;
};

// Helper for file URLs (for images, documents, etc.)
export const getFileUrl = (filePath) => {
  if (!filePath) return '';
  // If the path already includes the API URL, return it as is
  if (filePath.startsWith('http')) return filePath;
  // Make sure filePath starts with a slash if it doesn't already
  const formattedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${API_BASE_URL}${formattedPath}`;
};

// Common API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: getApiUrl('api/employees/login'),

  // Employees
  EMPLOYEES: getApiUrl('api/employees'),
  EMPLOYEES_BY_CHEF: (chefId) => getApiUrl(`api/employees/chef/${chefId}`),
  EMPLOYEE_BY_ID: (id) => getApiUrl(`api/employees/${id}`),
  CHEFS: getApiUrl('api/employees/chefs'),
  CHECK_CIN: (cin) => getApiUrl(`api/employees/check-cin/${cin}`),
  CHANGE_PASSWORD: getApiUrl('api/employees/change-password'),

  // Departments
  DEPARTMENTS: getApiUrl('api/departments'),
  DEPARTMENT_BY_ID: (id) => getApiUrl(`api/departments/${id}`),

  // Projects
  PROJECTS: getApiUrl('api/projects'),
  PROJECTS_BY_EMPLOYEE: (employeeId) => getApiUrl(`api/projects/employee/${employeeId}`),
  PROJECT_BY_ID: (id) => getApiUrl(`api/projects/${id}`),
  PROJECT_DOCUMENTS: (id) => getApiUrl(`api/projects/${id}/documents`),
  PROJECT_COMMENTS: (id) => getApiUrl(`api/projects/${id}/comments`),

  // Tasks
  TASKS: getApiUrl('api/tasks'),
  TASKS_BY_EMPLOYEE: (employeeId) => getApiUrl(`api/tasks/employee/${employeeId}`),
  TASKS_BY_PROJECT: (projectId) => getApiUrl(`api/tasks/project/${projectId}`),
  TASKS_BY_ASSIGNED_BY: (userId) => getApiUrl(`api/tasks?assignedBy=${userId}`),
  TASK_BY_ID: (id) => getApiUrl(`api/tasks/${id}`),
  TASK_COMMENTS: (id) => getApiUrl(`api/tasks/${id}/comments`),
  TASK_ATTACHMENTS: (id) => getApiUrl(`api/tasks/${id}/attachments`),

  // Evaluations
  EVALUATIONS: getApiUrl('api/evaluationresultat'),
  EVALUATIONS_BY_CHEF: (chefId) => getApiUrl(`api/evaluationresultat/chef/${chefId}`),
  EVALUATIONS_BY_EMPLOYEE: (employeeId) => getApiUrl(`api/evaluationresultat/employee/${employeeId}`),
  EVALUATION_BY_ID: (id) => getApiUrl(`api/evaluationresultat/${id}`),
  EVALUATED_EMPLOYEES: (period) => getApiUrl(`api/evaluationresultat/evaluated-employees?periode=${period}`),
  QCM: getApiUrl('api/qcm'),
  QCM_BY_ID: (id) => getApiUrl(`api/qcm/${id}`),
  QCM_BY_CHAPTER: (chapter) => getApiUrl(`api/qcm/chapter/${encodeURIComponent(chapter)}`),

  // Attendance
  PRESENCE: getApiUrl('api/presence'),
  PRESENCE_CHECKOUT: (id) => getApiUrl(`api/presence/checkout/${id}`),
  PRESENCE_BY_ID: (id) => getApiUrl(`api/presence/${id}`),
  DAILY_REPORT: (date, period) => getApiUrl(`api/reports/daily?date=${date}&period=${period}`),

  // Leave Management
  LEAVES: getApiUrl('api/conges'),
  LEAVES_BY_EMPLOYEE: (employeeId) => getApiUrl(`api/conges?employee=${employeeId}`),
  LEAVES_BY_CHEF: (chefId) => getApiUrl(`api/conges/chef/${chefId}`),
  LEAVE_BY_ID: (id) => getApiUrl(`api/conges/${id}`),
  LEAVE_STATUS: (id) => getApiUrl(`api/conges/${id}/status`),
  LEAVE_BALANCE: (employeeId) => getApiUrl(`api/conges/balance/${employeeId}`),
  LEAVE_DOCUMENTS: (id, employeeId) => getApiUrl(`api/conges/${id}/documents?employee=${employeeId}`),

  // Messages
  TASK_MESSAGES: getApiUrl('api/task-messages'),
  TASK_MESSAGES_BY_TASK: (taskId) => getApiUrl(`api/task-messages/task/${taskId}`),
  TASK_MESSAGE_READ: (messageId) => getApiUrl(`api/task-messages/${messageId}/read`),
  CHEF_MESSAGES: (chefId) => getApiUrl(`api/messages/chef/${chefId}`),

  // Dashboard
  DASHBOARD_CHEF: (chefId) => getApiUrl(`api/dashboard/chef/${chefId}`),
  DASHBOARD_ACTIVITIES: (chefId) => getApiUrl(`api/dashboard/chef/${chefId}/activities`),

  // Notifications
  NOTIFICATIONS: getApiUrl('api/notifications'),
  NOTIFICATIONS_COUNT: getApiUrl('api/notifications/count'),

  // Files
  FILE_UPLOAD: getApiUrl('api/files/upload'),

  // Maintenance
  MAINTENANCE: getApiUrl('api/maintenance')
};

export default API_BASE_URL;
