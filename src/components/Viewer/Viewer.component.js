import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import {
  AmbientLight,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { IFCLoader } from 'web-ifc-three/IFCLoader';
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from 'three-mesh-bvh';
import {
  IFCWALLSTANDARDCASE,
  IFCDOOR,
  IFCWINDOW,
  IFCMEMBER,
} from 'web-ifc';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import _ from 'lodash';

import getAnnotationModule from '../annotation';
import './Viewer.scss';

const categories = {
  IFCWALLSTANDARDCASE,
  IFCDOOR,
  IFCWINDOW,
  IFCMEMBER
};

let loaded = false;

const subsets = {};

const size = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const scene = new Scene();
const renderer = new WebGLRenderer({ alpha: true });
renderer.setSize(size.width, size.height);
// renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setPixelRatio(1);

const camera = new PerspectiveCamera(75, size.width / size.height);
camera.position.z = 15;
camera.position.y = 13;
camera.position.x = 8;

window.scene = scene;
window.camera = camera;

const lightColor = 0xffffff;
const ambientLight = new AmbientLight(lightColor, 0.5);
scene.add(ambientLight);
const directionalLight = new DirectionalLight(lightColor, 1);
directionalLight.position.set(0, 10, 0);
directionalLight.target.position.set(-5, 0, 0);
scene.add(directionalLight);
scene.add(directionalLight.target);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(-2, 0, 0);

window.controls = controls;

const animate = () => {
  controls.update();
  annotation.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

window.addEventListener('resize', () => {
  size.width = window.innerWidth
  size.height = window.innerHeight;
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();
  renderer.setSize(size.width, size.height);
});

const ifcLoader = new IFCLoader();

if (process.env.NODE_ENV === 'development') {
  ifcLoader.ifcManager.setWasmPath('../../');
  ifcLoader.load('../../models/aspen.ifc', console.info);
} else {
  ifcLoader.ifcManager.setWasmPath('https://farhadg.github.io/ifc-demo/');
  ifcLoader.load('https://farhadg.github.io/ifc-demo/models/aspen.ifc', console.info);
}

ifcLoader.ifcManager.setupThreeMeshBVH(
  computeBoundsTree,
  disposeBoundsTree,
  acceleratedRaycast
);

async function newSubsetOfType(category) {
  const ids = await ifcLoader.ifcManager.getAllItemsOfType(0, category, false);
  return ifcLoader.ifcManager.createSubset({
    modelID: 0,
    scene,
    ids,
    removePrevious: true,
    customID: category.toString(),
  });
}

async function handleCheckbox(category, checked) {
  const subset = subsets[category] = await newSubsetOfType(category);
  if (checked) {
    const box3 = new THREE.Box3().setFromObject(subset);
    const vector = new THREE.Vector3();
    box3.getCenter(vector);
    subset.position.set(-vector.x, -vector.y, -vector.z);
    scene.add(subset);
    camera.position.set(-48.4299140328955, 11.537300458619915, 618.3302324487776);
    controls.target.set(-82.24609482132936, -8.189374308601197, 4.500647371273939)
  } else {
    subset.removeFromParent();
  }
}

let annotation;

function Viewer() {
  const container = useRef(null);

  useEffect(() => {
    if (loaded) return;
    loaded = true;
    container.current.appendChild(renderer.domElement);
    setTimeout(() => handleCheckbox(IFCMEMBER, true), 1000);
    annotation = new (getAnnotationModule(THREE, TWEEN))({
      renderer, camera, scene, templateSelector: '.annotation'
    });

    renderer.domElement.addEventListener('dblclick', annotation.add);
    // controls.addEventListener('change', annotation.hideTemplates);

    animate();
  }, []);

  return (
    <div className="Viewer">
      <div className="menu">
        <FormGroup>
          {_.map(categories, (category, name) => (
            <FormControlLabel
              label={name}
              control={<Checkbox
                defaultChecked={category === IFCMEMBER}
                onChange={(e) => {
                  handleCheckbox(category, e.target.checked);
                }}
              />}
            />
          ))}
        </FormGroup>

        <div className="annotation hide">
          <textarea className="title" type="text" placeholder="Comment" maxLength="64"
                    required></textarea>
          <input className="submit" type="submit" />
        </div>
      </div>
      <div ref={container}></div>
    </div>
  );
}

export default Viewer;
