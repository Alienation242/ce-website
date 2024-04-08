import { Route } from '@angular/router';
import { CubeComponent } from './three/cube/cube.component';
import { BallComponent } from './three/ball/ball.component';
import { StageComponent } from './components/stage/stage.component';

export const appRoutes: Route[] = [
  { path: 'cube', component: CubeComponent },
  { path: 'ball', component: BallComponent },
  { path: 'stage', component: StageComponent },
  { path: '', redirectTo: '/stage', pathMatch: 'full' }, // Redirect to /cube as default
  // Add other routes here as needed
];
