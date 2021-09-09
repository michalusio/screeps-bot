"use strict";
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import clear from 'rollup-plugin-clear';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: "src/main.ts",
  output: {
    file: "C:/Users/isals/AppData/Local/Screeps/scripts/127_0_0_1___21025/default/main.js",
    format: "cjs",
    sourcemap: true
  },

  plugins: [
    clear({ targets: ["C:/Users/isals/AppData/Local/Screeps/scripts/127_0_0_1___21025/default"] }),
    resolve({ rootDir: "src" }),
    commonjs(),
    typescript({tsconfig: "./tsconfig.json"})
  ]
}
