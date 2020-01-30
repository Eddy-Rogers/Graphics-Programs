/**
 * Lab 2 - COMP3801 Winter 2020
 *   Basic WebGL2 shaders, mouse events and coordinates
 * 
 * @author Mike Goss (mikegoss@cs.du.edu)
 * 
 * Modified on 01/22/2020 by Eddy Rogers (eddy.rogers@du.edu)
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
  
  this.sampleColors = ["white", "black", "red", "green", "blue", "cyan", "magenta", "yellow"];
  var colorButtons = [];
  for(var i in this.sampleColors) {
      var sampleColor = this.sampleColors[i];
      
      console.log(this.canvasID + "-" + sampleColor + "-button");
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
    t.vertexData = [];
    t.pointCount = 0;
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
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, t.vertexCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(t.vertexData), gl.STATIC_DRAW);  // write data to buffer
        
        requestAnimationFrame(render);
    }
  });
  
  canvas.addEventListener("mouseup", function (e) {
    t.mouseDown[e.button] = false;
    mouseButton.textContent = t.mouseDown;
//    var position = vec3(parseFloat(webGLmouseX.textContent), parseFloat(webGLmouseY.textContent), 0.0);
//    var color  = t.getSliderColor();
//    t.vertexData.push(position);
//    t.vertexData.push(color);
//    t.pointCount++;
//    gl.bufferData(gl.ARRAY_BUFFER, flatten(t.vertexData), gl.STATIC_DRAW);  // write data to buffer
//    requestAnimationFrame(render);
  });
  
  canvas.addEventListener("mousemove", function (e) {
    mouseX.textContent = e.pageX - e.target.offsetLeft;
    mouseY.textContent = e.pageY - e.target.offsetTop;
    
    //Calculate the WebGL coordinates
    webGLmouseX.textContent = ((2.0 * (e.pageX - e.target.offsetLeft) / (canvas.width - 1)) - 1.0).toFixed(3);
    webGLmouseY.textContent = (1.0 - (2.0 * (e.pageY - e.target.offsetTop) / (canvas.height - 1))).toFixed(3);
    
    if(t.mouseDown[2])
    {
        var position = vec3(parseFloat(webGLmouseX.textContent), parseFloat(webGLmouseY.textContent), 0.0);
        var color  = t.getSliderColor();
        t.vertexData.push(position);
        t.vertexData.push(color);
        t.pointCount++;
        gl.bufferData(gl.ARRAY_BUFFER, flatten(t.vertexData), gl.STATIC_DRAW);  // write data to buffer
        requestAnimationFrame(render);
    }
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
};