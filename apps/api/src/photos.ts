import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Store } from './store';
import { put } from '@vercel/blob';
export const PHOTO_STORAGE = Symbol('PHOTO_STORAGE');
// Leave room for multipart headers below Vercel Functions' 4.5 MB request limit.
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
export interface PhotoStorage {
  save(buffer: Buffer, extension: string): Promise<string>;
}
@Injectable()
export class LocalPhotoStorage implements PhotoStorage {
  async save(buffer: Buffer, extension: string) {
    const name = randomUUID() + '.' + extension,
      dir = resolve(process.cwd(), 'uploads');
    await mkdir(dir, { recursive: true });
    await writeFile(resolve(dir, name), buffer);
    return '/uploads/' + name;
  }
}
export class BlobPhotoStorage implements PhotoStorage {
  async save(buffer: Buffer, extension: string) {
    const blob = await put('products/' + randomUUID() + '.' + extension, buffer, {
      access: 'public',
      contentType: extension === 'jpg' ? 'image/jpeg' : 'image/' + extension,
      addRandomSuffix: false,
    });
    return blob.url;
  }
}
export function createPhotoStorage(): PhotoStorage {
  const vercelProduction = process.env.VERCEL === '1' && process.env.NODE_ENV === 'production';
  const driver = process.env.PHOTO_STORAGE || (vercelProduction ? 'blob' : 'local');
  if (driver === 'blob') {
    if (!process.env.BLOB_READ_WRITE_TOKEN)
      throw new Error('Configure BLOB_READ_WRITE_TOKEN para armazenar fotos no Vercel Blob.');
    return new BlobPhotoStorage();
  }
  if (driver !== 'local') throw new Error('PHOTO_STORAGE deve ser local ou blob.');
  if (vercelProduction) throw new Error('Vercel requer armazenamento persistente de fotos.');
  return new LocalPhotoStorage();
}
@Injectable()
export class PhotosService {
  constructor(
    @Inject(PHOTO_STORAGE) private storage: PhotoStorage,
    @Inject(Store) private store: Store,
  ) {}
  async upload(ownerId: string, file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Selecione uma foto.');
    const b = file.buffer;
    if (b.length > MAX_PHOTO_BYTES) throw new BadRequestException('Use uma foto de até 4 MB.');
    let ext: string | undefined;
    if (b.length > 3 && b[0] === 255 && b[1] === 216 && b[2] === 255) ext = 'jpg';
    if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
      ext = 'png';
    if (
      b.length > 12 &&
      b.toString('ascii', 0, 4) === 'RIFF' &&
      b.toString('ascii', 8, 12) === 'WEBP'
    )
      ext = 'webp';
    if (!ext) throw new BadRequestException('Use uma foto JPG, PNG ou WebP de até 4 MB.');
    const url = await this.storage.save(b, ext);
    await this.store.put('photo', 'photo:' + url, { ownerId, url });
    return { url };
  }
  async assertOwned(ownerId: string, url: string) {
    const photo = await this.store.get<{ ownerId: string }>('photo:' + url);
    if (photo?.ownerId !== ownerId)
      throw new BadRequestException('Envie uma foto do produto pela sua conta.');
  }
}
