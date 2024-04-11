import { Route } from '@angular/router';
import { StageComponent } from './components/stage/stage.component';

export const appRoutes: Route[] = [
  { path: 'stage', component: StageComponent },
  { path: '', redirectTo: '/stage', pathMatch: 'full' }, // Redirect to /cube as default
  // Add other routes here as needed
];
