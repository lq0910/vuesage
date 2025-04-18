#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { parse } from "@vue/compiler-sfc";
import { z } from "zod";
import fs from 'fs/promises';
import path from 'path';

// 启用调试输出
process.env.DEBUG = 'fastmcp:*';

// 全局错误处理
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

// 显示启动信息
console.error('VueSage MCP 服务启动中...');

// UI分析规则
const uiRules = {
  accessibility: (template) => {
    const issues = [];
    const warnings = [];
    const fixes = [];

    // 检查aria属性
    if (template.includes('<button') && !template.includes('aria-label')) {
      warnings.push('Button should have aria-label attribute');
      fixes.push({
        type: 'addAttribute',
        element: 'button',
        attribute: 'aria-label',
        value: '${buttonText}'
      });
    }

    // 检查图片alt
    if (template.includes('<img') && !template.includes('alt=')) {
      issues.push('Images must have alt attributes');
      fixes.push({
        type: 'addAttribute',
        element: 'img',
        attribute: 'alt',
        value: '${imageDescription}'
      });
    }

    return { issues, warnings, fixes };
  },

  responsiveness: (template, style) => {
    const issues = [];
    const warnings = [];
    const fixes = [];

    // 检查媒体查询
    if (!style.includes('@media')) {
      warnings.push('Consider adding responsive design with media queries');
      fixes.push({
        type: 'addStyle',
        content: '@media (max-width: 768px) { /* Mobile styles */ }'
      });
    }

    // 检查固定宽度
    if (style.includes('width: ') && !style.includes('max-width')) {
      warnings.push('Consider using max-width for better responsiveness');
      fixes.push({
        type: 'replaceStyle',
        from: 'width:',
        to: 'max-width:'
      });
    }

    return { issues, warnings, fixes };
  },

  semantics: (template) => {
    const issues = [];
    const warnings = [];
    const fixes = [];

    // 检查语义化标签使用
    if (template.includes('<div class="nav"')) {
      warnings.push('Consider using <nav> instead of div with nav class');
      fixes.push({
        type: 'replaceTag',
        from: '<div class="nav"',
        to: '<nav'
      });
    }

    return { issues, warnings, fixes };
  }
};

// 代码分析规则
const codeRules = {
  vForKey: (template) => {
    const issues = [];
    const warnings = [];
    const fixes = [];
    
    if (template.includes('v-for') && !template.includes(':key')) {
      issues.push('v-for directive should have a corresponding :key');
      fixes.push({
        type: 'addAttribute',
        element: 'v-for',
        attribute: ':key',
        value: 'item.id'
      });
    }
    return { issues, warnings, fixes };
  },
  
  propsValidation: (script) => {
    const issues = [];
    const warnings = [];
    const fixes = [];
    
    if (script.includes('props:') && !script.includes('type:')) {
      warnings.push('Props should have type validation');
      fixes.push({
        type: 'addPropType',
        content: 'type: String, // or appropriate type'
      });
    }
    return { issues, warnings, fixes };
  },
  
  emitsDeclaration: (script) => {
    const issues = [];
    const warnings = [];
    const fixes = [];
    
    if (script.includes('$emit') && !script.includes('emits:')) {
      warnings.push('Component should declare emitted events');
      fixes.push({
        type: 'addEmits',
        content: 'emits: ["eventName"],'
      });
    }
    return { issues, warnings, fixes };
  },
  
  styleScoping: (style) => {
    const issues = [];
    const warnings = [];
    const fixes = [];
    
    if (!style.includes('scoped')) {
      warnings.push('Consider using scoped style for better isolation');
      fixes.push({
        type: 'addScoped',
        content: '<style scoped>'
      });
    }
    return { issues, warnings, fixes };
  }
};

// 分析函数
async function analyze(code, filename) {
  try {
    const { descriptor } = parse(code);
    const template = descriptor.template?.content || '';
    const script = descriptor.script?.content || '';
    const style = descriptor.styles?.[0]?.content || '';

    let issues = [];
    let warnings = [];
    let fixes = [];

    // 应用UI规则
    for (const rule of Object.values(uiRules)) {
      const result = rule(template, style);
      issues = [...issues, ...result.issues];
      warnings = [...warnings, ...result.warnings];
      fixes = [...fixes, ...result.fixes];
    }

    // 应用代码规则
    for (const rule of Object.values(codeRules)) {
      const result = rule(template, script, style);
      issues = [...issues, ...result.issues];
      warnings = [...warnings, ...result.warnings];
      fixes = [...fixes, ...result.fixes];
    }

    // 计算得分
    const baseScore = 100;
    const deductPerIssue = 10;
    const deductPerWarning = 5;
    const score = Math.max(0, baseScore - 
      (issues.length * deductPerIssue) - 
      (warnings.length * deductPerWarning));

    return {
      score,
      issues,
      warnings,
      fixes,
      details: {
        ui: {
          accessibility: score >= 90 ? '✅' : '⚠️',
          responsiveness: style.includes('@media') ? '✅' : '⚠️',
          semantics: !issues.some(i => i.includes('semantic')) ? '✅' : '⚠️'
        },
        code: {
          props: !warnings.some(w => w.includes('Props')) ? '✅' : '⚠️',
          emits: !warnings.some(w => w.includes('emits')) ? '✅' : '⚠️',
          style: !warnings.some(w => w.includes('style')) ? '✅' : '⚠️'
        }
      }
    };
  } catch (error) {
    return {
      score: 0,
      issues: [`Failed to parse ${filename}: ${error.message}`],
      warnings: [],
      fixes: [],
      details: {
        ui: { accessibility: '❌', responsiveness: '❌', semantics: '❌' },
        code: { props: '❌', emits: '❌', style: '❌' }
      }
    };
  }
}

// 自动修复函数
async function autoFix(code, fixes) {
  let fixedCode = code;
  for (const fix of fixes) {
    switch (fix.type) {
      case 'addAttribute':
        fixedCode = fixedCode.replace(
          new RegExp(`<${fix.element}([^>]*)>`),
          `<${fix.element}$1 ${fix.attribute}="${fix.value}">`
        );
        break;
      case 'addStyle':
        fixedCode = fixedCode.replace(
          '</style>',
          `\n  ${fix.content}\n</style>`
        );
        break;
      case 'replaceTag':
        fixedCode = fixedCode.replace(
          new RegExp(fix.from, 'g'),
          fix.to
        );
        break;
      case 'addPropType':
      case 'addEmits':
        fixedCode = fixedCode.replace(
          'export default {',
          `export default {\n  ${fix.content}`
        );
        break;
      case 'addScoped':
        fixedCode = fixedCode.replace(
          '<style>',
          fix.content
        );
        break;
    }
  }
  return fixedCode;
}

// 生成报告
async function generateReport(results, format = 'html') {
  const templatePath = path.join(process.cwd(), 'templates', `report.${format}`);
  let template;
  
  try {
    template = await fs.readFile(templatePath, 'utf-8');
  } catch (error) {
    throw new Error(`无法读取报告模板: ${error.message}`);
  }

  const total = results.length;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / total;
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

  const summary = {
    totalFiles: total,
    averageScore: Math.round(avgScore),
    totalIssues,
    totalWarnings,
    passRate: `${Math.round((results.filter(r => r.score >= 80).length / total) * 100)}%`
  };

  // 替换模板变量
  let report = template
    .replace('{{totalFiles}}', summary.totalFiles)
    .replace('{{averageScore}}', summary.averageScore)
    .replace('{{totalIssues}}', summary.totalIssues)
    .replace('{{totalWarnings}}', summary.totalWarnings)
    .replace('{{passRate}}', summary.passRate)
    .replace('{{details}}', JSON.stringify(results, null, 2));

  return report;
}

// 创建 MCP 服务器
const server = new McpServer({
  name: "vuesage",
  version: "1.1.44",
  vendor: "VueSage"
});

// 单文件分析工具
server.tool(
  "analyze",
  {
    code: z.string(),
    filename: z.string()
  },
  async ({ code, filename }) => {
    const result = await analyze(code, filename);
    
    // 如果有问题，返回分析结果和修复建议
    if (result.issues.length > 0 || result.warnings.length > 0) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            ...result,
            needsFix: true,
            message: "发现问题，是否需要自动修复？(Y/N)"
          }, null, 2)
        }]
      };
    }
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// 批量分析工具
server.tool(
  "analyzeBatch",
  {
    files: z.array(z.object({
      code: z.string(),
      filename: z.string()
    }))
  },
  async ({ files }) => {
    const results = [];
    for (const file of files) {
      const result = await analyze(file.code, file.filename);
      results.push({
        filename: file.filename,
        ...result
      });
    }

    // 如果有问题，询问是否需要生成报告
    const hasIssues = results.some(r => r.issues.length > 0 || r.warnings.length > 0);
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          results,
          needsReport: hasIssues,
          message: hasIssues ? "是否需要生成分析报告？(Y/N)" : "分析完成，未发现问题。"
        }, null, 2)
      }]
    };
  }
);

// 自动修复工具
server.tool(
  "autoFix",
  {
    code: z.string(),
    fixes: z.array(z.object({
      type: z.string(),
      element: z.string().optional(),
      attribute: z.string().optional(),
      value: z.string().optional(),
      content: z.string().optional(),
      from: z.string().optional(),
      to: z.string().optional()
    }))
  },
  async ({ code, fixes }) => {
    const fixedCode = await autoFix(code, fixes);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          fixedCode,
          message: "修复完成，是否需要生成报告？(Y/N)"
        }, null, 2)
      }]
    };
  }
);

// 报告生成工具
server.tool(
  "generateReport",
  {
    results: z.array(z.any()),
    format: z.enum(['html', 'md'])
  },
  async ({ results, format }) => {
    try {
      const report = await generateReport(results, format);
      const outputDir = path.join(process.cwd(), 'vuesage-reports');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputPath = path.join(outputDir, `report-${timestamp}.${format}`);

      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(outputPath, report);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            message: `报告已生成：${outputPath}`
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            message: `生成报告失败：${error.message}`
          }, null, 2)
        }]
      };
    }
  }
);

// 连接服务器
const transport = new StdioServerTransport();
await server.connect(transport);

async function main() {
  try {
    server.start();
    console.error('VueSage MCP 服务已成功启动');
  } catch (error) {
    console.error('启动服务失败:', error);
  }
}

main().catch(() => process.exit(1)); 