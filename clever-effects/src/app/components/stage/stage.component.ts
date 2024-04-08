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
  }

  private setupStage(): void {
    // Example modifications in the setup method or component

    // Calculate a sufficiently wide plane to cover the camera's horizontal view at different depths
    // This is a simplified approximation. You may need to adjust these values based on your camera's actual FOV and aspect ratio
    const planeWidth = 100; // Ensure this is wide enough to cover the view
    const planeHeight = 5; // Height of the planes

    // Foreground - Lightest Green
    this.sceneService.addColoredPlane(
      '#9acd32',
      new THREE.Vector3(0, -2, -5),
      new THREE.Vector2(planeWidth, planeHeight)
    ); // Higher y means closer to the top of the screen

    // Middle Foreground - Medium Green
    this.sceneService.addColoredPlane(
      '#6b8e23',
      new THREE.Vector3(0, -3, -5),
      new THREE.Vector2(planeWidth, planeHeight)
    ); // Center

    // Background Foreground - Darkest Green
    this.sceneService.addColoredPlane(
      '#556b2f',
      new THREE.Vector3(0, -5, -5),
      new THREE.Vector2(planeWidth, planeHeight)
    ); // Lower y means closer to the bottom of the screen

    // Background - Sky Layers, positioned at the top of the screen
    // Lightest Blue
    this.sceneService.addColoredPlane(
      '#add8e6', // A light blue color
      new THREE.Vector3(0, 0, -10),
      new THREE.Vector2(planeWidth, planeHeight)
    );

    // Medium Blue
    this.sceneService.addColoredPlane(
      '#87ceeb', // A medium blue color
      new THREE.Vector3(0, 5, -10),
      new THREE.Vector2(planeWidth, planeHeight)
    );

    // Darkest Blue
    this.sceneService.addColoredPlane(
      '#00bfff', // A darker blue color, for added depth
      new THREE.Vector3(0, 10, -10),
      new THREE.Vector2(planeWidth, planeHeight)
    );
  }
}
