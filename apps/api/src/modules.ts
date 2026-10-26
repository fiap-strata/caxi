import { Module } from '@nestjs/common';
import { Store } from './store';
import { AuthService } from './auth';
import { LocalPhotoStorage, PhotosService } from './photos';
import { StallsService, ProductsService } from './products';
@Module({ providers: [Store], exports: [Store] })
export class PersistenceModule {}
@Module({ imports: [PersistenceModule], providers: [AuthService], exports: [AuthService] })
export class AccessModule {}
@Module({
  imports: [PersistenceModule],
  providers: [LocalPhotoStorage, PhotosService],
  exports: [PhotosService],
})
export class PhotosModule {}
@Module({
  imports: [PersistenceModule, PhotosModule],
  providers: [StallsService, ProductsService],
  exports: [StallsService, ProductsService],
})
export class CatalogModule {}
