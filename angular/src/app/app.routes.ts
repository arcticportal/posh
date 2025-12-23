import { Routes } from '@angular/router';

import {HomeComponent} from './home/home.component'

export const suf = ' | POSDT'

export const routes: Routes = [
  {path: '', component: HomeComponent,
   title: 'Polar Observing Site Discovery Tool'},
];
