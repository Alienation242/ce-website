import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { SceneService } from './scene.service';

@Injectable({
  providedIn: 'root',
})
export class InteractionService {
  constructor(private sceneService: SceneService) {}

  public setupInteractionListeners(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera): void {
    renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event, renderer, camera));
    // Add more listeners as needed (e.g., 'click', 'touchstart')
  }

  private onMouseMove(event: MouseEvent, renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera): void {
    // Convert mouse position to normalized device coordinates (-1 to +1) for both axes
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Implement interaction logic, e.g., parallax effect or object highlighting
    // This might involve updating positions of objects in the scene based on mouse movement
  }
}
