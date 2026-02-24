// 备忘录类型定义
// types/memo.ts

export interface Memo {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface CreateMemoDTO {
  title: string;
  content?: string;
  tags?: string[];
}

export interface UpdateMemoDTO {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  count: number;
}
