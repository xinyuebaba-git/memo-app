// 加密工具模块
// 提供密码哈希和数据加密功能

import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';

// 加密盐值（生产环境应从环境变量读取）
const SALT_ROUNDS = 10;
const ENCRYPTION_KEY = 'memo-app-secret-key-2026'; // TODO: 生产环境应使用环境变量

/**
 * 密码哈希
 * @param password 原始密码
 * @returns 哈希后的密码
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * 验证密码
 * @param password 原始密码
 * @param hash 哈希密码
 * @returns 是否匹配
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * AES 加密
 * @param data 要加密的数据
 * @param key 加密密钥（可选，默认使用内置密钥）
 * @returns 加密后的字符串
 */
export const encryptData = (data: string, key?: string): string => {
  const encryptionKey = key || ENCRYPTION_KEY;
  return CryptoJS.AES.encrypt(data, encryptionKey).toString();
};

/**
 * AES 解密
 * @param encryptedData 加密的数据
 * @param key 加密密钥（可选，默认使用内置密钥）
 * @returns 解密后的原始数据
 */
export const decryptData = (encryptedData: string, key?: string): string => {
  const encryptionKey = key || ENCRYPTION_KEY;
  const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * 从密码派生加密密钥
 * @param password 用户密码
 * @returns 派生的密钥
 */
export const deriveKeyFromPassword = (password: string): string => {
  // 使用 SHA256 从密码派生固定长度的密钥
  return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
};
