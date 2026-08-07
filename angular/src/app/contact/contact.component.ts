import { NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, HostBinding, inject } from '@angular/core';
import {
  FormBuilder, FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  @HostBinding('class.container') container = true
  submissionState: 'idle' | 'submitting' | 'success' | 'error' = 'idle'
  errorMessage: string = ''
  private fb = inject(FormBuilder)
  private http = inject(HttpClient)
  contactForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    from_email_id: ['', [Validators.required, Validators.email]],
    message: ['', [Validators.required, Validators.minLength(10)]]})

  // Honeypot candidate field names. The backend backend api
  // HONEYPOT_FIELDS) treats ANY of these being non-empty as a bot. The backend
  // never fetches this list, so a bot can't learn the full set in one request.
  // MUST stay in sync with that backend constant.
  private honeypotCandidates = ['website', 'url', 'homepage', 'company', 'phone_alt', 'fax']
  // One candidate is rendered at random per mount so the trap field name isn't
  // predictable across visits.
  honeypotField = this.honeypotCandidates[Math.floor(Math.random() * this.honeypotCandidates.length)]
  // Epoch ms stamped at construction (~component mount); sent as _ts. Backend
  // rejects submissions faster than MIN_FORM_SECONDS (fail-open if absent).
  private formLoadedAt = Date.now()

  constructor() {
    // Register the honeypot under its random name so its value flows into the
    // POST payload under that key. Real users never touch it -> empty -> OK.
    this.contactForm.addControl(this.honeypotField, this.fb.control(''))
  }

  onSubmit() {
    if (this.contactForm.invalid) return
    this.submissionState = 'submitting'
    const formData = this.contactForm.value, msg = `
Name: ${formData.name}
Email: ${formData.from_email_id}
------------------------------------------------------------------------
${formData.message}
------------------------------------------------------------------------
(Sent via RoPON Contact Us form)
`
    this.http.post(
      environment.emailAPIUrl + '/email/contact-us/',
      {...formData, message: msg, _ts: this.formLoadedAt}).subscribe({
	next: () => {
	  this.submissionState = 'success'
	  this.contactForm.reset() },
	error: err => {
	  this.submissionState = 'error'
	  this.errorMessage = err.error?.message ||
	    'An unknown error occurred' }}) }

  get name() { return this.contactForm.get('name') }
  get email() { return this.contactForm.get('from_email_id') }
  get message() { return this.contactForm.get('message') }
}
