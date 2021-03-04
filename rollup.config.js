import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'

const extensions = ['.js', '.ts']

export default {
  input: 'src/index.ts',
  external: [],
  plugins: [
    typescript(),
    resolve({ extensions }),
    babel({ extensions, babelHelpers: 'bundled' }),
    terser()
  ],
  output: [
    {
      format: 'umd',
      name: 'TWXYZ',
      file: 'dist/twxyz.umd.js'
    },
    {
      format: 'esm',
      name: 'TWXYZ',
      file: 'dist/twxyz.esm.js'
    },
    {
      format: 'amd',
      name: 'TWXYZ',
      file: 'dist/twxyz.amd.js'
    },
    {
      format: 'cjs',
      name: 'TWXYZ',
      file: 'dist/twxyz.cjs.js'
    }
  ]
}