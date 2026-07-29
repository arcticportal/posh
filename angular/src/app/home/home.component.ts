import {
  AfterViewInit, Component, ElementRef, HostBinding, inject,
  ViewChild } from '@angular/core';
import {DecimalPipe, NgClass} from '@angular/common'
import {ActivatedRoute, Router, RouterLink} from '@angular/router'
import {
  FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms'
import {debounceTime} from 'rxjs/operators'

import {ApiService} from '../api.service'
import {ModelService} from '../model.service'
import {HomeFilterComponent} from '../home-filter/home-filter.component'
import {HomeResultComponent} from '../home-result/home-result.component'
import {HomeGlobeComponent} from '../home-globe/home-globe.component'

@Component({
  selector: 'app-home',
  imports: [
    DecimalPipe, FormsModule, NgClass, RouterLink, ReactiveFormsModule,
    HomeFilterComponent, HomeResultComponent, HomeGlobeComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements AfterViewInit {
  @HostBinding('class.container') container = true
  @ViewChild(HomeResultComponent) result!: HomeResultComponent
  @ViewChild('splashModal') splashModalElement!: ElementRef
  private route = inject(ActivatedRoute)
  private router = inject(Router)
  api = inject(ApiService)
  model = inject(ModelService)
  dontShowAgain: boolean = false
  private modalInstance: any
  private readonly storageKey = 'dismissedSplashPage'
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

  ngAfterViewInit(): void {
    if (!localStorage.getItem(this.storageKey))
      this.launchSplashScreen() }

  private launchSplashScreen(): void {
    this.modalInstance = new (window as any).bootstrap.Modal(
      this.splashModalElement.nativeElement, {
	backdrop: true, keyboard: true})
    this.modalInstance.show()
    this.splashModalElement.nativeElement.addEventListener(
      'hidden.bs.modal', () => {
	if (this.dontShowAgain)
	  localStorage.setItem(this.storageKey, 'true') }) }
}
