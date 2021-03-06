import * as THREE from 'three';

const BLACK = '#000000';
const MAGENTA = '#f800f8';

export const generateErrTex = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;

    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    ctx.fillStyle = BLACK;
    ctx.fillRect(0, 0, 2, 2);

    ctx.fillStyle = MAGENTA;
    ctx.fillRect(1, 0, 1, 1);
    ctx.fillRect(0, 1, 1, 1);

    const blob = await new Promise<Blob>(resolve => {
        canvas.toBlob(blob => resolve(blob as Blob));
    });

    const texLoader = new THREE.TextureLoader();

    const tex = await texLoader.loadAsync(URL.createObjectURL(blob));
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;

    return tex;
};
