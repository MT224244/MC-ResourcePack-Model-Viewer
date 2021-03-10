import * as THREE from 'three';

import { IDisposable } from '@/renderer/IDisposable';

/**
 * モデルオブジェクト
 */
export interface IModel extends THREE.Object3D, IDisposable {}
