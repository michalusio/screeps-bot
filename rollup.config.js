import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import clear from 'rollup-plugin-clear';
import screeps from 'rollup-plugin-screeps';
import typescript from '@rollup/plugin-typescript';

("use strict");

let cfg;
const dest = process.env.DEST;
if (!dest) {
  console.log("No destination specified - code will be compiled but not uploaded");
} else if ((cfg = require("./screeps.json")[dest]) == null) {
  throw new Error("Invalid upload destination");
}

export default {
  input: "src/main.ts",
  output: {
    file: "dist/main.js",
    format: "cjs",
    sourcemap: false
  },

  plugins: [
    clear({ targets: ["dist"] }),
    resolve({ rootDir: "src", extensions: [".ts", ".js"] }),
    typescript({tsconfig: "./tsconfig.json", cacheDir: './.rollup.tscache', }),
    commonjs(),
    screeps({config: cfg, dryRun: cfg == null})
  ]
}
