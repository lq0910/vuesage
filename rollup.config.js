import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default {
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
        vue: 'Vue'
      }
    }
  ],
  plugins: [
    nodeResolve(),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**'
    }),
    terser()
  ],
  external: ['vue']
}; 