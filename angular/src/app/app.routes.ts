import { Routes } from '@angular/router';

import {HomeComponent} from './home/home.component'
import {SitesComponent} from './sites/sites.component'
import {FaqComponent} from './faq/faq.component'
import {ContactComponent} from './contact/contact.component'
import {AboutComponent} from './about/about.component'

export const suf = ' | POSC'

export const routes: Routes = [
  {path: '', component: HomeComponent,
   title: 'Polar Observing Site Catalog'},
  {path: 'sites/:posdt_id', component: SitesComponent},
  {path: 'faq', component: FaqComponent, title: 'FAQ' + suf},
  {path: 'contact', component: ContactComponent,
   title: 'Contact' + suf},
  {path: 'about', component: AboutComponent, title: 'About' + suf},
];
