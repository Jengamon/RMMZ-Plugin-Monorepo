export class FileAccessError extends Error {
    response: Response;

    constructor(response: Response, path: string) {
        super(`File access error [${response.status}]: ${path}`);

        this.response = response;
    }
}

export async function getFileFromServer<T>(path: string, convert: (response: Response) => Promise<T>, options: RequestInit = {method: 'GET'}): Promise<T> {
    console.log("gaaa");
    
    const response = await fetch(path, options);

    console.log("urgg");

    if (!response.ok) {
        throw new FileAccessError(response, path);
    }
    
    return convert(response);
}