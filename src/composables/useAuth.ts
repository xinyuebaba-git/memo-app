import { ref, reactive, readonly } from 'vue';
import type { User, LoginCredentials, RegisterData } from '../types/auth';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { loadAndMigrateData, backupData } from '../utils/migration';
import { STORAGE_KEYS } from '../types/schema';

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

// 用户存储键名（已废弃，保留用于迁移）
const USERS_STORAGE_KEY = 'memo_app_users';

// 获取所有用户（从新结构）
const getAllUsers = async (): Promise<User[]> => {
  try {
    const data = await loadAndMigrateData();
    return data.users || [];
  } catch (error) {
    console.error('获取用户失败:', error);
    return [];
  }
};

// 保存所有用户（到新结构）
const saveAllUsers = (users: User[]) => {
  try {
    const rawData = localStorage.getItem(STORAGE_KEYS.DATA);
    let data: any = rawData ? JSON.parse(rawData) : {};
    
    data.users = users;
    data.updatedAt = Date.now();
    
    localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(data));
  } catch (error) {
    console.error('保存用户失败:', error);
  }
};

// 查找用户
const findUser = async (username: string): Promise<User | undefined> => {
  const users = await getAllUsers();
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
  const existingUser = await findUser(registerData.username);
  if (existingUser) {
    throw new Error('用户名已存在');
  }
  
  // 🔐 使用 bcrypt 哈希密码
  const hashedPassword = await hashPassword(registerData.password);
  
  // 创建新用户
  const user: User = {
    id: String(Date.now()),
    username: registerData.username,
    password: hashedPassword
  };
  
  // 保存到 localStorage
  const users = await getAllUsers();
  users.push(user);
  await saveAllUsers(users);
  
  const token = `mock-jwt-token-${Date.now()}`;
  
  return { user, token };
};

// 模拟登录 API 调用
const mockLogin = async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
  // 模拟 API 延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 查找用户
  const user = await findUser(credentials.username);
  
  if (!user) {
    throw new Error('用户名不存在');
  }
  
  // 🔐 验证密码
  const isValid = await verifyPassword(credentials.password, user.password);
  if (!isValid) {
    throw new Error('密码错误');
  }
  
  const token = `mock-jwt-token-${Date.now()}`;
  
  return { user: { ...user, password: undefined }, token };
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
