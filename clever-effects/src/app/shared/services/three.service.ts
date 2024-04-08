// three.service.ts
import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

@Injectable({
  providedIn: 'root',
})
export class ThreeService {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private currentMesh!: THREE.Mesh;

  constructor() {
    this.initThree();
  }

  private initThree(): void {
    // Initialization of scene, camera, renderer, and controls
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // Initial object (cube)
    this.addCube();
  }

  public getRendererDOM(): HTMLElement {
    return this.renderer.domElement;
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));
    if (this.currentMesh) {
      this.currentMesh.rotation.x += 0.01;
      this.currentMesh.rotation.y += 0.01;
    }
    this.renderer.render(this.scene, this.camera);
  }

  public addCube(): void {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.currentMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.currentMesh);
    this.animate();
  }

  public transformToSphere(): void {
    if (this.currentMesh) {
      this.scene.remove(this.currentMesh);
    }
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.currentMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.currentMesh);
  }

  public transformToCube(): void {
    if (this.currentMesh) {
      this.scene.remove(this.currentMesh);
    }
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.currentMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.currentMesh);
}
}
