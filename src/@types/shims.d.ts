/**
 * pack.mcmeta
 */
type PackMcMeta = {
    pack: {
        pack_format: number;
        description: string;
    };
};

type Frame = {
    index: number;
    time: number;
};

/**
 * <texture>.png.mcmeta
 */
type TextureMcMeta = {
    animation?: {
        interpolate?: boolean;
        width?: number;
        height?: number;
        frametime?: number;
        frames?: (number | Frame)[];
    };
};

/**
 * 面
 */
type Direction =
    | 'north'
    | 'south'
    | 'east'
    | 'west'
    | 'up'
    | 'down';

/**
 * 座標
 */
type Coordinate = [
    x: number,
    y: number,
    z: number
];

type ModelElementFaceUV = [
    x1: number,
    y1: number,
    x2: number,
    y2: number
];

type ModelDisplayName =
    | 'thirdperson_righthand'
    | 'thirdperson_lefthand'
    | 'firstperson_righthand'
    | 'firstperson_lefthand'
    | 'gui'
    | 'head'
    | 'ground'
    | 'fixed';

type ModelElementRotation = {
    origin: Coordinate;
    axis: 'x' | 'y' | 'z';
    angle: -45 | -22.5 | 0 | 22.5 | 45;
    rescale?: boolean;
};

type ModelElementFace = {
    uv?: ModelElementFaceUV;
    texture: string;
    cullface?: Direction;
    rotation?: 0 | 90 | 180 | 270;
    tintindex?: number;
};

type ModelElement = {
    from: Coordinate;
    to: Coordinate;
    rotation?: ModelElementRotation;
    faces?: {
        [key in Direction]?: ModelElementFace;
    };
    shade?: boolean;
};

type ModelOverridePredicate =
    | 'angle'
    | 'blocking'
    | 'broken'
    | 'cast'
    | 'cooldown'
    | 'damage'
    | 'damaged'
    | 'lefthanded'
    | 'pull'
    | 'pulling'
    | 'charged'
    | 'firework'
    | 'throwing'
    | 'time'
    | 'custom_model_data';

type ModelOverride = {
    predicate: {
        [key in ModelOverridePredicate]: number;
    };
    model: string;
};

type ModelData = {
    parent?: string;
    ambientocclusion?: boolean;
    display?: {
        [key in ModelDisplayName]?: {
            rotation: Coordinate;
            translation: Coordinate;
            scale: Coordinate;
        }
    };
    textures?: {
        [key: string]: string;
    };
    elements?: ModelElement[];
    overrides?: ModelOverride[];
};

type TextureData = {
    texture: THREE.Texture;
    animation?: TextureMcMeta['animation'];
};

/**
 * IPC通信の引数定義\
 * Invoke, Handle用
 */
type IpcIHArgs = {
    'App_minimize': {
        args: [];
        return: void;
    };
    'App_maximize': {
        args: [];
        return: void;
    };
    'App_close': {
        args: [];
        return: void;
    };

    'MCDirPicker_request-defaultMcDirPath': {
        args: [];
        return: string;
    };
    'MCDirPicker_open-dir-picker': {
        args: [
            currentPath: string
        ];
        return?: string;
    };
};

/**
 * IPC通信の引数定義\
 * Send, On用
 */
type IpcSOArgs = {
    'maximize': [
        isMaximize: boolean
    ];
};
