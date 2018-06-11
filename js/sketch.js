var container, stats, controls;
var camera, scene, renderer;
var particlesObj;
var hemiLight, dirLight, hemiLightHelper, dirLightHelper;
var projector, mouseVector, raycaster;
var intersects;
var currentObjIntersected = null;
var currentObjMaterial = null;

var clock       = new THREE.Clock();
var fbxIsLoaded = false;
var fbxModel_1  = null;
var fbxModel_2  = null;
var fbxModel_3  = null;

checkWebGL();
init();
animate();

// -----------------------------------------------------
function checkWebGL() {
  if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
  } else {
    console.log('[checkWebGL] WebGL Supported.');
  }
}

// -----------------------------------------------------
function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  projector   = new THREE.Projector();
  mouseVector = new THREE.Vector3();

  setupCamera();
  setupLights();
  setupRenderer();
  setupStars();
  setupScene();

  // setupControls();
  setupStats();

  window.addEventListener( 'resize', onWindowResize, false );
}

// -----------------------------------------------------
function setupCamera() {
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 100, 800);
  camera.position.z = -800;
}

// -----------------------------------------------------
function setupControls() {
  controls = new THREE.OrbitControls(camera);
  controls.target.set(0, 0, 0);
  controls.update();
}

// -----------------------------------------------------
function setupLights() {
  hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
  hemiLight.color.setHSL( 0.6, 1, 0.6 );
	hemiLight.groundColor.setHSL( 0.1, 1, 0.75 );
	hemiLight.position.set( 0, 50, 0 );

  // dirLight                      = new THREE.DirectionalLight(0xffffff);
  // dirLight.castShadow           = false;
  // dirLight.shadow.camera.top    = 180;
  // dirLight.shadow.camera.bottom = -100;
  // dirLight.shadow.camera.left   = -120;
  // dirLight.shadow.camera.right  = 120;
  // dirLight.position.set(0, 200, 100);

  // Light helpers
  // hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 5);
  // dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 5);
}

// -----------------------------------------------------
function setupRenderer() {
  renderer = new THREE.WebGLRenderer({
    // antialias: true,
    alpha: true
  });

  renderer.setPixelRatio(window.devicePixelRatio * 0.8);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false;
  renderer.sortObjects       = false;
  renderer.autoClear         = false;
  renderer.setClearColor(0x000000, 0.0);

  container.appendChild(renderer.domElement);
}

// -----------------------------------------------------
function setupScene() {
  scene = new THREE.Scene();
  camera.lookAt( scene.position );

  // add lights
  scene.add(hemiLight);
  // scene.add(dirLight);

  // add light helpers
  // scene.add(hemiLightHelper);
  // scene.add(dirLightHelper);

  // add stars
  scene.add(particlesObj);

  // load the model and add it to the scene
  let loader = new THREE.FBXLoader();

  loader.load('models/tunnel.fbx', function(fbxData) {
    fbxIsLoaded = true;

    fbxData.traverse(function(group) {
      group.traverse(function(child) {
        if (child.isMesh) {
          child.material.side = THREE.DoubleSide;
        }
      });
    });

    // if everything worked out, add to the scene
    fbxModel_1 = fbxData;
    fbxModel_2 = fbxModel_1.clone();
    fbxModel_3 = fbxModel_1.clone();

    fbxModel_2.rotation.y = Math.PI;
    fbxModel_2.position.z = 600;
    fbxModel_2.rotation.z += Math.PI;

    fbxModel_3.position.z = 1200;

    scene.add(fbxModel_1);
    scene.add(fbxModel_2);
    scene.add(fbxModel_3);

    window.addEventListener( 'mousemove', onMouseMove, false );
  });
}

// -----------------------------------------------------
// Star code from https://codepen.io/tr13ze/pen/pbjWwg
function setupStars() {
  particlesObj = new THREE.Object3D();

  let numStars = 5000;
  let geometry = new THREE.TetrahedronGeometry(1, 0);
  let material = new THREE.MeshPhongMaterial({
      color: 0xffffff
  });

  for (let i = 0; i < numStars; i++) {
    let starMesh = new THREE.Mesh(geometry, material);
    starMesh.position.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    starMesh.position.multiplyScalar(90 + (Math.random() * 700));
    starMesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
    particlesObj.add(starMesh);
  }
}

// -----------------------------------------------------
function onMouseMove(e) {
  e.preventDefault();
  // map mouse coordinates to range (-1, 1) on x & y axes
  mouseVector.x = 2 * (e.clientX / window.innerWidth) - 1;
  mouseVector.y = 1 - 2 * ( e.clientY / window.innerHeight );

  // setup raycaster
  raycaster = new THREE.Raycaster();
  raycaster.setFromCamera( mouseVector, camera );

  let pickableObjs = fbxModel_1.children.concat(fbxModel_2.children).concat(fbxModel_3.children);
  intersects = raycaster.intersectObjects( pickableObjs );

  // if we are intersecting something
  if (intersects.length > 0) {
    let intersectingObj = intersects[0].object;

    if (intersectingObj.name.includes('Rock') || intersectingObj.name.includes('Gem')) {
      if (currentObjIntersected !== intersectingObj || currentObjIntersected == null) {

        if (currentObjIntersected !== null) {
          currentObjIntersected.material = currentObjMaterial;
          currentObjMaterial = null;
          currentObjIntersected = null;
        }

        // store a copy of the material to reset to later
        currentObjMaterial = intersectingObj.material.clone();

        // create another copy of the material so we can modify the emissive
        let materialCopy = intersectingObj.material.clone();
        materialCopy.emissive.set( 0x3d8fb1 );
        materialCopy.emissiveIntensity = 1.2;
        intersectingObj.material = materialCopy;
        currentObjIntersected = intersectingObj;
      }

    } else {
      // if we're intersecting a non-rock/gem but we were intersecting a gem/rock before
      if (currentObjIntersected !== null) {
        currentObjIntersected.material = currentObjMaterial;
        currentObjMaterial = null;
        currentObjIntersected = null;
      }
    }
  }
}

// -----------------------------------------------------
function setupStats() {
  stats = new Stats();
  container.appendChild(stats.dom);
}

// -----------------------------------------------------
function animate() {
  requestAnimationFrame(animate);
  renderer.clear();
  renderer.render(scene, camera);

  // is this the right way to do this?
  if (fbxIsLoaded) {
    // depending on what tunnel we are currently in,
    // we move one of them to make it 'infinite'
    if (fbxModel_1.position.z == -300) {
      fbxModel_2.position.z = 300;
    }

    if (fbxModel_3.position.z == -300) {
      fbxModel_1.position.z = 300;
    }

    if (fbxModel_2.position.z == -300) {
      fbxModel_3.position.z = 300;
    }

    // update positions & rotations
    fbxModel_1.position.z -= 1;
    fbxModel_2.position.z -= 1;
    fbxModel_3.position.z -= 1;

    fbxModel_1.rotation.z += 0.001;
    fbxModel_2.rotation.z += 0.001;
    fbxModel_3.rotation.z += 0.001;

    particlesObj.rotation.y += 0.001;
    particlesObj.rotation.x += 0.0005;
  }

  stats.update();
}

// -----------------------------------------------------
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// -----------------------------------------------------
