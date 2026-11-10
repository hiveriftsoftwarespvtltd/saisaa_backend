import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HeroBannersController } from './hero-banners.controller';
import { HeroBannersService } from './hero-banners.service';
import {
  HeroBanner,
  HeroBannerSchema,
  HeroMarquee,
  HeroMarqueeSchema,
} from './schemas/hero-banner.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HeroBanner.name, schema: HeroBannerSchema },
      { name: HeroMarquee.name, schema: HeroMarqueeSchema },
    ]),
  ],
  controllers: [HeroBannersController],
  providers: [HeroBannersService],
  exports: [HeroBannersService],
})
export class HeroBannersModule {}

