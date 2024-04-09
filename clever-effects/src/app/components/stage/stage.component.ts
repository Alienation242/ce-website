import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { InteractionService } from 'src/app/shared/services/interaction.service';
import { SceneService } from 'src/app/shared/services/scene.service';
import * as THREE from 'three';

@Component({
  selector: 'app-stage',
  templateUrl: './stage.component.html',
  styleUrl: './stage.component.css',
})
export class StageComponent implements OnInit {
  @ViewChild('rendererContainer', { static: true })
  rendererContainer!: ElementRef;

  initialPositions = {
    darkGreenPlane: -7,
    mediumGreenPlane: -5,
    lightGreenPlane: -3,
    lightBlueSky: 1,
    mediumBlueSky: 5,
    darkBlueSky: 9,
  };

  constructor(
    private sceneService: SceneService,
    private interactionService: InteractionService
  ) {}

  ngOnInit(): void {
    this.rendererContainer.nativeElement.appendChild(
      this.sceneService.getRendererDOM()
    );
    this.interactionService.setupInteractionListeners(
      this.sceneService.getRenderer(),
      this.sceneService.getCamera()
    );
    this.setupStage();
    this.addMouseMoveListener();
  }

  private setupStage(): void {
    // Example modifications in the setup method or component

    // Calculate a sufficiently wide plane to cover the camera's horizontal view at different depths
    // This is a simplified approximation. You may need to adjust these values based on your camera's actual FOV and aspect ratio
    const planeWidth = 100; // Ensure this is wide enough to cover the view
    const planeHeight = 6; // Height of the planes

    // Foreground - Lightest Green
    this.sceneService.addColoredPlane(
      '#9acd32',
      new THREE.Vector3(0, this.initialPositions.lightGreenPlane, -5),
      new THREE.Vector2(planeWidth, planeHeight),
      'lightGreenPlane'
    ); // Higher y means closer to the top of the screen

    // Middle Foreground - Medium Green
    this.sceneService.addColoredPlane(
      '#6b8e23',
      new THREE.Vector3(0, this.initialPositions.mediumGreenPlane, -5),
      new THREE.Vector2(planeWidth, planeHeight),
      'mediumGreenPlane'
    ); // Center

    // Background Foreground - Darkest Green
    this.sceneService.addColoredPlane(
      '#556b2f',
      new THREE.Vector3(0, this.initialPositions.darkGreenPlane, -5),
      new THREE.Vector2(planeWidth, planeHeight),
      'darkGreenPlane'
    ); // Lower y means closer to the bottom of the screen

    // Background - Sky Layers, positioned at the top of the screen
    // Lightest Blue
    this.sceneService.addColoredPlane(
      '#add8e6', // A light blue color
      new THREE.Vector3(0, this.initialPositions.lightBlueSky, -10),
      new THREE.Vector2(planeWidth, planeHeight),
      'lightBlueSky'
    );

    // Medium Blue
    this.sceneService.addColoredPlane(
      '#87ceeb', // A medium blue color
      new THREE.Vector3(0, this.initialPositions.mediumBlueSky, -10),
      new THREE.Vector2(planeWidth, planeHeight),
      'mediumBlueSky'
    );

    // Darkest Blue
    this.sceneService.addColoredPlane(
      '#00bfff', // A darker blue color, for added depth
      new THREE.Vector3(0, this.initialPositions.darkBlueSky, -10),
      new THREE.Vector2(planeWidth, planeHeight),
      'darkBlueSky'
    );

    // this.sceneService.addDecorativePlane(
    //   '../../assets/env/T_Grasspatch01.png',
    //   new THREE.Vector3(1, this.initialPositions.darkGreenPlane + 11, 0), // Relative position to the parent plane
    //   new THREE.Vector2(2, 2),
    //   '#556b2f', // Green tint
    //   'darkGreenPlane' // The name of the parent plane
    // );

    // this.sceneService.addDecorativePlane(
    //   '../../assets/env/T_Grasspatch01.png',
    //   new THREE.Vector3(4, this.initialPositions.darkGreenPlane + 11, 0), // Relative position to the parent plane
    //   new THREE.Vector2(2, 2),
    //   '#6b8e23', // Green tint
    //   'mediumGreenPlane' // The name of the parent plane
    // );

    this.populateWithVegetation(
      [
        '../../assets/env/T_Grasspatch01.png',
        '../../assets/env/T_Grasspatch02.png',
        '../../assets/env/T_Grasspatch03.png',
        '../../assets/env/T_Grasspatch04.png',
      ],
      this.sceneService
    );
  }

  private addMouseMoveListener(): void {
    window.addEventListener('mousemove', this.handleMouseMove);
  }

  private handleMouseMove = (event: MouseEvent): void => {
    let mouseX = (event.clientX - window.innerWidth / 2) / 100;
    let mouseY = (event.clientY - window.innerHeight / 2) / 100;

    // Clamp values to prevent excessive movement
    const maxX = 10; // Max movement on X axis
    const maxY = 4; // Max movement on Y axis

    mouseX = Math.max(-maxX, Math.min(maxX, mouseX));
    mouseY = Math.max(-maxY, Math.min(maxY, mouseY));

    // Adjust plane positions based on initial positions + mouse movement effect
    this.sceneService.movePlane(
      'darkGreenPlane',
      new THREE.Vector3(
        mouseX * 0.5,
        this.initialPositions.darkGreenPlane + mouseY * 0.5,
        -5
      )
    );
    this.sceneService.movePlane(
      'mediumGreenPlane',
      new THREE.Vector3(
        mouseX * 0.3,
        this.initialPositions.mediumGreenPlane + mouseY * 0.3,
        -5
      )
    );
    this.sceneService.movePlane(
      'lightGreenPlane',
      new THREE.Vector3(
        mouseX * 0.1,
        this.initialPositions.lightGreenPlane + mouseY * 0.1,
        -5
      )
    );

    // Apply the same concept to the sky layers
    this.sceneService.movePlane(
      'lightBlueSky',
      new THREE.Vector3(
        mouseX * 0.05,
        this.initialPositions.lightBlueSky + mouseY * 0.05,
        -10
      )
    );
    this.sceneService.movePlane(
      'mediumBlueSky',
      new THREE.Vector3(
        mouseX * 0.03,
        this.initialPositions.mediumBlueSky + mouseY * 0.03,
        -10
      )
    );
    this.sceneService.movePlane(
      'darkBlueSky',
      new THREE.Vector3(
        mouseX * 0.01,
        this.initialPositions.darkBlueSky + mouseY * 0.01,
        -10
      )
    );
  };

  private populateWithVegetation(assets: string[], sceneService: SceneService) {
    // Define the planes and their properties
    const planes = [
      { name: 'darkGreenPlane', color: '#556b2f', scale: 2, zOffset: 0.2 },
      { name: 'mediumGreenPlane', color: '#6b8e23', scale: 1.5, zOffset: 0.1 },
      { name: 'lightGreenPlane', color: '#9acd32', scale: 1, zOffset: 0 },
    ];

    Math.random();

    planes.forEach((plane) => {
      const numItems = Math.floor(Math.random() * 3) + 50; // Random number of items per plane, for example between 3 and 7

      for (let i = 0; i < numItems; i++) {
        const assetIndex = Math.floor(Math.random() * assets.length);
        const assetURL = assets[assetIndex];
        const position = new THREE.Vector3(
          (Math.random() - 0.5) * 50,
          3.4,
          plane.zOffset
        ); // Random position within plane bounds
        const size = new THREE.Vector2(plane.scale * 1.5, plane.scale); // Scale size based on plane

        // Add the decorative plane to the scene, parented to the current green plane
        sceneService.addDecorativePlane(
          assetURL,
          position,
          size,
          plane.color,
          plane.name
        );
      }
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('mousemove', this.handleMouseMove);
  }
}
