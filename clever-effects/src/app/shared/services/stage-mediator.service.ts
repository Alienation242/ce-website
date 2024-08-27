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
  private planeGroups: Map<string, THREE.Group> = new Map(); // Use string as the key type
  private vegetationMap: Map<string, THREE.Object3D[]> = new Map(); // Track vegetation objects per plane

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
    const numberOfGroundPlanes = 16;

    for (let i = 0; i < numberOfGroundPlanes; i++) {
      (Object.keys(this.initialPositions) as PlaneName[]).forEach(
        (planeName) => {
          const { y, z } = this.initialPositions[planeName];
          const initialZPosition = z - i * 1.5; // Space out planes by 1.5 units

          const position = new THREE.Vector3(0, y, initialZPosition);
          const size = planeName.includes('Sky')
            ? new THREE.Vector2(300, 24)
            : new THREE.Vector2(100, 6);

          const colorKey = planeName as keyof ColorTheme;
          const color = planeName.includes('Sky')
            ? themeColors['sky'][colorKey]
            : themeColors[colorKey];

          const colorTransitionFactor = (initialZPosition + 8) / 16;
          const initialColor = this.interpolateColor(colorTransitionFactor);

          const planeGroup = new THREE.Group();
          planeGroup.position.set(0, y, initialZPosition);
          planeGroup.name = `${planeName}_${i}`;

          this.sceneService.addColoredPlane(
            initialColor,
            position,
            size,
            planeGroup.name as PlaneName,
            planeGroup
          );

          if (!planeName.includes('Sky')) {
            const assets = this.generateVegetationAssets();
            this.populateWithVegetation(assets, planeGroup);
          }

          this.sceneService.addToScene(planeGroup);
          this.planeGroups.set(planeGroup.name, planeGroup);
        }
      );
    }

    (Object.keys(this.initialPositions) as PlaneName[]).forEach((planeName) => {
      if (planeName.includes('Sky')) {
        const { y, z } = this.initialPositions[planeName];
        const position = new THREE.Vector3(0, y, z);
        const size = new THREE.Vector2(300, 24);
        const color = themeColors['sky'][planeName as keyof SkyColorTheme];

        const planeGroup = new THREE.Group();
        planeGroup.position.set(0, y, z);
        planeGroup.name = planeName;

        this.sceneService.addColoredPlane(
          color,
          position,
          size,
          planeGroup.name as PlaneName,
          planeGroup
        );

        this.sceneService.addToScene(planeGroup);
        this.planeGroups.set(planeGroup.name, planeGroup);
      }
    });
  }

  public interpolateColor(factor: number): string {
    const theme = this.isDarkMode
      ? this.currentThemeConfig.dark
      : this.currentThemeConfig.light;

    const lightColor = new THREE.Color(theme['lightGreenPlane']);
    const mediumColor = new THREE.Color(theme['mediumGreenPlane']);
    const darkColor = new THREE.Color(theme['darkGreenPlane']);

    let color;
    if (factor <= 0.5) {
      color = lightColor.clone().lerp(mediumColor, factor * 2);
    } else {
      color = mediumColor.clone().lerp(darkColor, (factor - 0.5) * 2);
    }

    return `#${color.getHexString()}`;
  }

  public updatePlaneColor(planeGroup: THREE.Group, color: string): void {
    planeGroup.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshBasicMaterial;
        material.color.set(color);
      }
    });
  }

  private generateVegetationAssets(): Asset[] {
    return [
      { url: '../../assets/env/T_Grasspatch01.png', yOffset: 0 },
      { url: '../../assets/env/T_Grasspatch02.png', yOffset: 0 },
      { url: '../../assets/env/T_Grasspatch03.png', yOffset: 0 },
      { url: '../../assets/env/T_Grasspatch04.png', yOffset: 0 },
    ];
  }

  private populateWithVegetation(assets: Asset[], planeGroup: THREE.Group) {
    const planeConfig = this.configService.planesConfig.find(
      (p) => p.name === planeGroup.name.split('_')[0]
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

  public toggleMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.currentThemeConfig = this.configService.getTheme('meadow');
    const themeColors = this.isDarkMode
      ? this.currentThemeConfig.dark
      : this.currentThemeConfig.light;

    this.planeGroups.forEach((planeGroup, planeName) => {
      const colorKey = planeName.split('_')[0] as keyof ColorTheme;
      const colorSource = planeName.includes('Sky')
        ? themeColors['sky']
        : themeColors;
      const newColor = new THREE.Color(colorSource[colorKey]);

      planeGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          (child.material as THREE.MeshBasicMaterial).color.set(newColor);
        }
      });
    });
  }

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

    this.sceneService.createInteractionBox(
      'modeToggle',
      texturePath,
      '#ffffff',
      new THREE.Vector3(4, 2, 0),
      onClickCallback
    );
  }

  public destroy(): void {
    this.interactionService.cleanup();
  }
}
