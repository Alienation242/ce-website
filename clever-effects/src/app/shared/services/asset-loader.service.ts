import { Injectable } from '@angular/core';
import * as THREE from 'three';

@Injectable({
  providedIn: 'root',
})
export class AssetLoaderService {
  private loader = new THREE.TextureLoader(); // Single reusable instance of TextureLoader for efficient memory usage
  private cache = new Map<string, THREE.Texture>(); // Cache to store loaded textures to avoid reloading them

  // Method to load a texture from a URL, which returns a promise of THREE.Texture
  public loadTexture(url: string): Promise<THREE.Texture> {
    // Check if the texture is already in the cache
    if (this.cache.has(url)) {
      // If yes, return the cached texture wrapped in a resolved promise
      return Promise.resolve(this.cache.get(url)!);
    }

    // If the texture is not cached, load it using the TextureLoader
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (texture) => {
          // On successful loading, cache the texture and resolve the promise with the texture
          this.cache.set(url, texture);
          resolve(texture);
        },
        undefined, // Progress callback not used here, can be implemented if needed
        (error) => {
          // On failure, reject the promise with the error
          reject(error);
        }
      );
    });
  }
}
