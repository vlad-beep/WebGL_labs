'use strict';

let gl; // The webgl context.
let surface; // A surface model
let shProgram; // A shader program
let spaceball; // A SimpleRotator object that lets the user rotate the view by mouse.
let light;
let lightPositionEl;
let lightPos = [0, 0, 0];
let radius = 10;

function deg2rad(angle) {
  return (angle * Math.PI) / 180;
}
function GetCirclePoint(angle) {
  const xInput = document.getElementById('x');
  const yInput = document.getElementById('y');
  const zInput = document.getElementById('z');
  const x = parseFloat(xInput.value);
  const y = parseFloat(yInput.value);
  const z = parseFloat(zInput.value);
  return [x, y, z];
}

// Constructor
function Model(name) {
  this.name = name;
  this.iVertexBuffer = gl.createBuffer();
  this.count = 0;

  this.BufferData = function (vertices) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

    this.count = vertices.length / 3;
  };

  this.Draw = function () {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
    gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shProgram.iAttribVertex);

    gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shProgram.iAttribNormal);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count);
  };
}

// Constructor
function ShaderProgram(name, program) {
  this.name = name;
  this.prog = program;

  // Location of the attribute variable in the shader program.
  this.iAttribVertex = -1;
  // Location of the uniform specifying a color for the primitive.
  this.iColor = -1;
  // Location of the uniform matrix representing the combined transformation.
  this.iModelViewProjectionMatrix = -1;

  // Normals
  this.iAttribNormal = -1;
  this.iAttribNormalMatrix = -1;

  // Ambient, diffuse, specular
  this.iAmbientColor = -1;
  this.iDiffuseColor = -1;
  this.iSpecularColor = -1;
  this.iAmbientCoefficient = -1;
  this.iDiffuseCoefficient = -1;
  this.iSpecularCoefficient = -1;
  // Shininess
  this.iShininess = -1;

  // Light position
  this.iLightPos = -1;

  this.Use = function () {
    gl.useProgram(this.prog);
  };
}

/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  /* Set the values of the projection transformation */
  let projection = m4.perspective(Math.PI / 2, 1, 4, 18);

  /* Get the view matrix from the SimpleRotator object.*/
  let modelView = spaceball.getViewMatrix();

  let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
  let translateToPointZero = m4.translation(0, 0, -10);

  let matAccum0 = m4.multiply(rotateToPointZero, modelView);
  let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

  const modelviewInv = m4.inverse(matAccum1, new Float32Array(16));
  const normalMatrix = m4.transpose(modelviewInv, new Float32Array(16));

  /* Multiply the projection matrix times the modelview matrix to give the
     combined transformation matrix, and send that to the shader program. */
  let modelViewProjection = m4.multiply(projection, matAccum1);

  gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

  gl.uniformMatrix4fv(shProgram.iAttribNormalMatrix, false, normalMatrix);

  let angle = Array.from(lightPositionEl.getElementsByTagName('input')).map((el) => +el.value)[0];

  lightPos = GetCirclePoint(angle);
  gl.uniform3fv(shProgram.iLightPos, lightPos);

  gl.uniform1f(shProgram.iShininess, 30.0);

  gl.uniform3fv(shProgram.iAmbientColor, [0.2, 0.13, 0.7]);
  gl.uniform3fv(shProgram.iDiffuseColor, [0.16, 1, 0.2]);
  gl.uniform3fv(shProgram.iSpecularColor, [1.0, 1.0, 1.0]);

  surface.Draw(gl.TRIANGLE_STRIP);
  light.Draw(gl.LINES);
}

function CreateSurfaceData() {
  let vertexList = [];
  const a = 1.5;
  const b = 3;
  const c = 2;
  const d = 4;

  for (let u = 0; u < 360; u += 0.2) {
    for (let v = 0; v < 360; v += 8) {
      let funcV =
        (a * b) /
        Math.sqrt(
          Math.pow(a, 2) * Math.pow(Math.sin(deg2rad(v)), 2) +
            Math.pow(b, 2) * Math.pow(Math.cos(deg2rad(v)), 2),
        );
      let funcS =
        funcV * (1 + Math.cos(deg2rad(u))) +
        (Math.pow(d, 2) - Math.pow(c, 2)) * ((1 - Math.cos(deg2rad(u))) / funcV);
      let x = 0.5 * funcS * Math.cos(deg2rad(v));
      let y = 0.5 * funcS * Math.sin(deg2rad(v));
      let z = 0.5 * (funcV - (Math.pow(d, 2) - Math.pow(c, 2)) / funcV) * Math.sin(deg2rad(u));
      vertexList.push(x, y, z);
    }
  }

  return vertexList;
}

function CreateLightData() {
  let vertexList = [];

  vertexList.push(lightPos[0], lightPos[1], lightPos[2]);
  vertexList.push(0, 0, 0);

  return vertexList;
}

/* Initialize the WebGL context. Called from init() */
function initGL() {
  let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

  shProgram = new ShaderProgram('Basic', prog);
  shProgram.Use();

  shProgram.iAttribVertex = gl.getAttribLocation(prog, 'vertex');
  shProgram.iAttribNormal = gl.getAttribLocation(prog, 'normal');
  shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, 'ModelViewProjectionMatrix');
  shProgram.iColor = gl.getUniformLocation(prog, 'color');
  shProgram.iAttribNormalMatrix = gl.getUniformLocation(prog, 'normalMat');
  shProgram.iAmbientColor = gl.getUniformLocation(prog, 'ambientColor');
  shProgram.iDiffuseColor = gl.getUniformLocation(prog, 'diffuseColor');
  shProgram.iSpecularColor = gl.getUniformLocation(prog, 'specularColor');
  shProgram.iShininess = gl.getUniformLocation(prog, 'shininess');
  shProgram.iLightPos = gl.getUniformLocation(prog, 'lightPosition');
  shProgram.iSpecularCoefficient = gl.getUniformLocation(prog, 'specularCoefficient');
  shProgram.iAmbientCoefficient = gl.getUniformLocation(prog, 'ambientCoefficient');
  shProgram.iDiffuseCoefficient = gl.getUniformLocation(prog, 'diffuseCoefficient');

  surface = new Model('Surface');
  surface.BufferData(CreateSurfaceData());

  light = new Model('light');
  light.BufferData(CreateLightData());
  gl.enable(gl.DEPTH_TEST);
}

/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
  let vsh = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vsh, vShader);
  gl.compileShader(vsh);
  if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
    throw new Error('Error in vertex shader:  ' + gl.getShaderInfoLog(vsh));
  }
  let fsh = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fsh, fShader);
  gl.compileShader(fsh);
  if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
    throw new Error('Error in fragment shader:  ' + gl.getShaderInfoLog(fsh));
  }
  let prog = gl.createProgram();
  gl.attachShader(prog, vsh);
  gl.attachShader(prog, fsh);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error('Link error in program:  ' + gl.getProgramInfoLog(prog));
  }
  return prog;
}

function Redraw() {
  surface.BufferData(CreateSurfaceData());
  light.BufferData(CreateLightData());
  draw();
}

/**
 * initialization function that will be called when the page has loaded
 */
function init() {
  lightPositionEl = document.getElementById('lightPostion');

  let canvas;
  try {
    canvas = document.getElementById('webglcanvas');
    gl = canvas.getContext('webgl');
    if (!gl) {
      throw 'Browser does not support WebGL';
    }
  } catch (e) {
    document.getElementById('canvas-holder').innerHTML =
      '<p>Sorry, could not get a WebGL graphics context.</p>';
    return;
  }
  try {
    initGL(); // initialize the WebGL graphics context
  } catch (e) {
    document.getElementById('canvas-holder').innerHTML =
      '<p>Sorry, could not initialize the WebGL graphics context: ' + e + '</p>';
    return;
  }

  spaceball = new TrackballRotator(canvas, draw, 0);
  draw();
}
