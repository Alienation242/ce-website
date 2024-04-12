import { Injectable } from '@angular/core';
import * as THREE from 'three';

export type ThemeName = 'meadow' | 'desert';

export interface SkyColorTheme {
  lightBlueSky: string;
  mediumBlueSky: string;
  darkBlueSky: string;
}

export interface BaseColorTheme {
  darkGreenPlane: string;
  mediumGreenPlane: string;
  lightGreenPlane: string;
  sky: SkyColorTheme;
}

export interface ColorTheme {
  [key: string]: string | any; // Supports nested structures
}

export interface ThemeConfig {
  light: ColorTheme;
  dark: ColorTheme;
}

type Themes = { [key in ThemeName]: ThemeConfig };

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  private baseColors: BaseColorTheme = {
    darkGreenPlane: '#556b2f',
    mediumGreenPlane: '#6b8e23',
    lightGreenPlane: '#9acd32',
    sky: {
      lightBlueSky: '#add8e6',
      mediumBlueSky: '#87ceeb',
      darkBlueSky: '#00bfff',
    },
  };

  private themes: Themes = {
    meadow: {
      light: this.generateTheme('light'),
      dark: this.generateTheme('dark', {
        darkGreenPlane: '#37412a',
        mediumGreenPlane: '#49531d',
        lightGreenPlane: '#687422',
        sky: {
          lightBlueSky: '#2a3b55',
          mediumBlueSky: '#1d2c49',
          darkBlueSky: '#0f1d3d',
        },
      }),
    },
    desert: {
      light: this.generateTheme('light', {
        darkGreenPlane: '#c2b280',
        mediumGreenPlane: '#c2a679',
        lightGreenPlane: '#c29c62',
        sky: {
          lightBlueSky: '#eddcd2',
          mediumBlueSky: '#fff1e6',
          darkBlueSky: '#fde2e4',
        },
      }),
      dark: this.generateTheme('dark', {
        darkGreenPlane: '#827b60',
        mediumGreenPlane: '#796a53',
        lightGreenPlane: '#6f5946',
        sky: {
          lightBlueSky: '#62374d',
          mediumBlueSky: '#412234',
          darkBlueSky: '#272838',
        },
      }),
    },
  };

  public getTheme(themeName: ThemeName): ThemeConfig {
    return this.themes[themeName];
  }

  // Generates themes either by applying darkening or custom overrides.
  private generateTheme(
    mode: 'light' | 'dark',
    overrides?: Partial<ColorTheme>
  ): ColorTheme {
    const colors: ColorTheme = JSON.parse(JSON.stringify(this.baseColors));
    if (mode === 'dark' && !overrides) {
      this.applyDarkening(colors);
    } else if (overrides) {
      this.applyOverrides(colors, overrides);
    }
    return colors;
  }

  // Applies darkening to base colors when no specific overrides are provided.
  private applyDarkening(colors: ColorTheme): void {
    this.applyDarkeningToColorFields(colors);
    this.applyDarkeningToSky(colors['sky']);
  }

  // Darkens color fields not including the sky.
  private applyDarkeningToColorFields(colors: Omit<ColorTheme, 'sky'>): void {
    for (const key of Object.keys(colors)) {
      const color = colors[key as keyof typeof colors];
      if (typeof color === 'string') {
        colors[key as keyof typeof colors] = this.darkenColor(color);
      }
    }
  }

  // Darkens the colors within the sky object.
  private applyDarkeningToSky(sky: SkyColorTheme) {
    (Object.keys(sky) as (keyof SkyColorTheme)[]).forEach((key) => {
      sky[key] = this.darkenColor(sky[key]);
    });
  }
  // Applies custom overrides to the base colors.
  private applyOverrides(
    colors: ColorTheme,
    overrides: Partial<ColorTheme>
  ): void {
    Object.keys(overrides).forEach((key) => {
      const value = overrides[key as keyof ColorTheme];
      if (value) {
        if (typeof value === 'string') {
          colors[key] = value;
        } else {
          Object.assign(colors[key], value);
        }
      }
    });
  }

  // Darkens a hex color by reducing its brightness.
  private darkenColor(color: string): string {
    const col = new THREE.Color(color);
    return `#${col.multiplyScalar(0.75).getHexString()}`;
  }
}
