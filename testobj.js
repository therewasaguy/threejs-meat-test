
var clock = new THREE.Clock();
var delta = clock.getDelta(); // seconds.
var time = 0;
var camera, scene, renderer;

var texture;
var animals = [];
var animalGeo = []; // array of animal geometries
var materials; // array of materials that will start invisible

window.onload = function() {
  init();
  animate();
}

function init() {
  clock.start();

  // add container to document
  container = document.createElement( 'div' );
  document.body.appendChild( container );

  // camera
  // camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 100);
  camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, -10000, 10000 );
  camera.position.z = -100000;

  // scene
  scene = new THREE.Scene();

  var ambient = new THREE.AmbientLight( 0xffbbff );
  scene.add( ambient );

  var directionalLight = new THREE.DirectionalLight( 0xffffff );
  directionalLight.position.set( 0, 0, 1 ).normalize();
  scene.add( directionalLight );

  // texture
  var manager = new THREE.LoadingManager();
  manager.onProgress = function ( item, loaded, total ) {
    console.log( item, loaded, total );
  };

  texture = new THREE.ImageUtils.loadTexture('textures/meat1.jpg');
  texture.generateMipMaps = false;
  texture.wrapS = THREE.MirroredRepeatWrapping;
  texture.wrapT = THREE.MirroredRepeatWrapping;
  texture.repeat.set(1,1);
  texture.needsUpdate = true;

  ///////////////////////////////////////// obj1, obj2, obj3
  initAnimals();
  loadGeometry('panther');
  loadGeometry('panther');

  // renderer
  if(Detector.webgl){
    renderer = new THREE.WebGLRenderer();
  } else {
    renderer = new THREE.CanvasRenderer();
  }
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor(0x222222, 0.01);
  container.appendChild( renderer.domElement );
}

function initAnimals(){
  animals = [];
  animalGeo = [];
  buildingAnimal = false;
  facePos = 0;
}


function animate() {
  render();
  requestAnimationFrame( animate );
  time = clock.getElapsedTime();
}

function render() {
  renderer.clear();
  updateCamera();
  if (typeof (obj) !== 'undefined') {
    obj.rotation.y += (0.1*(Math.PI / 180));
    obj.rotation.y %=360;

  }
  if (buildingAnimal) {
    showNextFace();
  }
}

////////////// from 3 dreams of black, loads a .js file
function loadGeometry(animalPath) {

  var path = './jsModels/' + animalPath + '.js';
  console.log(path);
  var loader = new THREE.JSONLoader();
  THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader() );

  loader.load(path, function(g) {
    g.name = animalPath;
    animalGeo.push(g);
  }, onProgress, onError);
}


function initAnimal(g) {
  materials = [
    new THREE.MeshPhongMaterial( { map: texture, color: 0xffffff, side: THREE.DoubleSide, shading: THREE.NoShading, magFilter:THREE.NearestFilter, minFilter:THREE.NearestFilter } ),
  ];

  for (var i = 0; i < g.faces.length - 1; i++ ){
    materials.push(new THREE.MeshLambertMaterial( { visible: false } ) );
  }

  obj = new THREE.Mesh(g, new THREE.MeshFaceMaterial(materials));
  // make all faces invisible by assigning them to a unique materials index
  for (var i = 0; i < g.faces.length - 1; i++) {
    g.faces[ i ].materialIndex = i; // materialB
  }
  materials[0].map.generateMipMaps = false;
  materials[0].map.wrapS = THREE.MirroredRepeatWrapping;
  materials[0].map.wrapT = THREE.MirroredRepeatWrapping;
  materials[0].map.repeat.set(1,1);
  materials[0].map.needsUpdate = true;

  obj.geometry.computeFaceNormals();
  obj.geometry.computeVertexNormals();
  obj.geometry.buffersNeedUpdate = true;
  obj.geometry.uvsNeedUpdate = true;
  obj.geometry.elementsNeedUpdate = true;
  obj.geometry.castShadow = true;
  animals.push(obj);
  scene.add(obj);
}


function showNextFace() {
  var scaleSize = map_range(facePos, 0.2, allFaces.length-1, 0.0, 1.0);
  obj.scale.set(1.0, scaleSize, scaleSize);
  obj.material.materials[facePos] = materials[0];
  if (facePos >= allFaces.length -1) {
    buildingAnimal = false;
  } else {
    facePos++;
  }
}

// work on this
function clearAnimal() {
  if (typeof(obj) !== 'undefined') {
    scene.remove(obj);
  }
}

/// generate the hybrid animal
function genGeometry(percentage) {
  if (typeof (obj) !== 'undefined') {
    scene.remove(obj);
    obj = null;
    animals = [];
  }
  var p = 0.1;
  if (typeof (percentage) !== 'undefined') {
    p = percentage;
  } else {
    console.log('percentage was undefined');
  }
  console.log(p);
  var geometry = animalGeo[0].clone();
  for (var i in animalGeo[0].vertices) {
    var vec = animalGeo[0].vertices[i].lerp(animalGeo[1].vertices[i % animalGeo[1].vertices.length], p);
    geometry.vertices[i] = vec;
  }

  geometry.computeVertexNormals();
  geometry.computeLineDistances();
  geometry.verticesNeedUpdate = true;
  geometry.buffersNeedUpdate = true;
  geometry.uvsNeedUpdate = true;
  geometry.elementsNeedUpdate = true;
  geometry.castShadow = true;
  geometry.computeFaceNormals();
  geometry.computeTangents();

  genMesh(geometry);
}

function genMesh(g) {
  console.log(g);
  initAnimal(g);
  constructAnimal();
}

var buildingAnimal = false;
var allFaces = [];
var facePos = 0;

function constructAnimal() {
  allFaces = obj.geometry.faces;
  facePos = 0;
  buildingAnimal = true;
}

// HELPERS
var onProgress = function ( xhr ) {
  if ( xhr.lengthComputable ) {
    var percentComplete = xhr.loaded / xhr.total * 100;
    console.log( Math.round(percentComplete, 2) + '% downloaded' );
  }
};
var onError = function ( xhr ) {
  console.log(xhr);
};

function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}


/// MOUSE
var mouseX = 0;
var mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var r = 0.0;
document.addEventListener( 'mousemove', onDocumentMouseMove, false );

function onDocumentMouseMove(event) {

  mouseX = ( event.clientX / window.innerWidth ) * 2; // * 10;
  mouseY = ( event.clientY / window.innerHeight ) * 2; //* 10;
}


window.addEventListener( 'mousewheel', onMouseWheel, false );
window.addEventListener( 'DOMMouseScroll', onMouseWheel, false );

function onMouseWheel(ev) {
  var amount = -ev.wheelDeltaY || ev.detail;
  var dir = amount / Math.abs(amount);
  zoomspeed = dir/5;

  // Slow down default zoom speed after user starts zooming, to give them more control
  minzoomspeed = 0.001;
}


/// camera
var minzoomspeed = 0.015;
var zoomspeed = minzoomspeed;
var zoompos = -10;

function updateCamera() {
  // Put some limits on zooming
  var minzoom = 10;
  var maxzoom = 300;
  var damping = (Math.abs(zoomspeed) > minzoomspeed ? .95 : 1.0);

  // Zoom out faster the further out you go
  var zoom = THREE.Math.clamp(Math.pow(Math.E, zoompos), minzoom, maxzoom);
  zoompos = Math.log(zoom);

  // Slow down quickly at the zoom limits
  if ((zoom == minzoom && zoomspeed < 0) || (zoom == maxzoom && zoomspeed > 0)) {
    damping = .85;
  }

  zoompos += zoomspeed;
  zoomspeed *= damping;

  camera.position.x = Math.sin(.5 * Math.PI * (mouseX - .5)) * zoom;
  camera.position.y = Math.sin(.25 * Math.PI * (mouseY - .5)) * zoom;
  camera.position.z = Math.cos(.5 * Math.PI * (mouseX - .5)) * zoom;
  camera.zoom = zoompos ;
  camera.updateProjectionMatrix ()
  // if (typeof (obj) !== 'undefined') {
  //   obj.scale.x =  map_range(obj.scale.x, 0, 1, 0, zoom);
  //   obj.scale.y =  map_range(obj.scale.y, 0, 1, 0, zoom);;
  //   obj.scale.z =  map_range(obj.scale.z, 0, 1, 0, zoom);;
  // }

  camera.lookAt(scene.position);
  renderer.render(scene, camera);

}

function onWindowResize(event) {
  updateRendererSizes();
}

function updateRendererSizes() {

}