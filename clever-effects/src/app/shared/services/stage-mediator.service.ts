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
  private currentThemeConfig: ThemeConfig;
  private planeGroups: Map<PlaneName, THREE.Group> = new Map(); // Track groups of planes for easy manipulation
  private vegetationMap: Map<string, THREE.Object3D[]> = new Map(); // Track vegetation objects per plane
  private scrollOffset = 0; // Tracks how far we've scrolled

  initialPositions: { [key in PlaneName]: { y: number; z: number } } = {
    darkGreenPlane: { y: -5, z: -2 }, // Lower starting Y position
    mediumGreenPlane: { y: -4, z: -2.5 }, // Lower starting Y position
    lightGreenPlane: { y: -3, z: -3 }, // Lower starting Y position
    lightBlueSky: { y: 3, z: -10 },
    mediumBlueSky: { y: 5, z: -9 },
    darkBlueSky: { y: 7, z: -8 },
  };

  constructor(
    private sceneService: SceneService,
    private interactionService: InteractionService,
    private configService: ConfigurationService
  ) {
    this.currentThemeConfig = this.configService.getTheme('meadow'); // Initialize the theme config
    window.addEventListener('wheel', this.onMouseWheel); // Add wheel event listener
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

  private onMouseWheel = (event: WheelEvent): void => {
    const direction = event.deltaY > 0 ? 1 : -1; // Determine scroll direction
    this.scrollOffset += direction * 0.5; // Update scroll offset
    this.scrollLandscape(direction);
  };

  private generateVegetationAssets(): Asset[] {
    return [
      { url: '../../assets/env/T_Grasspatch01.png', yOffset: 0 },
      { url: '../../assets/env/T_Grasspatch02.png', yOffset: 0 },
      { url: '../../assets/env/T_Grasspatch03.png', yOffset: 0 },
      { url: '../../assets/env/T_Grasspatch04.png', yOffset: 0 },
    ];
  }

  private setupStage(): void {
    const theme: ThemeConfig = this.currentThemeConfig;
    const themeColors = this.isDarkMode ? theme.dark : theme.light;

    (Object.keys(this.initialPositions) as PlaneName[]).forEach((planeName) => {
      const { y, z } = this.initialPositions[planeName];
      const position = new THREE.Vector3(0, y, z);

      // Adjust size based on whether it's a sky or ground plane
      const size = planeName.includes('Sky')
        ? new THREE.Vector2(300, 24) // Make sky planes larger for a 1:4 ratio
        : new THREE.Vector2(100, 6); // Ground planes remain the same

      const colorKey = planeName as keyof ColorTheme;
      const color = planeName.includes('Sky')
        ? themeColors['sky'][colorKey]
        : themeColors[colorKey];

      // Create a group for each plane
      const planeGroup = new THREE.Group();
      planeGroup.position.set(0, y, z);
      planeGroup.name = planeName;

      this.sceneService.addColoredPlane(
        color,
        position,
        size,
        planeName,
        planeGroup
      );

      if (!planeName.includes('Sky')) {
        const assets = this.generateVegetationAssets();
        this.populateWithVegetation(assets, planeGroup); // Pass the correct group
      }

      this.sceneService.addToScene(planeGroup);
      this.planeGroups.set(planeName, planeGroup);
    });
  }

  private scrollLandscape(direction: number): void {
    this.planeGroups.forEach((planeGroup, planeName) => {
      if (!planeName.includes('Sky')) {
        // Only move ground planes
        planeGroup.position.z += direction * 0.5; // Adjust the scroll speed
        planeGroup.position.y += direction * 0.1; // Y offset for better plane management

        // Update vegetation Z position to match plane's Z position
        planeGroup.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            child.position.z = 0; // Keep vegetation at the same local Z relative to the plane
          }
        });

        // Reposition planes earlier to avoid empty horizon
        if (planeGroup.position.z > 6) {
          // Despawn and respawn earlier
          this.clearVegetationFromPlane(planeGroup);
          planeGroup.position.z = -6; // Reposition slightly back for smooth transition
          planeGroup.position.y = this.initialPositions[planeName].y; // Reset Y to the original position
          this.populateWithVegetation(
            this.generateVegetationAssets(),
            planeGroup
          );
        } else if (planeGroup.position.z < -6) {
          // Despawn and respawn earlier
          this.clearVegetationFromPlane(planeGroup);
          planeGroup.position.z = 6; // Reposition slightly ahead for smooth transition
          planeGroup.position.y = this.initialPositions[planeName].y; // Reset Y to the original position
          this.populateWithVegetation(
            this.generateVegetationAssets(),
            planeGroup
          );
        }

        // Update plane color based on Z position
        const colorTransitionFactor = (planeGroup.position.z + 6) / 12; // Normalize Z position for color interpolation
        const color = this.interpolateColor(colorTransitionFactor);
        this.updatePlaneColor(planeGroup, color);
      }
    });
  }

  private respawnPlane(planeGroup: THREE.Group, newPositionZ: number): void {
    const originalPosition =
      this.initialPositions[planeGroup.name as PlaneName];

    planeGroup.position.z = newPositionZ;
    planeGroup.position.y = originalPosition.y; // Reset Y to original position to avoid drift

    // Reinitialize vegetation to avoid flicker
    const assets = this.generateVegetationAssets();
    this.populateWithVegetation(assets, planeGroup);
  }

  private clearVegetationFromPlane(planeGroup: THREE.Group): void {
    const vegetation = this.vegetationMap.get(planeGroup.name);
    if (vegetation) {
      vegetation.forEach((obj) => this.sceneService.removeFromScene(obj.name));
      this.vegetationMap.set(planeGroup.name, []); // Reset vegetation array
    }
  }

  private interpolateColor(factor: number): string {
    const theme = this.currentThemeConfig.light; // Assuming light theme for now
    const darkColor = new THREE.Color(theme['darkGreenPlane']);
    const mediumColor = new THREE.Color(theme['mediumGreenPlane']);
    const lightColor = new THREE.Color(theme['lightGreenPlane']);

    let color;
    if (factor <= 0.5) {
      // Interpolate between darkGreenPlane and mediumGreenPlane
      color = darkColor.clone().lerp(mediumColor, factor * 2);
    } else {
      // Interpolate between mediumGreenPlane and lightGreenPlane
      color = mediumColor.clone().lerp(lightColor, (factor - 0.5) * 2);
    }

    return `#${color.getHexString()}`;
  }

  private updatePlaneColor(planeGroup: THREE.Group, color: string): void {
    planeGroup.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshBasicMaterial;
        material.color.set(color);
      }
    });
  }

  private adjustColorBrightness(color: string, direction: number): string {
    const colorObj = new THREE.Color(color);
    const brightnessFactor = direction > 0 ? 1.05 : 0.95; // Adjust brightness factor as needed
    colorObj.multiplyScalar(brightnessFactor);
    return `#${colorObj.getHexString()}`;
  }

  private populateWithVegetation(assets: Asset[], planeGroup: THREE.Group) {
    const planeConfig = this.configService.planesConfig.find(
      (p) => p.name === planeGroup.name
    );
    if (planeConfig) {
      this.addVegetationToPlane(planeConfig, assets, planeGroup);
    }
  }

  private addVegetationToPlane(
    plane: PlaneConfig,
    assets: Asset[],
    planeGroup: THREE.Group
  ) {
    const numItems = 30; // Fixed number of vegetation for consistent appearance
    const vegetationObjects: THREE.Object3D[] = [];

    for (let i = 0; i < numItems; i++) {
      const asset = assets[Math.floor(Math.random() * assets.length)];
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 40, // Randomly distributed along the X-axis
        asset.yOffset + plane.vegetationYOffset, // Y-position based on plane config
        0 // Z-position set to 0 relative to planeGroup
      );
      const size = new THREE.Vector2(plane.scale * 1.5, plane.scale);

      this.sceneService
        .addDecorativePlane(
          asset.url,
          position,
          size,
          plane.color,
          planeGroup.name
        )
        .then((vegObject) => {
          if (vegObject) {
            vegObject.position.set(position.x, position.y, position.z); // Ensure proper local positioning
            planeGroup.add(vegObject);
            vegetationObjects.push(vegObject);
          }
        });
    }

    this.vegetationMap.set(planeGroup.name, vegetationObjects);
  }

  public addMouseMoveListener(): void {
    // Adds a global mouse move listener to create interactive effects
    window.addEventListener('mousemove', this.handleMouseMove);
  }

  private handleMouseMove = (event: MouseEvent): void => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const mouseX = (event.clientX - centerX) / centerX;
    const mouseY = (event.clientY - centerY) / centerY;

    this.planeGroups.forEach((planeGroup, planeName) => {
      const originalPosition = this.initialPositions[planeName];
      const depthFactor = 1 / Math.abs(originalPosition.z);
      const newPositionX = mouseX * depthFactor * 10;
      const newPositionY = originalPosition.y + mouseY * depthFactor * 1.5;

      planeGroup.position.x = newPositionX;
      planeGroup.position.y = newPositionY;
    });
  };

  public addModeToggleButton(): void {
    const textureType = this.isDarkMode ? 'moon' : 'sun';
    const texturePath =
      textureType === 'sun'
        ? '../../assets/env/T_Sun.png'
        : '../../assets/env/T_Moon.png';

    this.sceneService.removeFromScene('modeToggle');

    const onClickCallback = () => {
      this.toggleMode();
      this.addModeToggleButton();
    };

    // Fixed position above all planes
    this.sceneService.createInteractionBox(
      'modeToggle',
      texturePath,
      '#ffffff',
      new THREE.Vector3(4, 2, 0),
      onClickCallback
    );
  }

  private toggleMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.currentThemeConfig = this.configService.getTheme('meadow');
    const themeColors = this.isDarkMode
      ? this.currentThemeConfig.dark
      : this.currentThemeConfig.light;

    this.planeGroups.forEach((planeGroup, planeName) => {
      const colorKey = planeName as keyof ColorTheme;
      const colorSource = planeName.includes('Sky')
        ? themeColors['sky']
        : themeColors;
      const newColor = new THREE.Color(colorSource[colorKey]);

      planeGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          this.lerpColor(
            (child.material as THREE.MeshBasicMaterial).color,
            newColor,
            0.2
          );
        }
      });
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
      }
    };

    requestAnimationFrame(animate);
  }

  public destroy(): void {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('wheel', this.onMouseWheel);
  }
}
