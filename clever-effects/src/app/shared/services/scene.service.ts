import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { AssetLoaderService } from './asset-loader.service';

@Injectable({
  providedIn: 'root',
})
export class SceneService {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  public interactiveObjects: THREE.Mesh[] = []; // Store interactive objects here

  constructor(private assetLoaderService: AssetLoaderService) {
    this.initializeScene();
  }

  private initializeScene(): void {
    // Create the scene
    this.scene = new THREE.Scene();

    // Setup the camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 5); // Adjust as needed

    // Setup the renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Setup basic ambient light
    const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
    this.scene.add(ambientLight);

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize, false);

    // Start the animation loop
    this.animate();
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    // Any animation-related updates go here
    this.renderer.render(this.scene, this.camera);
  };

  private onWindowResize = (): void => {
    // Define the desired aspect ratio
    const aspectRatio = 16 / 9;

    // Calculate the aspect ratio based on the window size
    let width = window.innerWidth;
    let height = window.innerHeight;
    const windowAspectRatio = width / height;

    // Adjust width and height to maintain the aspect ratio
    if (windowAspectRatio > aspectRatio) {
      // If the window is too wide, adjust the width to maintain the aspect ratio
      width = height * aspectRatio;
    } else {
      // If the window is too tall, adjust the height to maintain the aspect ratio
      height = width / aspectRatio;
    }

    // Update the renderer and camera with the new dimensions
    this.renderer.setSize(width, height);
    this.camera.aspect = aspectRatio;
    this.camera.updateProjectionMatrix();

    // Optionally, center the canvas if it doesn't fill the window
    const canvas = this.renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.top = `${(window.innerHeight - height) / 2}px`;
    canvas.style.left = `${(window.innerWidth - width) / 2}px`;
  };

  public getRendererDOM(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public addToScene(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  public removeFromScene(object: THREE.Object3D): void {
    this.scene.remove(object);
  }
  public addColoredPlane(
    color: string,
    position: THREE.Vector3,
    size: THREE.Vector2,
    name: string
  ): void {
    const geometry = new THREE.PlaneGeometry(size.x, size.y);
    const material = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(position.x, position.y, position.z);
    plane.name = name; // Set the name for reference
    this.addToScene(plane);
  }
  public addDecorativePlane(
    textureUrl: string,
    position: THREE.Vector3,
    size: THREE.Vector2,
    color: string,
    parentPlaneName: string
  ): void {
    this.assetLoaderService.loadTexture(textureUrl).then((texture) => {
      const geometry = new THREE.PlaneGeometry(size.x, size.y);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        color: color, // Apply the color tint
      });
      const decorativePlane = new THREE.Mesh(geometry, material);
      decorativePlane.position.set(position.x, position.y, position.z);

      // Retrieve the parent plane by name and add the decorative plane as its child
      const parentPlane = this.scene.getObjectByName(parentPlaneName);
      if (parentPlane) {
        parentPlane.add(decorativePlane);
      } else {
        console.warn(`Parent plane '${parentPlaneName}' not found.`);
      }
    });
  }

  public addObjectToPlane(object: THREE.Object3D, planeName: string): void {
    const plane = this.scene.getObjectByName(planeName);
    if (plane) {
      plane.add(object); // This sets the plane as the parent of the object
    }
  }

  public movePlane(planeId: string, newPosition: THREE.Vector3): void {
    const plane = this.scene.getObjectByName(planeId);
    if (plane) {
      plane.position.set(newPosition.x, newPosition.y, newPosition.z);
    }
  }

  public highlightPlane(planeName: string, highlight: boolean): void {
    const plane = this.scene.getObjectByName(planeName);
    if (plane instanceof THREE.Mesh) {
      const material = plane.material as THREE.MeshBasicMaterial;
      material.color.set(highlight ? 0xff0000 : 0x00ff00); // Example: Red on highlight, green otherwise
      // Ensure the scene is updated if necessary
    }
  }

  public createInteractionBox(
    name: string,
    assetPath: string,
    color: string,
    position: THREE.Vector3,
    parentName?: string
  ): void {
    this.assetLoaderService
      .loadTexture(assetPath)
      .then((texture) => {
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          color: color, // Use the color as a tint for the texture
          transparent: true, // Ensure transparency is supported
        });
        const geometry = new THREE.PlaneGeometry(1, 1); // You can adjust the size as needed
        const plane = new THREE.Mesh(geometry, material);
        plane.name = name; // Ensure you set a name for identification
        this.interactiveObjects.push(plane); // Add the plane to the interactiveObjects array

        plane.position.copy(position);
        plane.name = name;

        // If a parent object name is provided, add this plane as a child of that object
        if (parentName) {
          const parentObject = this.scene.getObjectByName(parentName);
          if (parentObject) {
            parentObject.add(plane);
          } else {
            console.warn(
              `Parent object "${parentName}" not found in the scene.`
            );
          }
        } else {
          // No parent specified, add directly to the scene
          this.scene.add(plane);
        }
      })
      .catch((error) => {
        console.error(`Failed to load texture "${assetPath}":`, error);
      });
  }

  // Add additional helper methods as necessary...
}
