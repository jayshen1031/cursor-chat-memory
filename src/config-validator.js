#!/usr/bin/env node

/**
 * 🔧 配置验证器
 * 启动时检查所有必需的配置项
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

class ConfigValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.configPath = './cursor-mcp-config.json';
        this.requiredFields = [
            'port',
            'host',
            'memoryBankPath',
            'outputPath',
            'logPath'
        ];
        this.optionalFields = [
            'logLevel',
            'projects',
            'mcpServers'
        ];
    }

    /**
     * 🚀 主验证入口
     */
    async validate() {
        console.log('🔍 开始配置验证...');
        
        try {
            // 1. 检查配置文件存在性
            await this.checkConfigFileExists();
            
            // 2. 加载并解析配置
            const config = await this.loadConfig();
            
            // 3. 验证必需字段
            this.validateRequiredFields(config);
            
            // 4. 验证字段类型和值
            this.validateFieldTypes(config);
            
            // 5. 检查路径存在性
            await this.validatePaths(config);
            
            // 6. 验证端口可用性
            await this.validatePort(config.port);
            
            // 7. 检查Node.js版本
            this.validateNodeVersion();
            
            // 8. 验证项目配置
            if (config.projects) {
                this.validateProjects(config.projects);
            }
            
            // 9. 检查Cursor数据库路径
            await this.validateCursorDatabase();
            
            // 输出验证结果
            this.outputResults();
            
            return {
                isValid: this.errors.length === 0,
                errors: this.errors,
                warnings: this.warnings,
                config
            };
            
        } catch (error) {
            this.errors.push(`配置验证失败: ${error.message}`);
            this.outputResults();
            return {
                isValid: false,
                errors: this.errors,
                warnings: this.warnings
            };
        }
    }

    /**
     * 📁 检查配置文件存在性
     */
    async checkConfigFileExists() {
        try {
            await fs.access(this.configPath);
        } catch (error) {
            this.errors.push(`配置文件不存在: ${this.configPath}`);
            throw new Error('配置文件缺失');
        }
    }

    /**
     * 📖 加载配置文件
     */
    async loadConfig() {
        try {
            const configContent = await fs.readFile(this.configPath, 'utf-8');
            return JSON.parse(configContent);
        } catch (error) {
            if (error instanceof SyntaxError) {
                this.errors.push(`配置文件JSON格式错误: ${error.message}`);
            } else {
                this.errors.push(`读取配置文件失败: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * ✅ 验证必需字段
     */
    validateRequiredFields(config) {
        for (const field of this.requiredFields) {
            if (!(field in config)) {
                this.errors.push(`缺少必需配置项: ${field}`);
            } else if (config[field] === null || config[field] === undefined || config[field] === '') {
                this.errors.push(`配置项不能为空: ${field}`);
            }
        }
    }

    /**
     * 🔢 验证字段类型和值
     */
    validateFieldTypes(config) {
        // 验证端口
        if (config.port) {
            if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
                this.errors.push(`端口号无效: ${config.port} (必须是1-65535之间的整数)`);
            }
        }

        // 验证主机地址
        if (config.host) {
            const validHosts = ['localhost', '127.0.0.1', '0.0.0.0'];
            if (!validHosts.includes(config.host) && !this.isValidIP(config.host)) {
                this.warnings.push(`主机地址可能无效: ${config.host}`);
            }
        }

        // 验证日志级别
        if (config.logLevel) {
            const validLevels = ['error', 'warn', 'info', 'debug'];
            if (!validLevels.includes(config.logLevel)) {
                this.warnings.push(`日志级别无效: ${config.logLevel} (建议使用: ${validLevels.join(', ')})`);
            }
        }
    }

    /**
     * 📂 验证路径存在性
     */
    async validatePaths(config) {
        const pathFields = ['memoryBankPath', 'outputPath', 'logPath'];
        
        for (const field of pathFields) {
            if (config[field]) {
                const fullPath = path.resolve(config[field]);
                try {
                    await fs.access(fullPath);
                } catch (error) {
                    // 尝试创建目录
                    try {
                        await fs.mkdir(fullPath, { recursive: true });
                        this.warnings.push(`已创建缺失目录: ${fullPath}`);
                    } catch (createError) {
                        this.errors.push(`无法创建目录 ${field}: ${fullPath} - ${createError.message}`);
                    }
                }
            }
        }
    }

    /**
     * 🌐 验证端口可用性
     */
    async validatePort(port) {
        if (!port) return;

        try {
            const { createServer } = await import('net');
            
            return new Promise((resolve) => {
                const server = createServer();
                
                server.listen(port, () => {
                    server.close(() => {
                        resolve();
                    });
                });
                
                server.on('error', (error) => {
                    if (error.code === 'EADDRINUSE') {
                        this.warnings.push(`端口 ${port} 已被占用，可能需要停止现有服务`);
                    } else {
                        this.errors.push(`端口验证失败: ${error.message}`);
                    }
                    resolve();
                });
            });
        } catch (error) {
            this.warnings.push(`无法验证端口可用性: ${error.message}`);
        }
    }

    /**
     * 🟢 验证Node.js版本
     */
    validateNodeVersion() {
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        
        if (majorVersion < 18) {
            this.errors.push(`Node.js版本过低: ${nodeVersion} (需要18+)`);
        } else if (majorVersion < 20) {
            this.warnings.push(`建议升级Node.js版本: ${nodeVersion} -> 20+`);
        }
    }

    /**
     * 📋 验证项目配置
     */
    validateProjects(projects) {
        if (typeof projects !== 'object') {
            this.errors.push('projects配置必须是对象类型');
            return;
        }

        const validTypes = ['development', 'analysis', 'bi'];
        
        for (const [projectId, project] of Object.entries(projects)) {
            // 验证项目基本字段
            if (!project.name) {
                this.errors.push(`项目 ${projectId} 缺少name字段`);
            }
            
            if (!project.type) {
                this.errors.push(`项目 ${projectId} 缺少type字段`);
            } else if (!validTypes.includes(project.type)) {
                this.errors.push(`项目 ${projectId} 类型无效: ${project.type} (支持: ${validTypes.join(', ')})`);
            }
            
            if (!project.path) {
                this.warnings.push(`项目 ${projectId} 缺少path字段`);
            }
        }
    }

    /**
     * 🗄️ 验证Cursor数据库路径
     */
    async validateCursorDatabase() {
        const cursorDataPath = path.join(os.homedir(), 'Library/Application Support/Cursor/User/workspaceStorage');
        
        try {
            await fs.access(cursorDataPath);
            
            // 查找工作区数据库
            const workspaces = await fs.readdir(cursorDataPath);
            const validDatabases = [];
            
            for (const workspace of workspaces) {
                const dbPath = path.join(cursorDataPath, workspace, 'state.vscdb');
                try {
                    await fs.access(dbPath);
                    validDatabases.push(dbPath);
                } catch (error) {
                    // 忽略不存在的数据库
                }
            }
            
            if (validDatabases.length === 0) {
                this.warnings.push('未找到有效的Cursor工作区数据库');
            } else {
                console.log(`✅ 找到 ${validDatabases.length} 个Cursor工作区数据库`);
            }
            
        } catch (error) {
            this.warnings.push(`无法访问Cursor数据目录: ${cursorDataPath}`);
        }
    }

    /**
     * 🌐 验证IP地址格式
     */
    isValidIP(ip) {
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(ip);
    }

    /**
     * 📊 输出验证结果
     */
    outputResults() {
        console.log('\n📊 配置验证结果:');
        
        if (this.errors.length === 0) {
            console.log('✅ 配置验证通过');
        } else {
            console.log(`❌ 发现 ${this.errors.length} 个错误:`);
            this.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }
        
        if (this.warnings.length > 0) {
            console.log(`⚠️  发现 ${this.warnings.length} 个警告:`);
            this.warnings.forEach((warning, index) => {
                console.log(`   ${index + 1}. ${warning}`);
            });
        }
        
        console.log('');
    }

    /**
     * 🛠️ 生成修复建议
     */
    generateFixSuggestions() {
        const suggestions = [];
        
        if (this.errors.some(e => e.includes('配置文件不存在'))) {
            suggestions.push('运行 npm run setup 创建默认配置文件');
        }
        
        if (this.errors.some(e => e.includes('端口号无效'))) {
            suggestions.push('修改配置文件中的port字段为有效端口号(1-65535)');
        }
        
        if (this.errors.some(e => e.includes('Node.js版本过低'))) {
            suggestions.push('升级Node.js到18+版本: https://nodejs.org/');
        }
        
        return suggestions;
    }
}

// 导出类和便捷函数
export default ConfigValidator;

export const validateConfig = async () => {
    const validator = new ConfigValidator();
    return await validator.validate();
};

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
    const validator = new ConfigValidator();
    const result = await validator.validate();
    
    if (!result.isValid) {
        const suggestions = validator.generateFixSuggestions();
        if (suggestions.length > 0) {
            console.log('💡 修复建议:');
            suggestions.forEach((suggestion, index) => {
                console.log(`   ${index + 1}. ${suggestion}`);
            });
        }
        process.exit(1);
    }
    
    console.log('🎉 配置验证完成，可以启动服务！');
} 