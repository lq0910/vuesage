#!/usr/bin/env node

import { VueSageService } from '../src/service.js';

const service = new VueSageService();

process.stdin.setEncoding('utf-8');
let inputData = '';

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', async () => {
  try {
    const request = JSON.parse(inputData);
    const { command, params } = request;

    let response;
    switch (command) {
      case 'analyze':
        response = await service.analyze(params.component);
        break;
      case 'fix':
        response = await service.fix(params.component, params.issues);
        break;
      default:
        throw new Error(`Unknown command: ${command}`);
    }

    process.stdout.write(JSON.stringify(response));
  } catch (error) {
    process.stderr.write(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
}); 