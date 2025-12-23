import { TestBed } from '@angular/core/testing';

import { JsonSeqService } from './json-seq.service';

describe('JsonSeqService', () => {
  let service: JsonSeqService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JsonSeqService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
