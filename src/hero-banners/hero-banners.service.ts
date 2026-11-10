import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import {
  HeroBanner,
  HeroBannerDocument,
  HeroMarquee,
  HeroMarqueeDocument,
} from './schemas/hero-banner.schema';
import { CreateHeroBannerDto } from './dto/create-hero-banner.dto';
import { UpdateHeroBannerDto } from './dto/update-hero-banner.dto';
import {
  CreateHeroMarqueeDto,
  UpdateHeroMarqueeDto,
} from './dto/hero-marquee.dto';

const SLIDE_CMS_TYPE = 'hero_slide';
const MARQUEE_CMS_TYPE = 'hero_marquee';

const makeSystemKey = (prefix: string, id: Types.ObjectId) =>
  `cms-${prefix}-${id.toString()}@system.saisaa.local`;

@Injectable()
export class HeroBannersService implements OnModuleInit {
  private readonly logger = new Logger(HeroBannersService.name);

  constructor(
    @InjectModel(HeroBanner.name)
    private readonly heroBannerModel: Model<HeroBannerDocument>,
    @InjectModel(HeroMarquee.name)
    private readonly heroMarqueeModel: Model<HeroMarqueeDocument>,
  ) {}

  async onModuleInit() {
    try {
      await this.seedDefaults();
    } catch (err: any) {
      this.logger.warn(`Failed to seed default hero content: ${err.message}`);
    }
  }

  async seedDefaults() {
    const slideCount = await this.heroBannerModel.countDocuments({
      cmsType: SLIDE_CMS_TYPE,
    });
    if (slideCount === 0) {
      const defaultSlides = [
        {
          image: '/images/hero/hero-slide-1.jpg',
          mobileImage: '',
          eyebrow: '',
          title: 'Welcome to Saisaa',
          subtitle: 'Timeless Heritage Couture',
          ctaText: '',
          ctaLink: '/shop',
          titleStyle: 'script',
          layoutPreset: 'bottom',
          overlayScrim: 'bottom',
          objectPosition: 'center 35%',
          displayOrder: 1,
          status: 'Active',
        },
        {
          image: '/images/hero/hero-slide-2.jpg',
          mobileImage: '',
          eyebrow: 'SAISAA ATELIER',
          title: 'Luxury Ethnic Couture',
          subtitle: '',
          ctaText: 'Explore Collection',
          ctaLink: '/shop',
          titleStyle: 'serif',
          layoutPreset: 'center',
          overlayScrim: 'dark',
          objectPosition: 'center',
          displayOrder: 2,
          status: 'Active',
        },
        {
          image: '/images/hero/hero-slide-3.jpg',
          mobileImage: '',
          eyebrow: '',
          title: 'Shop Traditional Maheshwari Sets',
          subtitle: '',
          ctaText: 'Click to Shop',
          ctaLink: '/unstitched-suits',
          titleStyle: 'serif',
          layoutPreset: 'bottom',
          overlayScrim: 'bottom',
          objectPosition: 'center',
          displayOrder: 3,
          status: 'Active',
        },
        {
          image: '/images/hero/hero-slide-4.jpg',
          mobileImage: '',
          eyebrow: 'COUTURE SUIT SETS',
          title: '',
          subtitle: '',
          ctaText: 'Shop here',
          ctaLink: '/stitched-suits',
          titleStyle: 'serif',
          layoutPreset: 'split-badge',
          overlayScrim: 'none',
          objectPosition: 'center 25%',
          displayOrder: 4,
          status: 'Active',
        },
        {
          image: '/images/hero/hero-slide-5.jpg',
          mobileImage: '',
          eyebrow: '',
          title: 'SHOP AESTHETICS',
          subtitle: 'Handwoven Banarasi & Royal Zari Weaves',
          ctaText: 'Shop collection',
          ctaLink: '/sarees',
          titleStyle: 'serif',
          layoutPreset: 'center',
          overlayScrim: 'light',
          objectPosition: 'center',
          displayOrder: 5,
          status: 'Active',
        },
      ].map((slide) => {
        const docId = new Types.ObjectId();
        return {
          _id: docId,
          cmsType: SLIDE_CMS_TYPE,
          userEmail: makeSystemKey('slide', docId),
          ...slide,
        };
      });

      await this.heroBannerModel.insertMany(defaultSlides);
    }

    const marqueeCount = await this.heroMarqueeModel.countDocuments({
      cmsType: MARQUEE_CMS_TYPE,
    });
    if (marqueeCount === 0) {
      const defaultMarquee = [
        {
          text: 'Complimentary Shipping Pan-India',
          displayOrder: 1,
          status: 'Active',
        },
        {
          text: 'Handcrafted Indian Ethnic Couture',
          displayOrder: 2,
          status: 'Active',
        },
        {
          text: 'New Artisanal Updates Every Week',
          displayOrder: 3,
          status: 'Active',
        },
        {
          text: 'Pure Silk, Chanderi & Maheshwari Weaves',
          displayOrder: 4,
          status: 'Active',
        },
      ].map((item) => {
        const docId = new Types.ObjectId();
        return {
          _id: docId,
          cmsType: MARQUEE_CMS_TYPE,
          userEmail: makeSystemKey('marquee', docId),
          ...item,
        };
      });

      await this.heroMarqueeModel.insertMany(defaultMarquee);
    }
  }

  // ==================== HERO SLIDES ====================

  async findAll(status?: string): Promise<HeroBanner[]> {
    const filter: Record<string, any> = { cmsType: SLIDE_CMS_TYPE };
    if (status) filter.status = status;
    return this.heroBannerModel
      .find(filter)
      .sort({ displayOrder: 1, createdAt: 1 })
      .exec();
  }

  async findOne(id: string): Promise<HeroBanner> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Hero slide "${id}" not found`);
    }
    const slide = await this.heroBannerModel
      .findOne({ _id: id, cmsType: SLIDE_CMS_TYPE })
      .exec();
    if (!slide) {
      throw new NotFoundException(`Hero slide "${id}" not found`);
    }
    return slide;
  }

  async create(dto: CreateHeroBannerDto): Promise<HeroBanner> {
    let displayOrder = dto.displayOrder;
    if (displayOrder === undefined || displayOrder === null) {
      const last = await this.heroBannerModel
        .findOne({ cmsType: SLIDE_CMS_TYPE })
        .sort({ displayOrder: -1 })
        .exec();
      displayOrder = last ? (last.displayOrder || 0) + 1 : 1;
    }

    const docId = new Types.ObjectId();
    const created = new this.heroBannerModel({
      ...dto,
      _id: docId,
      cmsType: SLIDE_CMS_TYPE,
      userEmail: makeSystemKey('slide', docId),
      displayOrder,
      status: dto.status || 'Active',
    });
    return created.save();
  }

  async update(id: string, dto: UpdateHeroBannerDto): Promise<HeroBanner> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Hero slide not found');
    }
    const updated = await this.heroBannerModel
      .findOneAndUpdate(
        { _id: id, cmsType: SLIDE_CMS_TYPE },
        dto,
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Hero slide not found');
    }
    return updated;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Hero slide not found');
    }
    const deleted = await this.heroBannerModel
      .findOneAndDelete({ _id: id, cmsType: SLIDE_CMS_TYPE })
      .exec();
    if (!deleted) {
      throw new NotFoundException('Hero slide not found');
    }
    return { success: true };
  }

  async reorder(orderedIds: string[]): Promise<HeroBanner[]> {
    const validOps = orderedIds
      .filter((id) => isValidObjectId(id))
      .map((id, idx) => ({
        updateOne: {
          filter: { _id: id, cmsType: SLIDE_CMS_TYPE },
          update: { $set: { displayOrder: idx + 1 } },
        },
      }));

    if (validOps.length > 0) {
      await this.heroBannerModel.bulkWrite(validOps);
    }

    return this.findAll();
  }

  // ==================== HERO MARQUEE HIGHLIGHTS ====================

  async findAllMarquee(status?: string): Promise<HeroMarquee[]> {
    const filter: Record<string, any> = { cmsType: MARQUEE_CMS_TYPE };
    if (status) filter.status = status;
    return this.heroMarqueeModel
      .find(filter)
      .sort({ displayOrder: 1, createdAt: 1 })
      .exec();
  }

  async createMarquee(dto: CreateHeroMarqueeDto): Promise<HeroMarquee> {
    let displayOrder = dto.displayOrder;
    if (displayOrder === undefined || displayOrder === null) {
      const last = await this.heroMarqueeModel
        .findOne({ cmsType: MARQUEE_CMS_TYPE })
        .sort({ displayOrder: -1 })
        .exec();
      displayOrder = last ? (last.displayOrder || 0) + 1 : 1;
    }

    const docId = new Types.ObjectId();
    const created = new this.heroMarqueeModel({
      ...dto,
      _id: docId,
      cmsType: MARQUEE_CMS_TYPE,
      userEmail: makeSystemKey('marquee', docId),
      displayOrder,
      status: dto.status || 'Active',
    });
    return created.save();
  }

  async updateMarquee(
    id: string,
    dto: UpdateHeroMarqueeDto,
  ): Promise<HeroMarquee> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Marquee highlight not found');
    }
    const updated = await this.heroMarqueeModel
      .findOneAndUpdate(
        { _id: id, cmsType: MARQUEE_CMS_TYPE },
        dto,
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Marquee highlight not found');
    }
    return updated;
  }

  async removeMarquee(id: string): Promise<{ success: boolean }> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Marquee highlight not found');
    }
    const deleted = await this.heroMarqueeModel
      .findOneAndDelete({ _id: id, cmsType: MARQUEE_CMS_TYPE })
      .exec();
    if (!deleted) {
      throw new NotFoundException('Marquee highlight not found');
    }
    return { success: true };
  }
}
