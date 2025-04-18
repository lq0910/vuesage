import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import json from '@rollup/plugin-json';

const shebang = {
  name: 'shebang',
  transform(code, id) {
    if (id.includes('src/server.js')) {
      return code.replace(/^#!.*/, '');
    }
  }
};

export default [
  // 库构建配置
  {
    input: 'src/index.js',
    output: [
      {
        file: 'dist/vuesage.cjs.js',
        format: 'cjs',
        exports: 'named',
        sourcemap: true
      },
      {
        file: 'dist/vuesage.esm.js',
        format: 'es',
        exports: 'named',
        sourcemap: true
      },
      {
        file: 'dist/vuesage.umd.js',
        format: 'umd',
        name: 'VueSage',
        exports: 'named',
        sourcemap: true,
        globals: {
          vue: 'Vue',
          path: 'path',
          util: 'util',
          tty: 'tty',
          fs: 'fs',
          net: 'net',
          events: 'events',
          stream: 'stream',
          zlib: 'zlib',
          buffer: 'buffer',
          string_decoder: 'string_decoder',
          async_hooks: 'async_hooks',
          querystring: 'querystring',
          url: 'url',
          http: 'http',
          crypto: 'crypto'
        }
      }
    ],
    plugins: [
      json(),
      nodeResolve(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**'
      }),
      terser()
    ],
    external: ['vue']
  },
  // MCP 服务器构建配置
  {
    input: 'src/server.js',
    output: {
      file: 'dist/server.js',
      format: 'cjs',
      banner: '#!/usr/bin/env node',
    },
    plugins: [
      shebang,
      json(),
      nodeResolve({ 
        preferBuiltins: true,
        exportConditions: ['node']
      }),
      commonjs({
        ignoreDynamicRequires: true
      }),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**'
      })
    ],
    external: [
      'vue',
      'express',
      'body-parser',
      '@babel/parser',
      '@vue/compiler-sfc',
      'chalk',
      'commander',
      'cosmiconfig',
      'path',
      'fs',
      'util'
    ]
  }
]; 