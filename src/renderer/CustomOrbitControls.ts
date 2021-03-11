/*!
 * The MIT License
 *
 * Copyright © 2010-2021 three.js authors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import * as THREE from 'three';

type State =
    | 'NONE'
    | 'ROTATE'
    | 'DOLLY'
    | 'PAN'
    | 'TOUCH_ROTATE'
    | 'TOUCH_PAN'
    | 'TOUCH_DOLLY_PAN'
    | 'TOUCH_DOLLY_ROTATE';

export class CustomOrbitControls {
    // #region OrbitControls public properties

    public object: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    public domElement: HTMLElement;

    public enabled = true;

    public target = new THREE.Vector3();

    public minDistance = 0;
    public maxDistance = Infinity;

    public minZoom = 0;
    public maxZoom = Infinity;

    public minPolarAngle = 0;
    public maxPolarAngle = Infinity;

    public minAzimuthAngle = -Infinity;
    public maxAzimuthAngle = Infinity;

    public enableDamping = false;
    public dampingFactor = 0.05;

    public enableZoom = true;
    public zoomSpeed = 1.0;

    public enableRotate = true;
    public rotateSpeed = 1.0;

    public enablePan = true;
    public panSpeed = 1.0;
    public screenSpacePanning = true;
    public keyPanSpeed = 7.0;

    public autoRotate = false;
    public autoRotateSpeed = 2.0;

    public mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
    };

    // #endregion

    // #region OrbitControls private properties

    private target0: THREE.Vector3;
    private position0: THREE.Vector3;
    private zoom0: number;

    private state: State = 'NONE';

    private EPS = 0.000001;

    private spherical = new THREE.Spherical();
    private sphericalDelta = new THREE.Spherical();

    private scale = 1;
    private panOffset = new THREE.Vector3();
    private zoomChanged = false;

    private rotateStart = new THREE.Vector2();
    private rotateEnd = new THREE.Vector2();
    private rotateDelta = new THREE.Vector2();

    private panStart = new THREE.Vector2();
    private panEnd = new THREE.Vector2();
    private panDelta = new THREE.Vector2();

    private dollyStart = new THREE.Vector2();
    private dollyEnd = new THREE.Vector2();
    private dollyDelta = new THREE.Vector2();

    // #endregion

    private pCamera: THREE.PerspectiveCamera;
    private oCamera: THREE.OrthographicCamera;

    public constructor(
        pCamera: THREE.PerspectiveCamera,
        oCamera: THREE.OrthographicCamera,
        domElement: HTMLCanvasElement
    ) {
        this.pCamera = pCamera;
        this.oCamera = oCamera;

        this.object = pCamera;
        this.domElement = domElement;

        this.target0 = this.target.clone();
        this.position0 = pCamera.position.clone();
        this.zoom0 = pCamera.zoom;

        domElement.addEventListener('contextmenu', this.onContextMenu.bind(this));

        domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
        domElement.addEventListener('wheel', this.onMouseWheel.bind(this));
    }

    // #region OrbitControls public methods

    public getPolarAngle(): number {
        return this.spherical.phi;
    }

    public getAzimuthalAngle(): number {
        return this.spherical.theta;
    }

    public saveState(): void {
        this.target0.copy(this.target);
        this.position0.copy(this.object.position);
        this.zoom0 = this.object.zoom;
    }

    public reset(): void {
        this.target.copy(this.target0);
        this.object.position.copy(this.position0);
        this.object.zoom = this.zoom0;

        this.object.updateProjectionMatrix();

        this.update();

        this.state = 'NONE';
    }

    public update(): boolean {
        const offset = new THREE.Vector3();

        const quat = new THREE.Quaternion().setFromUnitVectors(this.object.up, new THREE.Vector3(0, 1, 0));
        const quatInverse = quat.clone().invert();

        const lastPosition = new THREE.Vector3();
        const lastQuaternion = new THREE.Quaternion();

        const twoPI = 2 * Math.PI;

        const position = this.object.position;

        offset.copy(position).sub(this.target);

        // rotate offset to "y-axis-is-up" space
        offset.applyQuaternion(quat);

        // angle from z-axis around y-axis
        this.spherical.setFromVector3(offset);

        if (this.autoRotate && this.state === 'NONE') {
            this.rotateLeft(this.getAutoRotationAngle());
        }

        if (this.enableDamping) {
            this.spherical.theta += this.sphericalDelta.theta * this.dampingFactor;
            this.spherical.phi += this.sphericalDelta.phi * this.dampingFactor;
        }
        else {
            this.spherical.theta += this.sphericalDelta.theta;
            this.spherical.phi += this.sphericalDelta.phi;
        }

        // restrict theta to be between desired limits

        let min = this.minAzimuthAngle;
        let max = this.maxAzimuthAngle;

        if (isFinite(min) && isFinite(max)) {
            if (min < -Math.PI) min += twoPI;
            else if (min > Math.PI) min -= twoPI;

            if (max < -Math.PI) max += twoPI;
            else if (max > Math.PI) max -= twoPI;

            if (min <= max) {
                this.spherical.theta = Math.max(min, Math.min(max, this.spherical.theta));
            }
            else {
                this.spherical.theta = (this.spherical.theta > (min + max) / 2)
                    ? Math.max(min, this.spherical.theta)
                    : Math.min(max, this.spherical.theta);
            }
        }

        // restrict phi to be between desired limits
        this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));

        this.spherical.makeSafe();

        this.spherical.radius *= this.scale;

        // restrict radius to be between desired limits
        this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));

        // move target to panned location

        if (this.enableDamping) {
            this.target.addScaledVector(this.panOffset, this.dampingFactor);
        }
        else {
            this.target.add(this.panOffset);
        }

        offset.setFromSpherical(this.spherical);

        // rotate offset back to "camera-up-vector-is-up" space
        offset.applyQuaternion(quatInverse);

        position.copy(this.target).add(offset);

        this.object.lookAt(this.target);

        if (this.enableDamping) {
            this.sphericalDelta.theta *= (1 - this.dampingFactor);
            this.sphericalDelta.phi *= (1 - this.dampingFactor);

            this.panOffset.multiplyScalar(1 - this.dampingFactor);
        }
        else {
            this.sphericalDelta.set(0, 0, 0);

            this.panOffset.set(0, 0, 0);
        }

        this.scale = 1;

        // update condition is:
        // min(camera displacement, camera rotation in radians)^2 > EPS
        // using small-angle approximation cos(x/2) = 1 - x^2 / 8

        if (this.zoomChanged || lastPosition.distanceToSquared(this.object.position) > this.EPS || 8 * (1 - lastQuaternion.dot(this.object.quaternion)) > this.EPS) {
            lastPosition.copy(this.object.position);
            lastQuaternion.copy(this.object.quaternion);
            this.zoomChanged = false;

            return true;
        }

        return false;
    }

    public dispose(): void {
        this.domElement.removeEventListener('contextmenu', this.onContextMenu.bind(this));

        this.domElement.removeEventListener('pointerdown', this.onPointerDown.bind(this));
        this.domElement.removeEventListener('wheel', this.onMouseWheel.bind(this));

        this.domElement.ownerDocument.removeEventListener('pointermove', this.onPointerMove.bind(this));
        this.domElement.ownerDocument.removeEventListener('pointerup', this.onPointerUp.bind(this));
    }

    // #endregion

    public ChangeCamera(camera: 'perspective' | 'orthographic') {
        if (camera === 'perspective') {
            this.object = this.pCamera;

            this.pCamera.position.copy(this.oCamera.position);
        }
        else {
            this.object = this.oCamera;

            this.oCamera.position.copy(this.pCamera.position);
        }
    }

    // #region OrbitControls private methods

    private getAutoRotationAngle() {
        return 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;
    }

    private getZoomScale() {
        return Math.pow(0.95, this.zoomSpeed);
    }

    private rotateLeft(angle: number) {
        this.sphericalDelta.theta -= angle;
    }

    private rotateUp(angle: number) {
        this.sphericalDelta.phi -= angle;
    }

    private panLeft(distance: number, objectMatrix: THREE.Matrix4) {
        const v = new THREE.Vector3();

        v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix
        v.multiplyScalar(-distance);

        this.panOffset.add(v);
    }

    private panUp(distance: number, objectMatrix: THREE.Matrix4) {
        const v = new THREE.Vector3();

        if (this.screenSpacePanning) {
            v.setFromMatrixColumn(objectMatrix, 1);
        }
        else {
            v.setFromMatrixColumn(objectMatrix, 0);
            v.crossVectors(this.object.up, v);
        }

        v.multiplyScalar(distance);

        this.panOffset.add(v);
    }

    // deltaX and deltaY are in pixels; right and down are positive
    private pan(deltaX: number, deltaY: number) {
        const offset = new THREE.Vector3();

        const element = this.domElement;

        // PerspectiveCamera
        const position = this.pCamera.position;
        offset.copy(position).sub(this.target);
        let targetDistance = offset.length();

        // half of the fov is center to top of screen
        targetDistance *= Math.tan((this.pCamera.fov / 2) * Math.PI / 180.0);

        // we use only clientHeight here so aspect ratio does not distort speed
        this.panLeft(2 * deltaX * targetDistance / element.clientHeight, this.pCamera.matrix);
        this.panUp(2 * deltaY * targetDistance / element.clientHeight, this.pCamera.matrix);

        // OrthographicCamera
        this.panLeft(deltaX * (this.oCamera.right - this.oCamera.left) / this.oCamera.zoom / element.clientWidth, this.oCamera.matrix);
        this.panUp(deltaY * (this.oCamera.top - this.oCamera.bottom) / this.oCamera.zoom / element.clientHeight, this.oCamera.matrix);
    }

    private dollyOut(dollyScale: number) {
        // PerspectiveCamera
        this.scale /= dollyScale;

        // OrthographicCamera
        this.oCamera.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.oCamera.zoom * dollyScale));
        this.oCamera.updateProjectionMatrix();
        this.zoomChanged = true;
    }

    private dollyIn(dollyScale: number) {
        // PerspectiveCamera
        this.scale *= dollyScale;

        // OrthographicCamera
        this.oCamera.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.oCamera.zoom / dollyScale));
        this.oCamera.updateProjectionMatrix();
        this.zoomChanged = true;
    }

    private handleMouseDownRotate(event: MouseEvent) {
        this.rotateStart.set(event.clientX, event.clientY);
    }

    private handleMouseDownDolly(event: MouseEvent) {
        this.dollyStart.set(event.clientX, event.clientY);
    }

    private handleMouseDownPan(event: MouseEvent) {
        this.panStart.set(event.clientX, event.clientY);
    }

    private handleMouseMoveRotate(event: MouseEvent) {
        this.rotateEnd.set(event.clientX, event.clientY);

        this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);

        const element = this.domElement;

        this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientHeight); // yes, height

        this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight);

        this.rotateStart.copy(this.rotateEnd);

        this.update();
    }

    private handleMouseMoveDolly(event: MouseEvent) {
        this.dollyEnd.set(event.clientX, event.clientY);

        this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);

        if (this.dollyDelta.y > 0) {
            this.dollyOut(this.getZoomScale());
        }
        else if (this.dollyDelta.y < 0) {
            this.dollyIn(this.getZoomScale());
        }

        this.dollyStart.copy(this.dollyEnd);

        this.update();
    }

    private handleMouseMovePan(event: MouseEvent) {
        this.panEnd.set(event.clientX, event.clientY);

        this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);

        this.pan(this.panDelta.x, this.panDelta.y);

        this.panStart.copy(this.panEnd);

        this.update();
    }

    private handleMouseWheel(event: WheelEvent) {
        if (event.deltaY < 0) {
            this.dollyIn(this.getZoomScale());
        }
        else if (event.deltaY > 0) {
            this.dollyOut(this.getZoomScale());
        }

        this.update();
    }

    private onPointerDown(event: PointerEvent) {
        if (!this.enabled) return;

        switch (event.pointerType) {
            case 'mouse':
            case 'pen':
                this.onMouseDown(event);
                break;
        }
    }

    private onPointerMove(event: PointerEvent) {
        if (!this.enabled) return;

        switch (event.pointerType) {
            case 'mouse':
            case 'pen':
                this.onMouseMove(event);
                break;
        }
    }

    private onPointerUp(event: PointerEvent) {
        switch (event.pointerType) {
            case 'mouse':
            case 'pen':
                this.onMouseUp();
                break;
        }
    }

    private onMouseDown(event: MouseEvent) {
        // Prevent the browser from scrolling.
        event.preventDefault();

        // Manually set the focus since calling preventDefault above
        // prevents the browser from setting it automatically.

        this.domElement.focus ? this.domElement.focus() : window.focus();

        let mouseAction: THREE.MOUSE;

        switch (event.button) {
            case 0:
                mouseAction = this.mouseButtons.LEFT;
                break;
            case 1:
                mouseAction = this.mouseButtons.MIDDLE;
                break;
            case 2:
                mouseAction = this.mouseButtons.RIGHT;
                break;
            default:
                mouseAction = -1;
        }

        switch (mouseAction) {
            case THREE.MOUSE.DOLLY:
                if (!this.enableZoom) return;

                this.handleMouseDownDolly(event);

                this.state = 'DOLLY';

                break;
            case THREE.MOUSE.ROTATE:
                if (event.ctrlKey || event.metaKey || event.shiftKey) {
                    if (!this.enablePan) return;

                    this.handleMouseDownPan(event);

                    this.state = 'PAN';
                }
                else {
                    if (!this.enableRotate) return;

                    this.handleMouseDownRotate(event);

                    this.state = 'ROTATE';
                }

                break;
            case THREE.MOUSE.PAN:
                if (event.ctrlKey || event.metaKey || event.shiftKey) {
                    if (!this.enableRotate) return;

                    this.handleMouseDownRotate(event);

                    this.state = 'ROTATE';
                }
                else {
                    if (!this.enablePan) return;

                    this.handleMouseDownPan(event);

                    this.state = 'PAN';
                }

                break;
            default:
                this.state = 'NONE';
        }

        if (this.state !== 'NONE') {
            this.domElement.ownerDocument.addEventListener('pointermove', this.onPointerMove.bind(this));
            this.domElement.ownerDocument.addEventListener('pointerup', this.onPointerUp.bind(this));
        }
    }

    private onMouseMove(event: MouseEvent) {
        if (!this.enabled) return;

        event.preventDefault();

        switch (this.state) {
            case 'ROTATE':
                if (!this.enableRotate) return;

                this.handleMouseMoveRotate(event);

                break;
            case 'DOLLY':
                if (!this.enableZoom) return;

                this.handleMouseMoveDolly(event);

                break;
            case 'PAN':
                if (!this.enablePan) return;

                this.handleMouseMovePan(event);

                break;
        }
    }

    private onMouseUp() {
        this.domElement.ownerDocument.removeEventListener('pointermove', this.onPointerMove.bind(this));
        this.domElement.ownerDocument.removeEventListener('pointerup', this.onPointerUp.bind(this));

        if (!this.enabled) return;

        this.state = 'NONE';
    }

    private onMouseWheel(event: WheelEvent) {
        if (!this.enabled || !this.enableZoom || (this.state !== 'NONE' && this.state !== 'ROTATE')) return;

        event.preventDefault();
        event.stopPropagation();

        this.handleMouseWheel(event);
    }

    private onContextMenu(event: MouseEvent) {
        if (!this.enabled) return;

        event.preventDefault();
    }

    // #endregion
}
