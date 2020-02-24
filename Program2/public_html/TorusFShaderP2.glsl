#version 300 es
// Fragment shader for Torus for Lab 5
precision highp float;   // required precision declaration

in vec3 fColor;       // input color for fragment
out vec4 fragColor;   // output fragment color

void main() {
  fragColor = vec4(fColor, 1.0);
}
