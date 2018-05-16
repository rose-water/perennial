var container, stats, controls;
var camera, scene, renderer, groundMesh, grid;
var hemiLight, dirLight, hemiLightHelper, dirLightHelper;
var clock = new THREE.Clock();
var mixers = [];

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

  setupCamera();
  setupControls();
  setupLights();
  setupRenderer();
  setupScene();
  setupStats();

  window.addEventListener( 'resize', onWindowResize, false );
}

// -----------------------------------------------------
function setupCamera() {
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000);
  camera.position.set(0, 0, -600);
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
	hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
	hemiLight.position.set( 0, 50, 0 );
  // hemiLight.position.set(0, 200, 0);

  dirLight                      = new THREE.DirectionalLight(0xffffff);
  dirLight.castShadow           = true;
  dirLight.shadow.camera.top    = 180;
  dirLight.shadow.camera.bottom = -100;
  dirLight.shadow.camera.left   = -120;
  dirLight.shadow.camera.right  = 120;
  dirLight.position.set(0, 200, 100);

  // Light helpers
  hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 5);
  dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 5);
}

// -----------------------------------------------------
function setupRenderer() {
  renderer = new THREE.WebGLRenderer({
    antialias: true
  });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.sortObjects = false;

  container.appendChild( renderer.domElement );
}

// -----------------------------------------------------
function setupScene() {
  scene = new THREE.Scene();
  camera.lookAt( scene.position );
  // scene.background = new THREE.Color(0xa0a0a0);
  // scene.fog = new THREE.Fog(0x111111, 200, 1000);

  // add everything to the scene
  scene.add(hemiLight);
  // scene.add(hemiLightHelper);
  scene.add(dirLight);
  // scene.add(dirLightHelper);

  // load the model and add it to the scene when loaded
  let loader = new THREE.FBXLoader();

  loader.load('models/tunnel.fbx', function(fbxData) {
    console.log('loaded fbx: ', fbxData);

    fbxData.mixer = new THREE.AnimationMixer(fbxData);
    mixers.push(fbxData.mixer);

    let action;
    if (fbxData.animations.length > 0) {
      action = fbxData.mixer.clipAction(fbxData.animations[0]);
      action.play();
    } else {
      console.log('fbx did not load / does not include animations.');
    }

    fbxData.traverse(function(group) {
      group.traverse(function(child) {
        if (child.isMesh) {
          child.material.side = THREE.DoubleSide;
        }
      });
    });

    // if everything worked out, add it to the scene
    // console.log('about to add to scene.');
    scene.add(fbxData);
  });

}

// -----------------------------------------------------
function setupStats() {
  stats = new Stats();
  // container.appendChild(stats.dom);
}

// -----------------------------------------------------
function animateMixers() {
  if (mixers.length > 0) {
    for (let i = 0; i < mixers.length; i++) {
      mixers[i].update(clock.getDelta());
    }
  }
}

// -----------------------------------------------------
function animate() {
  requestAnimationFrame(animate);
  animateMixers();
  renderer.render(scene, camera);
  stats.update();
}

// -----------------------------------------------------
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// -----------------------------------------------------
