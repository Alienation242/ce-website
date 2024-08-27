import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { AssetLoaderService } from './asset-loader.service';
import {
  PlaneName,
  ColorTheme,
  PlaneConfig,
  Asset,
  ConfigurationService,
} from './configuration.service';

@Injectable({
  providedIn: 'root',
})
export class SceneService {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  public interactiveObjects: THREE.Mesh[] = []; // Store interactive objects here

  public initialPositions: { [key in PlaneName]: { y: number; z: number } } = {
    darkGreenPlane: { y: -5, z: -2 },
    mediumGreenPlane: { y: -4, z: -2.5 },
    lightGreenPlane: { y: -3, z: -3 },
    lightBlueSky: { y: 3, z: -10 },
    mediumBlueSky: { y: 5, z: -9 },
    darkBlueSky: { y: 7, z: -8 },
  };

  public planesConfig: PlaneConfig[];

  constructor(
    private assetLoaderService: AssetLoaderService,
    private configService: ConfigurationService
  ) {
    this.planesConfig = this.configService.planesConfig; // Initialize planesConfig from ConfigurationService
    this.initializeScene();
  }

  private initializeScene(): void {
    // Create the scene
    this.scene = new THREE.Scene();

    // Setup the camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 5); // Adjust as needed

    // Setup the renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Setup basic ambient light
    const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
    this.scene.add(ambientLight);

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize, false);

    // Start the animation loop
    this.animate();
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    // Any animation-related updates go here
    this.renderer.render(this.scene, this.camera);
  };

  private onWindowResize = (): void => {
    const aspectRatio = 16 / 9;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const windowAspectRatio = width / height;

    if (windowAspectRatio > aspectRatio) {
      width = height * aspectRatio;
    } else {
      height = width / aspectRatio;
    }

    this.renderer.setSize(width, height);
    this.camera.aspect = aspectRatio;
    this.camera.updateProjectionMatrix();

    const canvas = this.renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.top = `${(window.innerHeight - height) / 2}px`;
    canvas.style.left = `${(window.innerWidth - width) / 2}px`;
  };

  public getRendererDOM(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public addToScene(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  public removeFromScene(objectName: string): void {
    const object = this.scene.getObjectByName(objectName);
    if (object) {
      object.parent?.remove(object);
      const index = this.interactiveObjects.findIndex(
        (obj) => obj.name === objectName
      );
      if (index > -1) {
        this.interactiveObjects.splice(index, 1);
      }
    }
  }

  public addColoredPlane(
    color: string,
    position: THREE.Vector3,
    size: THREE.Vector2,
    name: string,
    parentGroup: THREE.Group
  ): void {
    const geometry = new THREE.PlaneGeometry(size.x, size.y);
    const material = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.copy(position);
    plane.name = name;
    parentGroup.add(plane);
  }

  public addDecorativePlane(
    textureUrl: string,
    position: THREE.Vector3,
    size: THREE.Vector2,
    color: string,
    parentPlaneName: string
  ): Promise<THREE.Mesh | null> {
    return this.assetLoaderService
      .loadTexture(textureUrl)
      .then((texture) => {
        const geometry = new THREE.PlaneGeometry(size.x, size.y);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.DoubleSide,
          color,
        });
        const decorativePlane = new THREE.Mesh(geometry, material);
        decorativePlane.position.copy(position);
        decorativePlane.name = `vegetation_${parentPlaneName}`;

        return decorativePlane;
      })
      .catch((error) => {
        console.error(`Failed to load texture "${textureUrl}":`, error);
        return null;
      });
  }

  public addObjectToPlane(object: THREE.Object3D, planeName: string): void {
    const plane = this.scene.getObjectByName(planeName);
    if (plane) {
      plane.add(object);
    }
  }

  public movePlane(planeId: string, newPosition: THREE.Vector3): void {
    const plane = this.scene.getObjectByName(planeId);
    if (plane) {
      plane.position.set(newPosition.x, newPosition.y, newPosition.z);
    }
  }

  public highlightPlane(planeName: string, highlight: boolean): void {
    const plane = this.scene.getObjectByName(planeName);
    if (plane instanceof THREE.Mesh) {
      const material = plane.material as THREE.MeshBasicMaterial;
      material.color.set(highlight ? 0xff0000 : 0x00ff00);
    }
  }

  public createInteractionBox(
    name: string,
    assetPath: string,
    color: string,
    position: THREE.Vector3,
    onClickCallback: () => void,
    parentName?: string
  ): void {
    this.assetLoaderService
      .loadTexture(assetPath)
      .then((texture) => {
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          color: color,
          transparent: true,
        });
        const geometry = new THREE.PlaneGeometry(1, 1);
        const plane = new THREE.Mesh(geometry, material);
        plane.position.copy(position);
        plane.name = name;

        plane.userData = { onClick: onClickCallback };
        this.interactiveObjects.push(plane);

        if (parentName) {
          const parentObject = this.scene.getObjectByName(parentName);
          parentObject?.add(plane);
        } else {
          this.scene.add(plane);
        }
      })
      .catch((error) => {
        console.error(`Failed to load texture "${assetPath}":`, error);
      });
  }

  public toggleTheme(isDarkMode: boolean): void {
    // Your existing logic to switch between themes
    if (isDarkMode) {
      console.log('Switching to dark theme');
    } else {
      console.log('Switching to light theme');
    }
  }

  // New method to add mode toggle button
  public addModeToggleButton(): void {
    const textureType = 'sun'; // This would toggle based on a condition
    const texturePath =
      textureType === 'sun'
        ? '../../assets/env/T_Sun.png'
        : '../../assets/env/T_Moon.png';

    this.removeFromScene('modeToggle');

    const onClickCallback = () => {
      this.toggleTheme(true);
      this.addModeToggleButton();
    };

    this.createInteractionBox(
      'modeToggle',
      texturePath,
      '#ffffff',
      new THREE.Vector3(4, 2, 0),
      onClickCallback
    );
  }

  public interpolateColor(factor: number): string {
    const themeColors: ColorTheme = {
      lightGreenPlane: '#9acd32',
      mediumGreenPlane: '#6b8e23',
      darkGreenPlane: '#556b2f',
      sky: {
        lightBlueSky: '#add8e6',
        mediumBlueSky: '#87ceeb',
        darkBlueSky: '#00bfff',
      },
    };

    const lightColor = new THREE.Color(themeColors['lightGreenPlane']);
    const mediumColor = new THREE.Color(themeColors['mediumGreenPlane']);
    const darkColor = new THREE.Color(themeColors['darkGreenPlane']);

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

  public clearVegetationFromPlane(planeGroup: THREE.Group): void {
    const vegetationObjects =
      this.scene.getObjectByName(planeGroup.name)?.children || [];

    vegetationObjects.forEach((obj) => {
      if (obj.name.startsWith('vegetation_')) {
        this.removeFromScene(obj.name); // Assuming this method removes an object from the scene
      }
    });
  }
  public populateWithVegetation(
    assets: Asset[],
    planeGroup: THREE.Group
  ): void {
    const planeConfig = this.planesConfig.find(
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
  ): void {
    const numItems = 30; // Fixed number of vegetation for consistent appearance
    const vegetationObjects: THREE.Object3D[] = [];

    // Cast the material to MeshBasicMaterial to access 'color'
    const planeMesh = planeGroup.children[0] as THREE.Mesh;
    const planeMaterial = planeMesh.material as THREE.MeshBasicMaterial;
    const planeColor = planeMaterial.color.getHexString(); // Use plane's color

    // New: Set a threshold for the Z position to avoid placing vegetation at the horizon
    const horizonThresholdZ = -8.0; // Example threshold value for Z position

    // Check if the plane's position is close to the horizon, skip vegetation
    if (planeGroup.position.z <= horizonThresholdZ) {
      console.log(
        `Skipping vegetation for plane at Z: ${planeGroup.position.z}`
      );
      return;
    }

    // Adjust the vertical offset to raise the vegetation a bit higher
    const vegetationVerticalOffset = 0.2; // Adjust this value as needed

    for (let i = 0; i < numItems; i++) {
      const asset = assets[Math.floor(Math.random() * assets.length)];
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 40, // Randomly distributed along the X-axis
        asset.yOffset + plane.vegetationYOffset + vegetationVerticalOffset, // Y-position adjusted to raise vegetation
        0 // Z-position set to 0 relative to planeGroup
      );
      const size = new THREE.Vector2(plane.scale * 1.5, plane.scale);

      this.addDecorativePlane(
        asset.url,
        position,
        size,
        `#${planeColor}`, // Apply the plane's color to vegetation
        planeGroup.name
      ).then((vegObject) => {
        if (vegObject) {
          vegObject.position.set(position.x, position.y, position.z); // Ensure proper local positioning
          planeGroup.add(vegObject);
          vegetationObjects.push(vegObject);
        }
      });
    }
  }

  public generateVegetationAssets(): Asset[] {
    return [
      { url: '../../assets/env/T_Grasspatch01.png', yOffset: 0 },
      { url: '../../assets/env/T_Grasspatch02.png', yOffset: 0 },
      { url: '../../assets/env/T_Grasspatch03.png', yOffset: 0 },
      { url: '../../assets/env/T_Grasspatch04.png', yOffset: 0 },
    ];
  }
}
