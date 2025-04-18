// 检查 fastmcp 模块导出
import { FastMCP } from 'fastmcp';

console.log('FastMCP exports:', Object.keys(FastMCP.prototype));

// 创建一个实例并查看
const server = new FastMCP({ name: 'test', version: '1.0.0' });
console.log('FastMCP instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(server))); 