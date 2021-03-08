// ItemModelのFragmentシェーダー

in vec3 position;
in vec4 color;
in vec3 nextPosition;
in vec4 nextColor;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

out vec4 vColor;
out vec4 vNextColor;

void main() {
    vColor = color;
    vNextColor = nextColor;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
