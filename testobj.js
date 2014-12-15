
var clock = new THREE.Clock();
var delta = clock.getDelta(); // seconds.

var camera, scene, renderer;

var texture, obj;
var materials; // array of materials that will start invisible

window.onload = function() {
  init();
  animate();
}

function init() {
  // add container to document
  container = document.createElement( 'div' );
  document.body.appendChild( container );

  // camera
  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.z = 100;

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
  var loader = new THREE.ImageLoader(manager);
  loader.load('textures/meat1.jpg', function(img) {
    texture.image = img;
    texture.emissive = new THREE.Color( 0xff0000 );
    texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.MipMapFilter;
    texture.repeat.set(1.0,1.0);
    texture.needsUpdate = true;

    console.log('loaded texture');

    loadDreamAnimal('cow');

    // model
    // loadMyObj('objs/bird.obj', manager);
  },onProgress, onError);

  var boxGeometry = new THREE.BoxGeometry(5.2, 5.2, 20.2); 
  var boxMaterial = new THREE.MeshBasicMaterial({ 
    map:texture,
    side:THREE.DoubleSide
  });
  boxMesh = new THREE.Mesh(boxGeometry, boxMaterial); 
  boxMesh.position.set(20.0,-40.0,4.0);
  scene.add(boxMesh);


  // renderer
  if(Detector.webgl){
    renderer = new THREE.WebGLRenderer({antialias:true});
  } else {
    renderer = new THREE.CanvasRenderer();
  }
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor(0x222222, 0.01);
  container.appendChild( renderer.domElement );
}


function animate() {
  render();
  requestAnimationFrame( animate );


}

function render() {
  if (typeof (obj) !== 'undefined') {
    obj.rotation.y += (0.1*(Math.PI / 180));
    obj.rotation.y %=360;
    obj.rotation.x += (0.01*(Math.PI / 180));
    obj.rotation.x %=360;

    boxMesh.rotation.x += (0.2*(Math.PI / 180));
    boxMesh.rotation.x %=360;
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
  }
  if (buildingAnimal) {
    showNextFace();
  }
}

////////////// from 3 dreams of black
// loads a .js file
function loadDreamAnimal(animalPath) {

  var path = './jsModels/' + animalPath + '.js';
  console.log(path);
  var loader = new THREE.JSONLoader();
  THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader() );

  loader.load(path, function(g) {
    // addAnimal(g);
    // buildAnimal(g);
    initAnimal(g);
  }, onProgress, onError);
  console.log('hi');
}

var buildingAnimal = false;
var allFaces = [];
var facePos = 0;

function initAnimal(g) {
  buildingAnimal = true;
  allFaces = g.faces;
  facePos = 0;
  clearAnimal();

  materials = [
    new THREE.MeshLambertMaterial( { map: texture, color: 0xffffff, side: THREE.DoubleSide } ),
  ];

  for (var i = 0; i < g.faces.length - 1; i++ ){
    materials.push(new THREE.MeshLambertMaterial( { visible: false } ) );
  }

  obj = new THREE.Mesh(g, new THREE.MeshFaceMaterial(materials));
  // make all faces invisible by assigning them to a unique materials index
  for (var i = 0; i < g.faces.length - 1; i++) {
    g.faces[ i ].materialIndex = i; // materialB
  }

  // obj.material.side = THREE.DoubleSide;
  // obj.material.color.setRGB(1, 1, 1);
  obj.geometry.computeFaceNormals();
  obj.geometry.computeVertexNormals();
  obj.geometry.buffersNeedUpdate = true;
  obj.geometry.uvsNeedUpdate = true;
  obj.geometry.elementsNeedUpdate = true;
  obj.geometry.castShadow = true;
  scene.add(obj);
}

function showNextFace() {
  obj.material.materials[facePos] = materials[0];
  if (facePos >= allFaces.length -1) {
    buildingAnimal = false;
  } else {
    facePos++;
  }
}

// function growAnimal() {
//   for (var i = 0; i < obj.geometry.vertices; i++) {
//     var v = obj.geometry.vertices[i];
//     v.x *= facePos;
//     v.y *= facePos;
//     v.z *= facePos;
//   }
//   facePos ++;
// }

// function addAnimalFaces() {
//   // make next face visible
//   obj.geometry.faces[ facePos ].materialIndex = 1;
//   // if (facePos >= allFaces.length -1) {
//   //   buildingAnimal = false;
//   // } else {
//   //   facePos++;
//   // }

//   // var g = obj.geometry;
//   // g.faces.push(allFaces[facePos]);
//   // obj = new THREE.Mesh(g);
//   // obj.material.map = texture;
//   // obj.material.side = THREE.DoubleSide;
//   // obj.material.color.setRGB(1, 1, 1);
//   obj.geometry.computeFaceNormals();
//   obj.geometry.computeVertexNormals();
//   obj.geometry.buffersNeedUpdate = true;
//   obj.geometry.uvsNeedUpdate = true;
//   obj.geometry.elementsNeedUpdate = true;
//   obj.geometry.castShadow = true;
//   // scene.add(obj);
//   if (facePos >= allFaces.length -1) {
//     buildingAnimal = false;
//   } else {
//     facePos++;
//   }
// }

function clearAnimal() {
  if (typeof(obj) !== 'undefined') {
    scene.remove(obj);
  }
}

///////////////////////////////////////
// loads an OBJ file
function loadMyObj(animalPath, m) {
  var manager = m;
  var loader = new THREE.OBJLoader( manager );
  loader.load( animalPath, function( object ) {
    obj = object;
    obj.traverse( function ( child ) {
      if ( child instanceof THREE.Mesh ) {
        // child.material.vertexColors = THREE.NoColors;
        child.material.map = texture;
        child.geometry.computeFaceNormals();
        child.geometry.computeVertexNormals();

        child.geometry.buffersNeedUpdate = true;
        child.geometry.uvsNeedUpdate = true;
        child.geometry.elementsNeedUpdate = true;

        child.castShadow = true;
        console.log('loaded obj');
      }
    });
      object = obj;
      object.position.x = -60;
      object.rotation.x = 20*Math.PI / 180;
      object.rotation.z = 20*Math.PI / 180;
      object.scale.x = 30;
      object.scale.y = 30;
      object.scale.z = 30;
      obj = object;

      scene.add(obj);
  }, onProgress, onError);
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


//// UNUSED
function addAnimal(g) {
  obj = new THREE.Mesh(g);
  obj.material.map = texture;
  obj.material.side = THREE.DoubleSide;
  g.computeFaceNormals();
  g.computeVertexNormals();
  g.buffersNeedUpdate = true;
  g.uvsNeedUpdate = true;
  g.elementsNeedUpdate = true;
  g.castShadow = true;
  obj.material.color.setRGB(1, 1, 1);
  scene.add(obj);
}

function buildAnimal(g) {
  var allFaces = g.faces;
  g.faces = [];
  for (var i = 0; i < allFaces.length; i++) {
    g.faces.push(allFaces[i]);
    if (typeof(obj) !== 'undefined') {
      scene.remove(obj);
    }
    obj = new THREE.Mesh(g);
    obj.material.map = texture;
    obj.material.side = THREE.DoubleSide;
    g.computeFaceNormals();
    g.computeVertexNormals();
    g.buffersNeedUpdate = true;
    g.uvsNeedUpdate = true;
    g.elementsNeedUpdate = true;
    g.castShadow = true;
    obj.material.color.setRGB(1, 1, 1);
    scene.add(obj);
  }
}

// research: http://www.infoplease.com/cig/biology/protein-synthesis.html