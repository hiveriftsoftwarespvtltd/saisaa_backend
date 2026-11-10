import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import {
  EditorialBanner,
  EditorialBannerSchema,
  OurStory,
  OurStorySchema,
} from './schemas/content.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EditorialBanner.name, schema: EditorialBannerSchema },
      { name: OurStory.name, schema: OurStorySchema },
    ]),
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}

