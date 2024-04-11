// interactive-element.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { AssetLoaderService } from 'src/app/shared/services/asset-loader.service';
import { SceneService } from 'src/app/shared/services/scene.service';
import * as THREE from 'three';

@Component({
  selector: 'app-interactive-element',
  template: ``,
  styleUrls: ['./interactive-element.component.css'],
})
export class InteractiveElementComponent implements OnInit {
  @Input() modelUrl!: string; // URL to the 3D model of the element
  @Input() position: THREE.Vector3 = new THREE.Vector3(); // Position of the element in the scene

  constructor(
    private sceneService: SceneService,
    private assetLoader: AssetLoaderService
  ) {}

  ngOnInit(): void {
    this.assetLoader.loadModel(this.modelUrl).then((model: THREE.Group) => {
      model.position.copy(this.position);
      this.sceneService.addToScene(model);
      // Setup interactions here, if any
    });
  }
}
