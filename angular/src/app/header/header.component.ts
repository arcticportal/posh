import { Component, inject } from '@angular/core';
import {
  ActivatedRoute, NavigationStart, RouterLink} from '@angular/router'

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  private route = inject(ActivatedRoute)

  id(e?: NavigationStart): string {
    var a = (e || (this.route.snapshot as any)._routerState).url.slice(
	  1).split('/'),
	r = a.length ? a[0].replace(/\?.*$/, '') : ''
    return r || 'home' }
}
