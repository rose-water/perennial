// =======================================================
// LeapJS - https://github.com/leapmotion/leapjs-plugins
// =======================================================
var cursor = document.getElementById('cursor');

// Leap.loop({
//   hand: function(hand) {
//     var screenPosition = hand.screenPosition(hand.palmPosition);
//
//     // console.log('==========================');
//     // console.log('x: ' + (screenPosition[0].toPrecision(4)) + 'px');
//     // console.log('y: ' + (screenPosition[1].toPrecision(4)) + 'px');
//     // console.log('z: ' + (screenPosition[2].toPrecision(4)) + 'px');
//
//     // Update and display cursor
//     cursor.style.visibility = 'hidden';
//     var el = document.elementFromPoint(
//       hand.screenPosition()[0],
//       hand.screenPosition()[1]
//     );
//     cursor.style.visibility = 'visible';
//
//     cursor.style.left = screenPosition[0] + 'px';
//     cursor.style.top = screenPosition[1] + 'px';
//
//     let leapPosVector = new THREE.Vector3();
//     leapPosVector.x = 2 * ( screenPosition[0] / window.innerWidth) - 1;
//     leapPosVector.y = 1 - 2 * ( screenPosition[1] / window.innerHeight );
//
//     raycaster.setFromCamera( leapPosVector, camera );
//     intersects = raycaster.intersectObjects( pickableObjs );
//
//     // if we are intersecting something
//     if (intersects.length > 0) {
//
//       let intersectingObj = intersects[0].object;
//
//       // TODO: update since we no longer need to check the name
//       if (intersectingObj.name.includes('Rock') || intersectingObj.name.includes('Gem')) {
//         if (currentObjIntersected !== intersectingObj || currentObjIntersected == null) {
//
//           if (currentObjIntersected !== null) {
//             currentObjIntersected.material = currentObjMaterial;
//             currentObjMaterial = null;
//             currentObjIntersected = null;
//           }
//
//           // store a copy of the material to reset to later
//           currentObjMaterial = intersectingObj.material.clone();
//
//           // create another copy of the material so we can modify the emissive
//           let materialCopy = intersectingObj.material.clone();
//
//           if (intersectingObj.name.includes('Rock')) {
//             materialCopy.emissive.set( 0x52236b );
//           } else {
//             materialCopy.emissive.set( 0x3d8fb1 );
//           }
//
//           materialCopy.emissiveIntensity = 1.2;
//           intersectingObj.material = materialCopy;
//           currentObjIntersected = intersectingObj;
//
//           // this is the wrong way to do this!
//           if (intersectingObj.name.includes('Gem')) {
//             if (sound_1.isPlaying) {
//               sound_1.stop();
//             }
//             sound_1.play();
//
//           } else if (intersectingObj.name.includes('Rock')) {
//             if (sound_2.isPlaying) {
//               sound_2.stop();
//             }
//             sound_2.play();
//           }
//         }
//
//       } else {
//         // if we're intersecting a non-rock/gem but we were intersecting a gem/rock before
//         if (currentObjIntersected !== null) {
//           currentObjIntersected.material = currentObjMaterial;
//           currentObjMaterial = null;
//           currentObjIntersected = null;
//           if (sound_1.isPlaying) {
//             sound_1.stop();
//           }
//         }
//       }
//     }
//   }
//
// }).use('screenPosition', { scale: 1 });

// =======================================================
// THREE.js
// =======================================================
var stats, controls;
var camera, scene, renderer;
var particlesObj;
var audio, sound_1, sound_2, bgm;
var hemiLight, dirLight;

var projector, mouseVector, raycaster;
var intersects;
var currentObjIntersected = null;
var currentObjMaterial    = null;
var tunnelObj             = null;

var fbxIsLoaded           = false;
var fbxModel_1            = null;
var fbxModel_2            = null;
var fbxModel_3            = null;
var pickableObjs          = null;

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
  // init raycasting related things
  projector     = new THREE.Projector();
  mouseVector   = new THREE.Vector3();
  raycaster     = new THREE.Raycaster();

  // limit how far the raycaster can go
  raycaster.far = 800;

  setupCamera();
  setupAudio();
  setupLights();
  setupRenderer();
  setupStars();
  setupScene();
  // setupStats();

  // DEBUG only: OrbitControls
  // setupControls();

  window.addEventListener( 'resize', onWindowResize, false );
}

// -----------------------------------------------------
function setupCamera() {
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 100, 800);
  camera.position.z = -800;
}

// -----------------------------------------------------
function setupAudio() {
  let audioListener = new THREE.AudioListener();
  camera.add(audioListener);

  let sampleUrls = [
    'audio/sound_1.wav',
    'audio/sound_2.wav',
    'audio/underwater.m4a'
  ];

  sound_1 = new THREE.Audio(audioListener);
  sound_2 = new THREE.Audio(audioListener);
  bgm     = new THREE.Audio(audioListener);

  audioLoader = new THREE.AudioLoader();

  // BGM sound
  audioLoader.load(
    sampleUrls[2],

    // onload callback
    function(audioBuffer) {
      console.log('bgm loaded.');
      bgm.setBuffer(audioBuffer);
      bgm.setLoop(true);
      bgm.setVolume(1.2);
      bgm.play();
    },

    // on progress callback
    function(xhr) {
      // console.log('bgm progress:' + (xhr.loaded / xhr.total * 100) + '% loaded' );
    },

    // on error callback
    function(err) {
      // console.log('bgm error: ', err);
    }
  );

  // GEM sound
  audioLoader.load(
    sampleUrls[0],

    // onload callback
    function(audioBuffer) {
      console.log('sound_1 loaded.');
      sound_1.setBuffer(audioBuffer);
    },

    // on progress callback
    function(xhr) {
      // console.log('sound_1 progress:' + (xhr.loaded / xhr.total * 100) + '% loaded' );
    },

    // on error callback
    function(err) {
      // console.log('sound_1 error: ', err);
    }
  );

  // Rock sound
  audioLoader.load(
    sampleUrls[1],

    // onload callback
    function(audioBuffer) {
      console.log('sound_2 loaded.');
      sound_2.setBuffer(audioBuffer);
    },

    // on progress callback
    function(xhr) {
      // console.log('sound_2 progress:' + (xhr.loaded / xhr.total * 100) + '% loaded' );
    },

    // on error callback
    function(err) {
      // console.log('sound_2 error: ', err);
    }
  );
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

  dirLight                      = new THREE.DirectionalLight(0xfbacde, 0.8);
  dirLight.castShadow           = false;
  dirLight.position.set(0, 200, 100);
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
  renderer.domElement.id = 'canvas';

  document.body.appendChild(renderer.domElement);
}

// -----------------------------------------------------
function setupScene() {
  scene = new THREE.Scene();
  camera.lookAt( scene.position );

  // add lights
  scene.add(hemiLight);
  // scene.add(dirLight);

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
          if (child.name.includes('Tunnel_')) {
            child.material.emissive.set(0xa68aa);
            child.material.emissiveIntensity = 0.15;
          }
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

    // setup pickableObjs to be only gems and rocks
    let unfilteredPickables = fbxModel_1.children.concat(fbxModel_2.children).concat(fbxModel_3.children);

    pickableObjs = setupPickableObjsForGroup(unfilteredPickables);

    // DEBUG only: mouse events for raycasting
    window.addEventListener( 'mousemove', onMouseMove, false );
  });
}

// -----------------------------------------------------
function setupPickableObjsForGroup(groupedChildren) {
  return groupedChildren.filter(function(mesh) {
    if (mesh.name.includes('Gem') || mesh.name.includes('Rock')) {
      return mesh;
    }
    return;
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
// DEBUG only: mouse events for raycasting
// -----------------------------------------------------
function onMouseMove(e) {
  e.preventDefault();
  // map mouse coordinates to range (-1, 1) on x & y axes
  mouseVector.x = 2 * (e.clientX / window.innerWidth) - 1;
  mouseVector.y = 1 - 2 * ( e.clientY / window.innerHeight );

  raycaster.setFromCamera( mouseVector, camera );
  intersects = raycaster.intersectObjects( pickableObjs );

  // if we are intersecting something
  if (intersects.length > 0) {

    let intersectingObj = intersects[0].object;

    // TODO: update since we no longer need to check the name
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

        if (intersectingObj.name.includes('Rock')) {
          materialCopy.emissive.set( 0x52236b );
        } else {
          materialCopy.emissive.set( 0x3d8fb1 );
        }

        materialCopy.emissiveIntensity = 1.2;
        intersectingObj.material = materialCopy;
        currentObjIntersected = intersectingObj;

        // this is the wrong way to do this!
        if (intersectingObj.name.includes('Gem')) {
          if (sound_1.isPlaying) {
            sound_1.stop();
          }
          sound_1.play();

        } else if (intersectingObj.name.includes('Rock')) {
          if (sound_2.isPlaying) {
            sound_2.stop();
          }
          sound_2.play();
        }
      }

    } else {
      // if we're intersecting a non-rock/gem but we were intersecting a gem/rock before
      if (currentObjIntersected !== null) {
        currentObjIntersected.material = currentObjMaterial;
        currentObjMaterial = null;
        currentObjIntersected = null;
        if (sound_1.isPlaying) {
          sound_1.stop();
        }
      }
    }
  }
}

// -----------------------------------------------------
function setupStats() {
  stats = new Stats();
  document.body.appendChild(stats.dom);
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

  // stats.update();
}

// -----------------------------------------------------
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// -----------------------------------------------------
