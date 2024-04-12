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
  [key: string]: string | any; // Using `any` for nested structures if they exist
}

export interface ThemeConfig {
  light: ColorTheme;
  dark: ColorTheme;
}

type Themes = {
  [key in ThemeName]: ThemeConfig;
};

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

  private generateTheme(
    mode: 'light' | 'dark',
    overrides?: Partial<ColorTheme>
  ): ColorTheme {
    const colors: ColorTheme = JSON.parse(JSON.stringify(this.baseColors)); // Deep copy base colors

    // Apply darkening if the mode is 'dark' and no specific overrides are provided
    if (mode === 'dark' && !overrides) {
      this.applyDarkening(colors);
    } else if (overrides) {
      // Apply provided overrides if any
      this.applyOverrides(colors, overrides);
    }

    return colors;
  }

  private applyDarkening(colors: ColorTheme) {
    this.applyDarkeningToColorFields(colors);
    this.applyDarkeningToSky(colors?.['sky']);
  }

  private applyDarkeningToColorFields(colors: Omit<ColorTheme, 'sky'>) {
    (Object.keys(colors) as (keyof Omit<ColorTheme, 'sky'>)[]).forEach(
      (key) => {
        if (typeof colors[key] === 'string') {
          colors[key] = this.darkenColor(colors[key]);
        }
      }
    );
  }

  private applyDarkeningToSky(sky: SkyColorTheme) {
    (Object.keys(sky) as (keyof SkyColorTheme)[]).forEach((key) => {
      sky[key] = this.darkenColor(sky[key]);
    });
  }

  private applyOverrides(colors: ColorTheme, overrides: Partial<ColorTheme>) {
    Object.keys(overrides).forEach((key) => {
      const overrideValue = overrides[key as keyof ColorTheme];
      if (overrideValue !== undefined) {
        if (typeof overrideValue === 'string') {
          (colors[key as keyof ColorTheme] as unknown as string) =
            overrideValue;
        } else {
          Object.assign(
            colors[key as keyof ColorTheme] as SkyColorTheme,
            overrideValue
          );
        }
      }
    });
  }

  private darkenColor(color: string): string {
    const col = new THREE.Color(color);
    return `#${col.multiplyScalar(0.75).getHexString()}`; // Darken color by 25%
  }
}
