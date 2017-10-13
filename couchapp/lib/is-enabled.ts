import {Feature} from "./signaler-db";

const crcTable = makeCRCTable();

export function isEnabled(feature: Feature, user_id: string, user_group: string) {
    if (feature.active) {
        if (feature.user_groups.length > 0) {
            return feature.user_groups.indexOf(user_group) != -1;
        }
        if (feature.percentage) {
            return percentage_enabled_for_user(feature, user_id);
        }
        return true;
    }
    return false;
}

function makeCRCTable() {
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

function crc32(str) {
    let crc = 0 ^ (-1);

    for (let i = 0; i < str.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
    }

    return (crc ^ (-1)) >>> 0;
}

function percentage_enabled_for_user(doc, user_id) {
    return crc32(doc.name + "-1_000_000-" + user_id) % 100 < doc.percentage
}