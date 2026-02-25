import { ref, reactive, readonly } from 'vue';
import type { User, LoginCredentials, RegisterData } from '../types/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

const authState = reactive<AuthState>({
  user: null,
  isAuthenticated: false,
  token: null
});

// 用户存储键名
const USERS_STORAGE_KEY = 'memo_app_users';

// 获取所有用户
const getAllUsers = (): User[] => {
  const users = localStorage.getItem(USERS_STORAGE_KEY);
  return users ? JSON.parse(users) : [];
};

// 保存所有用户
const saveAllUsers = (users: User[]) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

// 查找用户
const findUser = (username: string): User | undefined => {
  const users = getAllUsers();
  return users.find(u => u.username === username);
};

// 模拟注册 API 调用
const mockRegister = async (registerData: RegisterData): Promise<{ user: User; token: string }> => {
  // 模拟 API 延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 验证密码一致性
  if (registerData.password !== registerData.confirmPassword) {
    throw new Error('两次输入的密码不一致');
  }
  
  // 检查用户名是否已存在
  const existingUser = findUser(registerData.username);
  if (existingUser) {
    throw new Error('用户名已存在');
  }
  
  // 创建新用户
  const user: User = {
    id: String(Date.now()),
    username: registerData.username,
    password: btoa(registerData.password) // Base64 编码
  };
  
  // 保存到 localStorage
  const users = getAllUsers();
  users.push(user);
  saveAllUsers(users);
  
  const token = `mock-jwt-token-${Date.now()}`;
  
  return { user, token };
};

// 模拟登录 API 调用
const mockLogin = async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
  // 模拟 API 延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 查找用户
  const user = findUser(credentials.username);
  
  if (!user) {
    throw new Error('用户名不存在');
  }
  
  // 验证密码
  const encodedPassword = btoa(credentials.password);
  if (user.password !== encodedPassword) {
    throw new Error('密码错误');
  }
  
  const token = `mock-jwt-token-${Date.now()}`;
  
  return { user: { ...user, password: undefined }, token }; // 不返回密码
};

export const useAuth = () => {
  const login = async (credentials: LoginCredentials) => {
    try {
      const result = await mockLogin(credentials);
      
      authState.user = result.user;
      authState.isAuthenticated = true;
      authState.token = result.token;
      
      // 存储到 localStorage
      localStorage.setItem('user', JSON.stringify(result.user));
      localStorage.setItem('token', result.token);
      
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: (error as Error).message };
    }
  };

  const register = async (registerData: RegisterData) => {
    try {
      const result = await mockRegister(registerData);
      
      authState.user = result.user;
      authState.isAuthenticated = true;
      authState.token = result.token;
      
      // 存储到 localStorage
      localStorage.setItem('user', JSON.stringify(result.user));
      localStorage.setItem('token', result.token);
      
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: (error as Error).message };
    }
  };

  const logout = () => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.token = null;
    
    // 清除本地存储
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const checkAuthStatus = () => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      authState.user = JSON.parse(storedUser);
      authState.token = storedToken;
      authState.isAuthenticated = true;
    }
    
    return authState.isAuthenticated;
  };

  return {
    authState: readonly(authState),
    login,
    register,
    logout,
    checkAuthStatus
  };
};
