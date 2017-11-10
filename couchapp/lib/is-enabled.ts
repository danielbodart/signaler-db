import {Feature} from "./signaler-db";

const crcTable = makeCRCTable();

export function isEnabled(feature: Feature, user_group: string) {
    if (feature.active) {
        if (feature.user_groups.length > 0) {
            return feature.user_groups.indexOf(user_group) != -1;
        }
        return true;
    }
    return false;
}

function getOptions( feature: Feature ): Array<any> {
    if ( feature.options ) {
        return feature.options;
    }

    if ( feature.percentage ) {
        return convertPercentagePropertyToOptions(feature.percentage);
    }

    return [ true ];
}

export function chooseOption(feature: Feature, user_id: string) {
    return option_to_show_user(
        crc32_to_percentage(string_to_be_hashed(feature.name, user_id)),
        getOptions(feature)
    );
};

export function option_to_show_user( percentage: number, options: Array<any> ): any {
    return options[ Math.floor( percentage / ( 100 / options.length ) ) ];

}

export function convertPercentagePropertyToOptions(percentage: number ) {
    if ( percentage === 0 ) {
        return [ false ];
    }
    if ( percentage === 100 ) {
        return [ true ];
    }
    return [ true, false ];
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

function string_to_be_hashed(part1: string, part2: string): string {
    return `${part1}-1_000_000-${part2}`;
}

export function crc32_to_percentage(string_to_hash: string): number {
    return crc32(string_to_hash) % 100;
}