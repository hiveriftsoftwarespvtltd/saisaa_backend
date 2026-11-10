import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HeroBannersController } from './hero-banners.controller';
import { HeroBannersService } from './hero-banners.service';
import {
  HeroBanner,
  HeroBannerSchema,
  HeroMarquee,
  HeroMarqueeSchema,
  PageHero,
  PageHeroSchema,
} from './schemas/hero-banner.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HeroBanner.name, schema: HeroBannerSchema },
      { name: HeroMarquee.name, schema: HeroMarqueeSchema },
      { name: PageHero.name, schema: PageHeroSchema },
    ]),
  ],
  controllers: [HeroBannersController],
  providers: [HeroBannersService],
  exports: [HeroBannersService],
})
export class HeroBannersModule {}
