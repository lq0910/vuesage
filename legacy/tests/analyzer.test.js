const { VueAnalyzer } = require('../src/tools/analyzer.js');

describe('VueAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new VueAnalyzer();
  });

  describe('analyze', () => {
    test('应该检测无效的 Vue 组件', async () => {
      const result = await analyzer.analyze('<div>Invalid</div>');
      expect(result.success).toBe(false);
      expect(result.issues[0].message).toContain('必须包含');
    });

    test('应该检测缺少 key 的 v-for', async () => {
      const component = `
        <template>
          <div v-for="item in items">{{ item }}</div>
        </template>
        <script>
        export default {
          data() {
            return { items: [] }
          }
        }
        </script>
      `;
      const result = await analyzer.analyze(component);
      const hasKeyIssue = result.issues.some(
        issue => issue.message.includes('key') && issue.fix === 'addVForKey'
      );
      expect(hasKeyIssue).toBe(true);
    });

    test('应该检测缺少组件名称', async () => {
      const component = `
        <template>
          <div>Hello</div>
        </template>
        <script>
        export default {
          data() {
            return {}
          }
        }
        </script>
      `;
      const result = await analyzer.analyze(component);
      const hasNameIssue = result.issues.some(
        issue => issue.message.includes('name') && issue.fix === 'addComponentName'
      );
      expect(hasNameIssue).toBe(true);
    });

    test('应该检测过长的代码行', async () => {
      const component = `
        <template>
          <div class="very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-class">
            Hello
          </div>
        </template>
        <script>
        export default {
          name: 'Test'
        }
        </script>
      `;
      const result = await analyzer.analyze(component);
      const hasLongLineIssue = result.issues.some(
        issue => issue.message.includes('行超过') && issue.fix === 'formatLongLine'
      );
      expect(hasLongLineIssue).toBe(true);
    });

    test('应该检测未使用 scoped 样式', async () => {
      const component = `
        <template>
          <div>Hello</div>
        </template>
        <script>
        export default {
          name: 'Test'
        }
        </script>
        <style>
        .test { color: red; }
        </style>
      `;
      const result = await analyzer.analyze(component);
      const hasScopedIssue = result.issues.some(
        issue => issue.message.includes('scoped') && issue.fix === 'addScopedStyle'
      );
      expect(hasScopedIssue).toBe(true);
    });

    test('应该检测复杂的计算属性', async () => {
      const component = `
        <template>
          <div>{{ complexComputed }}</div>
        </template>
        <script>
        export default {
          name: 'Test',
          computed: {
            complexComputed() {
              return this.items
                .filter(item => item.active)
                .map(item => item.value)
                .reduce((acc, val) => acc + val, 0);
            }
          }
        }
        </script>
      `;
      const result = await analyzer.analyze(component);
      const hasComplexityIssue = result.issues.some(
        issue => issue.message.includes('计算属性') && issue.fix === 'optimizeComputed'
      );
      expect(hasComplexityIssue).toBe(true);
    });
  });

  describe('analyzeTemplate', () => {
    test('应该正确分析模板语法', async () => {
      const template = `
        <div>
          <span v-if="show">{{ message }}</span>
          <button @click="handleClick">Click</button>
        </div>
      `;
      const issues = analyzer.analyzeTemplate(template);
      expect(Array.isArray(issues)).toBe(true);
    });
  });

  describe('analyzeScript', () => {
    test('应该正确分析脚本部分', async () => {
      const script = `
        export default {
          data() {
            return {
              message: ''
            }
          },
          methods: {
            veryLongMethod() {
              // 这是一个很长的方法
              const step1 = this.doSomething();
              const step2 = this.doSomethingElse();
              const step3 = this.andMore();
              return step1 + step2 + step3;
            }
          }
        }
      `;
      const issues = analyzer.analyzeScript(script);
      expect(Array.isArray(issues)).toBe(true);
    });
  });

  describe('analyzeStyles', () => {
    test('应该正确分析样式部分', async () => {
      const styles = [{
        content: '.test { color: red; }',
        scoped: false
      }];
      const issues = analyzer.analyzeStyles(styles);
      expect(Array.isArray(issues)).toBe(true);
      expect(issues.some(issue => issue.message.includes('scoped'))).toBe(true);
    });
  });
}); 