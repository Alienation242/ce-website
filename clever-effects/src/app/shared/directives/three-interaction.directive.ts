// src/app/shared/directives/three-interaction.directive.ts
import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { SceneService } from '../services/scene.service';

@Directive({
  selector: '[appThreeInteraction]',
})
export class ThreeInteractionDirective {
  @Input() interactionType!: string;

  constructor(private el: ElementRef, private sceneService: SceneService) {}

  @HostListener('mouseenter') onMouseEnter() {
    this.highlight(true);
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.highlight(false);
  }

  private highlight(state: boolean): void {
    // Example interaction: change the color of a plane based on mouse enter/leave
    // 'interactionType' could determine which object or what kind of interaction to apply
    if (this.interactionType === 'planeHighlight') {
      this.sceneService.highlightPlane('somePlane', state);
    }
    // Add other interaction types as needed
  }
}
