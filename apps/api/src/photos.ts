import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Store } from './store';
export interface PhotoStorage {
  save(buffer: Buffer, extension: string): Promise<string>;
}
// Replace this provider with S3/R2 without changing controllers or product rules.
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
@Injectable()
export class PhotosService {
  constructor(
    @Inject(LocalPhotoStorage) private storage: PhotoStorage,
    @Inject(Store) private store: Store,
  ) {}
  async upload(ownerId: string, file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Selecione uma foto.');
    const b = file.buffer;
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
    if (!ext) throw new BadRequestException('Use uma foto JPG, PNG ou WebP de até 5 MB.');
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
