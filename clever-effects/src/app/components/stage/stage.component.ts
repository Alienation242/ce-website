import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { StageMediatorService } from 'src/app/shared/services/stage-mediator.service';

@Component({
  selector: 'app-stage',
  templateUrl: './stage.component.html',
  styleUrls: ['./stage.component.css'],
})
export class StageComponent implements OnInit, OnDestroy {
  @ViewChild('rendererContainer', { static: true })
  rendererContainer!: ElementRef;

  constructor(private stageMediatorService: StageMediatorService) {}

  ngOnInit(): void {
    this.rendererContainer.nativeElement.appendChild(
      this.stageMediatorService.getRendererDOM()
    );
    this.stageMediatorService.initializeStage();
    this.stageMediatorService.addMouseMoveListener();
    this.stageMediatorService.addModeToggleButton();
  }

  ngOnDestroy(): void {
    this.stageMediatorService.destroy();
  }
}
