export interface Object {
    width: number;
    height: number;
    x: number;
    y: number;
    name: string;
}

export interface MapObjectLayer {
    objects: Object[];
    name: string;
}