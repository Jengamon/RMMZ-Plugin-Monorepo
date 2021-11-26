const {minify} = require("terser");
const fs = require("fs");
const path = require("path");

const distPath = path.join(__dirname, "dist");
const distMinPath = path.join(__dirname, "dist_min");

if(!fs.existsSync(distMinPath)) {
    fs.mkdirSync(distMinPath);
}

// A replacement for .terserrc for now
const options = {};

for(let file of fs.readdirSync(distPath)) {
    if (path.extname(file) != ".js") {
        continue;
    }

    let code = fs.readFileSync(path.join(distPath, file)).toString();
    let codeMap = null;
    if (fs.existsSync(path.join(distPath, file + ".map"))) {
        codeMap = fs.readFileSync(path.join(distPath, file + ".map")).toString();
    }

    (async () => {
        var result = await minify(code, Object.assign({}, options, {
            sourceMap: {
                content: codeMap,
                filename: file,
                url: file + ".map",
            }
        }));
        fs.writeFileSync(path.join(distMinPath, path.basename(file)), result.code);
        fs.writeFileSync(path.join(distMinPath, path.basename(file) + ".map"), result.map);
    })();
}