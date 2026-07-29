import { Component, HostBinding, inject } from '@angular/core';
import {HttpClient} from '@angular/common/http'
import {
  FormBuilder, FormGroup, ReactiveFormsModule,
  Validators} from '@angular/forms'

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  @HostBinding('class.container') container = true
  private http = inject(HttpClient)
  private fb = inject(FormBuilder)
  errorMessage: string = ''
  submissionState: 'idle' | 'submitting' | 'success' | 'error' = 'idle'
  contactForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    from_email_id: ['', [Validators.required, Validators.email]],
    message: ['', [Validators.required, Validators.minLength(10)]]})

  onSubmit() {
    if (this.contactForm.invalid) return
    this.submissionState = 'submitting'
    var formData = this.contactForm.value, msg = `
Name: ${formData.name}
Email: ${formData.from_email_id}
------------------------------------------------------------------------
${formData.message}
------------------------------------------------------------------------
(Sent via POSH Contact Us form)
`
    this.http.post(
      'https://polarobservingregistry.org/api/v2/email/contact-us/',
      {...formData, message: msg}).subscribe({
	next: () => {
	  this.submissionState = 'success'
	  this.contactForm.reset() },
	error: err => {
	  this.submissionState = 'error'
	  this.errorMessage = err?.error?.message ||
	    'An unknown error occurred' }}) }

  get name() { return this.contactForm.get('name') }
  get email() { return this.contactForm.get('from_email_id') }
  get message() { return this.contactForm.get('message') }
}
