import { useRef, useEffect } from 'react';
import { Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import * as THREE from 'three';
import { IFCMEMBER } from 'web-ifc';
import TWEEN from '@tweenjs/tween.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { IFCLoader } from 'web-ifc-three/IFCLoader';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree, } from 'three-mesh-bvh';

import initAnnotation from '../../module/annotation';
import './Viewer.scss';

const CONTEXT = {
  scene: null,
  renderer: null,
  controls: null,
  camera: null,
  annotation: null,
  ifcFile: require('./assets/aspen.ifc'),
  size: { width: window.innerWidth, height: window.innerHeight, },
}

function initScene() {
  const { size } = CONTEXT;

  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ alpha: true, logarithmicDepthBuffer: true });
  renderer.setSize(size.width, size.height);
  renderer.setClearColor(0xE8E8E8);
  renderer.setPixelRatio(1);

  const camera = new THREE.PerspectiveCamera(60, size.width / size.height);
  camera.position.z = 15;
  camera.position.y = 13;
  camera.position.x = 8;

  const lightColor = 0xffffff;
  const ambientLight = new THREE.AmbientLight(lightColor, 0.7);
  const directionalLight = new THREE.DirectionalLight(lightColor, 0.7);
  directionalLight.position.set(-10, 30, 10);
  scene.add(ambientLight);
  scene.add(directionalLight);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(-2, 0, 0);

  const loader = new THREE.CubeTextureLoader();
  scene.background = loader.load([
    'right', 'left', 'top', 'bottom', 'front', 'back'
    ].map(side => require(`./assets/${side}.png`))
  );

  window.addEventListener('resize', () => {
    const { size, camera, renderer } = CONTEXT;
    size.width = window.innerWidth
    size.height = window.innerHeight;
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height);
  });

  Object.assign(CONTEXT, { scene, camera, renderer, controls });
}

function animate() {
  const { annotation, controls, renderer, scene, camera } = CONTEXT;
  TWEEN.update();
  controls.update();
  annotation.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

async function loadIfc() {
  const { scene, camera, controls, ifcFile } = CONTEXT;
  const ifcLoader = new IFCLoader();

  await ifcLoader.ifcManager.setWasmPath('../../');
  ifcLoader.ifcManager.setupThreeMeshBVH(computeBoundsTree, disposeBoundsTree, acceleratedRaycast);
  CONTEXT.ifcLoader = ifcLoader;

  await ifcLoader.load(ifcFile, async (model) => {
    const subset = await newSubsetOfType(IFCMEMBER);
    const box3 = new THREE.Box3().setFromObject(model);
    const vector = new THREE.Vector3();
    box3.getCenter(vector);
    subset.position.set(-vector.x, -vector.y, -vector.z);
    camera.position.set(-58.410031199338576, 17.122119563083928, 719.0616601519481);
    controls.target.set(-82.24609482132936, -8.189374308601197, 4.500647371273939);
    scene.add(subset);
  });
}

async function newSubsetOfType(category) {
  const { ifcLoader, scene } = CONTEXT;
  const ids = await ifcLoader.ifcManager.getAllItemsOfType(0, category, false);
  return ifcLoader.ifcManager.createSubset({
    modelID: 0,
    scene,
    ids,
    removePrevious: true,
    customID: category.toString(),
  });
}

function Viewer() {
  const container = useRef(null);

  useEffect(() => {
    if (CONTEXT.scene) return;

    initScene();
    loadIfc();

    const { scene, renderer, controls, camera } = CONTEXT;
    container.current.appendChild(CONTEXT.renderer.domElement);

    const annotation = new (initAnnotation(THREE, TWEEN))({
      renderer, camera, scene, templateSelector: '.annotation'
    });

    renderer.domElement.addEventListener('dblclick', annotation.add);
    controls.addEventListener('start', annotation.hideTemplates);

    CONTEXT.annotation = annotation;
    animate();
  }, []);

  return (
    <div className="Viewer">
      <div ref={container} />

      <div className="annotation hide">
        <textarea className="text-box" placeholder="Comment" maxLength="129" required />
        <Button variant="contained" endIcon={<SendIcon />}>Submit</Button>
      </div>
    </div>
  );
}

export default Viewer;
