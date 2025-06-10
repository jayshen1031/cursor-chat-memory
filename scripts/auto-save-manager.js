#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Cursor 自动保存管理器
 * 用于配置和监控 Cursor 的自动保存设置
 */
class AutoSaveManager {
    constructor() {
        this.settingsPath = this.getSettingsPath();
        this.intervals = {
            '30秒': 30000,
            '1分钟': 60000,
            '5分钟': 300000,
            '10分钟': 600000,
            '15分钟': 900000,
            '30分钟': 1800000
        };
    }

    getSettingsPath() {
        const platform = os.platform();
        const homeDir = os.homedir();
        
        switch (platform) {
            case 'win32':
                return path.join(process.env.APPDATA, 'Cursor', 'User', 'settings.json');
            case 'darwin':
                return path.join(homeDir, 'Library', 'Application Support', 'Cursor', 'User', 'settings.json');
            case 'linux':
                return path.join(homeDir, '.config', 'Cursor', 'User', 'settings.json');
            default:
                throw new Error(`不支持的平台: ${platform}`);
        }
    }

    readSettings() {
        try {
            if (!fs.existsSync(this.settingsPath)) {
                return {};
            }
            const content = fs.readFileSync(this.settingsPath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            console.error('❌ 读取设置文件失败:', error.message);
            return {};
        }
    }

    writeSettings(settings) {
        try {
            const dir = path.dirname(this.settingsPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 4));
            console.log('✅ 设置已保存到:', this.settingsPath);
            return true;
        } catch (error) {
            console.error('❌ 保存设置文件失败:', error.message);
            return false;
        }
    }

    getCurrentSettings() {
        const settings = this.readSettings();
        
        console.log('\n📋 当前自动保存设置:');
        console.log('==================');
        console.log(`🔧 files.autoSave: ${settings['files.autoSave'] || 'off'}`);
        console.log(`⏱️  files.autoSaveDelay: ${settings['files.autoSaveDelay'] || 1000}ms`);
        
        if (settings['files.autoSave'] === 'afterDelay' && settings['files.autoSaveDelay']) {
            const minutes = settings['files.autoSaveDelay'] / 60000;
            const seconds = (settings['files.autoSaveDelay'] % 60000) / 1000;
            console.log(`⏰ 间隔时间: ${minutes}分${seconds}秒`);
        }
        
        return settings;
    }

    setAutoSave(interval = '10分钟') {
        const settings = this.readSettings();
        
        if (!this.intervals[interval]) {
            console.error(`❌ 不支持的间隔: ${interval}`);
            console.log('支持的间隔:', Object.keys(this.intervals).join(', '));
            return false;
        }

        settings['files.autoSave'] = 'afterDelay';
        settings['files.autoSaveDelay'] = this.intervals[interval];

        if (this.writeSettings(settings)) {
            console.log(`✅ 自动保存已设置为 ${interval} (${this.intervals[interval]}ms)`);
            return true;
        }
        
        return false;
    }

    disableAutoSave() {
        const settings = this.readSettings();
        settings['files.autoSave'] = 'off';
        
        if (this.writeSettings(settings)) {
            console.log('✅ 自动保存已禁用');
            return true;
        }
        
        return false;
    }

    enableOnFocusChange() {
        const settings = this.readSettings();
        settings['files.autoSave'] = 'onFocusChange';
        
        if (this.writeSettings(settings)) {
            console.log('✅ 已设置为失去焦点时自动保存');
            return true;
        }
        
        return false;
    }

    showHelp() {
        console.log(`
🔧 Cursor 自动保存管理器
========================

用法: node auto-save-manager.js [命令]

命令:
  status          查看当前设置
  set [间隔]      设置定时自动保存 (默认10分钟)
  focus          设置失去焦点时自动保存
  disable        禁用自动保存
  help           显示此帮助信息

支持的间隔:
  ${Object.keys(this.intervals).join(', ')}

示例:
  node auto-save-manager.js status
  node auto-save-manager.js set 10分钟
  node auto-save-manager.js set 5分钟
  node auto-save-manager.js focus
  node auto-save-manager.js disable
        `);
    }
}

// 主程序
function main() {
    const manager = new AutoSaveManager();
    const args = process.argv.slice(2);
    const command = args[0] || 'status';

    console.log('🔧 Cursor 自动保存管理器\n');

    switch (command) {
        case 'status':
            manager.getCurrentSettings();
            break;
            
        case 'set':
            const interval = args[1] || '10分钟';
            manager.setAutoSave(interval);
            manager.getCurrentSettings();
            break;
            
        case 'focus':
            manager.enableOnFocusChange();
            manager.getCurrentSettings();
            break;
            
        case 'disable':
            manager.disableAutoSave();
            manager.getCurrentSettings();
            break;
            
        case 'help':
            manager.showHelp();
            break;
            
        default:
            console.log(`❌ 未知命令: ${command}`);
            manager.showHelp();
            break;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = AutoSaveManager; 