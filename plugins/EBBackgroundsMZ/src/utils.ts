export class FileAccessError extends Error {
    response: Response;

    constructor(target: string, response: Response) {
        super(`File access error [${response.status}]: ${target}`);

        this.response = response;
    }
}

export async function loadFileFromServer(path: string) {
    const response = await fetch(path, {
        method: 'GET'
    });

    if (!response.ok) {
        throw new FileAccessError(path, response);
    }

    return response;
}