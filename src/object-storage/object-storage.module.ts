import { Module } from '@nestjs/common';
import { ObjectStorageService } from './object-storage.service';

@Module({
  providers: [ObjectStorageService],
})
export class ObjectStorageModule {}
