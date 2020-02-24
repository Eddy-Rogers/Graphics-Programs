#version 300 es
// Fragment shader
precision highp float;   // required precision declaration

in vec3 fColor;       // input color for fragment
out vec4 fragColor;   // output color for pixel

void main() {
  fragColor = vec4(fColor, 1.0);
}
