const fs = require('fs');
const path = require('path');
const _ = require('lodash');

// 默认配置
const defaultConfig = {
  server: {
    port: 6188,
    host: 'localhost'
  },
  rules: {
    naming: {
      enabled: true,
      severity: 'error',
      options: {
        componentPrefix: 'App',
        propsCasing: 'camelCase'
      }
    },
    props: {
      enabled: true,
      severity: 'warning',
      options: {
        requireType: true,
        requireDefault: true
      }
    },
    lifecycle: {
      enabled: true,
      severity: 'error',
      options: {
        checkDeprecated: true
      }
    },
    template: {
      enabled: true,
      severity: 'error',
      options: {
        maxLength: 80,
        requireKey: true
      }
    },
    complexity: {
      enabled: true,
      severity: 'warning',
      options: {
        maxMethodLines: 20,
        maxMethods: 10
      }
    },
    style: {
      enabled: true,
      severity: 'warning',
      options: {
        enforceScoped: true,
        maxNestingDepth: 3
      }
    }
  },
  autofix: {
    safeMode: true,
    backup: true,
    ignoreFiles: ['dist/**/*', 'node_modules/**/*']
  },
  formatting: {
    indentSize: 2,
    maxLineLength: 100,
    singleQuote: true
  }
};

// 加载用户配置
function loadConfig(configPath = '.vuesagerc.json') {
  try {
    const userConfigPath = path.resolve(process.cwd(), configPath);
    if (fs.existsSync(userConfigPath)) {
      const userConfig = JSON.parse(fs.readFileSync(userConfigPath, 'utf8'));
      return _.merge({}, defaultConfig, userConfig);
    }
  } catch (error) {
    console.warn(`Warning: Could not load config file: ${error.message}`);
  }
  return defaultConfig;
}

// 验证规则配置
function validateRuleConfig(rule, config) {
  if (!config.enabled) return false;
  
  const severity = config.severity.toLowerCase();
  if (severity === 'off') return false;
  
  return true;
}

// 获取规则配置
function getRuleConfig(ruleName) {
  const config = loadConfig();
  const ruleConfig = config.rules[ruleName];
  
  if (!ruleConfig || !validateRuleConfig(ruleName, ruleConfig)) {
    return null;
  }
  
  return {
    ...ruleConfig,
    severity: ruleConfig.severity.toLowerCase()
  };
}

// 获取自动修复配置
function getAutofixConfig() {
  const config = loadConfig();
  return config.autofix;
}

// 获取格式化配置
function getFormattingConfig() {
  const config = loadConfig();
  return config.formatting;
}

const config = {
  server: {
    port: 6188,
    host: 'localhost'
  },
  rules: {
    naming: {
      enabled: true,
      severity: 'error',
      options: {
        componentPrefix: 'App',
        propsCasing: 'camelCase'
      }
    },
    props: {
      enabled: true,
      severity: 'warning',
      options: {
        requireType: true,
        requireDefault: true
      }
    },
    template: {
      enabled: true,
      severity: 'error',
      options: {
        maxLength: 80,
        requireKey: true
      }
    }
  },
  autofix: {
    safeMode: true,
    backup: true,
    ignoreFiles: ['dist/**/*', 'node_modules/**/*']
  },
  formatting: {
    indentSize: 2,
    maxLineLength: 100,
    singleQuote: true
  }
};

export { config }; 