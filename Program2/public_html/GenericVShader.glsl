#version 300 es
// Vertex shader

in vec3 vPosition;  // position of vertex (x, y, z)
in vec3 vColor;     // color of vertex (r, g, b)

uniform mat4 modelView;    // transform for vertex into view coords
uniform mat4 projection;   // projection matrix

out vec3 fColor;       // output color to send to fragment shader

void main() {
  // Compute position in view coordinates
  vec4 viewPos = modelView * vec4(vPosition, 1.0);
  
  // Project point and set vertex position
  gl_Position = projection * viewPos; // set vertex position
  fColor = vColor;         // output color to fragment shader
}
