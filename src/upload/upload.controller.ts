import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

// Ensure uploads directory exists
const uploadsDir = join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const multerStorage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const randomHex = crypto.randomBytes(8).toString('hex');
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${randomHex}${ext}`);
  },
});

export const imageFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  const ext = extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  // 1. Explicitly reject SVG to prevent Stored Cross-Site Scripting (XSS)
  if (ext === '.svg' || mime.includes('svg')) {
    return cb(
      new BadRequestException(
        'SVG file uploads are rejected for security reasons (XSS vector prevention). Please upload JPG, PNG, or WebP images.',
      ),
      false,
    );
  }

  // 2. Strict whitelist of safe raster image extensions and MIME types
  if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(mime)) {
    return cb(
      new BadRequestException(
        'Invalid file type. Only secure JPG, PNG, and WebP images are permitted.',
      ),
      false,
    );
  }

  cb(null, true);
};

@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UploadController {
  @Post()
  @ResponseMessage('Image uploaded successfully')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multerStorage,
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB maximum limit per image
      },
    }),
  )
  uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Please provide a file to upload');
    }

    const host = req.get('host') || 'localhost:6001';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const protocol = isLocal ? (req.protocol || 'http') : 'https';
    const finalHost = isLocal ? host : 'api.saisaa.com';
    const url = `${protocol}://${finalHost}/uploads/${file.filename}`;

    return {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: `/uploads/${file.filename}`,
      url,
    };
  }

  @Post('multiple')
  @ResponseMessage('Images uploaded successfully')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: multerStorage,
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 10,
      },
    }),
  )
  uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Please provide files to upload');
    }

    const host = req.get('host') || 'localhost:6001';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const protocol = isLocal ? (req.protocol || 'http') : 'https';
    const finalHost = isLocal ? host : 'api.saisaa.com';

    return files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: `/uploads/${file.filename}`,
      url: `${protocol}://${finalHost}/uploads/${file.filename}`,
    }));
  }
}

