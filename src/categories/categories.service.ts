import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultCategories();
  }

  async seedDefaultCategories() {
    const count = await this.categoryModel.countDocuments();
    if (count === 0) {
      const defaults = [
        {
          name: 'Stitched Suits',
          slug: 'stitched-suits',
          description:
            'Artisanal stitched suit sets, kurtis, coordinate sets and ceremonial attire.',
          image: '/images/02_category_suits.jpg',
          status: 'Active',
          productsCount: 42,
          subCategories: [
            '3 pcs set',
            '2 pcs set',
            'long kurtis',
            'Short kurtis',
          ],
        },
        {
          name: 'Unstitched Suits',
          slug: 'unstitched-suits',
          description:
            'Handcrafted unstitched fabrics in pure georgette, chanderi, and cotton weaves.',
          image: '/images/03_category_kurtis.jpg',
          status: 'Active',
          productsCount: 68,
          subCategories: [
            'Jamdani',
            'Banarasi silk',
            'Kanjivaram silk',
            'Pure cotton',
            'Muslin silk',
            'Linen fabric',
          ],
        },
        {
          name: 'Sarees',
          slug: 'sarees',
          description:
            'Six yards of mulberry silk, antique zari banarasi, and organza tissue heirloom drapes.',
          image: '/images/04_category_sarees.jpg',
          status: 'Active',
          productsCount: 46,
          subCategories: [
            'Cotton sarees',
            'Chiffon sarees',
            'Silk sarees',
            'Kota sarees',
          ],
        },
      ];
      await this.categoryModel.insertMany(defaults);
    }
  }

  async findAll(status?: string): Promise<Category[]> {
    const filter = status ? { status } : {};
    return this.categoryModel.find(filter).sort({ createdAt: 1 }).exec();
  }

  async findOne(idOrSlug: string): Promise<Category> {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const category = isObjectId
      ? await this.categoryModel.findById(idOrSlug).exec()
      : await this.categoryModel
          .findOne({ slug: idOrSlug.toLowerCase() })
          .exec();

    if (!category) {
      throw new NotFoundException(`Category "${idOrSlug}" not found`);
    }
    return category;
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const slug =
      createCategoryDto.slug?.trim().toLowerCase() ||
      createCategoryDto.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const existing = await this.categoryModel.findOne({ slug }).exec();
    if (existing) {
      throw new ConflictException(
        `Category with slug "${slug}" already exists`,
      );
    }

    const created = new this.categoryModel({
      ...createCategoryDto,
      slug,
      subCategories: createCategoryDto.subCategories || [],
    });
    return created.save();
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    if (updateCategoryDto.slug) {
      updateCategoryDto.slug = updateCategoryDto.slug.trim().toLowerCase();
      const existing = await this.categoryModel
        .findOne({
          slug: updateCategoryDto.slug,
          _id: { $ne: id },
        })
        .exec();
      if (existing) {
        throw new ConflictException(
          `Category with slug "${updateCategoryDto.slug}" already exists`,
        );
      }
    }

    const updated = await this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Category not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const deleted = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Category not found`);
    }
    return { success: true };
  }

  async addSubCategory(
    idOrSlug: string,
    subCategoryData:
      | string
      | { name: string; image?: string; status?: string; description?: string },
  ): Promise<Category> {
    const category = (await this.findOne(idOrSlug)) as CategoryDocument;
    const name =
      typeof subCategoryData === 'string'
        ? subCategoryData.trim()
        : subCategoryData.name.trim();

    const itemToStore =
      typeof subCategoryData === 'string'
        ? { name, image: '', status: 'Active' }
        : {
            name,
            image: subCategoryData.image || '',
            status: subCategoryData.status || 'Active',
            description: subCategoryData.description || '',
          };

    const existingIndex = category.subCategories.findIndex((s) => {
      const sName = typeof s === 'string' ? s : s?.name;
      return sName?.toLowerCase() === name.toLowerCase();
    });

    if (existingIndex > -1) {
      category.subCategories[existingIndex] = itemToStore;
    } else {
      category.subCategories.push(itemToStore);
    }

    category.markModified('subCategories');
    await category.save();
    return category;
  }

  async removeSubCategory(
    idOrSlug: string,
    subCategoryName: string,
  ): Promise<Category> {
    const trimmed = subCategoryName.trim().toLowerCase();
    const category = (await this.findOne(idOrSlug)) as CategoryDocument;

    category.subCategories = category.subCategories.filter((s) => {
      const sName = typeof s === 'string' ? s : s?.name;
      return sName?.trim().toLowerCase() !== trimmed;
    });

    category.markModified('subCategories');
    await category.save();
    return category;
  }
}
