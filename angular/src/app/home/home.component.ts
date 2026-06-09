import {
  Component, HostBinding, inject, ViewChild } from '@angular/core';
import {DecimalPipe, NgClass} from '@angular/common'
import {ActivatedRoute, Router, RouterLink} from '@angular/router'
import {FormControl, ReactiveFormsModule} from '@angular/forms'
import {debounceTime} from 'rxjs/operators'

import {ApiService} from '../api.service'
import {ModelService} from '../model.service'
import {HomeFilterComponent} from '../home-filter/home-filter.component'
import {HomeResultComponent} from '../home-result/home-result.component'
import {HomeGlobeComponent} from '../home-globe/home-globe.component'

@Component({
  selector: 'app-home',
  imports: [
    DecimalPipe, NgClass, RouterLink, ReactiveFormsModule,
    HomeFilterComponent, HomeResultComponent, HomeGlobeComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  @HostBinding('class.container') container = true
  @ViewChild(HomeResultComponent) result!: HomeResultComponent
  private route = inject(ActivatedRoute)
  private router = inject(Router)
  api = inject(ApiService)
  model = inject(ModelService)
  window = window
  ctrl = new FormControl('')
  mobileBarHidden = false
  mobileFilterExpanded = false

  onMobileFilterExpanded(expanded: any) {
    this.mobileFilterExpanded = expanded
    if (expanded) this.mobileBarHidden = false }

  ngOnInit(): void {
    this.ctrl.setValue(this.route.snapshot.queryParams['search'] || '')
    this.ctrl.valueChanges.pipe(debounceTime(300)).subscribe(s => {
      this.router.navigate([], {
	queryParams: this.model.setSearch(s)}) }) }
}
