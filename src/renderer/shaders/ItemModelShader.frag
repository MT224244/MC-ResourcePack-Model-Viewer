// ItemModelのVertexシェーダー

precision mediump float;

uniform float tick;

in vec4 vColor;
in vec4 vNextColor;

out vec4 frag_color;

void main() {
    vec4 color = vColor;

    color.r = mix(color.r, vNextColor.r, tick);
    color.g = mix(color.g, vNextColor.g, tick);
    color.b = mix(color.b, vNextColor.b, tick);

    frag_color = color;
}
