#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';
import '../service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('VueSage MCP 服务启动中...'); 