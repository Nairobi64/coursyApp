import { TestBed } from '@angular/core/testing';

import { ConnexionServiceService } from './connexion-service.service';

describe('ConnexionServiceService', () => {
  let service: ConnexionServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConnexionServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
