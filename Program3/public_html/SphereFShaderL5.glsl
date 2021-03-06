#version 300 es
// Fragment shader for Sphere
precision highp float;

// Light information.  Four lights are supported.  Light intensities are
// stored in a mat4, one per row.
uniform mat4 fLightDiffuse;
uniform mat4 fLightAmbient;
uniform mat4 fLightSpecular;

uniform vec4 fogColor;
uniform bool fogOn;

uniform bool procTexOn;
uniform float fTime;

// Light on/off information for the 4 light sources.  For light i,
// fLightOn is non-zero to use the light, 0 to ignore it.
uniform vec4 fLightOn;

uniform sampler2D fTexSampler;

// Interpolated input values from vertex shader
in vec4 fNormal;
in mat4 fLightDir;
in vec4 fSpecular;
in mat4 fLightHalfway;
in float fShininess;

in vec2 fTexCoord;

out vec4 fragColor;

void procTexture(in vec2 texCoord, in float time, out vec4 texture){
  float s = texCoord.x;
  float t = texCoord.y;
  float angle = mod(radians(((s + t)/2.0) * 360.0) + time, 360.0);
  //angle = mod(angle + time, 360.0);
  float r = ((sin(angle) + 1.0)/2.0);
  float g = ((cos(angle) + 1.0)/2.0);
  float b = ((tan(angle) + 1.0)/2.0);
  texture = vec4 (r, g, b, 1.0);
}

void main()
{
  vec4 shade = vec4(0.0, 0.0, 0.0, 0.0);     // initialize shade sum
  vec4 normal = normalize(fNormal);          // must normalize interpolated vector
   
  vec4 fDiffuse;
  if (procTexOn){
    procTexture(fTexCoord, fTime, fDiffuse);
  }
  else{
    fDiffuse = texture(fTexSampler, fTexCoord);  // use texture value as diffuse reflectance
  }

  // Use this code when using the procedural texture
    
  float depth = gl_FragCoord.z;
  
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
        vec4 diffLight = fLightDiffuse[i] * fDiffuse * dot(normal, normalLightDir[i]);
        if (diffLight.r > 0.0 && diffLight.g >= 0.0 && diffLight.b >= 0.0)
            shade += diffLight;
                
        // Specular reflectance
        vec4 specLight = (fLightSpecular[i] * fSpecular) * pow(dot(normal, normalize(fLightHalfway[i])), 2.0 * fShininess);
        if (specLight.b >= 0.0)
            shade += specLight;
         
    }
  }
  shade.a = 1.0;
  
  if (fogOn){
    shade = (shade * (pow(2.7, 0.0 - pow(depth, 2.0)))) + (fogColor * (1.0 - (pow(2.7, 0.0 - pow(depth, 2.0)))));
  }

  fragColor = shade;
}
