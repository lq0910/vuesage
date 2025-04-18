import express from 'express';
import { VueSageService } from './service.js';
import { config } from './config.js';
import { VueAnalyzer } from './tools/analyzer.js';
import { VueFixer } from './tools/fixer.js';
import * as utils from './tools/index.js';

const app = express();
const vueSage = new VueSageService();

app.use(express.json());
app.use(express.static('public'));

// 分析接口
app.post('/analyze', async (req, res) => {
  try {
    const { component } = req.body;
    const result = await vueSage.analyze(component);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 修复接口
app.post('/fix', async (req, res) => {
  try {
    const { component, issues } = req.body;
    const result = await vueSage.fix(component, issues);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 启动服务器
app.listen(config.server.port, config.server.host, () => {
  console.log(`VueSage 服务已启动: http://${config.server.host}:${config.server.port}`);
});

export {
  VueAnalyzer,
  VueFixer,
  utils
};

export default {
  analyze: (code) => {
    const analyzer = new VueAnalyzer();
    return analyzer.analyze(code);
  },
  
  fix: (code, issues) => {
    const fixer = new VueFixer();
    return fixer.fix(code, issues);
  }
}; 