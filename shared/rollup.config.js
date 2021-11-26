import path from 'path';
import fs from 'fs';

export function createConfig(pkg) {
    return {
        input: 'src/index.ts',
        external: Object.keys(pkg.dependencies || {}),
        output: [
            {
                format: 'iife',
                file: pkg.main,
                name: pkg.access_name,
                banner: prependHeader(pkg),
            }
        ]
    }
}

function prependHeader(pkg, headerFile = '_header.txt') {
    const header = 
`//-----------------------------------------------
// RPG Maker MZ - ${pkg.main.substring(pkg.main.lastIndexOf('/')+1)}
//-----------------------------------------------

`;

    const file = path.resolve(__dirname, headerFile);
    if (fs.existsSync(file)) {
        return header + fs.readFileSync(file, 'utf8');
    } else {
        return header;
    }
}