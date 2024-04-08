import { Route } from '@angular/router';
import { CubeComponent } from './three/cube/cube.component';
import { BallComponent } from './three/ball/ball.component';

export const appRoutes: Route[] =  [
    { path: 'cube', component: CubeComponent },
    { path: 'ball', component: BallComponent },
    { path: '', redirectTo: '/cube', pathMatch: 'full' }, // Redirect to /cube as default
    // Add other routes here as needed
  ];
