import { Injectable } from '@angular/core';
import * as THREE from 'three';

@Injectable({
  providedIn: 'root',
})
export class AssetLoaderService {
  private loader = new THREE.TextureLoader();
  private cache = new Map<string, THREE.Texture>();
  public loadTexture(url: string): Promise<THREE.Texture> {
    if (this.cache.has(url)) {
      return Promise.resolve(this.cache.get(url)!);
    }

    return new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(
        url,
        (texture) => {
          this.cache.set(url, texture);
          resolve(texture);
        },
        undefined,
        (error) => reject(error)
      );
    });
  }
}
