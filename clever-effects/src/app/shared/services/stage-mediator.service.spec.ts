import { TestBed } from '@angular/core/testing';

import { StageMediatorService } from './stage-mediator.service';

describe('StageMediatorService', () => {
  let service: StageMediatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StageMediatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
