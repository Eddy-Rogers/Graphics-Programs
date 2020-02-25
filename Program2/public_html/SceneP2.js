/*
 * COMP3801 Winter 2020 Programming Project 2
 *  
 * Scene object - define model placement in world coordinates
 */

/*
 * Constructor for Scene object. This object holds a list of models to render,
 * and a transform for each one.  The list is defined in a JSON file.  The
 * field named "models" in the JSON file defines the list.  This field is an
 * array of objects. Each object contains the "modelURL", a scale factor,
 * and the placement of the model frame in world frame as vec3 values for the
 * "location" point and "xBasis", "yBasis", and "zBasis" vectors for the frame.
 * The scale factor should be applied to the points before applying the frame
 * transform.
 * 
 * @param canvasID - string ID of canvas in which to render
 * @param sceneURL - URL of JSON file containing scene definition
 */

function Scene(canvasID, sceneURL) {
    // Set up WebGL context
    var t = this;
    this.canvasID = canvasID;
    var canvas = this.canvas = document.getElementById(canvasID);
    if (!canvas) {
        alert("Canvas ID '" + canvasID + "' not found.");
        return;
    }
    var gl = this.gl = WebGLUtils.setupWebGL(this.canvas);
    if (!gl) {
        alert("WebGL isn't available in this browser");
        return;
    }

    this.mouseDown = [false, false, false];

    this.clickLocationX = 0;
    this.clickLocationY = 0;

    this.currentRotationX = 0;
    this.currentRotationY = 0;

    this.totalRotationX = 0;
    this.totalRotationY = 0;

    this.currentDistance = 0;

    this.animationDirection = true;

    // Add key press event handler
    canvas.addEventListener("keypress", function (event) {
        t.KeyInput(event);
    });

    canvas.addEventListener("mousedown", function (e) {
        t.mouseDown[e.button] = true;
        if (e.button === 0) {
            t.clickLocationX = ((2.0 * (e.pageX - e.target.offsetLeft) / (canvas.width - 1)) - 1.0).toFixed(3);
            t.clickLocationY = (1.0 - (2.0 * (e.pageY - e.target.offsetTop) / (canvas.height - 1))).toFixed(3);
            t.currentRotationX = 0;
            t.currentRotationY = 0;
        }
    });

    canvas.addEventListener("mouseup", function (e) {
        t.mouseDown[e.button] = false;
        if (e.button === 0) {
            t.totalRotationX += t.currentRotationX;
            t.totalRotationY += t.currentRotationY;
            t.currentRotationX = 0;
            t.currentRotationY = 0;
        }

    });

    canvas.addEventListener("mousemove", function (e) {
        if (t.mouseDown[0] === true) {
            var currentX = ((2.0 * (e.pageX - e.target.offsetLeft) / (canvas.width - 1)) - 1.0).toFixed(3);
            var currentY = (1.0 - (2.0 * (e.pageY - e.target.offsetTop) / (canvas.height - 1))).toFixed(3);

            t.currentRotationY = t.clickLocationX - currentX;
            t.currentRotationX = currentY - t.clickLocationY;
        }
    });

    // Load the scene definition
    var jScene = this.jScene = LoadJSON(sceneURL);
    if (jScene === null) return;  // scene load failed (LoadJSON alerts on error)

    this.animationDistance = jScene.animationStep;
    this.collisionDistance = jScene.collisionDistance;

    // Set up WebGL rendering settings
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);
    var bgColor = [0, 0, 0, 1];
    if ("bgColor" in jScene) {
        bgColor = jScene["bgColor"];
    }
    gl.clearColor(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);

    // Set up User Interface elements
    this.fovSliderID = canvasID + "-fov-slider";
    this.fovSlider = document.getElementById(this.fovSliderID);

    // Get the initial camera parameters (copy values so we can change them
    // without modifying the jScene object, we might want the original values
    // to do a reset).
    this.ResetCamera();


    /*this.animationDistance = (Math.sqrt(Math.pow((jScene.models[2].location[0] - jScene.models[1].location[0]), 2) +
                                   Math.pow((jScene.models[2].location[1] - jScene.models[1].location[1]), 2) +
                                   Math.pow((jScene.models[2].location[2] - jScene.models[1].location[2]), 2))) / jScene.animationStep;*/

    this.stepX = (jScene.models[2].location[0] - jScene.models[1].location[0]);
    this.stepY = (jScene.models[2].location[1] - jScene.models[1].location[1]);
    this.stepZ = (jScene.models[2].location[2] - jScene.models[1].location[2]);

    // Load each model in the scene
    var loadedModels = this.loadedModels = [];  // array of models
    for (var i = 0; i < jScene.models.length; ++i) {
        // Load model from JSON and add to loadedModels array
        var jModel = jScene.models[i];
        var model = new JSONModel(gl, jModel.modelURL);
        if (model === null) return;  // failed to load a model

        var mf;

        if (i === 0) {
            this.xLoc = (jScene.models[1].location[0] + jScene.models[2].location[0]) / 2;
            this.yLoc = (jScene.models[1].location[1] + jScene.models[2].location[1]) / 2;
            this.zLoc = (jScene.models[1].location[2] + jScene.models[2].location[2]) / 2;

            this.yBase = (normalize(subtract(jScene.models[1].location, vec3(this.xLoc, this.yLoc, this.zLoc))));
            this.zBase = vec3(0, 0, 1);
            this.xBase = cross(this.yBase, this.zBase);

            this.currentX = this.xLoc;
            this.currentY = this.yLoc;
            this.currentZ = this.zLoc;

            mf = mat4(this.xBase[0], this.yBase[0], this.zBase[0], this.xLoc,
                this.xBase[1], this.yBase[1], this.zBase[1], this.yLoc,
                this.xBase[2], this.yBase[2], this.zBase[2], this.zLoc,
                0.0, 0.0, 0.0, 1.0);
        } else {
            mf = mat4(jModel.xBasis[0], jModel.yBasis[0], jModel.zBasis[0], jModel.location[0],
                jModel.xBasis[1], jModel.yBasis[1], jModel.zBasis[1], jModel.location[1],
                jModel.xBasis[2], jModel.yBasis[2], jModel.zBasis[2], jModel.location[2],
                0.0, 0.0, 0.0, 1.0);
        }

        // Compute transform matrix for model
        var ms = scalem(jModel.scale);

        model.transform = mult(mf, ms);

        // Save model
        loadedModels.push(model);
    }

    this.preRotationDegrees = 0.0;

    // Start rendering
    requestAnimationFrame(function () {
        t.Render();
    });
};

Scene.prototype.Render = function () {
    var t = this;
    var gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var camera = this.camera;

    // Compute aspect ratio of canvas
    var aspect = this.canvas.width / this.canvas.height;

    // Build projection matrix
    var projection = [];
    camera.FOVdeg = this.fovSlider.valueAsNumber;
    projection = perspective(camera.FOVdeg, aspect,
        camera.near, camera.far);

    // Determine look-at point
    var lookAtPoint = camera.lookAt;  // point from scene file
    if (this.lookAtModel >= 0) {      // if looking at object
        if(this.lookAtModel === 0) {
            lookAtPoint = vec3(this.currentX, this.currentY, this.currentZ);
        }
        else {
            lookAtPoint = this.jScene.models[this.lookAtModel].location;
        }
    }


    // Build view transform and initialize matrix stack
    var matrixStack = new MatrixStack;
    matrixStack.LoadMatrix(
        lookAt(camera.location, lookAtPoint, camera.approxUp));

    // Render each loaded object with its transform
    for (var i = 0; i < this.loadedModels.length; ++i) {
        matrixStack.PushMatrix();


        matrixStack.MultMatrix(translate(lookAtPoint));
        matrixStack.MultMatrix(rotateX((this.currentRotationX + this.totalRotationX) * 90));
        matrixStack.MultMatrix(rotateY((this.currentRotationY + this.totalRotationY) * 90));
        matrixStack.MultMatrix(translate(-lookAtPoint[0], -lookAtPoint[1], -lookAtPoint[2]));


        // @EDDY ROGERS
        // This code is supposed to check if the object's distance to the target is less than the collision distance
        // and reverse the path of the animation.
        // Right now the switch is hard coded, and the object does not flip around like it is supposed to
        if (i === 0) {
            if (this.animationDirection) {
                distance = length(subtract(this.jScene.models[1].location, vec3(this.currentX, this.currentY, this.currentZ)));
                console.log(distance);
                if (distance <= this.collisionDistance) {
                    this.animationDirection = false;
                }
            }
            if (this.animationDirection === false) {
                distance = length(subtract(this.jScene.models[2].location, vec3(this.currentX, this.currentY, this.currentZ)));
                if (distance <= this.collisionDistance) {
                    this.animationDirection = true;
                }
            }
            var mf;
            if (this.animationDirection) {
                mf = mat4(this.xBase[0], this.yBase[0], this.zBase[0], this.xLoc,
                    this.xBase[1], this.yBase[1], this.zBase[1], this.yLoc,
                    this.xBase[2], this.yBase[2], this.zBase[2], this.zLoc,
                    0.0, 0.0, 0.0, 1.0);
                this.currentX -= this.stepX / this.animationDistance;
                this.currentY -= this.stepY / this.animationDistance;
                this.currentZ -= this.stepZ / this.animationDistance;
            }
            else {
                mf = mat4(this.xBase[0], -this.yBase[0], this.zBase[0], this.xLoc,
                    this.xBase[1], -this.yBase[1], this.zBase[1], this.yLoc,
                    this.xBase[2], -this.yBase[2], this.zBase[2], this.zLoc,
                    0.0, 0.0, 0.0, 1.0);
                this.currentX += this.stepX / this.animationDistance;
                this.currentY += this.stepY / this.animationDistance;
                this.currentZ += this.stepZ / this.animationDistance;
            }
            var ms = scalem(this.jScene.models[0].scale);
            this.loadedModels[0].transform = mult(mf, ms);
            matrixStack.MultMatrix(translate(this.currentX, this.currentY, this.currentZ));
        }

    // Post-multiply frame transform from model to world coordinates
    matrixStack.MultMatrix(this.loadedModels[i].transform);

    this.loadedModels[i].Render(projection, matrixStack);

    this.currentDistance += this.animationDistance;


    matrixStack.PopMatrix();
}

requestAnimationFrame(function () {
    t.Render();
});
}
;

Scene.prototype.ResetCamera = function () {
    // Copy the camera parameters from the jScene object.  The copy's values
    // are independent of the originals, so changes won't affect the originals.
    this.camera = {};
    this.camera.location = this.jScene.camera.location.slice();
    this.camera.lookAt = this.jScene.camera.lookAt.slice();
    this.lookAtModel = -1;
    this.camera.approxUp = this.jScene.camera.approxUp.slice();
    this.camera.FOVdeg = this.jScene.camera.FOVdeg;
    this.camera.near = this.jScene.camera.near;
    this.camera.far = this.jScene.camera.far;

    // Set UI elements to the values defined in the scene files
    this.fovSlider.value = this.camera.FOVdeg;
    SliderUpdate(this.fovSliderID + "-output", this.camera.FOVdeg);
};

Scene.prototype.KeyInput = function (event) {
    // Get character from event
    var c = String.fromCharCode(event.which);

    // If numeric, switch view to selected object
    var atModel = parseInt(c);
    if (!isNaN(atModel))
        if (atModel <= this.jScene.models.length) {  // if in range
            this.lookAtModel = atModel - 1;  // model index or -1 to use orig. lookAt
        }
};
