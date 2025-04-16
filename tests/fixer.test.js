const { VueFixer } = require('../src/tools/fixer.js');

describe('VueFixer', () => {
  let fixer;

  beforeEach(() => {
    fixer = new VueFixer();
  });

  describe('fix', () => {
    test('应该修复缺少 key 的 v-for', async () => {
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
      const result = await fixer.fix(component, ['addVForKey']);
      expect(result.success).toBe(true);
      expect(result.code).toContain(':key="item"');
    });

    test('应该修复缺少组件名称', async () => {
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
      const result = await fixer.fix(component, ['addComponentName']);
      expect(result.success).toBe(true);
      expect(result.code).toMatch(/name:\s*['"][^'"]+['"]/);
    });

    test('应该格式化过长的代码行', async () => {
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
      const result = await fixer.fix(component, ['formatLongLine']);
      expect(result.success).toBe(true);
      expect(result.code.split('\n').every(line => line.length <= 80)).toBe(true);
    });

    test('应该添加 scoped 样式', async () => {
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
      const result = await fixer.fix(component, ['addScopedStyle']);
      expect(result.success).toBe(true);
      expect(result.code).toContain('<style scoped>');
    });

    test('应该优化复杂的计算属性', async () => {
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
      const result = await fixer.fix(component, ['optimizeComputed']);
      expect(result.success).toBe(true);
      expect(result.code).toContain('activeItems');
      expect(result.code).toContain('activeValues');
    });
  });

  describe('addVForKey', () => {
    test('应该正确添加 key 绑定', () => {
      const template = '<div v-for="item in items">{{ item }}</div>';
      const result = fixer.addVForKey(template);
      expect(result.success).toBe(true);
      expect(result.code).toContain(':key="item"');
    });

    test('应该处理带括号的 v-for', () => {
      const template = '<div v-for="(item, index) in items">{{ item }}</div>';
      const result = fixer.addVForKey(template);
      expect(result.success).toBe(true);
      expect(result.code).toContain(':key="index"');
    });
  });

  describe('addComponentName', () => {
    test('应该正确添加组件名称', () => {
      const script = 'export default {\n  data() { return {} }\n}';
      const result = fixer.addComponentName(script);
      expect(result.success).toBe(true);
      expect(result.code).toMatch(/name:\s*['"][^'"]+['"]/);
    });
  });

  describe('formatLongLine', () => {
    test('应该正确格式化长行', () => {
      const template = '<div class="very-very-very-very-very-very-very-very-very-long-class">Hello</div>';
      const result = fixer.formatLongLine(template);
      expect(result.success).toBe(true);
      expect(result.code.split('\n').every(line => line.length <= 80)).toBe(true);
    });
  });

  describe('addScopedStyle', () => {
    test('应该正确添加 scoped 属性', () => {
      const styles = [{ content: '.test { color: red; }', scoped: false }];
      const result = fixer.addScopedStyle(styles);
      expect(result.success).toBe(true);
      expect(result.styles[0].scoped).toBe(true);
    });
  });
}); 