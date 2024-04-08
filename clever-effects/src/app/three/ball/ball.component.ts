import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ThreeService } from 'src/app/shared/services/three.service';
@Component({
  selector: 'app-ball',
  template: '<div #rendererContainer></div>', // Using a local reference in template
  styleUrls: ['./ball.component.css']
})
export class BallComponent implements OnInit {
  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef;

  constructor(private threeService: ThreeService) { }

  ngOnInit(): void {
    this.rendererContainer.nativeElement.appendChild(this.threeService.getRendererDOM());
    this.threeService.transformToSphere(); // Transform the geometry to a sphere
  }
}
