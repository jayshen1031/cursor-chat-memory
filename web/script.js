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
        this.sessions = [];
        this.prompts = [];
        this.selectedSession = null;
        this.selectedPrompt = null;
        this.currentTab = 'sessions';
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

// 会话管理
class SessionManager {
    static async loadSessions() {
        try {
            LoadingManager.show();
            const response = await APIClient.get('/api/sessions');
            state.sessions = response.sessions || [];
            this.renderSessions();
            NotificationManager.success(`已加载 ${state.sessions.length} 个会话`);
        } catch (error) {
            NotificationManager.error('加载会话失败: ' + error.message);
        } finally {
            LoadingManager.hide();
        }
    }

    static async searchSessions() {
        const query = document.getElementById('sessionSearch').value;
        const category = document.getElementById('categoryFilter').value;
        
        if (!query.trim()) {
            this.renderSessions();
            return;
        }

        try {
            LoadingManager.show();
            const response = await APIClient.post('/api/sessions/search', { 
                query,
                category: category || undefined
            });
            
            const filteredSessions = response.results || [];
            this.renderSessions(filteredSessions);
            NotificationManager.success(`找到 ${filteredSessions.length} 个匹配的会话`);
        } catch (error) {
            NotificationManager.error('搜索会话失败: ' + error.message);
        } finally {
            LoadingManager.hide();
        }
    }

    // 优化的防抖搜索方法
    static debouncedSearchSessions = PerformanceUtils.debounce(SessionManager.searchSessions.bind(SessionManager), 300);

    static renderSessions(sessions = state.sessions) {
        const container = document.getElementById('sessionsContainer');
        
        if (sessions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>暂无会话记录</p>
                </div>
            `;
            return;
        }

        container.innerHTML = sessions.map(session => `
            <div class="session-item" data-id="${session.id}" onclick="SessionManager.selectSession('${session.id}')">
                <div class="session-title">${session.summary || session.id}</div>
                <div class="session-meta">
                    <span class="importance-stars">${'★'.repeat(session.importance || 1)}</span>
                    ${session.category ? `<span class="tag category-tag">${session.category}</span>` : ''}
                    <span class="tag">${new Date(session.timestamp).toLocaleDateString()}</span>
                </div>
                <div class="session-summary">${session.content?.substring(0, 100)}...</div>
            </div>
        `).join('');
    }

    static selectSession(sessionId) {
        // 更新选中状态
        document.querySelectorAll('.session-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const selectedItem = document.querySelector(`[data-id="${sessionId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }

        // 显示会话详情
        const session = state.sessions.find(s => s.id === sessionId);
        if (session) {
            state.selectedSession = session;
            this.renderSessionDetail(session);
        }
    }

    static renderSessionDetail(session) {
        const container = document.getElementById('sessionDetailContainer');
        
        container.innerHTML = `
            <div class="detail-header">
                <div class="detail-title">${session.summary || session.id}</div>
                <div class="session-meta">
                    <span class="importance-stars">${'★'.repeat(session.importance || 1)}</span>
                    ${session.category ? `<span class="tag category-tag">${session.category}</span>` : ''}
                    <span class="tag">${new Date(session.timestamp).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="detail-content">
                <h4>会话内容</h4>
                <pre style="white-space: pre-wrap; font-family: inherit; line-height: 1.6;">${session.content || '暂无内容'}</pre>
                ${session.context ? `
                    <h4 style="margin-top: 2rem;">上下文信息</h4>
                    <pre style="white-space: pre-wrap; font-family: inherit; line-height: 1.6;">${session.context}</pre>
                ` : ''}
            </div>
            <div class="detail-actions">
                <button class="btn btn-primary" onclick="SessionManager.generateReference('${session.id}')">
                    生成引用
                </button>
                <button class="btn btn-secondary" onclick="SessionManager.copyContent('${session.id}')">
                    复制内容
                </button>
            </div>
        `;
    }

    static async generateReference(sessionId) {
        try {
            LoadingManager.show();
            const response = await APIClient.post('/api/sessions/enhanced-reference', {
                templateId: 'current-topic',
                inputText: state.selectedSession?.content || ''
            });
            
            // 切换到引用生成标签页并显示结果
            TabManager.switchTab('reference');
            document.getElementById('referenceOutput').textContent = response.reference;
            document.getElementById('copyReferenceBtn').style.display = 'block';
            
            NotificationManager.success('引用内容已生成');
        } catch (error) {
            NotificationManager.error('生成引用失败: ' + error.message);
        } finally {
            LoadingManager.hide();
        }
    }

    static copyContent(sessionId) {
        const session = state.sessions.find(s => s.id === sessionId);
        if (session) {
            navigator.clipboard.writeText(session.content || '').then(() => {
                NotificationManager.success('内容已复制到剪贴板');
            });
        }
    }
}

// 提示词管理
class PromptManager {
    static async loadPrompts() {
        try {
            LoadingManager.show();
            const response = await APIClient.get('/api/prompts');
            state.prompts = response.prompts || [];
            this.renderPrompts();
            NotificationManager.success(`已加载 ${state.prompts.length} 个提示词`);
        } catch (error) {
            NotificationManager.error('加载提示词失败: ' + error.message);
        } finally {
            LoadingManager.hide();
        }
    }

    static async searchPrompts() {
        const query = document.getElementById('promptSearch').value;
        const category = document.getElementById('typeFilter').value;
        
        if (!query.trim()) {
            this.renderPrompts();
            return;
        }

        try {
            LoadingManager.show();
            const response = await APIClient.post('/api/prompts/search', { 
                query,
                category: category || undefined
            });
            
            const filteredPrompts = response.results || [];
            this.renderPrompts(filteredPrompts);
            NotificationManager.success(`找到 ${filteredPrompts.length} 个匹配的提示词`);
        } catch (error) {
            NotificationManager.error('搜索提示词失败: ' + error.message);
        } finally {
            LoadingManager.hide();
        }
    }

    static renderPrompts(prompts = state.prompts) {
        const container = document.getElementById('promptsContainer');
        
        if (prompts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>暂无提示词模板</p>
                </div>
            `;
            return;
        }

        container.innerHTML = prompts.map(prompt => `
            <div class="prompt-item" data-id="${prompt.id}" onclick="PromptManager.selectPrompt('${prompt.id}')">
                <div class="prompt-title">${prompt.title}</div>
                <div class="prompt-meta">
                    <span class="tag type-tag">${prompt.type}</span>
                    ${prompt.category ? `<span class="tag category-tag">${prompt.category}</span>` : ''}
                    <span class="tag">使用次数: ${prompt.usageCount || 0}</span>
                </div>
                <div class="prompt-description">${prompt.description?.substring(0, 100)}...</div>
            </div>
        `).join('');
    }

    static selectPrompt(promptId) {
        // 更新选中状态
        document.querySelectorAll('.prompt-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const selectedItem = document.querySelector(`.prompt-item[data-id="${promptId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }

        // 显示提示词详情
        const prompt = state.prompts.find(p => p.id === promptId);
        if (prompt) {
            state.selectedPrompt = prompt;
            this.renderPromptDetail(prompt);
        }
    }

    static renderPromptDetail(prompt) {
        const container = document.getElementById('promptDetailContainer');
        
        container.innerHTML = `
            <div class="detail-header">
                <div class="detail-title">${prompt.title}</div>
                <div class="prompt-meta">
                    <span class="tag type-tag">${prompt.type}</span>
                    ${prompt.category ? `<span class="tag category-tag">${prompt.category}</span>` : ''}
                    <span class="tag">评分: ${prompt.averageRating || 0}/5</span>
                    <span class="tag">使用次数: ${prompt.usageCount || 0}</span>
                </div>
            </div>
            <div class="detail-content">
                <h4>描述</h4>
                <p>${prompt.description || '暂无描述'}</p>
                
                <h4 style="margin-top: 2rem;">模板内容</h4>
                <pre style="white-space: pre-wrap; font-family: 'Monaco', monospace; background: #f7fafc; padding: 1rem; border-radius: 6px; line-height: 1.6;">${prompt.template}</pre>
                
                ${prompt.tags && prompt.tags.length > 0 ? `
                    <h4 style="margin-top: 2rem;">标签</h4>
                    <div class="prompt-meta">
                        ${prompt.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
                
                ${prompt.examples && prompt.examples.length > 0 ? `
                    <h4 style="margin-top: 2rem;">示例</h4>
                    ${prompt.examples.map(example => `
                        <div style="margin-bottom: 1rem; padding: 1rem; background: #f7fafc; border-radius: 6px;">
                            <strong>输入:</strong> ${example.input}<br>
                            <strong>输出:</strong> ${example.output}
                        </div>
                    `).join('')}
                ` : ''}
            </div>
            <div class="detail-actions">
                <button class="btn btn-primary" onclick="PromptManager.usePrompt('${prompt.id}')">
                    使用模板
                </button>
                <button class="btn btn-secondary" onclick="PromptManager.editPrompt('${prompt.id}')">
                    编辑
                </button>
                <button class="btn btn-danger" onclick="PromptManager.deletePrompt('${prompt.id}')">
                    删除
                </button>
            </div>
        `;
    }

    static usePrompt(promptId) {
        const prompt = state.prompts.find(p => p.id === promptId);
        if (prompt) {
            // 切换到引用生成标签页并填入模板
            TabManager.switchTab('reference');
            document.getElementById('contextInput').value = prompt.template;
            NotificationManager.success('模板已应用到引用生成器');
        }
    }

    static async editPrompt(promptId) {
        const prompt = state.prompts.find(p => p.id === promptId);
        if (!prompt) return;

        const content = `
            <form id="editPromptForm">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">标题</label>
                    <input type="text" name="title" value="${prompt.title}" style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 6px;">
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">描述</label>
                    <textarea name="description" rows="3" style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 6px;">${prompt.description || ''}</textarea>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">类型</label>
                    <select name="type" style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 6px;">
                        <option value="global" ${prompt.type === 'global' ? 'selected' : ''}>全局知识</option>
                        <option value="project" ${prompt.type === 'project' ? 'selected' : ''}>项目经验</option>
                        <option value="iteration" ${prompt.type === 'iteration' ? 'selected' : ''}>迭代记录</option>
                    </select>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">模板内容</label>
                    <textarea name="template" rows="8" style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 6px; font-family: Monaco, monospace;">${prompt.template}</textarea>
                </div>
            </form>
        `;

        ModalManager.show('编辑提示词', content, async () => {
            const form = document.getElementById('editPromptForm');
            const formData = new FormData(form);
            const updates = Object.fromEntries(formData);

            try {
                LoadingManager.show();
                await APIClient.put(`/api/prompts/${promptId}`, updates);
                await this.loadPrompts();
                NotificationManager.success('提示词更新成功');
            } catch (error) {
                NotificationManager.error('更新提示词失败: ' + error.message);
            } finally {
                LoadingManager.hide();
            }
        });
    }

    static async deletePrompt(promptId) {
        const prompt = state.prompts.find(p => p.id === promptId);
        if (!prompt) return;

        ModalManager.show(
            '确认删除',
            `确定要删除提示词 "${prompt.title}" 吗？此操作不可撤销。`,
            async () => {
                try {
                    LoadingManager.show();
                    await APIClient.delete(`/api/prompts/${promptId}`);
                    await this.loadPrompts();
                    document.getElementById('promptDetailContainer').innerHTML = `
                        <div class="empty-state">
                            <p>选择一个提示词查看详细信息</p>
                        </div>
                    `;
                    NotificationManager.success('提示词删除成功');
                } catch (error) {
                    NotificationManager.error('删除提示词失败: ' + error.message);
                } finally {
                    LoadingManager.hide();
                }
            }
        );
    }

    static async createPrompt() {
        const content = `
            <form id="createPromptForm">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">标题</label>
                    <input type="text" name="title" required style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 6px;">
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">描述</label>
                    <textarea name="description" rows="3" style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 6px;"></textarea>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">类型</label>
                    <select name="type" style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 6px;">
                        <option value="global">全局知识</option>
                        <option value="project">项目经验</option>
                        <option value="iteration">迭代记录</option>
                    </select>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">分类（可选）</label>
                    <input type="text" name="category" style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 6px;">
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">模板内容</label>
                    <textarea name="template" rows="8" required style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 6px; font-family: Monaco, monospace;"></textarea>
                </div>
            </form>
        `;

        ModalManager.show('创建新提示词', content, async () => {
            const form = document.getElementById('createPromptForm');
            const formData = new FormData(form);
            const promptData = Object.fromEntries(formData);

            try {
                LoadingManager.show();
                await APIClient.post('/api/prompts', promptData);
                await this.loadPrompts();
                NotificationManager.success('提示词创建成功');
            } catch (error) {
                NotificationManager.error('创建提示词失败: ' + error.message);
            } finally {
                LoadingManager.hide();
            }
        });
    }
}

// 引用生成器
class ReferenceGenerator {
    static async generateReference() {
        const context = document.getElementById('contextInput').value;
        const template = document.getElementById('templateSelect').value;
        const includePrompts = document.getElementById('includePrompts').checked;

        if (!context.trim()) {
            NotificationManager.warning('请输入上下文内容');
            return;
        }

        try {
            LoadingManager.show();
            const endpoint = includePrompts ? '/api/sessions/enhanced-reference' : '/api/sessions/reference';
            const response = await APIClient.post(endpoint, {
                templateId: template,
                inputText: context
            });
            
            document.getElementById('referenceOutput').textContent = response.reference;
            document.getElementById('copyReferenceBtn').style.display = 'block';
            
            NotificationManager.success('引用内容已生成');
        } catch (error) {
            NotificationManager.error('生成引用失败: ' + error.message);
        } finally {
            LoadingManager.hide();
        }
    }

    static async getRecommendations() {
        const context = document.getElementById('contextInput').value;

        if (!context.trim()) {
            NotificationManager.warning('请输入上下文内容');
            return;
        }

        try {
            LoadingManager.show();
            const [sessionResponse, promptResponse] = await Promise.all([
                APIClient.post('/api/sessions/recommendations', { inputText: context }),
                APIClient.post('/api/prompts/recommendations', { context: context })
            ]);
            
            const recommendations = {
                sessions: sessionResponse.recommendations || [],
                prompts: promptResponse.recommendations || []
            };

            this.showRecommendations(recommendations);
            NotificationManager.success('推荐内容已获取');
        } catch (error) {
            NotificationManager.error('获取推荐失败: ' + error.message);
        } finally {
            LoadingManager.hide();
        }
    }

    static showRecommendations(recommendations) {
        const content = `
            <div>
                <h4>推荐会话 (${recommendations.sessions.length})</h4>
                ${recommendations.sessions.length > 0 ? 
                    recommendations.sessions.map(session => `
                        <div style="margin: 0.5rem 0; padding: 0.75rem; background: #f7fafc; border-radius: 6px; cursor: pointer;" onclick="ReferenceGenerator.selectRecommendation('session', '${session.id}')">
                            <strong>${session.summary || session.id}</strong><br>
                            <small>${session.content?.substring(0, 100)}...</small>
                        </div>
                    `).join('') : 
                    '<p style="color: #666;">暂无推荐会话</p>'
                }
                
                <h4 style="margin-top: 2rem;">推荐提示词 (${recommendations.prompts.length})</h4>
                ${recommendations.prompts.length > 0 ? 
                    recommendations.prompts.map(prompt => `
                        <div style="margin: 0.5rem 0; padding: 0.75rem; background: #f7fafc; border-radius: 6px; cursor: pointer;" onclick="ReferenceGenerator.selectRecommendation('prompt', '${prompt.id}')">
                            <strong>${prompt.title}</strong><br>
                            <small>${prompt.description?.substring(0, 100)}...</small>
                        </div>
                    `).join('') : 
                    '<p style="color: #666;">暂无推荐提示词</p>'
                }
            </div>
        `;

        ModalManager.show('智能推荐', content);
    }

    static selectRecommendation(type, id) {
        ModalManager.hide();
        
        if (type === 'session') {
            TabManager.switchTab('sessions');
            SessionManager.selectSession(id);
        } else if (type === 'prompt') {
            TabManager.switchTab('prompts');
            PromptManager.selectPrompt(id);
        }
    }

    static copyReference() {
        const content = document.getElementById('referenceOutput').textContent;
        navigator.clipboard.writeText(content).then(() => {
            NotificationManager.success('引用内容已复制到剪贴板');
        });
    }
}

// 统计分析
class AnalyticsManager {
    static async loadAnalytics() {
        try {
            LoadingManager.show();
            
            // 获取会话和提示词数据来计算统计信息
            const [sessionsResponse, promptsResponse] = await Promise.all([
                APIClient.get('/api/sessions'),
                APIClient.get('/api/prompts')
            ]);

            const sessions = sessionsResponse.sessions || [];
            const prompts = promptsResponse.prompts || [];

            this.renderSessionStats(sessions);
            this.renderPromptStats(prompts);
            this.renderCategoryStats(sessions, prompts);
            
            NotificationManager.success('统计数据已加载');
        } catch (error) {
            NotificationManager.error('加载统计数据失败: ' + error.message);
        } finally {
            LoadingManager.hide();
        }
    }

    static renderSessionStats(sessions) {
        const container = document.getElementById('sessionStats');
        
        const totalSessions = sessions.length;
        const categoryCounts = {};
        const importanceCounts = {};
        
        sessions.forEach(session => {
            const category = session.category || '未分类';
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            
            const importance = session.importance || 1;
            importanceCounts[importance] = (importanceCounts[importance] || 0) + 1;
        });

        const topCategory = Object.entries(categoryCounts).sort(([,a], [,b]) => b - a)[0];
        const avgImportance = sessions.reduce((sum, s) => sum + (s.importance || 1), 0) / totalSessions || 0;

        container.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">总会话数</span>
                <span class="stat-value">${totalSessions}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">最多分类</span>
                <span class="stat-value">${topCategory ? `${topCategory[0]} (${topCategory[1]})` : '无'}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">平均重要度</span>
                <span class="stat-value">${avgImportance.toFixed(1)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">高重要度会话</span>
                <span class="stat-value">${sessions.filter(s => (s.importance || 1) >= 4).length}</span>
            </div>
        `;
    }

    static renderPromptStats(prompts) {
        const container = document.getElementById('promptStats');
        
        const totalPrompts = prompts.length;
        const typeCounts = {};
        const totalUsage = prompts.reduce((sum, p) => sum + (p.usageCount || 0), 0);
        const avgRating = prompts.reduce((sum, p) => sum + (p.averageRating || 0), 0) / totalPrompts || 0;
        
        prompts.forEach(prompt => {
            const type = prompt.type || '未分类';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        const topType = Object.entries(typeCounts).sort(([,a], [,b]) => b - a)[0];

        container.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">总提示词数</span>
                <span class="stat-value">${totalPrompts}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">最多类型</span>
                <span class="stat-value">${topType ? `${topType[0]} (${topType[1]})` : '无'}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">总使用次数</span>
                <span class="stat-value">${totalUsage}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">平均评分</span>
                <span class="stat-value">${avgRating.toFixed(1)}/5</span>
            </div>
        `;
    }

    static renderCategoryStats(sessions, prompts) {
        const container = document.getElementById('categoryStats');
        
        const sessionCategories = {};
        const promptCategories = {};
        
        sessions.forEach(session => {
            const category = session.category || '未分类';
            sessionCategories[category] = (sessionCategories[category] || 0) + 1;
        });
        
        prompts.forEach(prompt => {
            const category = prompt.category || prompt.type || '未分类';
            promptCategories[category] = (promptCategories[category] || 0) + 1;
        });

        const allCategories = new Set([...Object.keys(sessionCategories), ...Object.keys(promptCategories)]);
        
        container.innerHTML = Array.from(allCategories).map(category => `
            <div class="stat-item">
                <span class="stat-label">${category}</span>
                <span class="stat-value">会话:${sessionCategories[category] || 0} / 提示词:${promptCategories[category] || 0}</span>
            </div>
        `).join('');
    }
}

// 标签页管理
class TabManager {
    static switchTab(tabName) {
        // 更新标签按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // 更新内容显示
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        state.currentTab = tabName;

        // 根据标签页加载相应数据
        switch (tabName) {
            case 'sessions':
                if (state.sessions.length === 0) {
                    SessionManager.loadSessions();
                }
                break;
            case 'prompts':
                if (state.prompts.length === 0) {
                    PromptManager.loadPrompts();
                }
                break;
            case 'analytics':
                AnalyticsManager.loadAnalytics();
                break;
        }
    }
}

// 性能监控工具
class PerformanceMonitor {
    static init() {
        // Core Web Vitals 监控
        this.measureCoreWebVitals();
        
        // 资源加载监控
        this.monitorResourceLoading();
        
        // 用户交互监控
        this.monitorUserInteractions();
    }

    static measureCoreWebVitals() {
        // Cumulative Layout Shift (CLS)
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    console.log('CLS:', entry.value);
                }
            }
        }).observe({entryTypes: ['layout-shift']});

        // Largest Contentful Paint (LCP)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log('LCP:', lastEntry.startTime);
        }).observe({entryTypes: ['largest-contentful-paint']});

        // First Input Delay (FID)
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                console.log('FID:', entry.processingStart - entry.startTime);
            }
        }).observe({entryTypes: ['first-input']});
    }

    static monitorResourceLoading() {
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            const loadTime = perfData.loadEventEnd - perfData.fetchStart;
            
            // 发送监控数据
            this.sendMetrics({
                type: 'page-load',
                loadTime,
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
                timeToFirstByte: perfData.responseStart - perfData.fetchStart
            });
        });
    }

    static monitorUserInteractions() {
        // 监控点击延迟
        document.addEventListener('click', (e) => {
            const startTime = performance.now();
            requestAnimationFrame(() => {
                const endTime = performance.now();
                if (endTime - startTime > 16) { // 超过一帧的时间
                    console.warn('Click response time:', endTime - startTime, 'ms');
                }
            });
        });
    }

    static sendMetrics(data) {
        // 发送到分析服务
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/metrics', JSON.stringify(data));
        } else {
            fetch('/api/metrics', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            }).catch(() => {}); // 静默失败
        }
    }
}

// 应用初始化
document.addEventListener('DOMContentLoaded', function() {
    // 绑定标签页切换事件
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            TabManager.switchTab(this.dataset.tab);
        });
    });

    // 绑定搜索事件
    document.getElementById('searchSessionsBtn').addEventListener('click', SessionManager.searchSessions);
    document.getElementById('searchPromptsBtn').addEventListener('click', PromptManager.searchPrompts);
    
    // 绑定搜索框回车事件
    document.getElementById('sessionSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') SessionManager.searchSessions();
    });
    document.getElementById('promptSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') PromptManager.searchPrompts();
    });

    // 绑定提示词管理事件
    document.getElementById('createPromptBtn').addEventListener('click', PromptManager.createPrompt);

    // 绑定引用生成事件
    document.getElementById('generateReferenceBtn').addEventListener('click', ReferenceGenerator.generateReference);
    document.getElementById('getRecommendationsBtn').addEventListener('click', ReferenceGenerator.getRecommendations);
    document.getElementById('copyReferenceBtn').addEventListener('click', ReferenceGenerator.copyReference);

    // 绑定刷新按钮
    document.getElementById('refreshBtn').addEventListener('click', function() {
        switch (state.currentTab) {
            case 'sessions':
                SessionManager.loadSessions();
                break;
            case 'prompts':
                PromptManager.loadPrompts();
                break;
            case 'analytics':
                AnalyticsManager.loadAnalytics();
                break;
        }
    });

    // 初始化加载会话数据
    SessionManager.loadSessions();
});

// 初始化性能监控
document.addEventListener('DOMContentLoaded', () => {
    if (typeof PerformanceObserver !== 'undefined') {
        PerformanceMonitor.init();
    }
}); 