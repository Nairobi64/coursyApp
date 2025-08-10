import { TestBed } from '@angular/core/testing';

import { LivraisonServiceService } from './livraison-service.service';

describe('LivraisonServiceService', () => {
  let service: LivraisonServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LivraisonServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
