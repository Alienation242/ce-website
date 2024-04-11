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

    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.addEventListener('click', this.onMouseClick);
    // Change cursor style back to default when not hovering over interactive objects
    this.renderer.domElement.addEventListener('mouseout', () => {
      this.resetHoveredObject();
      this.renderer!.domElement.style.cursor = 'auto';
    });
  }

  public onMouseMove = (event: MouseEvent): void => {
    if (!this.renderer || !this.camera) return;

    const mouse = new THREE.Vector2(
      (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1,
      -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const intersects = raycaster.intersectObjects(
      this.sceneService.interactiveObjects,
      true
    );

    if (intersects.length > 0) {
      if (this.hoveredObject !== intersects[0].object) {
        this.resetHoveredObject();
        this.hoveredObject = intersects[0].object;
        // Scale up the hovered object slightly
        this.hoveredObject.scale.set(1.1, 1.1, 1.1);
        // Change cursor to indicate clickability
        this.renderer.domElement.style.cursor = 'pointer';
        // Note: Implementing a border effect directly in Three.js can be complex and may require additional geometries or shader adjustments
      }
    } else {
      this.resetHoveredObject();
    }
  };

  private onMouseClick = (event: MouseEvent): void => {
    event.preventDefault();

    if (!this.renderer || !this.camera) return;

    const mouse = new THREE.Vector2(
      (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1,
      -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const intersects = raycaster.intersectObjects(
      this.sceneService.interactiveObjects
    );

    if (intersects.length > 0 && intersects[0].object.userData['onClick']) {
      intersects[0].object.userData['onClick']();
    }
  };

  private resetHoveredObject(): void {
    if (this.hoveredObject) {
      // Reset scale to original
      this.hoveredObject.scale.set(1, 1, 1);
      this.hoveredObject = null;
      this.renderer!.domElement.style.cursor = 'auto';
    }
  }
}
