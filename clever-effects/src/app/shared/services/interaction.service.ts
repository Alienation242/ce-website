import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { SceneService } from './scene.service';

@Injectable({
  providedIn: 'root',
})
export class InteractionService {
  private hoveredObject: THREE.Object3D | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private camera: THREE.PerspectiveCamera | null = null;

  constructor(private sceneService: SceneService) {}

  public setup(
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera
  ): void {
    this.renderer = renderer;
    this.camera = camera;
    this.setupInteractionListeners();
  }

  private setupInteractionListeners(): void {
    if (!this.renderer || !this.camera) {
      console.warn('InteractionService: Renderer or Camera not set up.');
      return;
    }

    this.renderer.domElement.addEventListener('mousemove', (event) =>
      this.onMouseMove(event)
    );

    this.renderer.domElement.addEventListener('click', (event) =>
      this.onMouseClick(event, this.renderer!, this.camera!)
    );
    // Add more listeners as needed (e.g. 'touchstart')
  }

  // Adjusted onMouseMove method in InteractionService
  public onMouseMove = (event: MouseEvent): void => {
    if (!this.renderer || !this.camera) return; // Safety check

    // Assuming renderer and camera are now passed to this method or set up earlier
    const mouse = new THREE.Vector2(
      (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1,
      -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const intersects = raycaster.intersectObjects(
      this.sceneService.interactiveObjects
    );

    if (intersects.length > 0) {
      const object = intersects[0].object;
      if (
        object instanceof THREE.Mesh &&
        object.material instanceof THREE.MeshBasicMaterial
      ) {
        if (this.hoveredObject !== object) {
          // Reset previous hovered object's color
          if (
            this.hoveredObject instanceof THREE.Mesh &&
            this.hoveredObject.material instanceof THREE.MeshBasicMaterial
          ) {
            this.hoveredObject.material.color.set(0x00ff00); // Original color
          }
          // Highlight new hovered object
          object.material.color.set(0xff0000); // Highlight color
          this.hoveredObject = object;
        }
      }
    } else {
      // Reset if no object is hovered
      if (
        this.hoveredObject instanceof THREE.Mesh &&
        this.hoveredObject.material instanceof THREE.MeshBasicMaterial
      ) {
        this.hoveredObject.material.color.set(0x00ff00); // Original color
        this.hoveredObject = null;
      }
    }
  };

  private onMouseClick(
    event: MouseEvent,
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera
  ): void {
    event.preventDefault();

    const mouse = new THREE.Vector2(
      (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
      -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Assuming the interactive objects are stored or can be referenced from SceneService
    const intersects = raycaster.intersectObjects(
      this.sceneService.interactiveObjects
    );

    if (intersects.length > 0) {
      const object = intersects[0].object;
      console.log(`Clicked on object: ${object.name}`);
      // Here, you can check for the specific object based on its name or other properties
      if (object.userData['onClick']) {
        object.userData['onClick'](); // Trigger the onClick callback
      }
    }
  }
}
