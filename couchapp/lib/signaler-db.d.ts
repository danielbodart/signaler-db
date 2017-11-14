import {CouchDoc} from "./couch";

export interface Change {
    property: string,
    old_value: any,
    new_value: any,
}

export interface Feature extends CouchDoc {
    name: string,
    description: string,
    active: boolean,
    percentage?: number,
    user_groups: string[],
    history?: History[],
    values?: any
}

export interface History {
    user?: string,
    changes: Change[],
    changed_at: Date,
}