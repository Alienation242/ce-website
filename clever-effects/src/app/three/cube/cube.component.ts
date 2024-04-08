// Example component
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ThreeService } from 'src/app/shared/services/three.service';

@Component({
  selector: 'app-cube',
  template: '<div #rendererContainer></div>',
  standalone: true,
})
export class CubeComponent implements OnInit {
  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef;

  constructor(private threeService: ThreeService) {}

  ngOnInit() {
    this.rendererContainer.nativeElement.appendChild(this.threeService.getRendererDOM());

    // Transform the current object to a cube
    this.threeService.transformToCube();
  }
}

// Similarly, in your "ball" component, you can call this.threeService.transformToSphere() to change the cube to a sphere.
