import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import glslify from 'rollup-plugin-glslify';
import commonjs from '@rollup/plugin-commonjs';

import pkg from './package.json';
import { createConfig } from '../../shared/rollup.config';

export default {
    ...createConfig(pkg),
    plugins: [
        typescript({}), 
        glslify(), 
        nodeResolve({
            browser: true,
        }), 
        commonjs({}),
    ],
}