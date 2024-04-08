import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ThreeComponent } from './three/three.component';

@Component({
  standalone: true,
  imports: [ RouterModule, ThreeComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'clever-effects';
}
