import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

@Component({
  selector: 'app-three',
  templateUrl: './three.component.html',
  styleUrls: ['./three.component.css'],
  standalone: true,
})
export class ThreeComponent implements AfterViewInit, OnDestroy {
  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private scene!: THREE.Scene;
  private cube!: THREE.Mesh;
  private controls!: OrbitControls;

  constructor() {}

  ngAfterViewInit() {
    this.initThree();
    this.animate();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.onWindowResize);
  }

  private initThree(): void {
    const container = document.getElementById('canvas-container')!;
    
    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 5;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(this.renderer.domElement);

    // Cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.cube = new THREE.Mesh(geometry, material);
    this.scene.add(this.cube);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize, false);
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    // Cube rotation for a bit of animation, remove or modify as needed
    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;

    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  };

  private onWindowResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };
}
