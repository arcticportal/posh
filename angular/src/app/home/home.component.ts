import {
  Component, HostBinding, inject, ViewChild } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router'
import {FormControl, ReactiveFormsModule} from '@angular/forms'
import {debounceTime} from 'rxjs/operators'

import {ApiService} from '../api.service'
import {HomeFilterComponent} from '../home-filter/home-filter.component'
import {HomeResultComponent} from '../home-result/home-result.component'

@Component({
  selector: 'app-home',
  imports: [
    ReactiveFormsModule, HomeFilterComponent, HomeResultComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  @HostBinding('class.container') container = true
  @ViewChild(HomeResultComponent) result!: HomeResultComponent
  private route = inject(ActivatedRoute)
  private router = inject(Router)
  private api = inject(ApiService)
  window = window
  ctrl = new FormControl('')

  ngOnInit(): void {
    this.ctrl.setValue(this.route.snapshot.queryParams['search'] || '')
    this.ctrl.valueChanges.pipe(debounceTime(300)).subscribe(s => {
      this.router.navigate([], {queryParams: this.api.changedQuery(
	this.route, 'search', s || '')}) }) }
}
