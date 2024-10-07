import axios from 'axios';
import https from 'https'; // Import https for HTTPS agent

// const API_URL = 'http://127.0.0.1:8000/api'; // Make sure this matches your Laravel server URL
const API_URL = 'https://team.aiwhatsapp.in/api'; // Make sure this matches your Laravel server URL

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // This is important
  httpsAgent: new https.Agent({  // Add HTTPS agent with rejectUnauthorized set to false
    rejectUnauthorized: false
  })
});

// Add a request interceptor to include the token in the headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export { api }; // Export the api instance

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await api.post('/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const signupUser = async (name: string, email: string, password: string) => {
  try {
    const response = await api.post('/signup', { name, email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description: string;
  status: 'in_progress' | 'pending_approval' | 'completed';
  estimated_time: number;
  assigned_user_name: string;
  assigned_user_id: number;
  parent_task_id: number | null;
  created_at: string;
  updated_at: string;
  start_date?: string;
  end_date?: string;
  subtasks?: Task[];  // Make sure this is included
}

export interface User {
  id: number;
  name: string;
  role: string;
}

export const fetchTasks = async (): Promise<Task[]> => {
  try {
    const response = await api.get('/tasks');
    const tasks = response.data;
    console.log('Raw tasks from API:', tasks);
    
    const formatTasks = (tasks: Task[]): Task[] => {
      return tasks.map(task => ({
        ...task,
        subtasks: task.subtasks && task.subtasks.length > 0 ? formatTasks(task.subtasks) : []
      }));
    };

    const formattedTasks = formatTasks(tasks);
    console.log('Formatted tasks:', formattedTasks);
    return formattedTasks;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const createTask = async (taskData: Partial<Task>): Promise<Task> => {
  try {
    const response = await api.post('/tasks', taskData);
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTask = async (taskId: number, taskData: Partial<Task>): Promise<Task> => {
  try {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (taskId: number) => {
  try {
    await api.delete(`/tasks/${taskId}`);
    return { success: true, message: 'Task deleted successfully' };
  } catch (error: any) {
    if (error.response && (error.response.status === 404 || error.response.status === 204)) {
      console.warn(`Task ${taskId} not found or already deleted.`);
      return { success: true, message: 'Task not found or already deleted' };
    }
    console.error('Error deleting task:', error);
    return { success: false, message: error.message || 'An error occurred while deleting the task' };
  }
};

export const getTasks = fetchTasks; // Add this line to alias fetchTasks as getTasks

export const requestApproval = async (taskId: number): Promise<Task> => {
  try {
    const response = await api.post(`/tasks/${taskId}/request-approval`);
    return response.data;
  } catch (error: any) { // Explicitly typing error as 'any'
    if (error.response && error.response.status === 403) {
      throw new Error('You do not have permission to request approval for this task.');
    }
    throw error;
  }
};

export const approveTask = async (taskId: number): Promise<Task> => {
  try {
    const response = await api.post(`/tasks/${taskId}/approve`);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 403) {
      throw new Error('You do not have permission to approve this task.');
    }
    console.error('Error approving task:', error);
    throw error;
  }
};

export const rejectTask = async (taskId: number): Promise<Task> => {
  try {
    const response = await api.post(`/tasks/${taskId}/reject`);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 403) {
      throw new Error('You do not have permission to reject this task.');
    }
    console.error('Error rejecting task:', error);
    throw error;
  }
};

export const markTaskCompleted = async (taskId: number): Promise<Task> => {
  try {
    const response = await api.post(`/tasks/${taskId}/complete`);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 403) {
      throw new Error('You do not have permission to mark this task as completed.');
    }
    console.error('Error marking task as completed:', error);
    throw error;
  }
};

export const revertTaskToInProgress = async (taskId: number): Promise<Task> => {
  try {
    const response = await api.post(`/tasks/${taskId}/revert-to-in-progress`);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 403) {
      throw new Error('You do not have permission to revert this task.');
    }
    console.error('Error reverting task to in progress:', error);
    throw error;
  }
};

export interface PomodoroSettings {
  workTime: number;
  breakTime: number;
  isBreak?: boolean;  // Add this line
}

export interface Sitting {
  startTime: Date;
  endTime: Date;
  duration: number;
}

export const savePomodoroSettings = async (taskId: number, settings: PomodoroSettings) => {
  try {
    const response = await api.post(`/tasks/${taskId}/pomodoro-settings`, settings);
    return response.data;
  } catch (error) {
    console.error('Error saving Pomodoro settings:', error);
    throw error;
  }
};

export const saveSitting = async (taskId: number, sitting: Sitting) => {
  try {
    const sittingToSend = {
      ...sitting,
      start_time: sitting.startTime.toISOString(),
      end_time: sitting.endTime.toISOString(),
    };
    const response = await api.post(`/tasks/${taskId}/sittings`, sittingToSend);
    return response.data;
  } catch (error) {
    console.error('Error saving sitting:', error);
    throw error;
  }
};

export const getSittings = async (taskId: number): Promise<Sitting[]> => {
  try {
    const response = await api.get(`/tasks/${taskId}/sittings`);
    return response.data.map((sitting: any) => ({
      ...sitting,
      startTime: new Date(sitting.start_time),
      endTime: new Date(sitting.end_time),
      duration: sitting.duration
    }));
  } catch (error) {
    console.error('Error fetching sittings:', error);
    return [];
  }
};

export const getPomodoroSettings = async (taskId: number): Promise<PomodoroSettings> => {
  try {
    const response = await api.get(`/tasks/${taskId}/pomodoro-settings`);
    console.log('Pomodoro settings from API:', response.data);
    return {
      workTime: response.data.work_time,
      breakTime: response.data.break_time
    };
  } catch (error) {
    console.error('Error fetching Pomodoro settings:', error);
    // Return default settings if there's an error
    return { workTime: 25 * 60, breakTime: 5 * 60 };
  }
};