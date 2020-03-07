#version 300 es
// Fragment shader for Sphere
precision highp float;

// Light information.  Four lights are supported.  Light intensities are
// stored in a mat4, one per row.
uniform mat4 fLightDiffuse;
uniform mat4 fLightAmbient;
uniform mat4 fLightSpecular;

// Light on/off information for the 4 light sources.  For light i,
// fLightOn is non-zero to use the light, 0 to ignore it.
uniform vec4 fLightOn;

// Interpolated input values from vertex shader
in vec4 fNormal;
in mat4 fLightDir;
in vec4 fSpecular;
in mat4 fLightHalfway;
in float fShininess;

out vec4 fragColor;

void main()
{
  vec4 shade = vec4(0.0, 0.0, 0.0, 0.0);     // initialize shade sum
  vec4 normal = normalize(fNormal);          // must normalize interpolated vector
  vec4 fDiffuse = vec4(1.0, 1.0, 1.0, 1.0);  // use white as diffuse color
  
  for (int i = 0; i < 4; ++i) {
    if (fLightOn[i] != 0.0) {
      shade += fLightAmbient[i] * fDiffuse;    // use diffuse reflectance for ambient
      
      // Normalize interpolated light vectors

      //**** TODO: Add your code here ****//
      mat4 normalLightDir;
        normalLightDir[i] = normalize(fLightDir[i]);
      
      

      // Compute diffuse and specular reflectance
      // (remember to check for and discard negative light values)

      //**** TODO: Add your code here ****//
      
                
        // Diffuse reflectance
        vec4 diffLight = fLightDiffuse[i] * dot(normal, normalLightDir[i]);
        if (diffLight.r > 0.0 && diffLight.g >= 0.0 && diffLight.b >= 0.0)
            shade += diffLight;
                
        // Specular reflectance
        vec4 specLight = (fLightSpecular[i] * fSpecular) * pow(dot(normal, normalize(fLightHalfway[i])), fShininess);
        if (specLight.b >= 0.0)
            shade += specLight;
         
    }
  }
  shade.a = 1.0;
  fragColor = shade;
}
