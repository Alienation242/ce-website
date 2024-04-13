import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { SceneService } from './scene.service';
import { InteractionService } from './interaction.service';
import {
  Asset,
  ColorTheme,
  ConfigurationService,
  PlaneConfig,
  PlaneName,
  SkyColorTheme,
  ThemeConfig,
} from './configuration.service';

@Injectable({
  providedIn: 'root',
})
export class StageMediatorService {
  private isDarkMode = false; // Tracks whether dark mode is enabled
  private currentThemeConfig: ThemeConfig; // Stores the current theme configuration
  initialPositions: { [key in PlaneName]: { y: number; z: number } } = {
    // Default positions for various planes in the 3D scene
    darkGreenPlane: { y: -7, z: -3 },
    mediumGreenPlane: { y: -5, z: -4 },
    lightGreenPlane: { y: -3, z: -5 },
    lightBlueSky: { y: 1, z: -10 },
    mediumBlueSky: { y: 5, z: -9 },
    darkBlueSky: { y: 9, z: -8 },
  };

  constructor(
    private sceneService: SceneService,
    private interactionService: InteractionService,
    private configService: ConfigurationService
  ) {
    this.currentThemeConfig = this.configService.getTheme('meadow'); // Initialize the theme config
  }

  public getRendererDOM(): HTMLCanvasElement {
    // Returns the renderer's DOM element for embedding in the Angular component
    return this.sceneService.getRendererDOM();
  }

  public initializeStage(): void {
    // Sets up the renderer and camera, and configures the initial stage
    this.interactionService.setup(
      this.sceneService.getRenderer(),
      this.sceneService.getCamera()
    );
    this.setupStage();
  }

  private setupStage(): void {
    // Configures the initial setup of planes based on the current theme
    const theme: ThemeConfig = this.currentThemeConfig;
    const themeColors = this.isDarkMode ? theme.dark : theme.light;

    (Object.keys(this.initialPositions) as PlaneName[]).forEach((planeName) => {
      const { y, z } = this.initialPositions[planeName];
      const position = new THREE.Vector3(0, y, z);
      const size = new THREE.Vector2(100, 6);

      const colorKey = planeName as keyof ColorTheme;
      const color = (
        planeName.includes('Sky')
          ? themeColors['sky'][colorKey]
          : themeColors[colorKey]
      ) as string;

      this.sceneService.addColoredPlane(color, position, size, planeName);
    });

    this.populateWithVegetation([
      { url: '../../assets/env/T_Grasspatch01.png', yOffset: 0 },
      { url: '../../assets/env/T_Grasspatch02.png', yOffset: 0 },
      { url: '../../assets/env/T_Grasspatch03.png', yOffset: 0 },
      { url: '../../assets/env/T_Grasspatch04.png', yOffset: 0 },
    ]);
  }

  private populateWithVegetation(assets: Asset[]) {
    // Adds vegetation to each plane using provided asset configurations
    this.configService.planesConfig.forEach((plane) =>
      this.addVegetationToPlane(plane, assets)
    );
  }

  private addVegetationToPlane(plane: PlaneConfig, assets: Asset[]) {
    // Randomly places a specified number of vegetation assets on a plane
    const numItems = Math.floor(Math.random() * 3) + 50;
    for (let i = 0; i < numItems; i++) {
      const asset = assets[Math.floor(Math.random() * assets.length)];
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        asset.yOffset + plane.vegetationYOffset,
        plane.zOffset
      );
      const size = new THREE.Vector2(plane.scale * 1.5, plane.scale);

      this.sceneService.addDecorativePlane(
        asset.url,
        position,
        size,
        plane.color,
        plane.name
      );
    }
  }

  public addMouseMoveListener(): void {
    // Adds a global mouse move listener to create interactive effects
    window.addEventListener('mousemove', this.handleMouseMove);
  }

  private handleMouseMove = (event: MouseEvent): void => {
    // Handles mouse movement to adjust the position of planes for a parallax effect
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const mouseX = (event.clientX - centerX) / centerX;
    const mouseY = (event.clientY - centerY) / centerY;

    Object.keys(this.initialPositions).forEach((key) => {
      const planeName = key as PlaneName;
      const plane = this.initialPositions[planeName];
      const { y, z } = plane;
      const depthFactor = 1 / Math.abs(z);

      const newPositionX = mouseX * depthFactor * 10;
      const newPositionY = y + mouseY * depthFactor * 4;

      this.sceneService.movePlane(
        planeName,
        new THREE.Vector3(newPositionX, newPositionY, z)
      );
    });
  };

  public addModeToggleButton(): void {
    // Adds a toggle button for switching themes, ensuring it's recreated after each click
    const textureType = this.isDarkMode ? 'moon' : 'sun';
    const texturePath =
      textureType === 'sun'
        ? '../../assets/env/T_Sun.png'
        : '../../assets/env/T_Moon.png';

    this.sceneService.removeFromScene('modeToggle'); // Ensure removal before recreation

    const onClickCallback = () => {
      this.toggleMode();
      this.addModeToggleButton();
    };

    this.sceneService.createInteractionBox(
      'modeToggle',
      texturePath,
      '#ffffff',
      new THREE.Vector3(4, 2, 0),
      onClickCallback
    );
  }

  private toggleMode(): void {
    // Toggles between light and dark themes and updates the scene accordingly
    this.isDarkMode = !this.isDarkMode;
    this.currentThemeConfig = this.configService.getTheme('meadow');
    const themeColors = this.isDarkMode
      ? this.currentThemeConfig.dark
      : this.currentThemeConfig.light;

    console.log(`Toggling theme to ${this.isDarkMode ? 'Dark' : 'Light'}`);
    console.log('Current theme configuration:', this.currentThemeConfig);

    Object.keys(this.initialPositions).forEach((key) => {
      const planeName = key as PlaneName;
      const plane = this.sceneService.getScene().getObjectByName(planeName);
      if (plane instanceof THREE.Mesh) {
        const isSky = planeName.includes('Sky');
        const colorKey = isSky
          ? (planeName as keyof SkyColorTheme)
          : (planeName as keyof ColorTheme);
        const colorSource = isSky ? themeColors['sky'] : themeColors;
        const newColor = new THREE.Color(colorSource[colorKey]);

        console.log(`Updating color of ${planeName} to ${newColor.getStyle()}`);
        this.lerpColor(plane.material.color, newColor, 0.2);

        if (!isSky) {
          plane.children.forEach((child) => {
            if (child instanceof THREE.Mesh) {
              this.lerpColor(child.material.color, newColor, 0.2);
            }
          });
        }
      }
    });
  }

  private lerpColor(
    color: THREE.Color,
    targetColor: THREE.Color,
    duration: number
  ): void {
    // Smoothly transitions a color to the target color over the specified duration
    const startColor = color.clone();
    const startTime = Date.now();

    const animate = () => {
      const elapsedTime = Date.now() - startTime;
      const t = Math.min(elapsedTime / (duration * 1000), 1);
      color.lerpColors(startColor, targetColor, t);
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        // Optionally handle any post-animation logic if necessary
      }
    };

    requestAnimationFrame(animate);
  }

  public destroy(): void {
    // Remove all event listeners and cleanup resources
    window.removeEventListener('mousemove', this.handleMouseMove);
    // Additional cleanup logic for other resources if necessary
  }
}
