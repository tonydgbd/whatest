import { Test, TestingModule } from '@nestjs/testing';
import { DirectusServiceService } from './directus-service.service';

describe('DirectusServiceService', () => {
  let service: DirectusServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DirectusServiceService],
    }).compile();

    service = module.get<DirectusServiceService>(DirectusServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
