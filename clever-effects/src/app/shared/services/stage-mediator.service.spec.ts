import { SceneService } from './scene.service';
import { InteractionService } from './interaction.service';
import { ConfigurationService } from './configuration.service';
import { AssetLoaderService } from './asset-loader.service';
import * as THREE from 'three';
import { StageMediatorService } from './stage-mediator.service';

jest.mock('./scene.service');
jest.mock('./interaction.service');
jest.mock('./configuration.service');

describe('StageMediatorService', () => {
  let stageMediatorService: StageMediatorService;
  let mockSceneService: jest.Mocked<SceneService>;
  let mockInteractionService: jest.Mocked<InteractionService>;
  let mockConfigService: jest.Mocked<ConfigurationService>;

  beforeEach(() => {
    const mockAssetLoaderService = {} as jest.Mocked<AssetLoaderService>;
    mockSceneService = new SceneService(
      mockAssetLoaderService
    ) as jest.Mocked<SceneService>;
    mockInteractionService = new InteractionService(
      mockSceneService
    ) as jest.Mocked<InteractionService>;
    mockConfigService =
      new ConfigurationService() as jest.Mocked<ConfigurationService>;
    stageMediatorService = new StageMediatorService(
      mockSceneService,
      mockInteractionService,
      mockConfigService
    );

    mockSceneService.getRendererDOM.mockReturnValue(
      document.createElement('canvas')
    );
    mockConfigService.getTheme.mockReturnValue({
      light: {
        darkGreenPlane: '#9acd32',
        mediumGreenPlane: '#6b8e23',
        lightGreenPlane: '#556b2f',
        sky: {
          lightBlueSky: '#87ceeb',
          mediumBlueSky: '#add8e6',
          darkBlueSky: '#00bfff',
        },
      },
      dark: {
        darkGreenPlane: '#37412a',
        mediumGreenPlane: '#49531d',
        lightGreenPlane: '#687422',
        sky: {
          lightBlueSky: '#2a3b55',
          mediumBlueSky: '#1d2c49',
          darkBlueSky: '#0f1d3d',
        },
      },
    });
  });

  it('should add a mouse move listener', () => {
    jest.spyOn(window, 'addEventListener');
    stageMediatorService.addMouseMoveListener();
    expect(window.addEventListener).toHaveBeenCalledWith(
      'mousemove',
      expect.any(Function)
    );
  });

  it('should destroy the stage and remove event listeners', () => {
    jest.spyOn(window, 'removeEventListener');
    stageMediatorService.destroy();
    expect(window.removeEventListener).toHaveBeenCalledWith(
      'mousemove',
      expect.any(Function)
    );
  });

  // it('should toggle mode correctly', () => {
  //   // Initially not in dark mode
  //   expect(stageMediatorService.isDarkMode).toBe(false);
  //   stageMediatorService.toggleMode();
  //   // After toggling
  //   expect(stageMediatorService.isDarkMode).toBe(true);
  // });

  it('should add and configure the stage', () => {
    stageMediatorService.initializeStage();
    expect(mockInteractionService.setup).toHaveBeenCalledWith(
      expect.any(THREE.WebGLRenderer),
      expect.any(THREE.Camera)
    );
    expect(mockSceneService.addColoredPlane).toHaveBeenCalledTimes(6);
  });

  it('should add mode toggle button correctly', () => {
    stageMediatorService.addModeToggleButton();
    expect(mockSceneService.removeFromScene).toHaveBeenCalledWith('modeToggle');
    expect(mockSceneService.createInteractionBox).toHaveBeenCalled();
  });

  // it('should update plane positions on mouse move', () => {
  //   // Trigger mouse move
  //   jest
  //     .spyOn(stageMediatorService, 'handleMouseMove')
  //     .mockImplementation(() => {});
  //   stageMediatorService.addMouseMoveListener();
  //   const event = new MouseEvent('mousemove', {
  //     clientX: window.innerWidth / 2 + 100,
  //     clientY: window.innerHeight / 2 + 100,
  //   });
  //   window.dispatchEvent(event);
  //   expect(stageMediatorService.handleMouseMove).toHaveBeenCalledWith(event);
  // });

  it('should get renderer DOM', () => {
    const dom = stageMediatorService.getRendererDOM();
    expect(dom).toBeInstanceOf(HTMLCanvasElement);
  });
});
