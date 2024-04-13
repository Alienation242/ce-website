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

  public destroy(): void {
    // Add cleanup logic if needed
  }
}
