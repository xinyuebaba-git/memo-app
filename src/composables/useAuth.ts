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

// 模拟注册 API 调用
const mockRegister = async (registerData: RegisterData): Promise<{ user: User; token: string }> => {
  // 模拟 API 延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 简单验证
  if (registerData.username && registerData.password && registerData.confirmPassword) {
    const user: User = {
      id: String(Date.now()),
      username: registerData.username,
      password: btoa(registerData.password) // 简单加密
    };
    
    const token = `mock-jwt-token-${Date.now()}`;
    
    return { user, token };
  }
  
  throw new Error('Registration failed');
};

// 模拟登录 API 调用
const mockLogin = async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
  // 模拟 API 延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 简单验证
  if (credentials.username && credentials.password) {
    const user: User = {
      id: '1',
      username: credentials.username,
      password: btoa(credentials.password)
    };
    
    const token = `mock-jwt-token-${Date.now()}`;
    
    return { user, token };
  }
  
  throw new Error('Invalid credentials');
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
