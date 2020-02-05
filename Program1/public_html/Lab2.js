/**
 * Lab 2 - COMP3801 Winter 2020
 *   Basic WebGL2 shaders, mouse events and coordinates
 * 
 * @author Mike Goss (mikegoss@cs.du.edu)
 * 
 * Modified on 02/01/2020 by Eddy Rogers (eddy.rogers@du.edu) and Declan Kahn
 */

"use strict";

// Constructor
//
// @param canvasID - string containing name of canvas to render.
//          Buttons and sliders should be prefixed with this string.
//
function Lab2(canvasID /* name of canvas to render */) {
  this.canvasID = canvasID;
  this.canvas = document.getElementById(canvasID);
  if (!this.canvas) {
    alert("Canvas ID '" + canvasID + "' not found.");
    return;
  }
  this.gl = WebGLUtils.setupWebGL(this.canvas);
  if (!this.gl) {
    alert("WebGL isn't available in this browser");
    return;
  }

  this.init();
}

// Define prototype values common to all Lab2 objects
Lab2.prototype.gl = null;

Lab2.prototype.toString = function () {
  return JSON.stringify(this);
};

Lab2.prototype.init = function () {
  var canvas = this.canvas;
  var gl = this.gl;
  var t = this;  // make available to event handlers

  // WebGL setup
  gl.viewport(0, 0, canvas.width, canvas.height);

  // Compile and link shaders
  this.shaderProgram = initShaders(gl, "vShader.glsl", "fShader.glsl");
  if (this.shaderProgram === null)
    return;
  gl.useProgram(this.shaderProgram);

  // Define names for colors
  var white = vec3(1.0, 1.0, 1.0);
  var red = vec3(1.0, 0.0, 0.0);
  var green = vec3(0.0, 1.0, 0.0);
  var blue = vec3(0.0, 0.0, 1.0);
  var yellow = vec3(1.0, 1.0, 1.0);
  
  // Array of alternating initial vertex coordinates and colors for each vertex
  /*this.vertexData = flatten([
    vec3(0.0, 0.0, 0.0),
    white,
    vec3(0.5, 0.5, 0.0),
    red,
    vec3(-0.5, 0.5, 0.0),
    green,
    vec3(-0.5, -0.5, 0.0),
    blue,
    vec3(0.5, -0.5, 0.0),
    yellow
  ]);*/
  
  // vertexData stores the data of points in the current, incomplete triangle
  this.vertexData = [];
  
  // triangleData stores the data of points in complete triangles
  this.triangleData = [];
  
  // Count of points in vertexData and triangleData
  this.currentPointCount = 0;
  this.pointCount = 0;
  
  // Load vertex data into WebGL buffer
  this.vertexCoordBuffer = gl.createBuffer();  // get unique buffer ID
  this.triangleCoordBuffer = gl.createBuffer();
  
  //Define an alpha value and set it in the shader program
  this.alpha = 1;
  var colorOffset = gl.getUniformLocation(this.shaderProgram, "alpha");
  gl.uniform1f(colorOffset, 1);
  
  //Enable transparency
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  
  //gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexCoordBuffer);  // make this the active buffer
  //gl.bufferData(gl.ARRAY_BUFFER, this.vertexData, gl.STATIC_DRAW);  // write data to buffer

  this.vPosition = gl.getAttribLocation(this.shaderProgram, "vPosition");
  gl.enableVertexAttribArray(this.vPosition);
  
  this.vColor = gl.getAttribLocation(this.shaderProgram, "vColor");
  gl.enableVertexAttribArray(this.vColor);

  // Define callback for change of slider value
  var sliderCallback = function (e) {
    // Update text display for slider
    var color = e.target.value;
    e.target.valueDisplay.textContent = color;

    // Re-render canvas
    requestAnimationFrame(render);
  };

  // Set up HTML user interface
  this.colors = ["r", "g", "b"];
  var rgbSliders = [];         // array of slider HTML elements
  var rgbSliderValues = [];    // array of slider value HTML elements

  // Set up an object with sliders for the three colors. The sliders are
  // accessed using "indices" of "r", "g", and "b".
  for (var i in this.colors) {
    var color = this.colors[i];
    var sliderID = this.canvasID + "-" + color + "-slider";
    rgbSliders[color] = document.getElementById(sliderID);
    if (rgbSliders[color] === null) {
      alert("Slider ID not found: " + sliderID);
      return;
    }
    var valueID = this.canvasID + "-" + color + "-value";
    rgbSliderValues[color] = document.getElementById(valueID);
    if (rgbSliders[color] === null) {
      alert("Slider value ID not found: " + sliderID);
      return;
    }
    rgbSliders[color].valueDisplay = rgbSliderValues[color];  // attach to slider
    
    // Set callback on slider input
    rgbSliders[color].addEventListener("input", sliderCallback);
  }
  this.rgbSliders = rgbSliders;

  var resetButton = document.getElementById(this.canvasID + "-reset-button");
  if (resetButton === null) {
    alert("Reset button ID not found: " + this.canvasID + "-reset-button");
    return;
  }
  
  //Get the HTML elements for the transparency buttons
  var opaqueButton = document.getElementById(this.canvasID + "-opaque-button");
  var transparentButton = document.getElementById(this.canvasID + "-transparent-button");
  
  //Add event listeners for the transparency buttons
  opaqueButton.addEventListener("click", transparencyCallback);
  transparentButton.addEventListener("click", transparencyCallback);
  
  //Callback function for transparency buttons, which change the alpha value in the object and in the shader program
  function transparencyCallback() {
      if (this.id === t.canvasID + "-opaque-button") {
          t.alpha = 1;
      }
      else if (this.id === t.canvasID + "-transparent-button") {
          t.alpha = 0.5;
      }
      //Set the alpha value
      var colorOffset = gl.getUniformLocation(t.shaderProgram, "alpha");
      gl.uniform1f(colorOffset, t.alpha);
      //Render a frame
      requestAnimationFrame(render);
  }
  
  //List of the colors you can set the verteces to
  this.sampleColors = ["white", "black", "red", "green", "blue", "cyan", "magenta", "yellow"];
  var colorButtons = [];
  //Get each button, and add a callback function which changes the program values
  for(var i in this.sampleColors) {
      var sampleColor = this.sampleColors[i];
      
      var buttonElement = document.getElementById(this.canvasID + "-" + sampleColor + "-button");
      
      colorButtons[sampleColor] = buttonElement;
      
      if(colorButtons[sampleColor] === null)
      {
        alert("Button ID not found: " + sliderID);
        return;
      }
      
      colorButtons[sampleColor].addEventListener("click", function () {
        // Update text display for slider
        var id = this.id;
        switch(id) {
            case (t.canvasID + "-white-button"):
                t.rgbSliders["r"].valueAsNumber = 1.0;
                t.rgbSliders["g"].valueAsNumber = 1.0;
                t.rgbSliders["b"].valueAsNumber = 1.0;
                break;
            case (t.canvasID + "-black-button"):
                t.rgbSliders["r"].valueAsNumber = 0;
                t.rgbSliders["g"].valueAsNumber = 0;
                t.rgbSliders["b"].valueAsNumber = 0;
                break;
            case (t.canvasID + "-red-button"):
                t.rgbSliders["r"].valueAsNumber = 1.0;
                t.rgbSliders["g"].valueAsNumber = 0;
                t.rgbSliders["b"].valueAsNumber = 0;
                break;
            case (t.canvasID + "-yellow-button"):
                t.rgbSliders["r"].valueAsNumber = 1.0;
                t.rgbSliders["g"].valueAsNumber = 1.0;
                t.rgbSliders["b"].valueAsNumber = 0;
                break;
            case (t.canvasID + "-green-button"):
                t.rgbSliders["r"].valueAsNumber = 0;
                t.rgbSliders["g"].valueAsNumber = 1.0;
                t.rgbSliders["b"].valueAsNumber = 0;
                break;
            case (t.canvasID + "-cyan-button"):
                t.rgbSliders["r"].valueAsNumber = 0;
                t.rgbSliders["g"].valueAsNumber = 1.0;
                t.rgbSliders["b"].valueAsNumber = 1.0;
                break;
            case (t.canvasID + "-blue-button"):
                t.rgbSliders["r"].valueAsNumber = 0;
                t.rgbSliders["g"].valueAsNumber = 0;
                t.rgbSliders["b"].valueAsNumber = 1.0;
                break;
            case (t.canvasID + "-magenta-button"):
                t.rgbSliders["r"].valueAsNumber = 1.0;
                t.rgbSliders["g"].valueAsNumber = 0;
                t.rgbSliders["b"].valueAsNumber = 1.0;
                break;
        }
        //Update the text content
        for(var i in t.rgbSliders){
            t.rgbSliders[i].valueDisplay.textContent = t.rgbSliders[i].valueAsNumber;
        }
        //Render a frame
        requestAnimationFrame(render);
      });
  }
  
  // Set up the callback for the reset button
  resetButton.addEventListener("click", function () {
    // Reset all the sliders to the middle value
    for (var i in rgbSliders) {
      rgbSliders[i].value = rgbSliders[i].max / 2.0;
      rgbSliders[i].valueDisplay.textContent =
              rgbSliders[i].valueAsNumber / rgbSliders[i].max;
    }
    //Reset all of our data
    t.vertexData = [];
    t.triangleData = [];
    t.pointCount = 0;
    t.currentPointCount = 0;
    //Write the empty arrays to both buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, t.triangleCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(t.vertexData), gl.STATIC_DRAW);  // write data to buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, t.vertexCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(t.vertexData), gl.STATIC_DRAW);  // write data to buffer
    
    requestAnimationFrame(render);
  });

  // Set up callback to render a frame
  var render = function () {
    t.Render();
  };

  // Set up the callback for the reset button
  resetButton.addEventListener("click", function () {
    // Reset all the sliders to the middle value
    for (var i in rgbSliders) {
      rgbSliders[i].value = rgbSliders[i].max / 2.0;
      rgbSliders[i].valueDisplay.textContent =
              rgbSliders[i].valueAsNumber / rgbSliders[i].max;
    }
    t.vertexData = [];
    t.pointCount = 0;
    gl.bufferData(gl.ARRAY_BUFFER, flatten(t.vertexData), gl.STATIC_DRAW);  // write data to buffer
    
    requestAnimationFrame(render);
  });

  // Set up mouse tracking
  var mouseX = document.getElementById(this.canvasID + "-mousex");
  var mouseY = document.getElementById(this.canvasID + "-mousey");
  
  var webGLmouseX = document.getElementById(this.canvasID + "-webGLmousex");
  var webGLmouseY = document.getElementById(this.canvasID + "-webGLmousey");
  
  var mouseButton = document.getElementById(this.canvasID + "-mousebutton");
  this.mouseDown = [ false, false, false ];  // track mouse button state
  mouseButton.textContent = this.mouseDown;
  if (mouseX === null || mouseY === null || mouseButton === null) {
    alert("Mouse output HTML IDs not found");
    return;
  }

  // Add mouse event handlers
  canvas.addEventListener("mousedown", function (e) {
    t.mouseDown[e.button] = true;
    mouseButton.textContent = t.mouseDown;
    if(t.mouseDown[0])
    {
        var position = vec3(parseFloat(webGLmouseX.textContent), parseFloat(webGLmouseY.textContent), 0.0);
        var color  = t.getSliderColor();
        t.vertexData.push(position);
        t.vertexData.push(color);
        t.currentPointCount++;
        t.pointCount++;
        
        // If there are three points in vertexData, the triangle is complete and should be moved to triangleData
        if(t.currentPointCount === 3){
            t.triangleData.push(t.vertexData);
            t.vertexData = [];
            t.currentPointCount = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, t.triangleCoordBuffer);
            var merged = [].concat.apply([], t.triangleData);
            console.log(merged);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(merged), gl.STATIC_DRAW);  // write data to buffer
            
            //Clearing the vertex buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, t.vertexCoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, 96, gl.STATIC_DRAW);//96 is the max size the buffer should ever be
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, t.vertexCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(t.vertexData), gl.STATIC_DRAW);  // write data to buffer
        
        requestAnimationFrame(render);
    }
  });
  
  canvas.addEventListener("mouseup", function (e) {
    t.mouseDown[e.button] = false;
    mouseButton.textContent = t.mouseDown;
  });
  
  canvas.addEventListener("mousemove", function (e) {
    mouseX.textContent = e.pageX - e.target.offsetLeft;
    mouseY.textContent = e.pageY - e.target.offsetTop;
    
    //Calculate the WebGL coordinates
    t.mouseXPos = ((2.0 * (e.pageX - e.target.offsetLeft) / (canvas.width - 1)) - 1.0).toFixed(3);
    t.mouseYPos = (1.0 - (2.0 * (e.pageY - e.target.offsetTop) / (canvas.height - 1))).toFixed(3);
    webGLmouseX.textContent = t.mouseXPos;
    webGLmouseY.textContent = t.mouseYPos;
    
    if (t.currentPointCount > 0)
      requestAnimationFrame(render);
  });

  // Kick things off with an initial rendering
  requestAnimationFrame(render);
};

/**
 * GetSliderColors - get the current RGB color represented by the sliders
 *   as a vec3.
 *   
 * @returns {vec3} current slider color
 */
Lab2.prototype.getSliderColor = function () {
  // Build an array of color values based on the current slider colors
  var colorValues = [];
  for (var i in this.colors) {
    var color = this.colors[i];
    var colorValue = this.rgbSliders[color].valueAsNumber;
    colorValues[i] = colorValue;
  }

  return vec3(colorValues);
};

/**
 * Render - draw the frame
 *
 */
Lab2.prototype.Render = function () {
  var floatSize = 4;  // size of gl.FLOAT in bytes
  var gl = this.gl;
  
  //Clear the canvas
  gl.clearColor(0.0, 0.0, 0.25, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, this.triangleCoordBuffer);
  
  //console.log(flatten(this.triangleData));
  // Define data layout in buffer for position.  Postions are 3 floats,
  // interleaved with 3 floats for colors, starting at beginning of buffer.
  gl.vertexAttribPointer(this.vPosition, 3, gl.FLOAT, false, 6 * floatSize, 0);

  // Define data layout in buffer for colors.  Colors are 3 floats,
  // interleaved with 3 floats for positions, starting after first position in buffer.
  gl.vertexAttribPointer(this.vColor, 3, gl.FLOAT, false, 6 * floatSize, 3 * floatSize);
  
  gl.drawArrays(gl.TRIANGLES, 0, this.pointCount);
  
  
  // Now that we're done drawing complete triangles, draw rubber band lines
  //    for the triangle currently being drawn.
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexCoordBuffer);
  
  // If there is at least one point in the buffer, we want to draw lines between
  //    those points and the mouse. So we add the mouse position to the buffer.
  if(this.currentPointCount > 0)
  {
      var position = vec3(parseFloat(this.mouseXPos), parseFloat(this.mouseYPos), 0.0);
      var color  = this.getSliderColor();
      
      // Copy the vertex data so the current position of the mouse doesn't get
      //    permanently added to the array.
      var vDataCopy = this.vertexData.slice(0);
      vDataCopy.push(position);
      vDataCopy.push(color);
      
      // If there are two points in the array, we want to draw lines from
      //    point one to point two, point two to the mouse, and then
      //    the mouse back to point one, so we add point one to the array again.
      if(this.currentPointCount === 2){
          vDataCopy.push(vDataCopy[0]);
          vDataCopy.push(vDataCopy[1]);
      }
      
      gl.bufferData(gl.ARRAY_BUFFER, flatten(vDataCopy), gl.STATIC_DRAW);  // write data to buffer
  }
  
  gl.vertexAttribPointer(this.vPosition, 3, gl.FLOAT, false, 6 * floatSize, 0);
  gl.vertexAttribPointer(this.vColor, 3, gl.FLOAT, false, 6 * floatSize, 3 * floatSize);
  
  // currentPointcount is the number of points that should be rubber-banding.
  //    So we multiply that number by two, because one extra point is in the buffer
  //    for each rubber-band line.
  gl.drawArrays(gl.LINE_STRIP, 0, 2 * this.currentPointCount);
};