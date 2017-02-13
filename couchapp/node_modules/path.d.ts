export function join(...paths: string[]): string;

declare global{
    export var process: Process;
}

export interface Process {
    env:{}
}
