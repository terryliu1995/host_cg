// Global parameter

var container;
var convas;
var context;
var renderer;
var depthScene = new THREE.Scene(); // shadow map
var finalScene = new THREE.Scene(); // final map
var lightDirection = new THREE.Vector3(0.49,0.79,0.49);
// Axis helper
var worldFrame = new THREE.AxesHelper(2);
//particle
const PCOUNT = 15000;
var deltaTime;
var clock = new THREE.Clock(true);
var particleSystem1 = createRain(100, 100, 0.8);
var particleSystem2 = createRain(100, 0, 0.7);
var particleSystem3 = createRain(-100, 0, 0.6);
var particleSystem4 = createRain(-100, 100, 0.5);
// Cameras
// shadowMap_camera for scene that creates shadow map
var shadowMapWidth = 10;
var shadowMapHeight = 10;
var shadowMap_Camera = new THREE.OrthographicCamera(-8, 8, 8, -8, 1, 1000);
var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000); // view angle, aspect ratio, near, far
var cameraControl;
// shadow map
var shadowMap;
var colorMap;
var normalMap;
//uniforms
var cameraPositionUniform;
var lightColorUniform;
var ambientColorUniform;
var lightDirectionUniform;
var kAmbientUniform;
var kDiffuseUniform;
var kSpecularUniform;
var shininessUniform;
var bunnyPosition;
var lightViewMatrixUniform;
var lightProjectMatrixUniform;
var matrixWorldInverseUniform;
var lightningUniform;
// materials
var depthFloorMaterial;
var depthBunnyMaterial;
var terrainMaterial;
var skyboxCubemap;
var skyboxMaterial;
var bunnyMaterial;
var envmapMaterial;
const BOXURL = 'resource/images/';
const OBJURL = 'resource/obj/';
// terrain
var terrainGeometry;
var terrainShadow;
var terrain;
//Sphere
var sphereGeometry ;
var sphere;
//shader
var shaderFiles;
var skybox;
const DURL = 'shader/depth/';
const BURL = 'shader/bphong/';
const EURL = 'shader/envmap/';
const SURL = 'shader/skybox/';
const TURL = 'shader/terrain/';
//lightning
var initialTime = performance.now();
//sound
var audioListener = new THREE.AudioListener();
var audioLoader = new THREE.AudioLoader();
const SOUNDURL = 'resource/sound/rain.mp3';
// Input
var keyboard = new THREEx.KeyboardState();

// check version and Setup renderer
function setUpRenderer() {
  if ( WEBGL.isWebGL2Available() === false ) {
    document.body.appendChild( WEBGL.getWebGL2ErrorMessage() );
  }
  container = document.createElement( 'div' );
  document.body.appendChild( container );
  
  canvas = document.createElement("canvas");
  context = canvas.getContext( 'webgl2' );
  renderer = new THREE.WebGLRenderer( { canvas: canvas, context: context } );
  renderer.setClearColor(0X808080); // background color
  container.appendChild( renderer.domElement );
}

// Adapt backbuffer to window size
function windowControl() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  shadowMap_Camera.aspect = window.innerWidth / window.innerHeight;
  shadowMap_Camera.updateProjectionMatrix();
}


function createRain(scale, offset, opa) {

  // Create the geometry that will hold all of the vertices of raindrops
  var particles = new THREE.Geometry();

  // Create the vertices and add them to the particles geometry
  for (var p = 0; p < PCOUNT; p++) {

      // This will create all the vertices in a range of -200 to 200 in X, 100 to 200 in Y, and -100 to 50 in Z
      var x = Math.random() * 400 - 200;
      var y = Math.random() * scale + offset;
      var z = Math.random() * 150 - 100;

      // Create the vertex
      var particle = new THREE.Vector3(x, y, z);

      // Add the vertex to the geometry
      particles.vertices.push(particle);
  }
// Create the material that will be used to render each vertex of the geometry
  var particleMaterial = new THREE.PointsMaterial(
          {color: 0xffffffff,
           size: 1.5,
         map: new THREE.TextureLoader().load("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAIOCAYAAACxsI2jAAAFU0lEQVR4nO1dwU7sMAx0m4KQUM8rfoAv2f8/c+PMHjkgQNuWU1C2tLHj8TbJUl+exGNnnTR1xmMnNEQ0EWAt8uEdoHiApmno7u6OmqbRATw8PNDhcKDHx8coUEMLK7FpGur7np6fn8k5R+/v7/T6+kqfn59yD6Zpor7v6Xg80vF4pL7vF3+vWwMgInLO0dPT0+8wlox9Cn7sa3PAAkzT5RTNgQpeSKGFbs+HVMkQVAB+rOqXKbQYyDZzMH90IgBu7Eke7AA5ASSPkgVomobatr34WRKAc46cc/qg2rZtAS+TGgB6Cjf8NiYtpGmaouEsCuA/PI7jnxAfesF6MAwDDcOwuk+I+ME4julDiO3ISR5wtj2AmGAsjdv/LPy/63kgtehj5Egm64GPyBCAc+4irCfPQdu2WFhnv2AHyED3xQCSiMx64EHUIW0pKicBEBGN46iLyqEXlUblcgmGanNVewBzZYmxSxlOPKE5kJhYQ4E8qJjuEwFzIAmoIg84L0Rpn8oDz07grM05R13X6QgGzJEkdn2A/K+zCUCevdGEoXhuEPKDZK48DMNF8pnkgc8ZK2UoMMEwjYmmABWp+z6kQ7tzqOapAIj2vJGI32ALHoLJ2whF5TBnhPNGdVANo3JyWPfPfz6E/1RrMwWoNPkmMko84YBSsYJhCqCeRJPsnbPCAeBK11LemEyyoHpj6MWabZP2/de30ZTuQ/wA8mBeb1QB5Fe2OdsBigaQpHysB5LcURSV1UHVpI3EA6k8gOOBxCoBUIW0q+WNSe0DJmEdUvOI6DesJ3vgl29efmCSsVSsbK92SGvkwFjLaYWTqJqDWEfMNvVGCMCk2mcmBy6tie0nMUnJggjGUt6YPAcmBGPeKZsMwNkOUHxMLEfZzp83QgylvK1tewCTqJyv6usjMrS1QWLcnjcuW546U6WTKInIrAcmTRxwWA+HoSLbnCXnTEkexOidCAD2wBxAxVRNPcgHAIvzlbZQXA0g+URV3j4Us8q3GsCTCyhr45pdr0txJLYDFA9gkjfeSL3xhrb3HQAAgHam/LIwDFBGF8jeEQVEpPn4k5Iur6HApXO45dqEoUCNrjcmB6qKNLAHsILBgVTCUPIH1YoBzMS4vIknfBAGyp3N7sWpNG8s49R55VraDd3AoO6Iklrhiafkep+C52AtFlZ0QNIEAFZx/L9QkSbvDQymxbrKD4nmUTBCdgIxlK7r9Gd9/bdD0jhn1wfIr2BwOkoSxUlOPKG0T2rRmMidshV5ADEUk+I9ZwXvTFKQwucABoDPN8K30oRqnhrA64l5OqK4D4s9gAH29gElgI+HkAfwDQxExh1RKgDOtpFAKlY0zUQY0znYtkPSJG8MbdvmPu6bxQDm+8K2AkT+Zl9Y2Tbp2VYr2yFHUt85LzGRJKoGCIFUAGUK03DRNrk/kTNWGoeV7fP5fEEwkudgHEe9sj0vmavKxnmztrxLuYw605IlLSQuZ2QByqg3cqJk4UyVqOqb+0wAoNb7MITB9UbVDQxhHwp8A0PMCs/ayiQY+QDUsrCJB7F7AArf3ssBgKIyF9bEjzFv8R7aXMvJG9UA8FEc9gvKByhDW68UYC1vTGLrIcGAOqLUdwuHnqxZ4SUSU4aSJyaGploH8BwsReQkggHnjSbHD/aQBgBIJOEogI+F+dvKYDVPfWG7B4D7VG+Ard/AEOYm3t69JKyag2ma6Ovri06nE318fET5werfOj+fz3Q6nejl5YWIiL6/vxd/ryH6++favd3f39PhcCAiore3t0WQKEB41Zkv4P9R+2MAS4AQwJJVuBJ3gB1gBygV4AeT2N3vbwAzfAAAAABJRU5ErkJggg=="),
           blending: THREE.AdditiveBlending,
           transparent: true,
     opacity: opa,
          });

// Create the particle system
 particleSystem = new THREE.Points(particles, particleMaterial);
 return particleSystem;
}

function cameraSetUp() {
  shadowMap_Camera.position.set(10.0, 10.0, 10.0);
  // set the camera's lookAt and then add at it to the scene
  shadowMap_Camera.lookAt(new THREE.Vector3(0));
  depthScene.add(shadowMap_Camera);
  // Main camera
  camera.position.set(0,10,20);
  camera.lookAt(finalScene.position);
  finalScene.add(camera);
  // camera controls
  cameraControl = new THREE.OrbitControls(camera);
  cameraControl.damping = 0.2;
  cameraControl.autoRotate = false;
  finalScene.add(worldFrame);
}

function soundSetUp() {
  audioListener = new THREE.AudioListener();
  camera.add(audioListener);
  
  var sound = new THREE.Audio(audioListener);
  audioLoader = new THREE.AudioLoader();
  audioLoader.load(SOUNDURL, function(buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.5);
    sound.play();
  }); 
} 

// texture containing the depth values from the shadowMap_Camera POV
// create the depthTexture associating with this RenderTarget
function createShadowMap() {
  shadowMap = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight );
  shadowMap.texture.format = THREE.RGBFormat;
  shadowMap.texture.minFilter = THREE.NearestFilter;
  shadowMap.texture.magFilter = THREE.NearestFilter;
  shadowMap.texture.generateMipmaps = false;
  shadowMap.stencilBuffer = false;
  shadowMap.depthBuffer = true;
  shadowMap.depthTexture = new THREE.DepthTexture();
  shadowMap.depthTexture.type = THREE.UnsignedShortType;
}

// load texture
// anisotropy allows the texture to be viewed decently at skewed angles
function loadTexture() {
  colorMap = new THREE.TextureLoader().load('resource/images/color_rock.png');
  // var colorMap = new THREE.TextureLoader().load('resource/images/color.jpg');
  colorMap.minFilter = THREE.LinearFilter;
  colorMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
  // var normalMap = new THREE.TextureLoader().load('resource/images/normal_stone.png');
  normalMap = new THREE.TextureLoader().load('resource/images/normal_rock.png');
  normalMap.minFilter = THREE.LinearFilter;
  normalMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
}

// Uniforms
function initUniform() {
  cameraPositionUniform = {type: "v3", value: camera.position};
  lightColorUniform = {type: "c", value: new THREE.Vector3(1.0, 1.0, 1.0)};
  ambientColorUniform = {type: "c", value: new THREE.Vector3(1.0, 1.0, 1.0)};
  lightDirectionUniform = {type: "v3", value: lightDirection};
  kAmbientUniform = {type: "f", value: 0.1};
  kDiffuseUniform = {type: "f", value: 0.8};
  kSpecularUniform = {type: "f", value: 0.4};
  shininessUniform = {type: "f", value: 50.0};
  bunnyPosition = { type: 'v3', value: new THREE.Vector3(0.0,0.0,0.0)};
  lightViewMatrixUniform = {type: "m4", value: shadowMap_Camera.matrixWorldInverse};
  lightProjectMatrixUniform = {type: "m4", value: shadowMap_Camera.projectionMatrix};
  matrixWorldInverseUniform = {type: "m4", value: camera.matrixWorldInverse};
  lightningUniform = {type: "f", value: 0.0};
}

function setUpSkyBox() {
  skyboxCubemap = new THREE.CubeTextureLoader()
  .setPath( BOXURL )
  .load( [
    //Ask the load order
    'negx_st.png',
    'posx_st.png',
    'posy_st.png',
    'negy_st.png',
    'posz_st.png',
    'negz_st.png'
  ] );
  skyboxCubemap.format = THREE.RGBFormat;
}

// Materials
function initMaterial() {
  depthFloorMaterial = new THREE.ShaderMaterial({
  });

  depthBunnyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      bunnyPosition: bunnyPosition,
    }
  });

  terrainMaterial = new THREE.ShaderMaterial({
    uniforms: {
      lightColor: lightColorUniform,
      ambientColor: ambientColorUniform,
      lightDirection: lightDirectionUniform,
      kAmbient: kAmbientUniform,
      kDiffuse: kDiffuseUniform,
      kSpecular: kSpecularUniform,
      shininess: shininessUniform,
      colorMap: { type: "t", value: colorMap },
      normalMap: { type: "t", value: normalMap },
      shadowMap: { type: "t", value: shadowMap.depthTexture },
      lightProjectMatrix: lightProjectMatrixUniform,
      lightViewMatrix: lightViewMatrixUniform,
      lightning: lightningUniform,
    }
  });
  //set up the material for skybox
  skyboxMaterial = new THREE.ShaderMaterial({
    uniforms:{
      skybox: {type: "t", value: skyboxCubemap},
      lightning: lightningUniform,
    },
    side: THREE.DoubleSide
  });
  // object material
  bunnyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      lightColor: lightColorUniform,
      ambientColor: ambientColorUniform,
      lightDirection: lightDirectionUniform,
      kAmbient: kAmbientUniform,
      kDiffuse: kDiffuseUniform,
      kSpecular: kSpecularUniform,
      shininess: shininessUniform,
      bunnyPosition: bunnyPosition,
      lightning: lightningUniform,
    }
  });
  //set up the material for environment mapping
  envmapMaterial = new THREE.ShaderMaterial({
    uniforms:{
      skybox: {type: "t", value: skyboxCubemap},
      matrixWorldInverse: matrixWorldInverseUniform,
      lightning: lightningUniform,
    },
    side: THREE.DoubleSide
  });
}

function loadShader() {
  // Load shaders
  shaderFiles = [
    DURL + 'depth.vs.glsl',
    DURL + 'depth.fs.glsl',

    TURL + 'terrain.vs.glsl',
    TURL + 'terrain.fs.glsl',

    BURL + 'bphong.vs.glsl',
    BURL + 'bphong.fs.glsl',

    SURL + 'skybox.vs.glsl',
    SURL + 'skybox.fs.glsl',

    EURL + 'envmap.vs.glsl',
    EURL + 'envmap.fs.glsl'
  ];

  new THREE.SourceLoader().load(shaderFiles, function(shaders) {
    depthFloorMaterial.vertexShader = shaders['shader/depth/depth.vs.glsl'];
    depthFloorMaterial.fragmentShader = shaders['shader/depth/depth.fs.glsl'];

    depthBunnyMaterial.vertexShader = shaders['shader/bphong/bphong.vs.glsl'];
    depthBunnyMaterial.fragmentShader = shaders['shader/depth/depth.fs.glsl'];

    terrainMaterial.vertexShader = shaders['shader/terrain/terrain.vs.glsl'];
    terrainMaterial.fragmentShader = shaders['shader/terrain/terrain.fs.glsl'];

    bunnyMaterial.vertexShader = shaders['shader/bphong/bphong.vs.glsl'];
    bunnyMaterial.fragmentShader = shaders['shader/bphong/bphong.fs.glsl'];

    skyboxMaterial.vertexShader = shaders['shader/skybox/skybox.vs.glsl'];
    skyboxMaterial.fragmentShader = shaders['shader/skybox/skybox.fs.glsl'];

    envmapMaterial.vertexShader = shaders['shader/envmap/envmap.vs.glsl'];
    envmapMaterial.fragmentShader = shaders['shader/envmap/envmap.fs.glsl'];
  });
}

function initTerrain() {
  terrainGeometry = new THREE.PlaneBufferGeometry(10, 10);
  terrainShadow = new THREE.Mesh(terrainGeometry, depthFloorMaterial);
  terrainShadow.rotation.set(-1.57, 0, 0);
  depthScene.add(terrainShadow);
  terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
  terrain.rotation.set(-1.57, 0, 0);
  finalScene.add(terrain);
}
// Adding objects
function loadOBJ(scene, file, material, scale, xOff, yOff, zOff, xRot, yRot, zRot) {
  var onProgress = function(query) {
    if (query.lengthComputable) {
      var percentComplete = query.loaded / query.total * 100;
      console.log(Math.round(percentComplete, 2) + '% downloaded');
    }
  };

  var onError = function() {
    console.log('Failed to load ' + file);
  };

  var loader = new THREE.OBJLoader();
  loader.load(file, function(object) {
    object.traverse(function(child) {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });

    object.position.set(xOff, yOff, zOff);
    object.rotation.x = xRot;
    object.rotation.y = yRot;
    object.rotation.z = zRot;
    object.scale.set(scale, scale, scale);
    scene.add(object);
  }, onProgress, onError);
}

function initSphere() {
  sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
  sphere = new THREE.Mesh(sphereGeometry, envmapMaterial);
  sphere.position.set(0, 1, -2);
  finalScene.add(sphere);
}

function checkKeyboard() {
  if (keyboard.pressed("A"))
    bunnyPosition.value.x -= 0.1;
  if (keyboard.pressed("D"))
    bunnyPosition.value.x += 0.1;
  if (keyboard.pressed("W"))
    bunnyPosition.value.z -= 0.1;
  if (keyboard.pressed("S"))
    bunnyPosition.value.z += 0.1;
}

function updateParticle(verts, base, offset) {
  for(var i = 0; i < verts.length; i++) {
    var vert = verts[i];
    if (vert.y < 100) {
        vert.y = Math.random() * base + offset;
    }
    vert.y = vert.y - (50 * deltaTime);
  }
}
function animateParticles() {
  updateParticle(particleSystem1.geometry.vertices, 100, 100);
  updateParticle(particleSystem2.geometry.vertices, 300, -200);
  updateParticle(particleSystem3.geometry.vertices, 200, -200);
  updateParticle(particleSystem4.geometry.vertices, -50, -100);
   particleSystem1.geometry.verticesNeedUpdate = true;
   particleSystem2.geometry.verticesNeedUpdate = true;
   particleSystem3.geometry.verticesNeedUpdate = true;
   particleSystem4.geometry.verticesNeedUpdate = true;
}

function setLightning(){
  var rightNow = performance.now();
  var elapsedSeconds = Math.trunc(rightNow-initialTime/1000);
  if(elapsedSeconds % 23 == 0){
    lightningUniform.value = 1.0;
  }
  else{
    lightningUniform.value = 0.4;
  }
}

// Update routine
function updateByTime() {
  checkKeyboard();

  cameraPositionUniform.value = camera.position;
  depthFloorMaterial.needsUpdate = true;
  depthBunnyMaterial.needsUpdate = true;
  terrainMaterial.needsUpdate = true;
  bunnyMaterial.needsUpdate = true;
  skyboxMaterial.needsUpdate = true;
  envmapMaterial.needsUpdate = true;

  deltaTime = clock.getDelta();
  animateParticles();
  setLightning();
  requestAnimationFrame(updateByTime);
  // render depthScene to shadowMap target (instead of canvas as usual)
  renderer.render(depthScene, shadowMap_Camera, shadowMap);
  // render finalScene to the canvas
  renderer.render(finalScene, camera);

}

function initWindow() {
  window.addEventListener('resize', resize);
  window.addEventListener('vrdisplaypresentchange', resize, true);

  // Disable scrollbar function
  window.onscroll = function() {
    window.scrollTo(0, 0);
  }
}

function init() {
  setUpRenderer();
  cameraSetUp();
  soundSetUp();
  createShadowMap();
  loadTexture();
  initUniform();
  setUpSkyBox();
  initMaterial();
  loadShader();
  initTerrain();
  initObject()
}

function initObject() {
  skybox = new THREE.Mesh(new THREE.BoxGeometry( 1000, 1000, 1000 ), skyboxMaterial);
  finalScene.add(skybox);
  loadOBJ(depthScene, OBJURL + 'bunny.obj', depthBunnyMaterial, 1.0, -1.0, 0.0, 0, 0, 0, 0);
  loadOBJ(finalScene, OBJURL + 'bunny.obj', bunnyMaterial,      1.0, -1.0, 0.0, 0, 0, 0, 0);
  loadOBJ(finalScene, OBJURL + 'bunny.obj', envmapMaterial,         1.0, 2.0, 0.0, 0, 0, 0, 0);
  initSphere();
}

function initParticle() {
  finalScene.add(particleSystem1);
  finalScene.add(particleSystem2);
  finalScene.add(particleSystem3);
  finalScene.add(particleSystem4);
}
function main() {
  init();
  //Now add some Points to make rain.
  initParticle();
  windowControl();
  updateByTime();
}



