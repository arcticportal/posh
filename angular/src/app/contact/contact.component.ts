import { NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, HostBinding, HostListener, inject } from '@angular/core';
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

   // Honeypot candidate field names. The backend (ropon_email/serializers.py
  // HONEYPOT_FIELDS) flags a submission as bot only when one of these is
  // non-empty AND the form was submitted implausibly fast. The names are
  // deliberately OUTSIDE browser autofill vocabulary (no 'website', 'company',
  // 'phone', ...) so auto form fill never populates the trap for real users.
  // The backend never fetches this list, so a bot can't learn the full set in
  // one request. MUST stay in sync with that backend constant.
  private honeypotCandidates = ['fax_number', 'web_address2', 'contact_ref', 'alt_phone2', 'org_ref', 'site_link2']
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

// Browser autofill sets the :-webkit-autofill pseudo-class, which the CSS in
  // this component hooks with a no-op keyframes animation; that fires an
  // animationstart event here. A filled-then-autofilled honeypot is cleared so
  // a genuine user is never mistaken for a bot. Bots fill fields via scripts
  // and never trigger browser autofill, so clearing is safe.
  @HostListener('animationstart', ['$event'])
  onAutoFillStart(event: AnimationEvent) {
    if (event.animationName !== 'onAutoFillStart') return
    const target = event.target as HTMLElement
    if (target.id !== this.honeypotField) return
    this.contactForm.get(this.honeypotField)?.setValue('')
  }


  onSubmit() {
    if (this.contactForm.invalid) return
    this.submissionState = 'submitting'
    const formData = {...this.contactForm.value}, msg = `
Name: ${formData.name}
Email: ${formData.from_email_id}
------------------------------------------------------------------------
${formData.message}
------------------------------------------------------------------------
(Sent via POSH Contact Us form)
`
    // Defense in depth: if the honeypot input still carries a browser-autofill
    // signature at submit time (pseudo-class matches only while the autofilled
    // value is unedited), drop the trap key from the payload. Bots are not
    // browsers, so their script-filled honeypot never matches and still posts.
    const honeypotEl = document.getElementById(this.honeypotField)
    if (honeypotEl && this.hasAutofillSignature(honeypotEl)) {
      delete formData[this.honeypotField]
    }
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

      // True when the element carries a browser-autofill signature. Each vendor
  // pseudo-class is probed separately because a selector LIST containing an
  // unsupported pseudo-class (e.g. :-moz-autofill in Chrome) makes matches()
  // throw a SyntaxError for the whole list; an unsupported individual probe
  // is caught and skipped instead.
  private hasAutofillSignature(el: Element): boolean {
    for (const selector of [':autofill', ':-webkit-autofill', ':-moz-autofill']) {
      try {
        if (el.matches(selector)) return true
      } catch {
        // Pseudo-class unsupported in this browser; try the next one.
      }
    }
    return false
  }



  get name() { return this.contactForm.get('name') }
  get email() { return this.contactForm.get('from_email_id') }
  get message() { return this.contactForm.get('message') }
}
