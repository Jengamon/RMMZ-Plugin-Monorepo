// A small library that just defines some quick usefule functions
let booltest = /^(?:true|y(?:es)?)$/i;
export function to_boolean(string) {
    return booltest.test(string);
};

export function sandbox(pass_error, func) {
    try {
        func();
    } catch(e) {
        if(!pass_error) {
            console.error(e);
        }
        require("nw.gui").Window.get().showDevTools();
        if(pass_error) {
            throw e;
        }
    }
}

export async function loadFileFromServer(url, mime) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        if(mime !== undefined && mime !== null) {
            xhr.overrideMimeType(mime);
        }

        xhr.onload = function() {
            if(xhr.status < 400) {
                resolve(xhr.response);
            } else {
                reject({status: xhr.status, statusText: xhr.statusText});
            }
        };

        xhr.onerror = () => reject({status: xhr.status, statusText: xhr.statusText});

        xhr.send();
    })
}