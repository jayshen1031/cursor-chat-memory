import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import { ChatMemoryService } from './chatMemoryService';
import { PromptCenter, PromptTemplate } from './promptCenter';

export class WebServer {
  private server: http.Server;
  private memoryService: ChatMemoryService;
  private promptCenter: PromptCenter;
  private port: number;

  constructor(port: number = 3000, projectPath?: string) {
    this.port = port;
    this.memoryService = new ChatMemoryService(projectPath);
    this.promptCenter = this.memoryService.getPromptCenter();
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

      default:
        if (pathname.startsWith('/api/prompts/') && method === 'GET') {
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