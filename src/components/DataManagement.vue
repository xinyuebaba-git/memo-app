<template>
  <div class="data-management">
    <h2 class="title">📊 数据管理</h2>
    
    <!-- 数据版本信息 -->
    <div class="info-card">
      <div class="info-item">
        <span class="label">数据结构版本：</span>
        <span class="value">v{{ dataVersion }}</span>
      </div>
      <div class="info-item">
        <span class="label">加密状态：</span>
        <span class="value" :class="{ 'enabled': encryptionEnabled, 'disabled': !encryptionEnabled }">
          {{ encryptionEnabled ? '🔒 已启用' : '🔓 未启用' }}
        </span>
      </div>
      <div class="info-item">
        <span class="label">备忘录数量：</span>
        <span class="value">{{ memoCount }}</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="actions">
      <!-- 加密开关 -->
      <button 
        @click="toggleEncryption" 
        class="btn"
        :class="encryptionEnabled ? 'btn-warning' : 'btn-primary'"
      >
        {{ encryptionEnabled ? '🔓 禁用加密' : '🔒 启用加密' }}
      </button>

      <!-- 导出数据 -->
      <button @click="handleExport" class="btn btn-success">
        📤 导出数据
      </button>

      <!-- 导入数据 -->
      <label class="btn btn-info">
        📥 导入数据
        <input 
          type="file" 
          @change="handleImport" 
          accept=".json"
          class="file-input"
        />
      </label>

      <!-- 备份列表 -->
      <button @click="showBackups = !showBackups" class="btn btn-secondary">
        💾 备份管理 ({{ backups.length }})
      </button>
    </div>

    <!-- 备份列表 -->
    <div v-if="showBackups && backups.length > 0" class="backups-list">
      <h3 class="subtitle">历史备份</h3>
      <ul class="backup-items">
        <li v-for="backup in backups" :key="backup" class="backup-item">
          <span class="backup-name">{{ formatBackupName(backup) }}</span>
          <button @click="handleRestore(backup)" class="btn-small btn-primary">
            ⏮️ 恢复
          </button>
        </li>
      </ul>
    </div>

    <!-- 提示信息 -->
    <div class="tips">
      <h3 class="subtitle">💡 使用提示</h3>
      <ul class="tip-list">
        <li>✅ 数据自动迁移，无需手动操作</li>
        <li>✅ 每次更新前自动备份</li>
        <li>✅ 导出数据可在不同设备间同步</li>
        <li>⚠️ 导入数据会覆盖当前数据，请先导出备份</li>
        <li>⚠️ 启用加密后无法降级到旧版本</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  enableEncryption, 
  disableEncryption, 
  getEncryptionStatus,
  exportData,
  importData,
  getDataVersion
} from '../composables/useMemos';
import { listBackups, restoreBackup } from '../utils/migration';

const dataVersion = ref(1);
const encryptionEnabled = ref(false);
const memoCount = ref(0);
const showBackups = ref(false);
const backups = ref<string[]>([]);

// 加载数据信息
const loadDataInfo = () => {
  dataVersion.value = getDataVersion();
  encryptionEnabled.value = getEncryptionStatus();
  
  // 计算备忘录数量
  const memosRaw = localStorage.getItem('memo_app_memos');
  if (memosRaw) {
    try {
      const memos = JSON.parse(memosRaw);
      memoCount.value = memos.length;
    } catch {
      memoCount.value = 0;
    }
  }
  
  // 加载备份列表
  backups.value = listBackups();
};

// 切换加密状态
const toggleEncryption = async () => {
  try {
    if (encryptionEnabled.value) {
      const success = await disableEncryption();
      if (success) {
        encryptionEnabled.value = false;
        alert('✅ 加密已禁用');
      }
    } else {
      const success = await enableEncryption();
      if (success) {
        encryptionEnabled.value = true;
        alert('✅ 加密已启用');
      }
    }
    loadDataInfo();
  } catch (error) {
    alert(`❌ 操作失败：${(error as Error).message}`);
  }
};

// 导出数据
const handleExport = async () => {
  try {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `memo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('✅ 数据导出成功');
  } catch (error) {
    alert(`❌ 导出失败：${(error as Error).message}`);
  }
};

// 导入数据
const handleImport = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;
  
  try {
    const text = await file.text();
    const success = await importData(text);
    
    if (success) {
      alert('✅ 数据导入成功！页面将刷新。');
      location.reload();
    }
  } catch (error) {
    alert(`❌ 导入失败：${(error as Error).message}`);
  }
  
  // 清空 input
  target.value = '';
};

// 恢复备份
const handleRestore = async (backupKey: string) => {
  if (!confirm('⚠️ 确定要恢复此备份吗？当前数据将被覆盖。')) {
    return;
  }
  
  try {
    const success = await restoreBackup(backupKey);
    
    if (success) {
      alert('✅ 备份恢复成功！页面将刷新。');
      location.reload();
    } else {
      alert('❌ 备份恢复失败');
    }
  } catch (error) {
    alert(`❌ 恢复失败：${(error as Error).message}`);
  }
};

// 格式化备份名称
const formatBackupName = (backupKey: string) => {
  const match = backupKey.match(/v(\d+)_(\d+)/);
  if (match) {
    const version = match[1];
    const timestamp = parseInt(match[2]);
    const date = new Date(timestamp);
    return `v${version} - ${date.toLocaleString('zh-CN')}`;
  }
  return backupKey;
};

onMounted(() => {
  loadDataInfo();
});
</script>

<style scoped>
.data-management {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #2c3e50;
}

.info-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  color: #6c757d;
}

.value {
  font-weight: 600;
}

.value.enabled {
  color: #28a745;
}

.value.disabled {
  color: #dc3545;
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-info {
  background: #17a2b8;
  color: white;
  display: inline-block;
  position: relative;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.file-input {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.btn-small {
  padding: 4px 12px;
  font-size: 12px;
}

.backups-list {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.subtitle {
  font-size: 18px;
  margin-bottom: 12px;
  color: #2c3e50;
}

.backup-items {
  list-style: none;
  padding: 0;
  margin: 0;
}

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
}

.backup-item:last-child {
  border-bottom: none;
}

.backup-name {
  font-family: monospace;
  color: #495057;
}

.tips {
  background: #e7f3ff;
  border-radius: 8px;
  padding: 16px;
}

.tip-list {
  margin: 0;
  padding-left: 20px;
}

.tip-list li {
  margin-bottom: 8px;
  color: #004085;
}
</style>
