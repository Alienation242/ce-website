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
  private isDarkMode = false;
  private currentThemeConfig: ThemeConfig;
  initialPositions: { [key in PlaneName]: { y: number; z: number } } = {
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
    this.currentThemeConfig = this.configService.getTheme('meadow');
  }

  public getRendererDOM(): HTMLCanvasElement {
    return this.sceneService.getRendererDOM();
  }

  public initializeStage(): void {
    this.interactionService.setup(
      this.sceneService.getRenderer(),
      this.sceneService.getCamera()
    );
    this.setupStage();
  }

  private setupStage(): void {
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
    this.configService.planesConfig.forEach((plane) =>
      this.addVegetationToPlane(plane, assets)
    );
  }

  private addVegetationToPlane(plane: PlaneConfig, assets: Asset[]) {
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
    window.addEventListener('mousemove', this.handleMouseMove);
  }

  private handleMouseMove = (event: MouseEvent): void => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const mouseX = (event.clientX - centerX) / centerX; // Normalize to range -1 to 1
    const mouseY = (event.clientY - centerY) / centerY; // Normalize to range -1 to 1

    Object.keys(this.initialPositions).forEach((key) => {
      const planeName = key as PlaneName; // Cast key to PlaneName
      const plane = this.initialPositions[planeName];
      const { y, z } = plane;
      const depthFactor = 1 / Math.abs(z); // Smaller depth factor for farther objects

      const newPositionX = mouseX * depthFactor * 10; // Scale movement horizontally
      const newPositionY = y + mouseY * depthFactor * 4; // Scale movement vertically and adjust by the plane's base height

      this.sceneService.movePlane(
        planeName,
        new THREE.Vector3(newPositionX, newPositionY, z)
      );
    });
  };

  public addModeToggleButton(): void {
    const textureType = this.isDarkMode ? 'moon' : 'sun'; // Decide based on current theme
    const texturePath =
      textureType === 'sun'
        ? '../../assets/env/T_Sun.png'
        : '../../assets/env/T_Moon.png';

    this.sceneService.removeFromScene('modeToggle'); // Ensure removal before recreation

    const onClickCallback = () => {
      this.toggleMode();
      this.addModeToggleButton(); // Recreate button with new texture
    };

    this.sceneService.createInteractionBox(
      'modeToggle', // Ensure this is used consistently and not duplicated
      texturePath,
      '#ffffff', // Assuming a white tint for simplicity; adjust as needed
      new THREE.Vector3(4, 2, 0), // Position in the upper right corner; adjust as needed
      onClickCallback
    );
  }

  private toggleMode(): void {
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

        // Update decorative planes if it's a green plane
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
    // Add cleanup logic if needed
  }
}
