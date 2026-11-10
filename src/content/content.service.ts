import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import {
  EditorialBanner,
  EditorialBannerDocument,
  OurStory,
  OurStoryDocument,
} from './schemas/content.schema';
import {
  CreateEditorialBannerDto,
  UpdateEditorialBannerDto,
} from './dto/editorial-banner.dto';
import { CreateOurStoryDto, UpdateOurStoryDto } from './dto/our-story.dto';

const EDITORIAL_CMS_TYPE = 'editorial_banner';
const OUR_STORY_CMS_TYPE = 'our_story';

const makeSystemKey = (prefix: string, id: Types.ObjectId | string) =>
  `cms-${prefix}-${id.toString()}@system.saisaa.local`;

@Injectable()
export class ContentService implements OnModuleInit {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    @InjectModel(EditorialBanner.name)
    private readonly editorialBannerModel: Model<EditorialBannerDocument>,
    @InjectModel(OurStory.name)
    private readonly ourStoryModel: Model<OurStoryDocument>,
  ) {}

  async onModuleInit() {
    try {
      await this.seedDefaults();
    } catch (err: any) {
      this.logger.warn(`Failed to seed default storefront content: ${err.message}`);
    }
  }

  async seedDefaults() {
    const editorialCount = await this.editorialBannerModel.countDocuments({
      cmsType: EDITORIAL_CMS_TYPE,
    });
    if (editorialCount === 0) {
      const defaults = [
        {
          image: '/images/saree-arch.jpg',
          eyebrow: 'HERITAGE DRAPES',
          title: 'Tradition Lives On',
          description:
            'Graceful drapes for unforgettable moments. Our sarees celebrate timeless beauty, zari craftsmanship, and modern womanhood.',
          ctaText: 'Explore Sarees',
          ctaLink: '/sarees',
          theme: 'ivory',
          imagePosition: 'left',
          objectPosition: 'center top',
          displayOrder: 1,
          status: 'Active',
        },
        {
          image: '/images/pink-kurti.jpg',
          eyebrow: 'DAILY COUTURE',
          title: 'Everyday Elegance',
          description:
            'Tailored kurtis & stitched suits crafted for effortless grace, breathable comfort, and refined everyday celebrations.',
          ctaText: 'Explore Stitched Suits',
          ctaLink: '/stitched-suits',
          theme: 'emerald',
          imagePosition: 'right',
          objectPosition: 'center top',
          displayOrder: 2,
          status: 'Active',
        },
      ].map((banner) => {
        const docId = new Types.ObjectId();
        return {
          _id: docId,
          cmsType: EDITORIAL_CMS_TYPE,
          userEmail: makeSystemKey('editorial', docId),
          ...banner,
        };
      });

      await this.editorialBannerModel.insertMany(defaults);
    }

    const storyCount = await this.ourStoryModel.countDocuments({
      cmsType: OUR_STORY_CMS_TYPE,
    });
    if (storyCount === 0) {
      const docId = new Types.ObjectId();
      await this.ourStoryModel.create({
        _id: docId,
        cmsType: OUR_STORY_CMS_TYPE,
        userEmail: makeSystemKey('story', docId),
        eyebrow: 'OUR STORY',
        title: 'More Than Fashion',
        scriptText: 'Traditional • Beautiful • You',
        description:
          "At Saisaa, we celebrate the timeless beauty of Indian heritage with contemporary designs for today's woman. Our collections are crafted to bring elegance, tradition, and lasting confidence into your everyday moments.",
        ctaText: 'Our Story',
        ctaLink: '/about',
        image: '/images/maroon-story.jpg',
        objectPosition: 'center top',
        pillars: ['Style', 'Tradition', 'Confidence'],
        badgeLabel: 'SAISAA HERITAGE',
        displayOrder: 1,
        status: 'Active',
      });
    }
  }

  // ==================== EDITORIAL BANNERS ====================

  async findAllEditorialBanners(status?: string): Promise<EditorialBanner[]> {
    const filter: Record<string, any> = { cmsType: EDITORIAL_CMS_TYPE };
    if (status) filter.status = status;
    return this.editorialBannerModel
      .find(filter)
      .sort({ displayOrder: 1, createdAt: 1 })
      .exec();
  }

  async findOneEditorialBanner(id: string): Promise<EditorialBanner> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Editorial banner "${id}" not found`);
    }
    const item = await this.editorialBannerModel
      .findOne({ _id: id, cmsType: EDITORIAL_CMS_TYPE })
      .exec();
    if (!item) {
      throw new NotFoundException(`Editorial banner "${id}" not found`);
    }
    return item;
  }

  async createEditorialBanner(
    dto: CreateEditorialBannerDto,
  ): Promise<EditorialBanner> {
    let displayOrder = dto.displayOrder;
    if (displayOrder === undefined || displayOrder === null) {
      const last = await this.editorialBannerModel
        .findOne({ cmsType: EDITORIAL_CMS_TYPE })
        .sort({ displayOrder: -1 })
        .exec();
      displayOrder = last ? (last.displayOrder || 0) + 1 : 1;
    }

    const docId = new Types.ObjectId();
    const created = new this.editorialBannerModel({
      ...dto,
      _id: docId,
      cmsType: EDITORIAL_CMS_TYPE,
      userEmail: makeSystemKey('editorial', docId),
      displayOrder,
      theme: dto.theme || 'ivory',
      imagePosition: dto.imagePosition || 'left',
      objectPosition: dto.objectPosition || 'center top',
      status: dto.status || 'Active',
    });
    return created.save();
  }

  async updateEditorialBanner(
    id: string,
    dto: UpdateEditorialBannerDto,
  ): Promise<EditorialBanner> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Editorial banner not found');
    }
    const updated = await this.editorialBannerModel
      .findOneAndUpdate(
        { _id: id, cmsType: EDITORIAL_CMS_TYPE },
        dto,
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Editorial banner not found');
    }
    return updated;
  }

  async removeEditorialBanner(id: string): Promise<{ success: boolean }> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Editorial banner not found');
    }
    const deleted = await this.editorialBannerModel
      .findOneAndDelete({ _id: id, cmsType: EDITORIAL_CMS_TYPE })
      .exec();
    if (!deleted) {
      throw new NotFoundException('Editorial banner not found');
    }
    return { success: true };
  }

  async reorderEditorialBanners(
    orderedIds: string[],
  ): Promise<EditorialBanner[]> {
    const validOps = orderedIds
      .filter((id) => isValidObjectId(id))
      .map((id, idx) => ({
        updateOne: {
          filter: { _id: id, cmsType: EDITORIAL_CMS_TYPE },
          update: { $set: { displayOrder: idx + 1 } },
        },
      }));

    if (validOps.length > 0) {
      await this.editorialBannerModel.bulkWrite(validOps);
    }

    return this.findAllEditorialBanners();
  }

  // ==================== OUR STORY SECTION ====================

  async findAllOurStories(status?: string): Promise<OurStory[]> {
    const filter: Record<string, any> = { cmsType: OUR_STORY_CMS_TYPE };
    if (status) filter.status = status;
    return this.ourStoryModel
      .find(filter)
      .sort({ displayOrder: 1, createdAt: 1 })
      .exec();
  }

  async findOneOurStory(id: string): Promise<OurStory> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Our Story section "${id}" not found`);
    }
    const item = await this.ourStoryModel
      .findOne({ _id: id, cmsType: OUR_STORY_CMS_TYPE })
      .exec();
    if (!item) {
      throw new NotFoundException(`Our Story section "${id}" not found`);
    }
    return item;
  }

  async createOurStory(dto: CreateOurStoryDto): Promise<OurStory> {
    let displayOrder = dto.displayOrder;
    if (displayOrder === undefined || displayOrder === null) {
      const last = await this.ourStoryModel
        .findOne({ cmsType: OUR_STORY_CMS_TYPE })
        .sort({ displayOrder: -1 })
        .exec();
      displayOrder = last ? (last.displayOrder || 0) + 1 : 1;
    }

    const docId = new Types.ObjectId();
    const created = new this.ourStoryModel({
      ...dto,
      _id: docId,
      cmsType: OUR_STORY_CMS_TYPE,
      userEmail: makeSystemKey('story', docId),
      eyebrow: dto.eyebrow ?? 'OUR STORY',
      scriptText: dto.scriptText ?? 'Traditional • Beautiful • You',
      pillars:
        Array.isArray(dto.pillars) && dto.pillars.length > 0
          ? dto.pillars
          : ['Style', 'Tradition', 'Confidence'],
      badgeLabel: dto.badgeLabel ?? 'SAISAA HERITAGE',
      objectPosition: dto.objectPosition || 'center top',
      displayOrder,
      status: dto.status || 'Active',
    });
    return created.save();
  }

  async updateOurStory(id: string, dto: UpdateOurStoryDto): Promise<OurStory> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Our Story section not found');
    }
    const updated = await this.ourStoryModel
      .findOneAndUpdate(
        { _id: id, cmsType: OUR_STORY_CMS_TYPE },
        dto,
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Our Story section not found');
    }
    return updated;
  }

  async removeOurStory(id: string): Promise<{ success: boolean }> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Our Story section not found');
    }
    const deleted = await this.ourStoryModel
      .findOneAndDelete({ _id: id, cmsType: OUR_STORY_CMS_TYPE })
      .exec();
    if (!deleted) {
      throw new NotFoundException('Our Story section not found');
    }
    return { success: true };
  }

  async reorderOurStories(orderedIds: string[]): Promise<OurStory[]> {
    const validOps = orderedIds
      .filter((id) => isValidObjectId(id))
      .map((id, idx) => ({
        updateOne: {
          filter: { _id: id, cmsType: OUR_STORY_CMS_TYPE },
          update: { $set: { displayOrder: idx + 1 } },
        },
      }));

    if (validOps.length > 0) {
      await this.ourStoryModel.bulkWrite(validOps);
    }

    return this.findAllOurStories();
  }
}

