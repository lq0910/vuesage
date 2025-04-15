import { expect } from 'chai';
import { VueAnalyzer } from '../src/tools/analyzer.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sinon = require('sinon');

describe('VueAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new VueAnalyzer();
  });

  describe('analyze()', () => {
    it('应该能分析模板中的基本问题', () => {
      const template = `
        <template>
          <div>
            <img src="test.jpg">
            <button onclick="test()">Click me</button>
          </div>
        </template>
      `;
      
      const result = analyzer.analyze(template);
      
      expect(result.issues).to.be.an('array');
      expect(result.issues).to.have.length.greaterThan(0);
      expect(result.issues.some(issue => issue.message.includes('img'))).to.be.true;
      expect(result.issues.some(issue => issue.message.includes('onclick'))).to.be.true;
    });

    it('应该能分析脚本中的潜在问题', () => {
      const script = `
        <script>
        export default {
          data() {
            return {
              test: 'test',
              test2: 'test2',
              test3: 'test3',
              test4: 'test4',
              test5: 'test5',
              test6: 'test6',
            }
          },
          methods: {
            veryLongMethodName() {
              // 方法名过长
            }
          }
        }
        </script>
      `;
      
      const result = analyzer.analyze(script);
      
      expect(result.issues).to.be.an('array');
      expect(result.issues.some(issue => issue.message.includes('data properties'))).to.be.true;
      expect(result.issues.some(issue => issue.message.includes('method name'))).to.be.true;
    });

    it('应该能分析 Composition API 的使用', () => {
      const script = `
        <script setup>
        import { ref, reactive, onMounted, watch } from 'vue'
        
        const count = ref(0)
        const state = reactive({
          name: 'test',
          age: 18
        })
        
        watch(count, (newVal, oldVal) => {
          console.log(newVal, oldVal)
        })
        
        onMounted(() => {
          console.log('mounted')
        })
        </script>
      `;
      
      const result = analyzer.analyze(script);
      
      expect(result.issues).to.be.an('array');
      expect(result.compositionApiUsage).to.be.an('object');
      expect(result.compositionApiUsage.refCount).to.equal(1);
      expect(result.compositionApiUsage.reactiveCount).to.equal(1);
    });
  });

  describe('fix()', () => {
    it('应该能修复基本的模板问题', () => {
      const template = `
        <template>
          <div>
            <img src="test.jpg">
          </div>
        </template>
      `;
      
      const result = analyzer.fix(template);
      
      expect(result.fixed).to.include('alt=');
    });
  });
}); 