/**
 * 检查是否为有效的Vue组件代码
 * @param {string} code Vue组件代码
 * @returns {boolean} 是否有效
 */
export function isValidVueComponent(code) {
  try {
    // 检查基本结构
    const hasTemplate = /<template>[\s\S]*<\/template>/.test(code);
    const hasScript = /<script>[\s\S]*<\/script>/.test(code);
    return hasTemplate && hasScript;
  } catch (error) {
    return false;
  }
}

/**
 * 提取template部分的代码
 * @param {string} code Vue组件代码
 * @returns {string} template代码
 */
export function extractTemplate(code) {
  const match = code.match(/<template>([\s\S]*)<\/template>/);
  return match ? match[1].trim() : '';
}

/**
 * 提取script部分的代码
 * @param {string} code Vue组件代码
 * @returns {string} script代码
 */
export function extractScript(code) {
  const match = code.match(/<script>([\s\S]*)<\/script>/);
  return match ? match[1].trim() : '';
}

/**
 * 提取styles部分的代码
 * @param {string} code Vue组件代码
 * @returns {Array} styles代码数组
 */
export function extractStyles(code) {
  const styles = [];
  const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/g;
  let match;

  while ((match = styleRegex.exec(code)) !== null) {
    const [fullMatch, content] = match;
    const scoped = fullMatch.includes('scoped');
    styles.push({ content: content.trim(), scoped });
  }

  return styles;
}

/**
 * 合并Vue组件的各个部分
 * @param {string} template template代码
 * @param {string} script script代码
 * @param {Array} styles styles代码数组
 * @returns {string} 完整的Vue组件代码
 */
export function mergeVueComponent(template, script, styles) {
  const templatePart = template ? `<template>\n${template}\n</template>\n\n` : '';
  const scriptPart = script ? `<script>\n${script}\n</script>\n\n` : '';
  const stylesPart = styles.map(style => 
    `<style${style.scoped ? ' scoped' : ''}>\n${style.content}\n</style>`
  ).join('\n\n');

  return `${templatePart}${scriptPart}${stylesPart}`.trim();
} 