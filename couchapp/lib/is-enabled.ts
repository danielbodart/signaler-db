import {Feature} from "./signaler-db";

export function isEnabled(feature: Feature, user_group: string) {
    if (feature.active) {
        if (feature.user_groups.length > 0) {
            return feature.user_groups.indexOf(user_group) != -1;
        }
        return true;
    }
    return false;
}

export function getValues(feature: Feature): any {
    if (feature.values) {
        return feature.values;
    }

    if (feature.percentage) {
        return percentageToValues(feature.percentage);
    }

    return true;
}

export function chooseValue(feature: Feature, user_id: string):any {
    return value_to_show_user(
        crc32_to_percentage(string_to_be_hashed(feature.name, user_id)),
        getValues(feature)
    );
}

export function value_to_show_user(percentage: number, values: any): any {
    if(!Array.isArray(values)) return values;
    return values[Math.floor(percentage / ( 100 / values.length ))];
}

export function percentageToValues(percentage: number): boolean | Array<boolean> {
    if (percentage === 0) {
        return false;
    }
    if (percentage === 100 || percentage === null) {
        return true;
    }
    return [true, false];
}

const crcTable = makeCRCTable();

function makeCRCTable():number[] {
    let c;
    let crcTable = [];
    for (let n = 0; n < 256; n++) {
        c = n;
        for (let k = 0; k < 8; k++) {
            c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
    }
    return crcTable;
}

function crc32(value:string):number {
    let crc = 0 ^ (-1);

    for (let i = 0; i < value.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ value.charCodeAt(i)) & 0xFF];
    }

    return (crc ^ (-1)) >>> 0;
}

function string_to_be_hashed(feature: string, user_id: string): string {
    return `${feature}-1_000_000-${user_id}`;
}

export function crc32_to_percentage(string_to_hash: string): number {
    return crc32(string_to_hash) % 100;
}