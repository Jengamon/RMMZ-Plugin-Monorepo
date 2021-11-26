import typescript from '@rollup/plugin-typescript';
import eslint from '@rollup/plugin-eslint';

import pkg from './package.json';
import { createConfig } from '../../shared/rollup.config';

export default {
    ...createConfig(pkg),
    plugins: [typescript({sourceMap: false}), eslint({})],
}