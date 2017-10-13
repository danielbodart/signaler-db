"use strict";
exports.__esModule = true;
var crcTable = makeCRCTable();
function isEnabled(feature, user_id, user_group) {
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
exports.isEnabled = isEnabled;
function makeCRCTable() {
    var c;
    var crcTable = [];
    for (var n = 0; n < 256; n++) {
        c = n;
        for (var k = 0; k < 8; k++) {
            c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
    }
    return crcTable;
}
function crc32(str) {
    var crc = 0 ^ (-1);
    for (var i = 0; i < str.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
}
function percentage_enabled_for_user(doc, user_id) {
    return crc32(doc.name + "-1_000_000-" + user_id) % 100 < doc.percentage;
}
