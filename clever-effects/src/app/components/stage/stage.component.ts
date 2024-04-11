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
    this.interactionService.setup(
      this.sceneService.getRenderer(),
      this.sceneService.getCamera()
    );

    this.setupStage();
    this.addMouseMoveListener();

    this.addThemeToggleButton('sun'); // Start with the sun
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

    this.populateWithVegetation(
      [
        { url: '../../assets/env/T_Grasspatch01.png', yOffset: 0 },
        { url: '../../assets/env/T_Grasspatch02.png', yOffset: 0 },
        { url: '../../assets/env/T_Grasspatch03.png', yOffset: 0 },
        { url: '../../assets/env/T_Grasspatch04.png', yOffset: 0 },
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

  private populateWithVegetation(
    assets: { url: string; yOffset: number }[],
    sceneService: SceneService
  ) {
    // Define the planes and their properties
    const planes = [
      {
        name: 'darkGreenPlane',
        color: '#556b2f',
        scale: 2,
        zOffset: 0.2,
        yOffset: 4,
      },
      {
        name: 'mediumGreenPlane',
        color: '#6b8e23',
        scale: 1.5,
        zOffset: 0.1,
        yOffset: 3.7,
      },
      {
        name: 'lightGreenPlane',
        color: '#9acd32',
        scale: 1,
        zOffset: 0,
        yOffset: 3.5,
      },
    ];

    Math.random();

    planes.forEach((plane) => {
      const numItems = Math.floor(Math.random() * 3) + 50; // Adjusted for example purposes

      for (let i = 0; i < numItems; i++) {
        const asset = assets[Math.floor(Math.random() * assets.length)];
        const position = new THREE.Vector3(
          (Math.random() - 0.5) * 40, // Random X within plane bounds
          asset.yOffset + plane.yOffset, // Use the asset's unique yOffset
          plane.zOffset // Ensure proper Z positioning for depth
        );
        const size = new THREE.Vector2(plane.scale * 1.5, plane.scale); // Scale size based on plane

        // Add the decorative plane to the scene, parented to the current green plane
        sceneService.addDecorativePlane(
          asset.url, // Use the URL from the asset object
          position,
          size,
          plane.color,
          plane.name
        );
      }
    });
  }
  private addThemeToggleButton(textureType: 'sun' | 'moon'): void {
    const texturePath =
      textureType === 'sun'
        ? '../../assets/env/T_Sun.png'
        : '../../assets/env/T_Moon.png';
    const onClickCallback = () => {
      // Toggle theme logic
      const newTextureType = textureType === 'sun' ? 'moon' : 'sun';
      this.sceneService.toggleTheme(newTextureType === 'moon'); // Assuming this method exists and toggles light/dark mode
      // Remove the current button and add a new one with the opposite texture
      this.sceneService.removeFromScene('themeToggleButton');
      this.addThemeToggleButton(newTextureType);
    };

    // Use createInteractionBox to add the toggle button
    this.sceneService.createInteractionBox(
      'themeToggleButton',
      texturePath,
      '#ffffff', // Assuming a white tint for simplicity; adjust as needed
      new THREE.Vector3(4, 2, 0), // Position in the upper right corner; adjust as needed
      onClickCallback,
      undefined // No parent
    );
  }

  ngOnDestroy(): void {
    window.removeEventListener('mousemove', this.handleMouseMove);
  }
}
