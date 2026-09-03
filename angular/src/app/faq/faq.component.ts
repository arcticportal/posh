import { Component, HostBinding } from '@angular/core';
import {RouterLink} from '@angular/router'

@Component({
  selector: 'app-faq',
  imports: [RouterLink],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css'
})
export class FaqComponent {
  @HostBinding('class.container') container = true
}
