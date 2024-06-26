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

  // Setup function to initialize event listeners and renderer components.
  public setup(
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera
  ): void {
    this.renderer = renderer;
    this.camera = camera;

    // Ensures renderer and camera are properly initialized.
    if (!this.renderer || !this.camera) {
      console.warn('InteractionService: Renderer or Camera not set up.');
      return;
    }

    this.initializeListeners();
  }

  // Group all event listener setups here for clarity.
  private initializeListeners(): void {
    this.renderer!.domElement.addEventListener('mousemove', this.onMouseMove);
    this.renderer!.domElement.addEventListener('click', this.onMouseClick);
    this.renderer!.domElement.addEventListener('mouseout', this.onMouseOut);
  }

  // Handles mouse move events, updating hover states and styles.
  private handleHover(newHoveredObject: THREE.Object3D | null): void {
    if (newHoveredObject !== this.hoveredObject) {
      this.resetHoveredObject();
      if (newHoveredObject) {
        newHoveredObject.scale.set(1.1, 1.1, 1.1); // Scaling up for hover
        this.renderer!.domElement.style.cursor = 'pointer'; // Set cursor to pointer
        this.hoveredObject = newHoveredObject;
      }
    }
  }

  public onMouseMove = (event: MouseEvent): void => {
    const mouse = this.calculateMousePosition(event);
    const intersects = this.getIntersections(mouse);
    if (intersects.length > 0) {
      this.handleHover(intersects[0].object);
    } else {
      this.handleHover(null); // Reset hover if no intersections
    }
  };

  private onMouseOut = (): void => {
    this.resetHoveredObject(); // Make sure this resets hover state
  };

  private resetHoveredObject(): void {
    if (this.hoveredObject) {
      this.hoveredObject.scale.set(1, 1, 1); // Reset scaling
      this.hoveredObject = null;
    }
    this.renderer!.domElement.style.cursor = 'auto'; // Reset cursor to default
  }
  // Handles mouse click events, executing user-defined callbacks.
  private onMouseClick = (event: MouseEvent): void => {
    event.preventDefault();
    const mouse = this.calculateMousePosition(event);
    const intersects = this.getIntersections(mouse);

    if (intersects.length > 0 && intersects[0].object.userData['onClick']) {
      intersects[0].object.userData['onClick']();
    }
  };

  // Helper function to calculate mouse position relative to the renderer's viewport.
  private calculateMousePosition(event: MouseEvent): THREE.Vector2 {
    return new THREE.Vector2(
      (event.clientX / this.renderer!.domElement.clientWidth) * 2 - 1,
      -(event.clientY / this.renderer!.domElement.clientHeight) * 2 + 1
    );
  }

  // Performs a raycast to detect intersections with interactive objects.
  private getIntersections(mouse: THREE.Vector2): THREE.Intersection[] {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera!);
    return raycaster.intersectObjects(
      this.sceneService.interactiveObjects,
      true
    );
  }
}
