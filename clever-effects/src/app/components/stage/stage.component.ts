import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { InteractionService } from 'src/app/shared/services/interaction.service';
import { SceneService } from 'src/app/shared/services/scene.service';
import {
  Asset,
  ColorTheme,
  ConfigurationService,
  PlaneConfig,
  SkyColorTheme,
  ThemeConfig,
} from 'src/app/shared/services/configuration.service';
import * as THREE from 'three';

type PlaneName =
  | 'darkGreenPlane'
  | 'mediumGreenPlane'
  | 'lightGreenPlane'
  | 'lightBlueSky'
  | 'mediumBlueSky'
  | 'darkBlueSky';

@Component({
  selector: 'app-stage',
  templateUrl: './stage.component.html',
  styleUrls: ['./stage.component.css'],
})
export class StageComponent implements OnInit, OnDestroy {
  @ViewChild('rendererContainer', { static: true })
  rendererContainer!: ElementRef;

  initialPositions: { [key in PlaneName]: { y: number; z: number } } = {
    darkGreenPlane: { y: -7, z: -3 },
    mediumGreenPlane: { y: -5, z: -4 },
    lightGreenPlane: { y: -3, z: -5 },
    lightBlueSky: { y: 1, z: -10 },
    mediumBlueSky: { y: 5, z: -9 },
    darkBlueSky: { y: 9, z: -8 },
  };

  isDarkMode = false;
  currentThemeConfig: ThemeConfig;

  constructor(
    private sceneService: SceneService,
    private interactionService: InteractionService,
    private configService: ConfigurationService
  ) {
    this.currentThemeConfig = this.configService.getTheme('meadow');
  }

  // Define planes configuration outside the method if they are static

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
    this.addModeToggleButton('sun'); // Initialize with the sun icon for light mode
  }

  private setupStage(): void {
    const theme: ThemeConfig = this.configService.getTheme('meadow');
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

      console.log(
        `Adding plane: ${planeName}, Color Key: ${colorKey}, Color: ${color}`
      );

      this.sceneService.addColoredPlane(color, position, size, planeName);
    });

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
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const mouseX = (event.clientX - centerX) / centerX; // Normalize to range -1 to 1
    const mouseY = (event.clientY - centerY) / centerY; // Normalize to range -1 to 1

    // Apply a scaling factor based on the depth to create the parallax effect
    // Planes further from the camera should move less
    (Object.keys(this.initialPositions) as PlaneName[]).forEach((planeName) => {
      const { y, z } = this.initialPositions[planeName];
      const depthFactor = 1 / Math.abs(z); // Smaller depth factor for farther objects

      // Calculate the new positions influenced by mouse position and depth factor
      const newPositionX = mouseX * depthFactor * 10; // Scale movement horizontally
      const newPositionY = y + mouseY * depthFactor * 4; // Scale movement vertically and adjust by the plane's base height

      // Update plane position
      this.sceneService.movePlane(
        planeName,
        new THREE.Vector3(newPositionX, newPositionY, z)
      );
    });
  };

  private addModeToggleButton(textureType: 'sun' | 'moon'): void {
    // Toggle between 'sun' and 'moon' textures
    const texturePath =
      textureType === 'sun'
        ? '../../assets/env/T_Sun.png'
        : '../../assets/env/T_Moon.png';
    const onClickCallback = () => {
      this.isDarkMode = !this.isDarkMode;
      this.toggleTheme();
      this.sceneService.removeFromScene('modeToggle');
      this.addModeToggleButton(this.isDarkMode ? 'moon' : 'sun');
    };

    this.sceneService.createInteractionBox(
      'modeToggle', // Ensure this is used consistently and not duplicated
      texturePath,
      '#ffffff', // Assuming a white tint for simplicity; adjust as needed
      new THREE.Vector3(4, 2, 0), // Position in the upper right corner; adjust as needed
      onClickCallback
    );
  }
  toggleTheme(): void {
    // Fetch the updated theme configuration based on the current state
    this.currentThemeConfig = this.configService.getTheme('meadow');
    const themeColors = this.isDarkMode
      ? this.currentThemeConfig.dark
      : this.currentThemeConfig.light;

    console.log(`Toggling theme to ${this.isDarkMode ? 'Dark' : 'Light'}`);
    console.log('Current theme configuration:', this.currentThemeConfig);

    // Iterate over all planes and update their colors
    Object.keys(this.initialPositions).forEach((planeName) => {
      const plane = this.sceneService
        .getScene()
        .getObjectByName(planeName as PlaneName);
      if (plane instanceof THREE.Mesh) {
        const isSky = planeName.includes('Sky');
        const colorKey = isSky
          ? (planeName as keyof SkyColorTheme)
          : (planeName as keyof ColorTheme);
        const colorSource = isSky ? themeColors['sky'] : themeColors; // Access the correct source based on plane type
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

  lerpColor(
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

    animate();
  }

  ngOnDestroy(): void {
    window.removeEventListener('mousemove', this.handleMouseMove);
  }

  private populateWithVegetation(
    assets: { url: string; yOffset: number }[],
    sceneService: SceneService
  ) {
    this.configService.planesConfig.forEach((plane) =>
      this.addVegetationToPlane(plane, assets, sceneService)
    );
  }

  private addVegetationToPlane(
    plane: PlaneConfig,
    assets: Asset[],
    sceneService: SceneService
  ) {
    const numItems = Math.floor(Math.random() * 3) + 50;
    for (let i = 0; i < numItems; i++) {
      const asset = assets[Math.floor(Math.random() * assets.length)];
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        asset.yOffset + plane.vegetationYOffset,
        plane.zOffset
      );
      const size = new THREE.Vector2(plane.scale * 1.5, plane.scale);

      sceneService.addDecorativePlane(
        asset.url,
        position,
        size,
        plane.color,
        plane.name
      );
    }
  }

  private updateVegetationColors(): void {
    const themeColors = this.isDarkMode
      ? this.currentThemeConfig.dark
      : this.currentThemeConfig.light;
    // Update colors of decorative planes
    const planes = ['darkGreenPlane', 'mediumGreenPlane', 'lightGreenPlane']; // List of parent planes
    planes.forEach((planeName) => {
      const parentPlane = this.sceneService
        .getScene()
        .getObjectByName(planeName);
      if (parentPlane && parentPlane.children.length > 0) {
        parentPlane.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            (child.material as THREE.MeshBasicMaterial).color = new THREE.Color(
              themeColors[planeName as keyof ColorTheme]
            );
          }
        });
      }
    });
  }
}
