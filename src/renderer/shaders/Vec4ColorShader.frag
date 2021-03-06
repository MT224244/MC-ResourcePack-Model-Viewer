// ItemModelを透明度に対応させるためのVertexシェーダー

precision mediump float;

varying vec4 vColor;

void main() {
    gl_FragColor = vColor;
}
