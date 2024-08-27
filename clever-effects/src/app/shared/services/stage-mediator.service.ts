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
  private scrollOffset = 0; // Tracks how far we've scrolled

  private lastMouseX: number = window.innerWidth / 2;
  private lastMouseY: number = window.innerHeight / 2;

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
    window.addEventListener('mousemove', this.onMouseMove); // Add mouse move event listener
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

  private trackMouse(event: MouseEvent): void {
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }

  private onMouseMove = (event: MouseEvent): void => {
    // Calculate normalized mouse position
    this.lastMouseX = (event.clientX / window.innerWidth) * 2 - 1;
    this.lastMouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    // Apply parallax effect based on the new mouse position
    this.applyParallax();
  };

  private onMouseWheel = (event: WheelEvent): void => {
    const direction = event.deltaY > 0 ? 1 : -1; // Determine scroll direction
    this.scrollOffset += direction * 0.5; // Update scroll offset
    this.scrollLandscape(direction);

    // Apply parallax effect after scrolling
    this.applyParallax();
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

    // Define the number of ground planes to generate
    const numberOfGroundPlanes = 16;

    for (let i = 0; i < numberOfGroundPlanes; i++) {
      (Object.keys(this.initialPositions) as PlaneName[]).forEach(
        (planeName) => {
          const { y, z } = this.initialPositions[planeName];

          // Calculate the initial Z position for each plane
          const initialZPosition = z - i * 1.5; // Space out planes by 1.5 units

          const position = new THREE.Vector3(0, y, initialZPosition);
          const size = planeName.includes('Sky')
            ? new THREE.Vector2(300, 24) // Adjust sky planes size for visibility
            : new THREE.Vector2(100, 6); // Ground planes size

          const colorKey = planeName as keyof ColorTheme;
          const color = planeName.includes('Sky')
            ? themeColors['sky'][colorKey]
            : themeColors[colorKey];

          // Correctly calculate initial color based on Z position
          const colorTransitionFactor = (initialZPosition + 8) / 16; // Normalize Z position for color interpolation
          const initialColor = this.interpolateColor(colorTransitionFactor);

          // Create a group for each plane
          const planeGroup = new THREE.Group();
          planeGroup.position.set(0, y, initialZPosition);
          planeGroup.name = `${planeName}_${i}`; // Unique name for each plane instance

          this.sceneService.addColoredPlane(
            initialColor, // Use calculated color
            position,
            size,
            planeGroup.name as PlaneName,
            planeGroup
          );

          if (!planeName.includes('Sky')) {
            const assets = this.generateVegetationAssets();
            this.populateWithVegetation(assets, planeGroup); // Populate each ground plane with vegetation
          }

          this.sceneService.addToScene(planeGroup);
          this.planeGroups.set(planeGroup.name, planeGroup);
        }
      );
    }

    // Ensure sky planes are always visible and correctly positioned
    (Object.keys(this.initialPositions) as PlaneName[]).forEach((planeName) => {
      if (planeName.includes('Sky')) {
        const { y, z } = this.initialPositions[planeName];
        const position = new THREE.Vector3(0, y, z);
        const size = new THREE.Vector2(300, 24); // Larger size for the sky

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
        if (planeGroup.position.z > 8) {
          this.clearVegetationFromPlane(planeGroup);
          planeGroup.position.z -= 12 * 1.5; // Reposition further back to maintain continuity
          planeGroup.position.y =
            this.initialPositions[planeName.split('_')[0] as PlaneName].y; // Reset Y to the original position
          this.populateWithVegetation(
            this.generateVegetationAssets(),
            planeGroup
          );
        } else if (planeGroup.position.z < -8) {
          this.clearVegetationFromPlane(planeGroup);
          planeGroup.position.z += 12 * 1.5; // Reposition further ahead to maintain continuity
          planeGroup.position.y =
            this.initialPositions[planeName.split('_')[0] as PlaneName].y; // Reset Y to the original position
          this.populateWithVegetation(
            this.generateVegetationAssets(),
            planeGroup
          );
        }

        // Correct color update after repositioning
        const colorTransitionFactor = (planeGroup.position.z + 8) / 16; // Normalize Z position for color interpolation
        const color = this.interpolateColor(colorTransitionFactor);
        this.updatePlaneColor(planeGroup, color);
      }
    });
  }

  private applyParallax(): void {
    this.planeGroups.forEach((planeGroup, planeName) => {
      const basePlaneName = planeName.split('_')[0] as PlaneName;
      const originalPosition = this.initialPositions[basePlaneName];

      const depthFactor = 1 / Math.abs(originalPosition.z);

      // Increase these factors for a faster parallax effect
      const parallaxStrengthX = 8; // Adjust for stronger/weaker parallax effect
      const parallaxStrengthY = 8; // Adjust for stronger/weaker parallax effect

      const targetX = this.lastMouseX * depthFactor * parallaxStrengthX;
      const targetY = this.lastMouseY * depthFactor * parallaxStrengthY;

      // Reduce the smoothing factor for quicker response (e.g., 0.2 to 0.3 for faster movement)
      const smoothingFactor = 0.2; // Increase this value for faster response, decrease for slower, smoother

      // Smooth transition with reduced smoothing for faster movement
      planeGroup.position.x +=
        (targetX - planeGroup.position.x) * smoothingFactor;
      planeGroup.position.y +=
        (originalPosition.y + targetY - planeGroup.position.y) *
        smoothingFactor;
    });

    // Render the scene after applying parallax effect
    this.sceneService
      .getRenderer()
      .render(this.sceneService.getScene(), this.sceneService.getCamera());
  }

  private clearVegetationFromPlane(planeGroup: THREE.Group): void {
    const vegetation = this.vegetationMap.get(planeGroup.name);
    if (vegetation) {
      vegetation.forEach((obj) => this.sceneService.removeFromScene(obj.name));
      this.vegetationMap.set(planeGroup.name, []); // Reset vegetation array
    }
  }
  private interpolateColor(factor: number): string {
    const theme = this.isDarkMode
      ? this.currentThemeConfig.dark
      : this.currentThemeConfig.light;

    const lightColor = new THREE.Color(theme['lightGreenPlane']);
    const mediumColor = new THREE.Color(theme['mediumGreenPlane']);
    const darkColor = new THREE.Color(theme['darkGreenPlane']);

    let color;
    if (factor <= 0.5) {
      // Interpolate between lightGreenPlane and mediumGreenPlane
      color = lightColor.clone().lerp(mediumColor, factor * 2);
    } else {
      // Interpolate between mediumGreenPlane and darkGreenPlane
      color = mediumColor.clone().lerp(darkColor, (factor - 0.5) * 2);
    }

    return `#${color.getHexString()}`;
  }

  private updatePlaneColor(planeGroup: THREE.Group, color: string): void {
    console.log(`Updating color for ${planeGroup.name} to ${color}`);
    planeGroup.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshBasicMaterial;
        material.color.set(color);
      }
    });
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
      const basePlaneName = planeName.split('_')[0] as PlaneName;
      const originalPosition = this.initialPositions[basePlaneName];

      const depthFactor = 1 / Math.abs(originalPosition.z);
      const newPositionX = mouseX * depthFactor * 10;
      const newPositionY = originalPosition.y + mouseY * depthFactor * 1.5;

      planeGroup.position.x = newPositionX;
      planeGroup.position.y = newPositionY;
    });

    // Update the renderer after applying parallax
    this.sceneService
      .getRenderer()
      .render(this.sceneService.getScene(), this.sceneService.getCamera());
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
