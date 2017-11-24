declare global {
    /** Emits a key-value pair for further processing by CouchDB after the map function is done. */
    export function emit(key: any, value: any);

    /** Registers callable handler for specified MIME key. */
    export function provides(key: string, handler: Function);

    /** Initiates chunked response. As an option, a custom response object may be sent at this point. For list-functions only! */
    export function start(init_resp?: {});

    /** Sends a single string chunk in response. */
    export function send(chunk: string);

    /** Extracts the next row from a related view result. */
    export function getRow(): Row | null;
}

export interface Row {
    key: any,
    value: any,
}

interface CouchDoc {
    _id: string,
    _rev?: string,
    _deleted?: boolean,
}

export interface View {
    /** Map functions accept a single document as the argument and (optionally) emit() key/value pairs that are stored in a view. **/
    map(doc: CouchDoc);
    /** Reduce functions take two required arguments of keys and values lists - the result of the related map function -
     * and an optional third value which indicates if rereduce mode is active or not.
     * Rereduce is used for additional reduce values list, so when it is true there is no information about related keys (first argument is null).**/
    reduce?: string | ((keys: any[] | null, values: any[], rereduce: boolean) => any[]);
}

export interface Library {
    [name: string]: string;
}

export interface Views {
    [name: string]: View | Library;
}

export interface Head {
    total_rows: number,
    offset: number,
}

export interface Lists {
    [name: string]: (head: Head, request: Request) => void | string;
}

export interface Shows {
    [name: string]: (doc: CouchDoc | null, request: Request) => Response | string;
}

export interface Updates {
    [name: string]: (doc: CouchDoc | null, request: Request) => [CouchDoc | null, Response | string];
}

export interface DesignDoc extends CouchDoc {
    views?: Views,
    lists?: Lists,
    shows?: Shows,
    updates?: Updates,
    lib?: Library,
    vendor?: Library,
    validate_doc_update?: (newDoc: CouchDoc, oldDoc: CouchDoc, userCtx?: UserContextObject, secObj?: SecurityObject) => void,
}

export interface UserContextObject {
    db: string,
    name?: string,
    roles: string[],
}

export interface SecurityObject {
    admins: SecurityObjectEntry,
    members: SecurityObjectEntry,
}

export interface SecurityObjectEntry {
    roles: string[],
    names: string[],
}

export interface Request {
    body: string,
    cookie: any,
    form: any,
    headers: any,
    id?: string,
    info: {},
    method: string,
    path: string[],
    peer: string,
    query: any,
    requested_path: string[],
    raw_path: string,
    secObj: SecurityObject,
    userCtx: UserContextObject,
    uuid: string,
}

export interface Response {
    code: number,
    json?: {},
    body?: string,
    base64?: string,
    headers?: {},
    stop?: boolean,
}

