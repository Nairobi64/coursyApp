import { TestBed } from '@angular/core/testing';

import { StatutDirectService } from './statut-direct.service';

describe('StatutDirectService', () => {
  let service: StatutDirectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StatutDirectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
