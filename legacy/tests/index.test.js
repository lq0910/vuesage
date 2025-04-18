import { VueAnalyzer } from '../src/tools/analyzer.js';
import { VueFixer } from '../src/tools/fixer.js';

describe('VueAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new VueAnalyzer();
  });

  describe('基础功能测试', () => {
    test('应该正确识别无效的Vue组件', () => {
      const invalidCode = '<template></template>';
      const result = analyzer.analyze(invalidCode);
      expect(result.success).toBe(false);
      expect(result.issues[0].type).toBe('error');
    });

    test('应该正确分析有效的Vue组件', () => {
      const validCode = `
<template>
  <div>Hello</div>
</template>
<script>
export default {
  name: 'HelloWorld'
}
</script>`;
      const result = analyzer.analyze(validCode);
      expect(result.success).toBe(true);
    });
  });

  describe('模板分析测试', () => {
    test('应该检测到缺少v-for的key', () => {
      const code = `
<template>
  <div>
    <div v-for="item in items">{{ item }}</div>
  </div>
</template>
<script>
export default {
  name: 'TestComponent',
  data() {
    return {
      items: []
    }
  }
}
</script>`;
      const result = analyzer.analyze(code);
      expect(result.issues.some(i => i.fix === 'addVForKey')).toBe(true);
    });

    test('应该检测到过长的代码行', () => {
      const code = `
<template>
  <div class="very-long-class-name another-long-class-name" style="width: 100%; height: 100%; background-color: #ffffff;">
    Content
  </div>
</template>
<script>
export default {
  name: 'TestComponent'
}
</script>`;
      const result = analyzer.analyze(code);
      expect(result.issues.some(i => i.fix === 'formatLongLine')).toBe(true);
    });
  });

  describe('脚本分析测试', () => {
    test('应该检测到缺少组件名称', () => {
      const code = `
<template>
  <div>Hello</div>
</template>
<script>
export default {
  data() {
    return {}
  }
}
</script>`;
      const result = analyzer.analyze(code);
      expect(result.issues.some(i => i.fix === 'addComponentName')).toBe(true);
    });

    test('应该检测到props缺少类型定义', () => {
      const code = `
<template>
  <div>{{ message }}</div>
</template>
<script>
export default {
  name: 'TestComponent',
  props: {
    message: {}
  }
}
</script>`;
      const result = analyzer.analyze(code);
      expect(result.issues.some(i => i.fix === 'addPropsType')).toBe(true);
    });
  });

  describe('性能分析测试', () => {
    test('应该检测到计算属性中的复杂操作', () => {
      const code = `
<template>
  <div>{{ computedData }}</div>
</template>
<script>
export default {
  name: 'TestComponent',
  computed: {
    computedData() {
      return this.items.filter(item => item.active).map(item => item.value)
    }
  }
}
</script>`;
      const result = analyzer.analyze(code);
      expect(result.issues.some(i => i.fix === 'optimizeComputed')).toBe(true);
    });

    test('应该检测到过多的watch', () => {
      const code = `
<template>
  <div>{{ data }}</div>
</template>
<script>
export default {
  name: 'TestComponent',
  data() {
    return { data: null }
  },
  watch: {
    prop1() {},
    prop2() {},
    prop3() {},
    prop4() {},
    prop5() {},
    prop6() {}
  }
}
</script>`;
      const result = analyzer.analyze(code);
      expect(result.issues.some(i => i.message.includes('watch'))).toBe(true);
    });
  });
});

describe('VueFixer', () => {
  let fixer;

  beforeEach(() => {
    fixer = new VueFixer();
  });

  describe('修复功能测试', () => {
    test('应该正确添加v-for的key', () => {
      const code = `
<template>
  <div v-for="item in items">{{ item }}</div>
</template>`;
      const issues = [{ type: 'template', message: 'v-for指令必须绑定key' }];
      const result = fixer.fix(code, issues);
      expect(result.code).toContain(':key="item"');
    });

    test('应该正确添加组件名称', () => {
      const code = `
<template>
  <div>Hello</div>
</template>
<script>
export default {
  data() {
    return {}
  }
}
</script>`;
      const issues = [{ type: 'script', message: '组件缺少name属性' }];
      const result = fixer.fix(code, issues);
      expect(result.code).toMatch(/name:\s*['"][^'"]+['"]/);
    });

    test('应该正确优化计算属性', () => {
      const code = `
<template>
  <div>{{ computedData }}</div>
</template>
<script>
export default {
  name: 'TestComponent',
  computed: {
    computedData() {
      return this.items.filter(x => x > 0)
    }
  }
}
</script>`;
      const issues = [{ type: 'performance', fix: 'optimizeComputed' }];
      const result = fixer.fix(code, issues);
      expect(result.code).toContain('cache: true');
    });
  });
}); 