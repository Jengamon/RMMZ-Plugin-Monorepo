import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

import pkg from './package.json';
import { createConfig } from '../../shared/rollup.config';

export default {
    ...createConfig(pkg),
    plugins: [
        typescript({}),
        nodeResolve({
            browser: true,
            resolveOnly: pkg.resolveModules || [],
        }), 
        commonjs({}),
    ],
}