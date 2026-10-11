import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

// Ensure uploads directory exists
const uploadsDir = join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const multerStorage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

export const imageFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif|svg\+xml)$/)) {
    return cb(
      new BadRequestException(
        'Only image files (jpg, jpeg, png, webp, gif, svg) are allowed!',
      ),
      false,
    );
  }
  cb(null, true);
};

@Controller('upload')
export class UploadController {
  @Post()
  @ResponseMessage('Image uploaded successfully')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multerStorage,
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB maximum limit
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
    const protocol = req.protocol || 'http';
    const url = `${protocol}://${host}/uploads/${file.filename}`;

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
    FilesInterceptor('files', 15, {
      storage: multerStorage,
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
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
    const protocol = req.protocol || 'http';

    return files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: `/uploads/${file.filename}`,
      url: `${protocol}://${host}/uploads/${file.filename}`,
    }));
  }
}

