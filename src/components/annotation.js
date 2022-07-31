// custom sprite
// drawing
// iterating through this._annotations
// config, such as opacity, transitions, etc.

export default (THREE, TWEEN) => class Annotation {
  constructor({ renderer, camera, scene, templateSelector }) {
    this._annotations = [];

    this._renderer = renderer;
    this._scene = scene;
    this._camera = camera;

    this._mouse = new THREE.Vector2();
    this._raycaster = new THREE.Raycaster();

    this._spriteContext = document.createElement('canvas').getContext('2d');

    if (templateSelector) {
      this._templateSelector = templateSelector;
      this._templateOpen = false;
      const template = document.querySelector(templateSelector);
      template && (template.style.display = 'none');
    }

    this._renderer.domElement.addEventListener('click', this.onClick);
  }

  getAllTemplates() {
    return document.querySelectorAll(`div[annotation-id]`);
  }

  getTemplate(uuid) {
    return document.querySelector(`div[annotation-id="${uuid}"]`)
      || console.warn('There is no template with the ID', uuid);
  }

  isTemplateOpen() {
    return this._templateSelector && this._templateOpen;
  }

  generateSprite() {
    const size = 128;
    const hsize = (size / 2) | 0;
    this._spriteContext.canvas.width = this._spriteContext.canvas.height = size;
    this._spriteContext.fillStyle = 'rgb(0, 0, 0)';
    this._spriteContext.strokeStyle = 'rgb(255, 255, 255)';
    this._spriteContext.lineWidth = ((size * .05) | 0);
    this._spriteContext.beginPath();
    this._spriteContext.arc(hsize, hsize, (hsize * .9) | 0, 0, 2 * Math.PI);
    this._spriteContext.fill();
    this._spriteContext.stroke();
    return new THREE.CanvasTexture(this._spriteContext.canvas);
  }

  generateAnnotation() {
    const map = this.generateSprite();
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map, depthWrite: false })
    );

    sprite.add(new THREE.Sprite(new THREE.SpriteMaterial({
      map,
      depthFunc: THREE.GreaterDepth,
      depthWrite: false,
      opacity: 0.2
    })));

    return sprite;
  }

  onClick = (e) => {
    this._mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this._mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    this._raycaster.setFromCamera(this._mouse, this._camera);
    const intersects = this._raycaster.intersectObjects(this._annotations);
    if (intersects.length) {
      const { _cameraPosition, uuid } = intersects[0].object;
      const { x, y, z } = this._camera.position;
      const position = { x, y, z };
      const target = {
        x: _cameraPosition.x,
        y: _cameraPosition.y,
        z: _cameraPosition.z,
      };

      if (TWEEN) {
        new TWEEN.Tween(position)
          .to(target, 1000)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .start()
          .onUpdate(() => {
            console.log('>>>>>>>>>>>>>>>>')
            const { x, y, z } = position;
            this._camera.position.set(x, y, z);
          })
          .onComplete(() => {
            if (this._templateSelector) {
              setTimeout(() => {
                this._templateOpen = true;
                const template = this.getTemplate(uuid);
                Object.assign(template.style, { display: 'block', opacity: 1 });
              }, 100);
            }
          });
      }
    }
  }

  update = () => {
    this._annotations.forEach((annotation) => {
      const canvas = this._renderer.domElement;
      const devicePixelRatio = this._renderer.getPixelRatio();
      const vector = new THREE.Vector3();
      annotation.getWorldPosition(vector);
      vector.project(this._camera);
      vector.x = Math.round((0.5 + vector.x / 2) * (canvas.width / devicePixelRatio));
      vector.y = Math.round((0.5 - vector.y / 2) * (canvas.height / devicePixelRatio));

      if (this.isTemplateOpen()) {
        const template = this.getTemplate(annotation.uuid);
        template.style.top = `${vector.y}px`;
        template.style.left = `${vector.x}px`;
      }
    });
  }

  hideTemplates = () => {
    if (this.isTemplateOpen()) {
      this.getAllTemplates().forEach(template => {
        template.style.opacity = '0';
        setTimeout(() => {
          template.style.display = 'none';
        }, 600);
      });
      this._templateOpen = false;
    }
  }

  add = (e) => {
    this._mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this._mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    this._raycaster.setFromCamera(this._mouse, this._camera);
    const intersects = this._raycaster.intersectObjects(this._scene.children, true);
    if (intersects.length) {
      const { point, object, face } = intersects[0];
      const annotation = this.generateAnnotation();
      const objectSize = new THREE.Vector3();
      new THREE.Box3().setFromObject(this._scene).getSize(objectSize)
      const annotationScale = Math.max(objectSize.x, objectSize.y, objectSize.z);
      annotation.scale.multiplyScalar(annotationScale / 80);
      const annotationDimensions = new THREE.Vector3();
      new THREE.Box3().setFromObject(annotation).getSize(annotationDimensions);
      const distanceFromObject = Math.max(
        annotationDimensions.x,
        annotationDimensions.y,
        annotationDimensions.z
      ) / 2;
      annotation.position.copy(face.normal).applyQuaternion(object.quaternion).multiplyScalar(distanceFromObject).add(point);
      object.attach(annotation);

      if (this._templateSelector) {
        let template = document.querySelector(this._templateSelector);
        if (!template) {
          console.warn('There is no template with the selector', this._templateSelector);
        }
        else {
          template = template.cloneNode(true);
          Object.assign(template.style, { display: 'block', transition: 'opacity 0.5s' });
          template.setAttribute('annotation-id', annotation.uuid);
          document.body.appendChild(template);
          this._templateOpen = true;
        }
      }

      annotation._cameraPosition = this._camera.position.clone();
      this._annotations.push(annotation);
    }
  }
}
