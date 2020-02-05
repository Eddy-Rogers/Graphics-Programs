#version 300 es
// Fragment shader

precision highp float;// required precision declaration

in vec4 fColor;       // input color for fragment
out vec4 outColor;    // output color

void main() {
  outColor = fColor;
}
