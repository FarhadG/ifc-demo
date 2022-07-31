import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import TWEEN from '@tweenjs/tween.js';
import { AmbientLight, DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer, } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { IFCLoader } from 'web-ifc-three/IFCLoader';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree, } from 'three-mesh-bvh';
import { IFCMEMBER } from 'web-ifc';
import { Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

import initAnnotation from '../../module/annotation';
import './Viewer.scss';

let context = {
  scene: null,
  renderer: null,
  controls: null,
  camera: null,
  annotation: null,
  size: { width: window.innerWidth, height: window.innerHeight, },
}

function initScene() {
  const { size } = context;

  const scene = new Scene();
  const renderer = new WebGLRenderer({ logarithmicDepthBuffer: true });
  renderer.setSize(size.width, size.height);
  renderer.setPixelRatio(1);

  const camera = new PerspectiveCamera(60, size.width / size.height);
  camera.position.z = 15;
  camera.position.y = 13;
  camera.position.x = 8;

  const lightColor = 0xffffff;
  const ambientLight = new AmbientLight(lightColor, 0.5);
  const directionalLight = new DirectionalLight(lightColor, 0.8);
  directionalLight.position.set(-10, 30, 10);
  scene.add(ambientLight);
  scene.add(directionalLight);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(-2, 0, 0);

  const loader = new THREE.CubeTextureLoader();
  scene.background = loader.load([
    'https://r105.threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/pos-x.jpg',
    'https://r105.threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/neg-x.jpg',
    'https://r105.threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/pos-y.jpg',
    'https://r105.threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/neg-y.jpg',
    'https://r105.threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/pos-z.jpg',
    'https://r105.threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/neg-z.jpg',
  ]);

  window.addEventListener('resize', () => {
    const { size, camera, renderer } = context;
    size.width = window.innerWidth
    size.height = window.innerHeight;
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height);
  });

  context = { ...context, scene, camera, renderer, controls };
}

function animate() {
  const { annotation, controls, renderer, scene, camera } = context;
  TWEEN.update();
  controls.update();
  annotation.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

async function loadIfc() {
  const { scene, camera, controls } = context;
  const ifcLoader = new IFCLoader();

  const ifcLocation = process.env.NODE_ENV === 'development'
    ? '../../models/aspen.ifc'
    : 'https://farhadg.github.io/ifc-demo/models/aspen.ifc'

  await ifcLoader.ifcManager.setWasmPath('../../');
  ifcLoader.ifcManager.setupThreeMeshBVH(computeBoundsTree, disposeBoundsTree, acceleratedRaycast);
  context.ifcLoader = ifcLoader;

  await ifcLoader.load(ifcLocation, async (model) => {
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
  const { ifcLoader, scene } = context;
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
    if (context.scene) return;

    initScene();
    loadIfc();

    const { scene, renderer, controls, camera } = context;
    container.current.appendChild(context.renderer.domElement);

    const annotation = new (initAnnotation(THREE, TWEEN))({
      renderer, camera, scene, templateSelector: '.annotation'
    });

    renderer.domElement.addEventListener('dblclick', annotation.add);
    controls.addEventListener('start', annotation.hideTemplates);

    context.annotation = annotation;
    animate();
  }, []);

  return (
    <div className="Viewer">
      <div className="annotation hide">
        <textarea className="text-box" placeholder="Comment" maxLength="129" required />
        <Button variant="contained" endIcon={<SendIcon />}>Submit</Button>
      </div>

      <div ref={container} />
    </div>
  );
}

export default Viewer;
