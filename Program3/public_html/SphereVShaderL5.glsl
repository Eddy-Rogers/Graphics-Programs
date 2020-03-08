#version 300 es
// Vertex shader for Sphere

// Per-vertex variables
in vec4 vPosition;
in vec4 vNormal;
in vec4 vSpecular;
in float vShininess;

in vec2 vTexCoord;

// Light information.  Four lights are supported.  Light positions are
// stored in a mat4, one light position per row. If the last (w) coordinate
// of the light position is 0, it is treated as a directional light source.
uniform mat4 vLightPos;  // light pos in viewing coord

// Light on/off information for the 4 light sources.  For vLightPos[i],
// vLightOn is non-zero to use the light, 0 to ignore it.
uniform vec4 vLightOn;

// Transformations
uniform mat4 vModelViewMatrix;
uniform mat4 vProjectionMatrix;

// Interpolated output values for fragment shader
out vec4 fSpecular;         // specular reflectivity
out float fShininess;       // shininess coeff (beta)
out vec4 fNormal;           // surface normal vector

out vec2 fTexCoord;

// The light direction and halfway vectors have one per light source.  We
// pack these into mat4, one per row
out mat4 fLightHalfway;     // halfway vector
out mat4 fLightDir;         // light direction vector

void main()
{
  fTexCoord = vTexCoord;

  vec4 normal = vec4(vNormal.xyz, 0.0);  // make sure last coord is 0

  // Transform the position and normal vector to viewing coord
  vec4 position_in_vc = vModelViewMatrix * vPosition;
  gl_Position = vProjectionMatrix * position_in_vc;
  fNormal = normalize(vModelViewMatrix * normal);

  // Compute vector from point to each light source
  for (int i = 0; i < 4; ++i) {
    if (vLightOn[i] != 0.0) {

      // Compute direction to the light
      vec4 to_light;
      if (vLightPos[i].w != 0.0) {  // if point source
        
        // TODO: to_light is vector from vertex position in viewing coords
        //       to the light source position
        to_light = vLightPos[i] - position_in_vc;
      } else {                      // directional source
        
        // TODO: to_light is just the light source vector
        to_light = vLightPos[i];
      }
      fLightDir[i] = normalize(to_light);

      // Compute halfway vector - this will be interpolated between vertices.
      // Remember that it should be a unit vector.
      // Notice that we're in viewing coordinates, so the vector to the eye
      // is just the vector to the origin.
      vec4 halfwayDir = normalize(to_light) - normalize(vec4(position_in_vc.xyz, 0.0));
      fLightHalfway[i] = normalize(halfwayDir); // *** TODO: compute halfway vector ***
    }
  }

  fSpecular = vSpecular;
  fShininess = vShininess;
}
 