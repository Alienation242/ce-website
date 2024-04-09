import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { SceneService } from './scene.service';

@Injectable({
  providedIn: 'root',
})
export class InteractionService {
  constructor(private sceneService: SceneService) {}

  public setupInteractionListeners(
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera
  ): void {
    renderer.domElement.addEventListener('mousemove', (event) =>
      this.onMouseMove(event, renderer, camera)
    );
    renderer.domElement.addEventListener('click', (event) =>
      this.onMouseClick(event, renderer, camera)
    );

    // Add more listeners as needed (e.g., 'click', 'touchstart')
  }

  private onMouseMove(
    event: MouseEvent,
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera
  ): void {
    // Convert mouse position to normalized device coordinates (-1 to +1) for both axes
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Implement interaction logic, e.g., parallax effect or object highlighting
    // This might involve updating positions of objects in the scene based on mouse movement
  }
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
      if (object.name === 'interactiveBox') {
        console.log('Interactive box was clicked');
        // Perform any action, such as navigating or toggling dark mode
      }
    }
  }
}
