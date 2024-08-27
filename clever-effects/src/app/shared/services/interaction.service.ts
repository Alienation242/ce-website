import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { SceneService } from './scene.service';
import { PlaneName } from './configuration.service';

@Injectable({
  providedIn: 'root',
})
export class InteractionService {
  private hoveredObject: THREE.Object3D | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private camera: THREE.PerspectiveCamera | null = null;

  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private lastInteractionTime = 0;
  private interactionDebounceTime = 24; // Adjust this debounce time to reduce lag

  constructor(private sceneService: SceneService) {}

  // Setup function to initialize event listeners and renderer components.
  public setup(
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera
  ): void {
    this.renderer = renderer;
    this.camera = camera;

    if (!this.renderer || !this.camera) {
      console.warn('InteractionService: Renderer or Camera not set up.');
      return;
    }

    this.initializeListeners();
  }

  // Initialize event listeners
  private initializeListeners(): void {
    this.renderer!.domElement.addEventListener('mousemove', this.onMouseMove);
    this.renderer!.domElement.addEventListener('wheel', this.onMouseWheel);
    this.renderer!.domElement.addEventListener('click', this.onMouseClick);
    this.renderer!.domElement.addEventListener('mouseout', this.onMouseOut);
  }

  // Handles mouse move events and applies parallax effect
  private onMouseMove = (event: MouseEvent): void => {
    this.lastMouseX = (event.clientX / window.innerWidth) * 2 - 1;
    this.lastMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    this.applyParallax();
    this.updateHoverState(event);
  };

  // Handles mouse wheel events for zoom and scrolling
  private onMouseWheel = (event: WheelEvent): void => {
    const direction = event.deltaY > 0 ? 1 : -1;
    this.scrollLandscape(direction);
    this.applyParallax();
  };

  // Apply parallax effect based on mouse position
  private applyParallax(): void {
    const now = Date.now();

    if (now - this.lastInteractionTime < this.interactionDebounceTime) {
      return; // Skip if interaction is happening too quickly
    }

    this.lastInteractionTime = now;

    const yOffsetThreshold = 0.9; // This simulates the mouse being higher (0.5 means 50% towards the top)

    this.sceneService.getScene().children.forEach((planeGroup) => {
      if (!(planeGroup instanceof THREE.Group)) return;

      const basePlaneName = planeGroup.name.split('_')[0] as PlaneName;
      const originalPosition =
        this.sceneService.initialPositions[basePlaneName];

      const depthFactor = 1 / Math.abs(originalPosition.z);

      const parallaxStrengthX = 1; // Adjust for lower parallax strength
      const parallaxStrengthY = 1; // Adjust for lower parallax strength

      const targetX = this.lastMouseX * depthFactor * parallaxStrengthX;

      // Apply the yOffsetThreshold to simulate the mouse being higher
      const adjustedMouseY = this.lastMouseY + yOffsetThreshold;
      const targetY = adjustedMouseY * depthFactor * parallaxStrengthY;

      const smoothingFactor = 0.3; // Higher value for faster response

      planeGroup.position.x +=
        (targetX - planeGroup.position.x) * smoothingFactor;
      planeGroup.position.y +=
        (originalPosition.y + targetY - planeGroup.position.y) *
        smoothingFactor;
    });

    this.sceneService
      .getRenderer()
      .render(this.sceneService.getScene(), this.sceneService.getCamera());
  }

  // Scroll landscape by moving planes based on wheel scroll
  private scrollLandscape(direction: number): void {
    this.sceneService.getScene().children.forEach((planeGroup) => {
      if (!(planeGroup instanceof THREE.Group)) return;

      if (!planeGroup.name.includes('Sky')) {
        planeGroup.position.z += direction * 0.5; // Adjust the scroll speed

        const yScrollThreshold = 1 / 2; // Set the threshold ratio for Y-axis scrolling

        // Adjust the Y offset with the threshold ratio for better plane management
        planeGroup.position.y += direction * 0.1 * yScrollThreshold;

        // Update vegetation Z position to match plane's Z position
        planeGroup.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            child.position.z = 0; // Keep vegetation at the same local Z relative to the plane
          }
        });

        // Reposition planes earlier to avoid empty horizon
        if (planeGroup.position.z > 8) {
          this.sceneService.clearVegetationFromPlane(planeGroup);
          planeGroup.position.z -= 12 * 1.5; // Reposition further back to maintain continuity
          planeGroup.position.y =
            this.sceneService.initialPositions[
              planeGroup.name.split(
                '_'
              )[0] as keyof typeof this.sceneService.initialPositions
            ].y; // Reset Y to the original position
          this.sceneService.populateWithVegetation(
            this.sceneService.generateVegetationAssets(),
            planeGroup
          );
        } else if (planeGroup.position.z < -8) {
          this.sceneService.clearVegetationFromPlane(planeGroup);
          planeGroup.position.z += 12 * 1.5; // Reposition further ahead to maintain continuity
          planeGroup.position.y =
            this.sceneService.initialPositions[
              planeGroup.name.split(
                '_'
              )[0] as keyof typeof this.sceneService.initialPositions
            ].y; // Reset Y to the original position
          this.sceneService.populateWithVegetation(
            this.sceneService.generateVegetationAssets(),
            planeGroup
          );
        }

        // Correct color update after repositioning
        const colorTransitionFactor = (planeGroup.position.z + 8) / 16; // Normalize Z position for color interpolation
        const color = this.sceneService.interpolateColor(colorTransitionFactor);
        this.sceneService.updatePlaneColor(planeGroup, color);
      }
    });
  }

  // Handles mouse click events, executing user-defined callbacks
  private onMouseClick = (event: MouseEvent): void => {
    event.preventDefault();
    const mouse = this.calculateMousePosition(event);
    const intersects = this.getIntersections(mouse);

    if (intersects.length > 0 && intersects[0].object.userData['onClick']) {
      intersects[0].object.userData['onClick']();
    }
  };

  // Handles mouse out events
  private onMouseOut = (): void => {
    this.resetHoveredObject();
  };

  // Update hover state based on mouse movements
  private updateHoverState(event: MouseEvent): void {
    const mouse = this.calculateMousePosition(event);
    const intersects = this.getIntersections(mouse);
    if (intersects.length > 0) {
      this.handleHover(intersects[0].object);
    } else {
      this.handleHover(null); // Reset hover if no intersections
    }
  }

  // Handles hover interactions
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

  // Reset hover object state
  private resetHoveredObject(): void {
    if (this.hoveredObject) {
      this.hoveredObject.scale.set(1, 1, 1); // Reset scaling
      this.hoveredObject = null;
    }
    this.renderer!.domElement.style.cursor = 'auto'; // Reset cursor to default
  }

  // Helper function to calculate mouse position relative to the renderer's viewport
  private calculateMousePosition(event: MouseEvent): THREE.Vector2 {
    return new THREE.Vector2(
      (event.clientX / this.renderer!.domElement.clientWidth) * 2 - 1,
      -(event.clientY / this.renderer!.domElement.clientHeight) * 2 + 1
    );
  }

  // Performs a raycast to detect intersections with interactive objects
  private getIntersections(mouse: THREE.Vector2): THREE.Intersection[] {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera!);
    return raycaster.intersectObjects(
      this.sceneService.interactiveObjects,
      true
    );
  }

  // Method to clean up event listeners (not used, but you could add if needed)
  public cleanup(): void {
    if (this.renderer) {
      this.renderer.domElement.removeEventListener(
        'mousemove',
        this.onMouseMove
      );
      this.renderer.domElement.removeEventListener('wheel', this.onMouseWheel);
      this.renderer.domElement.removeEventListener('click', this.onMouseClick);
      this.renderer.domElement.removeEventListener('mouseout', this.onMouseOut);
    }
  }
}
