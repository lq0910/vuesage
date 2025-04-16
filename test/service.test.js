import { strict as assert } from 'assert';
import sinon from 'sinon';
import Service from '../src/service.js';

describe('Service', () => {
  let service;

  beforeEach(() => {
    service = new Service();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('analyze', () => {
    it('should analyze Vue component and return results', async () => {
      const mockComponent = `
        <template>
          <div>Hello World</div>
        </template>
        <script>
        export default {
          name: 'TestComponent'
        }
        </script>
      `;

      const result = await service.analyze(mockComponent);
      assert.ok(result);
      assert.ok(result.issues);
      assert.ok(Array.isArray(result.issues));
    });
  });

  describe('fix', () => {
    it('should fix issues in Vue component', async () => {
      const mockComponent = `
        <template>
          <div v-for="item in items">{{ item }}</div>
        </template>
        <script>
        export default {
          data() {
            return {
              items: []
            }
          }
        }
        </script>
      `;

      const result = await service.fix(mockComponent);
      assert.ok(result);
      assert.ok(result.fixed);
      assert.ok(typeof result.content === 'string');
    });
  });
});