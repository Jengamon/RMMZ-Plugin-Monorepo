import path from 'path';
import fs from 'fs';

export function createConfig(pkg) {
    return {
        input: 'src/index.ts',
        output: [
            {
                format: 'iife',
                file: pkg.main,
                globals: {
                    "rmmz": "window",
                },
                name: pkg.accessName,
                banner: prependHeader(pkg),
                sourcemap: true,
            }
        ]
    }
}

function prependHeader(pkg, headerFile = '_header.txt') {
    const header = 
`//!-----------------------------------------------
//! RPG Maker MZ - ${pkg.main.substring(pkg.main.lastIndexOf('/')+1)}
//!-----------------------------------------------

`;

    const file = path.resolve(__dirname, headerFile);
    if (fs.existsSync(file)) {
        return header + fs.readFileSync(file, 'utf8');
    } else {
        return header;
    }
}