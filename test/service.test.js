import { Service } from '../src/service.js';
import { expect } from 'chai';

describe('Service', () => {
  let service;

  beforeEach(() => {
    service = new Service();
  });

  it('should analyze Vue component', async () => {
    const component = `
      <template>
        <div>Hello</div>
      </template>
      <script>
      export default {
        name: 'HelloWorld'
      }
      </script>
    `;

    const result = await service.analyze(component);
    expect(result).to.be.an('object');
    expect(result).to.have.property('summary');
    expect(result).to.have.property('issues');
  });

  it('should fix Vue component issues', async () => {
    const component = `
      <template>
        <div>Hello</div>
      </template>
      <script>
      export default {
        name: 'helloWorld'
      }
      </script>
    `;

    const issues = [{
      id: 'naming-001',
      message: 'Component name should be in PascalCase'
    }];

    const result = await service.fix(component, issues);
    expect(result).to.be.an('object');
    expect(result).to.have.property('fixed');
    expect(result.fixed).to.be.a('string');
  });
});