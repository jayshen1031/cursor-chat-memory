// 性能优化工具类
class PerformanceUtils {
    // 防抖函数 - 用于搜索输入优化
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 节流函数 - 用于滚动事件优化
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // 虚拟滚动 - 用于大列表渲染优化
    static createVirtualList(container, items, renderItem, itemHeight = 60) {
        const visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2;
        let startIndex = 0;
        
        const render = () => {
            const visibleItems = items.slice(startIndex, startIndex + visibleCount);
            container.innerHTML = visibleItems.map((item, index) => 
                renderItem(item, startIndex + index)
            ).join('');
            container.style.paddingTop = `${startIndex * itemHeight}px`;
            container.style.paddingBottom = `${(items.length - startIndex - visibleCount) * itemHeight}px`;
        };

        const handleScroll = this.throttle(() => {
            const scrollTop = container.scrollTop;
            const newStartIndex = Math.floor(scrollTop / itemHeight);
            if (newStartIndex !== startIndex) {
                startIndex = Math.max(0, newStartIndex);
                render();
            }
        }, 16);

        container.addEventListener('scroll', handleScroll);
        render();
        
        return { render, updateItems: (newItems) => { items = newItems; render(); } };
    }

    // 图片懒加载
    static lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }
}

// 全局状态管理
class AppState {
    constructor() {
        this.currentTab = 'extraction';
        this.knowledgeData = {};
    }
}

const state = new AppState();

// API 调用工具
class APIClient {
    static async get(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    static async post(url, data) {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    static async put(url, data) {
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    static async delete(url) {
        const response = await fetch(url, { method: 'DELETE' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }
}

// 通知系统
class NotificationManager {
    static show(message, type = 'info') {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    static success(message) {
        this.show(message, 'success');
    }

    static error(message) {
        this.show(message, 'error');
    }

    static warning(message) {
        this.show(message, 'warning');
    }
}

// 加载指示器
class LoadingManager {
    static show() {
        document.getElementById('loading').classList.add('show');
    }

    static hide() {
        document.getElementById('loading').classList.remove('show');
    }
}

// 模态框管理
class ModalManager {
    static show(title, content, onConfirm) {
        const modal = document.getElementById('modal');
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = content;
        
        const confirmBtn = document.getElementById('modalConfirm');
        const cancelBtn = document.getElementById('modalCancel');
        const closeBtn = modal.querySelector('.modal-close');
        
        modal.classList.add('show');
        
        const handleClose = () => {
            modal.classList.remove('show');
            confirmBtn.replaceWith(confirmBtn.cloneNode(true));
        };
        
        closeBtn.onclick = handleClose;
        cancelBtn.onclick = handleClose;
        
        if (onConfirm) {
            document.getElementById('modalConfirm').onclick = () => {
                onConfirm();
                handleClose();
            };
        }
    }

    static hide() {
        document.getElementById('modal').classList.remove('show');
    }
}

// 智能分析管理
class AnalysisManager {
    static workflowState = {
        currentStep: 1,
        completedSteps: new Set(),
        selectedAnalyzer: 'claude'
    };

    static init() {
        this.bindWorkflowEvents();
        this.bindAnalysisEvents();
        this.updateWorkflowProgress(1);
        this.loadProjectInfo();
    }

    static bindWorkflowEvents() {
        // 绑定工作流步骤点击事件
        document.querySelectorAll('.workflow-step').forEach(step => {
            step.addEventListener('click', () => {
                const stepNumber = parseInt(step.dataset.step);
                this.handleWorkflowStepClick(stepNumber);
            });
        });

        // 绑定分析器选择事件
        document.querySelectorAll('input[name="analyzer"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.workflowState.selectedAnalyzer = e.target.value;
                console.log('切换分析器:', this.workflowState.selectedAnalyzer);
            });
        });
    }

    static bindAnalysisEvents() {
        // 绑定分析功能按钮
        const bindBtn = (id, handler) => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('click', handler.bind(this));
        };

        bindBtn('batchSummarizeBtn', this.batchSummarize);
        bindBtn('singleSummarizeBtn', this.singleSummarize);
        bindBtn('smartIntegrateBtn', this.smartIntegrate);
        bindBtn('generateKnowledgeBtn', this.generateKnowledge);
        bindBtn('viewKnowledgeBaseBtn', this.viewKnowledgeBase);
        bindBtn('viewProjectKnowledgeBtn', this.viewProjectKnowledge);
    }

    static async loadProjectInfo() {
        this.updateProjectInfo();
    }

    static async updateProjectInfo() {
        try {
            const response = await APIClient.get('/api/sessions');
            const sessions = response.sessions || [];
            
            // 更新项目会话数
            const projectSessions = sessions.filter(session => 
                this.isSessionProjectRelated(session)
            );
            
            document.getElementById('projectSessionCount').textContent = 
                `📊 项目会话: ${projectSessions.length} 个`;
                
        } catch (error) {
            console.error('加载项目信息失败:', error);
            document.getElementById('projectSessionCount').textContent = 
                '📊 项目会话: 加载失败';
        }
    }

    static isSessionProjectRelated(session) {
        const title = session.title.toLowerCase();
        const keywords = ['cursor-chat-memory', '提示词中心', '项目', 'sqlite', 'dbeaver'];
        return keywords.some(keyword => title.includes(keyword));
    }

    static handleWorkflowStepClick(step) {
        this.workflowState.currentStep = step;
        this.updateWorkflowProgress(step);
    }

    static updateWorkflowProgress(step) {
        // 更新步骤状态
        document.querySelectorAll('.workflow-step').forEach(stepEl => {
            const stepNumber = parseInt(stepEl.dataset.step);
            stepEl.classList.remove('active', 'completed');
            
            if (stepNumber === step) {
                stepEl.classList.add('active');
            } else if (stepNumber < step) {
                stepEl.classList.add('completed');
                this.workflowState.completedSteps.add(stepNumber);
            }
        });
    }

    static getSelectedAnalyzer() {
        return this.workflowState.selectedAnalyzer;
    }

    static async batchSummarize() {
        const analyzerType = this.getSelectedAnalyzer();
        
        try {
            LoadingManager.show();
            
            const response = await APIClient.post('/api/analysis/batch-summarize', {
                analyzer: analyzerType,
                scope: this.getAnalysisScope()
            });
            
            this.renderBatchSummaryResults(response.results, analyzerType);
            this.workflowState.completedSteps.add(1);
            this.updateWorkflowProgress(2);
            
            NotificationManager.success('批量提炼完成！');
            
        } catch (error) {
            console.error('批量提炼失败:', error);
            NotificationManager.error('批量提炼失败：' + error.message);
        } finally {
            LoadingManager.hide();
        }
    }

    static async smartIntegrate() {
        const analyzerType = this.getSelectedAnalyzer();
        
        try {
            LoadingManager.show();
            
            const response = await APIClient.post('/api/analysis/smart-integrate', {
                analyzer: analyzerType
            });
            
            this.renderIntegrateResults(response.integrated, response.knowledgeBase, analyzerType);
            this.workflowState.completedSteps.add(2);
            this.updateWorkflowProgress(3);
            
            NotificationManager.success('智能整合完成！');
            
        } catch (error) {
            console.error('智能整合失败:', error);
            NotificationManager.error('智能整合失败：' + error.message);
        } finally {
            LoadingManager.hide();
        }
    }

    static async generateKnowledge() {
        const analyzerType = this.getSelectedAnalyzer();
        
        try {
            LoadingManager.show();
            
            const response = await APIClient.post('/api/analysis/knowledge-graph', {
                analyzer: analyzerType
            });
            
            this.renderKnowledgeResults(response.knowledge, analyzerType);
            this.workflowState.completedSteps.add(3);
            
            NotificationManager.success('项目知识图谱生成完成！');
            
        } catch (error) {
            console.error('知识图谱生成失败:', error);
            NotificationManager.error('知识图谱生成失败：' + error.message);
        } finally {
            LoadingManager.hide();
        }
    }

    static getAnalysisScope() {
        // 根据当前项目返回分析范围
        return {
            project: 'cursor-chat-memory',
            includeArchitecture: true,
            includeTechnical: true,
            includeDecisions: true
        };
    }

    static renderBatchSummaryResults(results, analyzerType) {
        const container = document.getElementById('summarizeResults');
        container.innerHTML = `
            <div class="analysis-result-header">
                <h4>📚 批量提炼结果 (${analyzerType})</h4>
                <span class="result-count">${results.length} 个会话已提炼</span>
            </div>
            <div class="analysis-result-content">
                ${results.map(result => `
                    <div class="summary-item">
                        <h5>${result.title}</h5>
                        <p class="summary-content">${result.summary}</p>
                        <div class="summary-meta">
                            <span>关键词: ${result.keywords.join(', ')}</span>
                            <span>重要性: ${'★'.repeat(result.importance)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    static renderIntegrateResults(integrated, knowledgeBase, analyzerType) {
        const container = document.getElementById('integrateResults');
        container.innerHTML = `
            <div class="analysis-result-header">
                <h4>🔧 智能整合结果 (${analyzerType})</h4>
                <span class="result-count">生成 ${integrated.templates.length} 个优化模板</span>
            </div>
            <div class="analysis-result-content">
                <div class="integration-stats">
                    <p>原有模板: ${integrated.originalCount} → 优化后: ${integrated.templates.length}</p>
                    <p>去重率: ${integrated.deduplicationRate}%</p>
                </div>
                ${this.formatKnowledgeBase(knowledgeBase)}
            </div>
        `;
    }

    static renderKnowledgeResults(knowledge, analyzerType) {
        const container = document.getElementById('knowledgeResults');
        container.innerHTML = `
            <div class="analysis-result-header">
                <h4>📊 项目知识图谱 (${analyzerType})</h4>
                <span class="result-count">${knowledge.categories.length} 个知识类别</span>
            </div>
            <div class="analysis-result-content">
                ${this.formatProjectKnowledge(knowledge)}
            </div>
        `;
    }

    static formatKnowledgeBase(knowledgeBase) {
        return `
            <div class="knowledge-base">
                <h5>💡 核心知识点</h5>
                ${knowledgeBase.coreKnowledge.map(item => `
                    <div class="knowledge-item">
                        <strong>${item.category}:</strong> ${item.content}
                    </div>
                `).join('')}
            </div>
        `;
    }

    static formatProjectKnowledge(knowledge) {
        return `
            <div class="project-knowledge">
                ${knowledge.categories.map(category => `
                    <div class="knowledge-category">
                        <h5>${category.name}</h5>
                        <ul>
                            ${category.items.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// 统计分析管理
class AnalyticsManager {
    static async loadAnalytics() {
        try {
            LoadingManager.show();
            
            const [sessionsResponse, promptsResponse] = await Promise.all([
                APIClient.get('/api/sessions'),
                APIClient.get('/api/prompts')
            ]);
            
            const sessions = sessionsResponse.sessions || [];
            const prompts = promptsResponse.prompts || [];
            
            this.renderSessionStats(sessions);
            this.renderPromptStats(prompts);
            this.renderCategoryStats(sessions, prompts);
            
        } catch (error) {
            console.error('加载统计数据失败:', error);
            NotificationManager.error('加载统计数据失败');
        } finally {
            LoadingManager.hide();
        }
    }

    static renderSessionStats(sessions) {
        const container = document.getElementById('sessionStats');
        const totalSessions = sessions.length;
        const projectSessions = sessions.filter(s => this.isProjectRelated(s)).length;
        
        container.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">总会话数</span>
                <span class="stat-value">${totalSessions}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">项目相关</span>
                <span class="stat-value">${projectSessions}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">项目占比</span>
                <span class="stat-value">${totalSessions > 0 ? Math.round(projectSessions / totalSessions * 100) : 0}%</span>
            </div>
        `;
    }

    static renderPromptStats(prompts) {
        const container = document.getElementById('promptStats');
        const totalPrompts = prompts.length;
        const activePrompts = prompts.filter(p => p.isActive).length;
        
        container.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">总提示词</span>
                <span class="stat-value">${totalPrompts}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">活跃提示词</span>
                <span class="stat-value">${activePrompts}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">活跃率</span>
                <span class="stat-value">${totalPrompts > 0 ? Math.round(activePrompts / totalPrompts * 100) : 0}%</span>
            </div>
        `;
    }

    static renderCategoryStats(sessions, prompts) {
        const container = document.getElementById('categoryStats');
        
        // 统计会话分类
        const sessionCategories = {};
        sessions.forEach(session => {
            const category = this.detectCategory(session);
            sessionCategories[category] = (sessionCategories[category] || 0) + 1;
        });
        
        container.innerHTML = `
            <h4>会话分类分布</h4>
            ${Object.entries(sessionCategories).map(([category, count]) => `
                <div class="stat-item">
                    <span class="stat-label">${category}</span>
                    <span class="stat-value">${count}</span>
                </div>
            `).join('')}
        `;
    }

    static isProjectRelated(session) {
        const title = session.title.toLowerCase();
        return title.includes('cursor-chat-memory') || title.includes('提示词');
    }

    static detectCategory(session) {
        const title = session.title.toLowerCase();
        if (title.includes('实现') || title.includes('功能')) return '功能实现';
        if (title.includes('架构') || title.includes('设计')) return '架构设计';
        if (title.includes('问题') || title.includes('错误')) return '问题调试';
        if (title.includes('优化') || title.includes('性能')) return '性能优化';
        return '其他';
    }
}

// 项目知识管理
class KnowledgeManager {
    static knowledgeState = {
        sessions: [],
        selectedSession: null,
        extractedContent: null,
        globalKnowledge: [],
        currentProject: 'cursor-chat-memory',
        isProcessing: false
    };

    static init() {
        console.log('🧠 初始化项目知识管理...');
        this.loadProjectSessions();
        this.loadGlobalKnowledge();
        this.bindEvents();
    }

    static bindEvents() {
        // 搜索会话
        const searchInput = document.getElementById('sessionSearch');
        if (searchInput) {
            const debouncedSearch = PerformanceUtils.debounce((value) => {
                this.searchSessions(value);
            }, 300);
            
            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
        }

        // 项目过滤
        const projectFilter = document.getElementById('projectFilter');
        if (projectFilter) {
            projectFilter.addEventListener('change', (e) => {
                this.filterByProject(e.target.value);
            });
        }

        // 知识分类过滤
        const knowledgeFilter = document.getElementById('knowledgeFilter');
        if (knowledgeFilter) {
            knowledgeFilter.addEventListener('change', (e) => {
                this.filterKnowledge(e.target.value);
            });
        }
    }

    static async loadProjectSessions() {
        this.setProcessing(true, '正在加载项目会话...');
        
        try {
            console.log('📡 加载项目会话数据...');
            
            let sessions = [];
            let usedFixedData = false;
            
            // 🆕 优先尝试从原始会话API获取完整数据结构
            try {
                console.log('🔍 尝试获取原始会话数据...');
                const response = await APIClient.get('/api/sessions');
                sessions = response.sessions || [];
                
                if (sessions.length > 0) {
                    console.log(`✅ 获取到 ${sessions.length} 个原始会话`);
                }
            } catch (originalApiError) {
                console.log('⚠️ 原始会话API不可用');
            }
            
            // 🆕 尝试从修复后数据API获取补充数据
            try {
                console.log('🔍 尝试获取修复后的Cursor数据作为补充...');
                const cursorDataResponse = await fetch('http://localhost:3001/api/cursor-data');
                
                if (cursorDataResponse.ok) {
                    const cursorData = await cursorDataResponse.json();
                    
                    if (cursorData.success && cursorData.data) {
                        console.log(`✅ 成功获取修复后数据 - 今天${cursorData.data.todayPromptsCount}个提示词, ${cursorData.data.todayGenerationsCount}个回复`);
                        const fixedSessions = this.convertCursorDataToSessions(cursorData.data);
                        
                        // 合并数据：用修复后的数据补充原始数据
                        const mergedSessions = this.mergeSessionData(sessions, fixedSessions);
                        sessions = mergedSessions;
                        usedFixedData = true;
                        
                        console.log(`📊 合并后会话数量: ${sessions.length} (包含今天${cursorData.data.todayPromptsCount}个最新对话)`);
                    }
                }
            } catch (cursorApiError) {
                console.log('⚠️ 修复后数据API不可用');
            }
            
            // 如果没有任何数据，使用模拟数据
            if (sessions.length === 0) {
                console.log('📝 使用模拟数据');
                sessions = [
                    {
                        id: 'session_1',
                        title: '实现cursor-chat-memory提示词中心模块',
                        category: 'implementation',
                        timestamp: '2025-01-14T10:30:00',
                        project: 'cursor-chat-memory',
                        messages: [
                            {
                                role: 'user',
                                content: '我需要实现一个提示词中心模块，能够管理和组织各种AI提示词模板',
                                timestamp: '2025-01-14T10:30:00'
                            },
                            {
                                role: 'assistant', 
                                content: '我来帮你设计一个功能完整的提示词中心模块。这个模块需要包含以下核心功能：\n\n1. **提示词模板管理**\n   - 创建、编辑、删除提示词\n   - 分类和标签管理\n   - 版本控制\n\n2. **智能搜索和过滤**\n   - 关键词搜索\n   - 分类筛选\n   - 使用频率排序\n\n3. **模板应用**\n   - 一键应用到聊天\n   - 参数化模板支持\n   - 历史使用记录',
                                timestamp: '2025-01-14T10:31:00'
                            }
                        ]
                    },
                    {
                        id: 'session_2',
                        title: '优化SQLite数据库查询性能',
                        category: 'optimization',
                        timestamp: '2025-01-14T09:15:00',
                        project: 'cursor-chat-memory',
                        messages: [
                            {
                                role: 'user',
                                content: '我的SQLite数据库查询很慢，需要优化性能',
                                timestamp: '2025-01-14T09:15:00'
                            },
                            {
                                role: 'assistant',
                                content: '针对SQLite性能优化，我建议从以下几个方面入手：\n\n1. **索引优化**\n   - 为经常查询的字段添加索引\n   - 使用复合索引优化多字段查询\n\n2. **查询优化**\n   - 使用EXPLAIN QUERY PLAN分析查询\n   - 避免SELECT *，只查询需要的字段\n\n3. **数据库配置**\n   - 调整cache_size\n   - 使用WAL模式\n   - 合理设置synchronous',
                                timestamp: '2025-01-14T09:16:00'
                            }
                        ]
                    }
                ];
            }
            
            this.knowledgeState.sessions = sessions;
            this.renderSessionsList();
            this.updateStats();
            
            if (typeof NotificationManager !== 'undefined') {
                const message = usedFixedData 
                    ? `已加载 ${sessions.length} 个会话（包含修复后数据）` 
                    : `已加载 ${sessions.length} 个原始会话`;
                NotificationManager.success(message);
            }
            
        } catch (error) {
            console.error('❌ 加载会话数据失败:', error);
            this.knowledgeState.sessions = [];
            this.renderSessionsList();
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.error('加载会话数据失败');
            }
        } finally {
            this.setProcessing(false);
        }
    }

    // 🆕 合并原始会话数据和修复后数据
    static mergeSessionData(originalSessions, fixedSessions) {
        const merged = [...originalSessions];
        const originalTitles = new Set(originalSessions.map(s => s.title));
        
        // 添加修复后数据中不存在于原始数据的会话
        fixedSessions.forEach(fixedSession => {
            if (!originalTitles.has(fixedSession.title)) {
                merged.push(fixedSession);
            }
        });
        
        // 按时间戳降序排序
        return merged.sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeB - timeA;
        });
    }

    // 🆕 将Cursor数据转换为会话格式的辅助方法
    static convertCursorDataToSessions(cursorData) {
        const sessions = [];
        const prompts = cursorData.improvedPrompts || [];
        const todayPrompts = cursorData.todayPrompts || [];
        
        // 优先处理今天的提示词
        if (todayPrompts.length > 0) {
            console.log(`🔥 处理今天的${todayPrompts.length}个最新对话...`);
            
            // 按小时分组今天的对话
            const hourGroups = new Map();
            
            todayPrompts.forEach((prompt, index) => {
                const time = new Date(prompt.improvedTimestamp);
                const hourKey = `${time.getFullYear()}-${time.getMonth()}-${time.getDate()}-${time.getHours()}`;
                
                if (!hourGroups.has(hourKey)) {
                    hourGroups.set(hourKey, {
                        hour: time.getHours(),
                        prompts: [],
                        timestamp: prompt.improvedTimestamp,
                        isToday: true
                    });
                }
                
                hourGroups.get(hourKey).prompts.push(prompt);
            });
            
            // 为今天的对话创建会话
            Array.from(hourGroups.values()).forEach((group, index) => {
                const firstPrompt = group.prompts[0];
                const content = firstPrompt?.text || firstPrompt?.content || '';
                const messages = this.convertPromptsToMessages(group.prompts);
                const detectedProject = this.detectProject(content, messages);
                
                // 只有真正属于cursor-chat-memory项目的会话才归类到项目下
                if (detectedProject === 'cursor-chat-memory') {
                    sessions.push({
                        id: `today-session-${index}`,
                        title: this.extractSessionTitle(content),
                        category: firstPrompt?.category || 'general',
                        timestamp: new Date(group.timestamp).toISOString(),
                        project: detectedProject,
                        isToday: true,
                        messages: messages
                    });
                }
            });
        }
        
        // 处理其他时间的提示词（跳过今天已处理的）
        const otherPrompts = prompts.filter(p => !p.isToday);
        if (otherPrompts.length > 0) {
            // 按日期分组
            const dateGroups = new Map();
            
            otherPrompts.forEach((prompt, index) => {
                const time = new Date(prompt.improvedTimestamp);
                const dateKey = time.toDateString();
                
                if (!dateGroups.has(dateKey)) {
                    dateGroups.set(dateKey, {
                        date: dateKey,
                        prompts: [],
                        timestamp: prompt.improvedTimestamp
                    });
                }
                
                dateGroups.get(dateKey).prompts.push(prompt);
            });
            
            // 转换为会话格式
            Array.from(dateGroups.values()).forEach((group, index) => {
                const firstPrompt = group.prompts[0];
                const content = firstPrompt?.text || firstPrompt?.content || '';
                const messages = this.convertPromptsToMessages(group.prompts);
                const detectedProject = this.detectProject(content, messages);
                
                // 只有真正属于cursor-chat-memory项目的会话才归类到项目下
                if (detectedProject === 'cursor-chat-memory') {
                    sessions.push({
                        id: `cursor-session-${index}`,
                        title: this.extractSessionTitle(content),
                        category: firstPrompt?.category || 'general',
                        timestamp: new Date(group.timestamp).toISOString(),
                        project: detectedProject,
                        messages: messages
                    });
                }
            });
        }
        
        return sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // 🆕 智能检测会话所属项目
    static detectProject(content, messages) {
        const lowerContent = content.toLowerCase();
        
        // 如果有完整的消息列表，分析整个会话的主要内容
        if (messages && messages.length > 0) {
            // 合并所有消息内容进行分析
            const fullContent = messages.map(msg => msg.content || msg.text || '').join(' ');
            const lowerFullContent = fullContent.toLowerCase();
            
            console.log(`🔍 分析完整会话: ${messages.length} 条消息, 总长度: ${fullContent.length} 字符`);
            
            // 统计项目相关关键词出现次数
            const projectKeywords = [
                'cursor chat memory', 'cursor-chat-memory',
                '聊天记忆', '聊天历史', '会话管理', '提示词中心',
                '历史会话', 'chat记录', '智能引用',
                'sqlitechatreader', 'chatmemoryservice',
                'promptcenter', 'web管理界面',
                '插件功能', 'vscode插件', 'extension',
                '项目知识', '智能分析', '提示词管理',
                'chat history', 'show chat', 'chat目录',
                'webserver.ts', 'script.js', 'index.html',
                'web/', 'src/', '.ts', '.js',
                '归档', '提炼', '总结', '分析',
                '加载会话', '显示历史', '统计分析',
                '项目迭代', '工程知识', '内容提取',
                '插件正常工作', '检测到项目',
                '启动失败', '修改代码'
            ];
            
            let projectKeywordCount = 0;
            projectKeywords.forEach(keyword => {
                const matches = (lowerFullContent.match(new RegExp(keyword, 'g')) || []).length;
                projectKeywordCount += matches;
            });
            
            // 统计通用关键词出现次数
            const generalKeywords = [
                '如何优化网站性能', '怎么做', '什么是',
                '帮我看下25年', '主要客户', '售前', '评分系统',
                '客户管理', '数据分析', 'bi项目'
            ];
            
            let generalKeywordCount = 0;
            generalKeywords.forEach(keyword => {
                const matches = (lowerFullContent.match(new RegExp(keyword, 'g')) || []).length;
                generalKeywordCount += matches;
            });
            
            // 特殊处理：如果是GitHub拉取开头，但后续内容大量涉及项目开发
            const startsWithGitHubPull = fullContent.includes('@https://github.com/') && 
                                       (lowerFullContent.includes('帮我拉取') || lowerFullContent.includes('拉取最新'));
            
            console.log(`📊 关键词统计: 项目相关=${projectKeywordCount}, 通用=${generalKeywordCount}`);
            
            // 判断归属
            if (startsWithGitHubPull && projectKeywordCount > 10) {
                console.log('✅ GitHub拉取开头，但后续大量项目开发内容 → cursor-chat-memory');
                return 'cursor-chat-memory';
            } else if (projectKeywordCount > generalKeywordCount && projectKeywordCount > 5) {
                console.log('✅ 项目相关内容占主导 → cursor-chat-memory');
                return 'cursor-chat-memory';
            } else if (generalKeywordCount > projectKeywordCount) {
                console.log('❌ 通用内容占主导 → general');
                return 'general';
            } else if (projectKeywordCount > 0) {
                console.log('✅ 包含项目相关内容 → cursor-chat-memory');
                return 'cursor-chat-memory';
            }
            
            console.log('❌ 未检测到明确项目归属 → general');
            return 'general';
        }
        
        // 排除：明确的通用问题（单一问题场景）
        if (lowerContent.includes('如何优化网站性能') || 
            lowerContent.includes('怎么做') || 
            lowerContent.includes('什么是') ||
            lowerContent.includes('帮我看下25年') ||
            lowerContent.includes('主要客户')) {
            console.log('❌ 排除通用问题:', content.substring(0, 50) + '...');
            return 'general';
        }
        
        // cursor-chat-memory项目相关关键词
        const projectKeywords = [
            'cursor chat memory', 'cursor-chat-memory',
            '聊天记忆', '聊天历史', '会话管理', '提示词中心',
            '历史会话', 'chat记录', '智能引用',
            'sqlitechatreader', 'chatmemoryservice',
            'promptcenter', 'web管理界面',
            '插件功能', 'vscode插件', 'extension',
            '项目知识', '智能分析', '提示词管理',
            'chat history', 'show chat', 'chat目录',
            'webserver.ts', 'script.js', 'index.html'
        ];
        
        // 项目功能相关关键词
        const featureKeywords = [
            '归档', '提炼', '总结', '分析',
            '加载会话', '显示历史', '统计分析',
            '项目迭代', '工程知识', '内容提取',
            '插件正常工作', '检测到项目',
            '启动失败', '修改代码', 'web/', 'src/'
        ];
        
        // 检查是否包含项目关键词
        const hasProjectKeywords = projectKeywords.some(keyword => 
            lowerContent.includes(keyword)
        );
        
        // 检查是否包含功能关键词
        const hasFeatureKeywords = featureKeywords.some(keyword => 
            lowerContent.includes(keyword)
        );
        
        // 检查是否提到具体的项目文件或组件
        const hasProjectFiles = lowerContent.includes('webserver.ts') || 
                               lowerContent.includes('script.js') || 
                               lowerContent.includes('web/') ||
                               lowerContent.includes('src/') ||
                               lowerContent.includes('index.html') ||
                               lowerContent.includes('chatmemoryservice') ||
                               lowerContent.includes('promptcenter');
        
        // 判断是否属于cursor-chat-memory项目
        if (hasProjectKeywords || hasFeatureKeywords || hasProjectFiles) {
            console.log('✅ 检测到项目相关会话:', content.substring(0, 50) + '...');
            return 'cursor-chat-memory';
        }
        
        console.log('❌ 非项目相关会话:', content.substring(0, 50) + '...');
        return 'general';
    }

    // 🆕 提取会话标题
    static extractSessionTitle(content) {
        const firstSentence = content.split(/[。！？\n]/)[0];
        const title = firstSentence.substring(0, 50);
        return title || '未命名会话';
    }

    // 🆕 将提示词转换为消息格式
    static convertPromptsToMessages(prompts) {
        return prompts.map(prompt => ({
            role: 'user',
            content: prompt.text || prompt.content || '',
            timestamp: new Date(prompt.improvedTimestamp).toISOString()
        }));
    }

    static searchSessions(query) {
        if (!query.trim()) {
            this.renderSessionsList();
            return;
        }
        
        const filtered = this.knowledgeState.sessions.filter(session =>
            session.title.toLowerCase().includes(query.toLowerCase()) ||
            session.messages.some(msg => 
                msg.content.toLowerCase().includes(query.toLowerCase())
            )
        );
        
        this.renderSessionsList(filtered);
    }

    static filterByProject(project) {
        if (project === 'all') {
            this.renderSessionsList();
            return;
        }
        
        const filtered = this.knowledgeState.sessions.filter(session =>
            session.project === project
        );
        
        this.renderSessionsList(filtered);
    }

    static renderSessionsList(sessions = this.knowledgeState.sessions) {
        const container = document.getElementById('sessionsList');
        
        if (sessions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>🔍 没有找到匹配的会话</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = sessions.map(session => `
            <div class="session-item" onclick="KnowledgeManager.selectSession('${session.id}')">
                <div class="session-title">${session.title}</div>
                <div class="session-meta">
                    <span class="session-category ${session.category}">${this.getCategoryLabel(session.category)}</span>
                    <span class="session-time">${new Date(session.timestamp).toLocaleDateString()}</span>
                    <span class="session-project">${session.project}</span>
                </div>
            </div>
        `).join('');
    }

    static getCategoryLabel(category) {
        const labels = {
            'implementation': '功能实现',
            'architecture': '架构设计', 
            'debugging': '问题调试',
            'optimization': '性能优化'
        };
        return labels[category] || '其他';
    }

    static selectSession(sessionId) {
        const session = this.knowledgeState.sessions.find(s => s.id === sessionId);
        if (!session) return;
        
        this.knowledgeState.selectedSession = session;
        
        // 更新选中状态
        document.querySelectorAll('.session-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.closest('.session-item').classList.add('active');
        
        this.renderSessionContent(session);
    }

    static renderSessionContent(session) {
        const container = document.getElementById('contentDetail');
        
        container.innerHTML = `
            <div class="session-messages">
                ${session.messages.map(message => `
                    <div class="message-item ${message.role}">
                        <div class="message-header">
                            <span class="message-role">${message.role === 'user' ? '👤 用户' : '🤖 助手'}</span>
                            <span class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div class="message-content">${this.formatMessageContent(message.content)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    static formatMessageContent(content) {
        // 格式化消息内容，支持Markdown语法
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    static async extractContent() {
        if (!this.knowledgeState.selectedSession) {
            NotificationManager.warning('请先选择一个会话');
            return;
        }
        
        this.setProcessing(true, '正在提炼核心内容...');
        
        try {
            // 模拟AI提炼过程
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const extracted = this.generateMockKnowledgeExtraction(this.knowledgeState.selectedSession);
            this.knowledgeState.extractedContent = extracted;
            
            this.showExtractedContent(extracted);
            NotificationManager.success('内容提炼完成！');
            
        } catch (error) {
            console.error('提炼失败:', error);
            NotificationManager.error('内容提炼失败');
        } finally {
            this.setProcessing(false);
        }
    }

    static generateMockKnowledgeExtraction(session) {
        // 根据会话内容生成模拟的知识提炼结果
        const knowledgeItems = [];
        
        if (session.category === 'implementation') {
            knowledgeItems.push({
                type: 'SOP',
                title: '提示词模块实现标准流程',
                content: '1. 分析需求和功能设计\n2. 创建数据模型和API接口\n3. 实现前端界面组件\n4. 集成搜索和过滤功能\n5. 测试和优化性能',
                source: session.title,
                timestamp: new Date().toISOString()
            });
            
            knowledgeItems.push({
                type: '实现方案',
                title: '模块化架构设计',
                content: '采用组件化设计，分离数据层、业务层和表现层，确保代码可维护性和扩展性',
                source: session.title,
                timestamp: new Date().toISOString()
            });
        }
        
        if (session.category === 'optimization') {
            knowledgeItems.push({
                type: '性能优化',
                title: 'SQLite查询优化最佳实践',
                content: '使用索引、优化查询语句、调整数据库配置参数，可显著提升查询性能',
                source: session.title,
                timestamp: new Date().toISOString()
            });
        }
        
        return {
            sessionId: session.id,
            sessionTitle: session.title,
            extractedAt: new Date().toISOString(),
            knowledgeItems
        };
    }

    static showExtractedContent(extracted) {
        const container = document.getElementById('contentDetail');
        const currentContent = container.innerHTML;
        
        container.innerHTML = currentContent + `
            <div class="extracted-content">
                <div class="content-comparison">
                    <div class="comparison-header">
                        <h4>🧠 智能提炼结果</h4>
                        <button class="btn btn-primary" onclick="KnowledgeManager.saveToGlobalKnowledge()">
                            💾 保存到全局记忆
                        </button>
                    </div>
                    <div class="extraction-result">
                        ${extracted.knowledgeItems.map(item => `
                            <div class="knowledge-item">
                                <div class="knowledge-type">${item.type}</div>
                                <div class="knowledge-content-text">${item.content}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    static loadGlobalKnowledge() {
        // 加载全局知识库
        this.knowledgeState.globalKnowledge = [
            {
                id: 'kb_1',
                category: 'sop',
                title: '项目开发标准流程',
                description: '从需求分析到部署上线的完整开发流程',
                content: '需求分析 → 技术选型 → 架构设计 → 编码实现 → 测试验证 → 部署上线',
                source: '实现cursor-chat-memory提示词中心模块',
                createdAt: '2025-01-14T10:00:00'
            },
            {
                id: 'kb_2', 
                category: 'architecture',
                title: '前端组件化架构',
                description: '基于组件化的前端架构设计原则',
                content: '采用模块化设计，分离关注点，提高代码复用性和可维护性',
                source: '前端架构优化讨论',
                createdAt: '2025-01-14T09:30:00'
            }
        ];
        
        this.renderGlobalKnowledge();
    }

    static renderGlobalKnowledge() {
        const container = document.getElementById('knowledgeContent');
        
        if (this.knowledgeState.globalKnowledge.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>🧠 暂无全局知识</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.knowledgeState.globalKnowledge.map(knowledge => `
            <div class="global-knowledge-item">
                <div class="knowledge-header">
                    <h4 class="knowledge-title">${knowledge.title}</h4>
                    <span class="knowledge-category-tag ${knowledge.category}">
                        ${this.getCategoryTag(knowledge.category)}
                    </span>
                </div>
                <p class="knowledge-description">${knowledge.description}</p>
                <div class="knowledge-details">${knowledge.content}</div>
                <div class="knowledge-source">
                    来源: ${knowledge.source} • ${new Date(knowledge.createdAt).toLocaleDateString()}
                </div>
            </div>
        `).join('');
    }

    static getCategoryTag(category) {
        const tags = {
            'sop': '操作规范',
            'architecture': '架构设计', 
            'implementation': '实现方案',
            'engineering': '工程实践'
        };
        return tags[category] || category;
    }

    static filterKnowledge(category) {
        if (category === 'all') {
            this.renderGlobalKnowledge();
            return;
        }
        
        const filtered = this.knowledgeState.globalKnowledge.filter(item =>
            item.category === category
        );
        
        const container = document.getElementById('knowledgeContent');
        container.innerHTML = filtered.map(knowledge => `
            <div class="global-knowledge-item">
                <div class="knowledge-header">
                    <h4 class="knowledge-title">${knowledge.title}</h4>
                    <span class="knowledge-category-tag ${knowledge.category}">
                        ${this.getCategoryTag(knowledge.category)}
                    </span>
                </div>
                <p class="knowledge-description">${knowledge.description}</p>
                <div class="knowledge-details">${knowledge.content}</div>
                <div class="knowledge-source">
                    来源: ${knowledge.source} • ${new Date(knowledge.createdAt).toLocaleDateString()}
                </div>
            </div>
        `).join('');
    }

    static exportKnowledge() {
        const data = {
            sessions: this.knowledgeState.sessions,
            globalKnowledge: this.knowledgeState.globalKnowledge,
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `knowledge-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        NotificationManager.success('知识库已导出');
    }

    static refreshData() {
        this.loadProjectSessions();
        this.loadGlobalKnowledge();
        NotificationManager.success('数据已刷新');
    }

    static updateStats() {
        const sessionCount = this.knowledgeState.sessions.length;
        const knowledgeCount = this.knowledgeState.globalKnowledge.length;
        
        document.getElementById('sessionCount').textContent = `会话: ${sessionCount}`;
        document.getElementById('knowledgeCount').textContent = `知识条目: ${knowledgeCount}`;
        document.getElementById('lastUpdate').textContent = `最后更新: ${new Date().toLocaleTimeString()}`;
    }

    static setProcessing(isProcessing, message = '') {
        this.knowledgeState.isProcessing = isProcessing;
        const btn = document.getElementById('extractBtn');
        
        if (btn) {
            btn.disabled = isProcessing;
            btn.textContent = isProcessing ? `⏳ ${message}` : '🔍 提炼核心内容';
        }
    }

    static async saveToGlobalKnowledge() {
        if (!this.knowledgeState.extractedContent) {
            NotificationManager.warning('没有可保存的提炼内容');
            return;
        }
        
        const extracted = this.knowledgeState.extractedContent;
        
        // 将提炼的内容添加到全局知识库
        extracted.knowledgeItems.forEach(item => {
            this.knowledgeState.globalKnowledge.push({
                id: `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                category: item.type.toLowerCase(),
                title: item.title,
                description: `从会话"${extracted.sessionTitle}"中提炼`,
                content: item.content,
                source: extracted.sessionTitle,
                createdAt: new Date().toISOString()
            });
        });
        
        this.renderGlobalKnowledge();
        this.updateStats();
        
        NotificationManager.success('已保存到全局知识库');
    }
}

// 标签页管理
class TabManager {
    static switchTab(tabName) {
        // 隐藏所有标签内容
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // 移除所有标签按钮的active类
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 显示选中的标签内容
        const targetTab = document.getElementById(`${tabName}-tab`);
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // 激活对应的标签按钮
        const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
        
        // 更新状态
        state.currentTab = tabName;
        
        // 初始化对应功能
        switch (tabName) {
            case 'extraction':
                if (typeof KnowledgeManager !== 'undefined') {
                    KnowledgeManager.init();
                }
                break;
            case 'analysis':
                if (typeof AnalysisManager !== 'undefined') {
                    AnalysisManager.init();
                }
                break;
            case 'analytics':
                if (typeof AnalyticsManager !== 'undefined') {
                    AnalyticsManager.loadAnalytics();
                }
                break;
        }
    }
}

// 性能监控
class PerformanceMonitor {
    static init() {
        this.measureCoreWebVitals();
        this.monitorResourceLoading();
        this.monitorUserInteractions();
    }

    static measureCoreWebVitals() {
        // 监控核心Web性能指标
        if ('web-vitals' in window) {
            // 如果有web-vitals库，使用它
            return;
        }
        
        // 简单的性能监控
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];
            const metrics = {
                FCP: navigation.responseEnd - navigation.fetchStart,
                LCP: navigation.loadEventEnd - navigation.fetchStart,
                pageLoadTime: navigation.loadEventEnd - navigation.fetchStart
            };
            
            this.sendMetrics(metrics);
        });
    }

    static monitorResourceLoading() {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                if (entry.duration > 1000) {
                    console.warn(`慢资源加载: ${entry.name} - ${entry.duration}ms`);
                }
            });
        });
        
        observer.observe({ entryTypes: ['resource'] });
    }

    static monitorUserInteractions() {
        ['click', 'keydown', 'scroll'].forEach(eventType => {
            document.addEventListener(eventType, () => {
                // 记录用户交互
            }, { passive: true });
        });
    }

    static sendMetrics(data) {
        // 发送性能数据到分析服务
        console.log('性能指标:', data);
    }
}

// 页面初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Cursor Chat Memory 管理中心初始化...');
    
    // 初始化性能监控
    PerformanceMonitor.init();
    
    // 默认显示项目知识标签页
    TabManager.switchTab('extraction');
    
    // 初始化全局事件
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            location.reload();
        });
    }
    
    console.log('✅ 初始化完成');
});

 
 