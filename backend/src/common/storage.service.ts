import { Injectable, BadRequestException } from '@nestjs/common';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';

@Injectable()
export class StorageService {
  private readonly uploadRootDir = join(process.cwd(), 'uploads');

  async saveFile(file: any, folder: string, allowedExtensions: string[], maxSizeBytes: number): Promise<string> {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni.');
    }

    // Validate file size
    if (file.size > maxSizeBytes) {
      const maxSizeMb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
      throw new BadRequestException(`Le fichier dépasse la taille maximale autorisée de ${maxSizeMb} Mo.`);
    }

    // Validate file extension
    const ext = extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        `Extension de fichier invalide. Les extensions autorisées sont : ${allowedExtensions.join(', ')}`
      );
    }

    // Ensure upload directory exists
    const targetDir = join(this.uploadRootDir, folder);
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const uniqueString = Math.random().toString(36).substring(2, 15);
    const filename = `${timestamp}_${uniqueString}${ext}`;
    const fullPath = join(targetDir, filename);

    // Save file locally
    writeFileSync(fullPath, file.buffer);

    // Return the relative URL path
    return `/uploads/${folder}/${filename}`;
  }
}
