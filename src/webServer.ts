import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import { ChatMemoryService } from './chatMemoryService';
import { PromptCenter, PromptTemplate } from './promptCenter';
import { LocalAnalyzer } from './localAnalyzer';

export class WebServer {
  private server: http.Server;
  private memoryService: ChatMemoryService;
  private promptCenter: PromptCenter;
  private localAnalyzer: LocalAnalyzer;
  private port: number;
  private projectPath?: string;

  constructor(port: number = 3000, projectPath?: string) {
    this.port = port;
    this.projectPath = projectPath;
    this.memoryService = new ChatMemoryService(projectPath);
    this.promptCenter = this.memoryService.getPromptCenter();
    this.localAnalyzer = new LocalAnalyzer();
    this.server = this.createServer();
  }

  private createServer(): http.Server {
    return http.createServer(async (req, res) => {
      const parsedUrl = url.parse(req.url || '', true);
      const pathname = parsedUrl.pathname || '';
      const method = req.method || 'GET';

      // 设置CORS头
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      try {
        if (pathname === '/' || pathname === '/index.html') {
          await this.serveFile(res, 'web/index.html', 'text/html');
        } else if (pathname === '/style.css') {
          await this.serveFile(res, 'web/style.css', 'text/css');
        } else if (pathname === '/script.js') {
          await this.serveFile(res, 'web/script.js', 'application/javascript');
        } else if (pathname.startsWith('/api/')) {
          await this.handleAPI(req, res, pathname, method);
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      } catch (error) {
        console.error('Server error:', error);
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    });
  }

  private async serveFile(res: http.ServerResponse, filePath: string, contentType: string) {
    const fullPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } else {
      res.writeHead(404);
      res.end('File not found');
    }
  }

  private async handleAPI(req: http.IncomingMessage, res: http.ServerResponse, pathname: string, method: string) {
    const body = await this.getRequestBody(req);
    
    switch (pathname) {
      case '/api/sessions':
        if (method === 'GET') {
          await this.memoryService.start();
          const sessions = this.memoryService.getAllSessions();
          this.memoryService.stop();
          this.sendJSON(res, { sessions });
        }
        break;

      case '/api/sessions/search':
        if (method === 'POST') {
          const { query } = JSON.parse(body);
          await this.memoryService.start();
          const results = this.memoryService.searchSessions(query);
          this.memoryService.stop();
          this.sendJSON(res, { results });
        }
        break;

      case '/api/sessions/recommendations':
        if (method === 'POST') {
          const { inputText, maxSessions = 5 } = JSON.parse(body);
          await this.memoryService.start();
          const recommendations = this.memoryService.getRecommendedSessions(inputText, maxSessions);
          this.memoryService.stop();
          this.sendJSON(res, { recommendations });
        }
        break;

      case '/api/sessions/reference':
        if (method === 'POST') {
          const { templateId, inputText } = JSON.parse(body);
          await this.memoryService.start();
          const reference = this.memoryService.getReferenceByTemplate(templateId, inputText);
          this.memoryService.stop();
          this.sendJSON(res, { reference });
        }
        break;

      case '/api/sessions/enhanced-reference':
        if (method === 'POST') {
          const { templateId, inputText } = JSON.parse(body);
          await this.memoryService.start();
          const reference = this.memoryService.getEnhancedReference(templateId, inputText, true);
          this.memoryService.stop();
          this.sendJSON(res, { reference });
        }
        break;

      case '/api/sessions/count':
        if (method === 'GET') {
          try {
            await this.memoryService.start();
            const allSessions = this.memoryService.getAllSessions();
            const projectSessions = this.memoryService.getProjectSessions(this.projectPath);
            this.memoryService.stop();
            this.sendJSON(res, { 
              success: true, 
              count: projectSessions.length,
              totalCount: allSessions.length
            });
          } catch (error) {
            this.memoryService.stop();
            this.sendJSON(res, { 
              success: false, 
              error: error instanceof Error ? error.message : '获取会话数量失败' 
            });
          }
        }
        break;

      case '/api/prompts':
        if (method === 'GET') {
          const prompts = this.promptCenter.getAllPrompts();
          this.sendJSON(res, { prompts });
        } else if (method === 'POST') {
          const promptData = JSON.parse(body);
          const id = this.promptCenter.createPrompt(promptData);
          this.sendJSON(res, { id, success: true });
        }
        break;

      case '/api/prompts/search':
        if (method === 'POST') {
          const { query, category } = JSON.parse(body);
          const results = this.promptCenter.searchPrompts(query, category);
          this.sendJSON(res, { results });
        }
        break;

      case '/api/prompts/reference':
        if (method === 'POST') {
          const { templateIds, context } = JSON.parse(body);
          const reference = this.promptCenter.generateReference(templateIds, context);
          this.sendJSON(res, { reference });
        }
        break;

      case '/api/prompts/recommendations':
        if (method === 'POST') {
          const { context, maxPrompts = 3 } = JSON.parse(body);
          const recommendations = this.promptCenter.getRecommendedPrompts(context, maxPrompts);
          this.sendJSON(res, { recommendations });
        }
        break;

      case '/api/analysis/session-summary':
        if (method === 'POST') {
          const { sessionId, content, useLocal = true } = JSON.parse(body || '{}');
          try {
            const session = { id: sessionId, content };
            const result = await this.promptCenter.smartSummarizeSession(session, content, useLocal);
            this.sendJSON(res, { 
              success: true, 
              result,
              analyzer: useLocal ? '本地Claude' : 'Azure OpenAI'
            });
          } catch (error) {
            this.sendJSON(res, { 
              success: false, 
              error: error instanceof Error ? error.message : '分析失败' 
            });
          }
        }
        break;

      case '/api/analysis/smart-integrate':
        if (method === 'POST') {
          const { useLocal = true, projectOnly = false } = JSON.parse(body || '{}');
          try {
            const result = await this.promptCenter.smartIntegratePrompts(useLocal);
            this.sendJSON(res, { 
              success: true, 
              integrated: result.integrated,
              knowledgeBase: result.knowledgeBase,
              analyzer: useLocal ? '本地Claude' : 'Azure OpenAI',
              projectOnly
            });
          } catch (error) {
            this.sendJSON(res, { 
              success: false, 
              error: error instanceof Error ? error.message : '分析失败' 
            });
          }
        }
        break;

      case '/api/analysis/project-knowledge':
        if (method === 'POST') {
          const { useLocal = true, projectOnly = false } = JSON.parse(body || '{}');
          try {
            await this.memoryService.start();
            const allSessions = this.memoryService.getAllSessions();
            // 如果是项目模式，只获取项目相关的会话
            const sessions = projectOnly ? this.memoryService.getProjectSessions(this.projectPath) : allSessions;
            const knowledge = await this.promptCenter.generateProjectKnowledge(sessions, useLocal);
            this.memoryService.stop();
            this.sendJSON(res, { 
              success: true, 
              knowledge,
              analyzer: useLocal ? '本地Claude' : 'Azure OpenAI',
              projectOnly,
              sessionsAnalyzed: sessions.length
            });
          } catch (error) {
            this.memoryService.stop();
            this.sendJSON(res, { 
              success: false, 
              error: error instanceof Error ? error.message : '分析失败' 
            });
          }
        }
        break;

      case '/api/analysis/batch-summary':
        if (method === 'POST') {
          const { useLocal = true, maxSessions = 10, projectOnly = false } = JSON.parse(body || '{}');
          try {
            await this.memoryService.start();
            const allSessions = this.memoryService.getAllSessions();
            // 如果是项目模式，只获取项目相关的会话
            const projectSessions = projectOnly ? this.memoryService.getProjectSessions(this.projectPath) : allSessions;
            const sessions = projectSessions.slice(0, maxSessions);
            const results = [];
            
            for (const session of sessions) {
              try {
                const fullContent = session.summary + '\n\n消息内容:\n' + session.messages.map(m => `${m.role}: ${m.content}`).join('\n');
                const result = await this.promptCenter.smartSummarizeSession(session, fullContent, useLocal);
                results.push({ 
                  sessionId: session.id, 
                  success: true, 
                  prompt: result 
                });
              } catch (error) {
                results.push({ 
                  sessionId: session.id, 
                  success: false, 
                  error: error instanceof Error ? error.message : '分析失败' 
                });
              }
            }
            
            this.memoryService.stop();
            this.sendJSON(res, { 
              success: true, 
              results,
              analyzer: useLocal ? '本地Claude' : 'Azure OpenAI',
              processed: results.length,
              projectOnly,
              totalProjectSessions: projectSessions.length
            });
          } catch (error) {
            this.memoryService.stop();
            this.sendJSON(res, { 
              success: false, 
              error: error instanceof Error ? error.message : '批量分析失败' 
            });
          }
        }
        break;

      case '/api/knowledge/base':
        if (method === 'GET') {
          try {
            const knowledgeBasePath = path.join(this.projectPath || process.cwd(), '.cursor-memory', 'knowledge_base.json');
            if (fs.existsSync(knowledgeBasePath)) {
              const knowledgeBase = JSON.parse(fs.readFileSync(knowledgeBasePath, 'utf8'));
              this.sendJSON(res, { success: true, knowledgeBase });
            } else {
              this.sendJSON(res, { success: false, error: '知识库文件不存在' });
            }
          } catch (error) {
            this.sendJSON(res, { 
              success: false, 
              error: error instanceof Error ? error.message : '读取知识库失败' 
            });
          }
        }
        break;

      case '/api/knowledge/project':
        if (method === 'GET') {
          try {
            const projectKnowledgePath = path.join(this.projectPath || process.cwd(), '.cursor-memory', 'project_knowledge.json');
            if (fs.existsSync(projectKnowledgePath)) {
              const projectKnowledge = JSON.parse(fs.readFileSync(projectKnowledgePath, 'utf8'));
              this.sendJSON(res, { success: true, projectKnowledge });
            } else {
              this.sendJSON(res, { success: false, error: '项目知识图谱文件不存在' });
            }
          } catch (error) {
            this.sendJSON(res, { 
              success: false, 
              error: error instanceof Error ? error.message : '读取项目知识图谱失败' 
            });
          }
        }
        break;

      default:
        if (pathname.startsWith('/api/sessions/') && method === 'DELETE') {
          const id = pathname.split('/')[3];
          await this.memoryService.start();
          const success = this.memoryService.deleteSession(id);
          this.memoryService.stop();
          this.sendJSON(res, { success });
        } else if (pathname.startsWith('/api/prompts/') && method === 'GET') {
          const id = pathname.split('/')[3];
          const prompt = this.promptCenter.getPrompt(id);
          if (prompt) {
            this.sendJSON(res, { prompt });
          } else {
            res.writeHead(404);
            res.end('Prompt not found');
          }
        } else if (pathname.startsWith('/api/prompts/') && method === 'PUT') {
          const id = pathname.split('/')[3];
          const updates = JSON.parse(body);
          const success = this.promptCenter.updatePrompt(id, updates);
          this.sendJSON(res, { success });
        } else if (pathname.startsWith('/api/prompts/') && method === 'DELETE') {
          const id = pathname.split('/')[3];
          const success = this.promptCenter.deletePrompt(id);
          this.sendJSON(res, { success });
        } else {
          res.writeHead(404);
          res.end('API endpoint not found');
        }
        break;
    }
  }

  private async getRequestBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        resolve(body);
      });
    });
  }

  private sendJSON(res: http.ServerResponse, data: any) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`🌐 Web管理界面启动: http://localhost:${this.port}`);
        resolve();
      });
    });
  }

  public stop(): void {
    this.server.close();
    console.log('�� Web服务器已停止');
  }
} 