import { TestBed } from '@angular/core/testing';

import { ColisServiceService } from './colis-service.service';

describe('ColisServiceService', () => {
  let service: ColisServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ColisServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
