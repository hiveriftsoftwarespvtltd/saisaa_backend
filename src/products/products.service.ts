import {
  Injectable,
  NotFoundException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultProducts();
  }

  async seedDefaultProducts() {
    const count = await this.productModel.countDocuments();
    if (count === 0) {
      const defaultProducts = [
        {
          customId: 'saisaa-suit-01',
          name: 'Embroidered Anarkali Suit Set',
          slug: 'embroidered-anarkali-suit-set',
          sku: 'SAI-ST-001',
          category: 'suits',
          subCategory: 'Anarkali Sets',
          price: 12999,
          originalPrice: 16999,
          rating: 4.9,
          reviewCount: 38,
          isBestSeller: true,
          isNewArrival: false,
          inStock: true,
          comingSoon: false,
          stock: 25,
          fabric: 'Pure Cotton Silk Blend',
          color: 'Mustard Gold',
          colorHex: '#D4AF37',
          work: 'Artisanal Floral Neck Embroidery & Lace Trims',
          care: 'Dry clean only. Store in muslin bag.',
          sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
          cardImage: '/images/05_shop_product_card_1.jpg',
          homeImage: '/images/02_product_1.jpg',
          originalImage: '/images/product_1_original.png',
          images: [
            '/images/05_shop_product_card_1.jpg',
            '/images/02_product_1.jpg',
            '/images/product_1_original.png',
          ],
          description:
            'A masterpiece from Saisaa’s Royal Heritage edit. Tailored from lustrous mustard silk with delicate hand-embroidered floral motifs across the neckline and sheer lace cuff trims. Paired with a coordinated dupatta.',
          features: [
            'Delicate hand-embroidered floral yoke detailing',
            'Scalloped lace trims along sleeves and neckline',
            'Includes matching trousers and artisan dupatta',
            'Soft breathable lining for all-day festive comfort',
          ],
          status: 'Active',
        },
        {
          customId: 'saisaa-kurti-01',
          name: 'Printed Artisanal Royal Kurti',
          slug: 'printed-artisanal-royal-kurti',
          sku: 'SAI-KT-001',
          category: 'kurtis',
          subCategory: 'Everyday & Festive Kurtis',
          price: 4999,
          originalPrice: 6999,
          rating: 4.8,
          reviewCount: 29,
          isBestSeller: false,
          isNewArrival: true,
          inStock: true,
          comingSoon: false,
          stock: 35,
          fabric: 'Fine Mercerized Cotton',
          color: 'Indigo Royal Blue',
          colorHex: '#1B365D',
          work: 'Traditional Heritage Block Print & Paisley Yoke',
          care: 'Gentle hand wash in cold water or dry clean.',
          sizes: ['XS', 'S', 'M', 'L', 'XL'],
          cardImage: '/images/06_shop_product_card_2.jpg',
          homeImage: '/images/03_product_2.jpg',
          originalImage: '/images/product_2_original.png',
          images: [
            '/images/06_shop_product_card_2.jpg',
            '/images/03_product_2.jpg',
            '/images/product_2_original.png',
          ],
          description:
            'Evoke the charm of artisanal block prints. This serene indigo blue kurti showcases intricate paisley booti prints, tailored in a straight comfort silhouette ideal for daily grace.',
          features: [
            'Authentic hand-blocked ethnic motifs',
            'Comfortable mandarin slit collar',
            'Quarter sleeves with printed border accents',
            'Feather-light breathable weave',
          ],
          status: 'Active',
        },
        {
          customId: 'saisaa-saree-01',
          name: 'Kanjeevaram Royal Brocade Gold Tissue Saree',
          slug: 'kanjeevaram-royal-brocade-gold-tissue-saree',
          sku: 'SAI-SR-001',
          category: 'sarees',
          subCategory: 'Kanjeevaram Silk',
          price: 24500,
          originalPrice: 32000,
          rating: 5.0,
          reviewCount: 52,
          isBestSeller: true,
          isNewArrival: false,
          inStock: true,
          comingSoon: false,
          stock: 12,
          fabric: 'Pure Mulberry Silk with Metallic Gold Zari',
          color: 'Royal Wine & Gold',
          colorHex: '#800020',
          work: 'Intricate Floral & Temple Jacquard Weave',
          care: 'Strictly dry clean. Roll inside-out.',
          sizes: ['Free Size (5.5m + 0.8m Blouse)'],
          cardImage: '/images/07_shop_product_card_3.jpg',
          homeImage: '/images/04_product_3.jpg',
          originalImage: '/images/product_3_original.png',
          images: [
            '/images/07_shop_product_card_3.jpg',
            '/images/04_product_3.jpg',
            '/images/product_3_original.png',
          ],
          description:
            'Woven with centuries-old South Indian loom craftsmanship, this Saisaa signature Kanjeevaram saree gleams with pure molten gold zari. Features royal temple borders and a magnificent regal pallu.',
          features: [
            'Certified Silk Mark guaranteed authenticity',
            'Heavy contrasting jacquard blouse piece included',
            'Pure silver zari dipped in antique gold',
            'Heirloom piece crafted for monumental celebrations',
          ],
          status: 'Active',
        },
        {
          customId: 'saisaa-suit-02',
          name: 'Festive Velvet Anarkali Set',
          slug: 'festive-velvet-anarkali-set',
          sku: 'SAI-ST-002',
          category: 'suits',
          subCategory: 'Anarkali Sets',
          price: 14999,
          originalPrice: 19999,
          rating: 5.0,
          reviewCount: 35,
          isBestSeller: true,
          isNewArrival: false,
          inStock: true,
          comingSoon: false,
          stock: 18,
          fabric: 'Pure Mulberry Silk & Velvet',
          color: 'Deep Wine Maroon',
          colorHex: '#4A1525',
          work: 'Zari Brocade, Zardozi & Resham Embroidery',
          care: 'Strictly dry clean.',
          sizes: ['S', 'M', 'L', 'XL'],
          cardImage: '/images/08_shop_product_card_4.jpg',
          homeImage: '/images/05_product_4.jpg',
          originalImage: '/images/product_4_original.png',
          images: [
            '/images/08_shop_product_card_4.jpg',
            '/images/05_product_4.jpg',
            '/images/product_4_original.png',
          ],
          description:
            'Opulence reimagined in deep wine tones. Richly adorned with antique gold zari work along the yoke, sleeves, and flared hemline. Paired with a regal embroidered dupatta.',
          features: [
            'Heavy scalloped zardozi embroidery border',
            'Flared royal anarkali silhouette',
            'Coordinated organza silk dupatta included',
            'Premium inner lining',
          ],
          status: 'Active',
        },
        {
          customId: 'saisaa-kurti-02',
          name: 'Elegant Chikankari Kurti Set',
          slug: 'elegant-chikankari-kurti-set',
          sku: 'SAI-KT-002',
          category: 'kurtis',
          subCategory: 'Chikankari Kurtis',
          price: 6899,
          originalPrice: 8999,
          rating: 4.9,
          reviewCount: 42,
          isBestSeller: true,
          isNewArrival: true,
          inStock: true,
          comingSoon: false,
          stock: 22,
          fabric: 'Fine Georgette',
          color: 'Blush Rose',
          colorHex: '#D89BA6',
          work: 'Awadhi Lucknowi Hand-embroidery with Silver Mukaish',
          care: 'Dry clean recommended.',
          sizes: ['XS', 'S', 'M', 'L', 'XL'],
          cardImage: '/images/09_shop_product_card_5.jpg',
          homeImage: '/images/06_product_5.jpg',
          originalImage: '/images/product_5_original.png',
          images: [
            '/images/09_shop_product_card_5.jpg',
            '/images/06_product_5.jpg',
            '/images/product_5_original.png',
          ],
          description:
            'Delicate Awadhi needlework adorns this dreamy dusty rose kurti. Featuring fine Chikankari floral stitches across the yoke and hemline for an ethereal festive touch.',
          features: [
            'Authentic Lucknow karigari needlework',
            'Includes matching inner slip',
            'Soft flowing georgette drape',
            'Scalloped detailing',
          ],
          status: 'Active',
        },
        {
          customId: 'saisaa-suit-03',
          name: 'Pastel Handwoven Chanderi Silk Suit Set',
          slug: 'pastel-handwoven-chanderi-silk-suit-set',
          sku: 'SAI-ST-003',
          category: 'suits',
          subCategory: 'Chanderi Suits',
          price: 9999,
          originalPrice: 12999,
          rating: 4.8,
          reviewCount: 19,
          isBestSeller: false,
          isNewArrival: true,
          inStock: true,
          comingSoon: false,
          stock: 14,
          fabric: 'Handwoven Chanderi Silk',
          color: 'Pastel Lilac Lavender',
          colorHex: '#9E8FB2',
          work: 'Fine Silver Tilla & Dabka Work',
          care: 'Dry clean only.',
          sizes: ['XS', 'S', 'M', 'L', 'XL'],
          cardImage: '/images/10_shop_product_card_6.jpg',
          homeImage: '/images/07_product_6.jpg',
          originalImage: '/images/product_6_original.png',
          images: [
            '/images/10_shop_product_card_6.jpg',
            '/images/07_product_6.jpg',
            '/images/product_6_original.png',
          ],
          description:
            'Understated luxury in ethereal pastel lilac. Features delicate silver tilla embroidery and subtle metallic sheen, perfect for summer soirees and daytime celebrations.',
          features: [
            'Handwoven Chanderi with silver sheen',
            'Intricate floral vine embroidery',
            'Gossamer chiffon dupatta included',
          ],
          status: 'Active',
        },
        {
          customId: 'saisaa-saree-02',
          name: 'Handloom Floral Heritage Organza Saree',
          slug: 'handloom-floral-heritage-organza-saree',
          sku: 'SAI-SR-002',
          category: 'sarees',
          subCategory: 'Banarasi Organza',
          price: 18999,
          originalPrice: 25000,
          rating: 4.9,
          reviewCount: 44,
          isBestSeller: true,
          isNewArrival: false,
          inStock: true,
          comingSoon: false,
          stock: 16,
          fabric: 'Pure Katan Organza Silk',
          color: 'Ivory Floral',
          colorHex: '#FFF8E7',
          work: 'Pastel Floral Prints with Heavy Gold Zari Border',
          care: 'Dry clean only.',
          sizes: ['Free Size (5.5m + 0.8m Blouse)'],
          cardImage: '/images/11_shop_product_card_7.jpg',
          homeImage: '/images/08_product_7.jpg',
          originalImage: '/images/product_7_original.png',
          images: [
            '/images/11_shop_product_card_7.jpg',
            '/images/08_product_7.jpg',
            '/images/product_7_original.png',
          ],
          description:
            'Graceful drapes for unforgettable moments. Celebrates timeless beauty and modern womanhood with sheer ivory organza, pastel rose motifs, and rich woven borders.',
          features: [
            'Ultra lightweight gossamer drape',
            'Woven golden border detailing',
            'Unstitched designer blouse piece included',
          ],
          status: 'Active',
        },
        {
          customId: 'saisaa-suit-04',
          name: 'Rani Pink Heritage Sharara Set',
          slug: 'rani-pink-heritage-sharara-set',
          sku: 'SAI-ST-004',
          category: 'suits',
          subCategory: 'Straight Suit Sets',
          price: 11499,
          originalPrice: 14999,
          rating: 4.7,
          reviewCount: 23,
          isBestSeller: false,
          isNewArrival: true,
          inStock: true,
          comingSoon: false,
          stock: 20,
          fabric: 'Raw Silk & Chanderi',
          color: 'Rani Hot Pink',
          colorHex: '#C2185B',
          work: 'Gota Patti, Pitta Work & Gold Thread Weave',
          care: 'Dry clean only.',
          sizes: ['S', 'M', 'L', 'XL'],
          cardImage: '/images/12_shop_product_card_8.jpg',
          homeImage: '/images/09_product_8.jpg',
          originalImage: '/images/product_8_original.png',
          images: [
            '/images/12_shop_product_card_8.jpg',
            '/images/09_product_8.jpg',
            '/images/product_8_original.png',
          ],
          description:
            'Vibrant celebratory hues for weddings and festivals. Tailored straight cut with traditional gold gota patti and intricate paisleys.',
          features: [
            'Lustrous pure raw silk texture',
            'Gota patti neck and hem finish',
            'Comfort-fit straight pants and matching dupatta',
          ],
          status: 'Active',
        },
      ];

      await this.productModel.insertMany(defaultProducts);
    }
  }

  async findAll(query: any = {}): Promise<{
    items: Product[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const filter: any = {};

    if (query.status) {
      filter.status = query.status;
    } else if (query.status !== 'all') {
      filter.status = 'Active';
    }

    if (query.category && query.category !== 'all') {
      filter.category = query.category.toLowerCase().trim();
    }

    if (query.subCategory && query.subCategory !== 'all') {
      filter.subCategory = query.subCategory.trim();
    }

    if (query.fabric && query.fabric !== 'all') {
      filter.fabric = { $regex: new RegExp(query.fabric, 'i') };
    }

    if (query.inStock === 'true' || query.inStock === true) {
      filter.inStock = true;
    }

    if (query.isBestSeller === 'true' || query.isBestSeller === true) {
      filter.isBestSeller = true;
    }

    if (query.isNewArrival === 'true' || query.isNewArrival === true) {
      filter.isNewArrival = true;
    }

    if (query.minPrice || query.maxPrice) {
      filter.price = {};
      if (query.minPrice) filter.price.$gte = Number(query.minPrice);
      if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      filter.$or = [
        { name: { $regex: s, $options: 'i' } },
        { description: { $regex: s, $options: 'i' } },
        { work: { $regex: s, $options: 'i' } },
        { fabric: { $regex: s, $options: 'i' } },
        { sku: { $regex: s, $options: 'i' } },
      ];
    }

    const sortOptions: any = {};
    if (query.sort === 'price_asc') {
      sortOptions.price = 1;
    } else if (query.sort === 'price_desc') {
      sortOptions.price = -1;
    } else if (query.sort === 'rating') {
      sortOptions.rating = -1;
    } else if (query.sort === 'bestseller') {
      sortOptions.isBestSeller = -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(idOrSlug: string): Promise<Product> {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    let product: ProductDocument | null = null;

    if (isObjectId) {
      product = await this.productModel.findById(idOrSlug).exec();
    }

    if (!product) {
      const normalizedQuery = idOrSlug.trim();
      const slugQuery = normalizedQuery.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      product = await this.productModel
        .findOne({
          $or: [
            { customId: normalizedQuery },
            { customId: slugQuery },
            { slug: normalizedQuery.toLowerCase() },
            { slug: slugQuery },
            { sku: normalizedQuery.toUpperCase() },
          ],
        })
        .exec();
    }

    if (!product) {
      throw new NotFoundException(`Product "${idOrSlug}" not found`);
    }

    return product;
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const slug =
      createProductDto.slug?.trim().toLowerCase() ||
      createProductDto.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const customId =
      createProductDto.customId ||
      `saisaa-${createProductDto.category.toLowerCase()}-${Date.now().toString().slice(-4)}`;

    const sku =
      (createProductDto.sku && createProductDto.sku.trim()) ||
      `SAI-${createProductDto.category.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const existing = await this.productModel
      .findOne({
        $or: [{ customId }, { slug }],
      })
      .exec();

    if (existing) {
      throw new ConflictException(`Product with slug/ID already exists`);
    }

    const created = new this.productModel({
      ...createProductDto,
      customId,
      slug,
      sku,
      category: createProductDto.category.toLowerCase(),
      images:
        createProductDto.images && createProductDto.images.length > 0
          ? createProductDto.images
          : [createProductDto.cardImage || '/images/05_shop_product_card_1.jpg'],
      cardImage:
        createProductDto.cardImage ||
        (createProductDto.images && createProductDto.images[0]) ||
        '/images/05_shop_product_card_1.jpg',
      coverImage:
        createProductDto.coverImage ||
        createProductDto.cardImage ||
        (createProductDto.images && createProductDto.images[0]) ||
        '/images/05_shop_product_card_1.jpg',
    });

    return created.save();
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const normalizedSlug = id.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filter = isObjectId
      ? { _id: id }
      : {
          $or: [
            { customId: id },
            { customId: normalizedSlug },
            { slug: id.toLowerCase() },
            { slug: normalizedSlug },
          ],
        };

    if (updateProductDto.category) {
      updateProductDto.category = updateProductDto.category.toLowerCase();
    }

    const updated = await this.productModel
      .findOneAndUpdate(filter, { $set: updateProductDto }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Product "${id}" not found`);
    }

    return updated;
  }

  async remove(id: string): Promise<{ success: boolean; id: string }> {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const normalizedSlug = id.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filter = isObjectId
      ? { _id: id }
      : {
          $or: [
            { customId: id },
            { customId: normalizedSlug },
            { slug: id.toLowerCase() },
            { slug: normalizedSlug },
          ],
        };

    const deleted = await this.productModel.findOneAndDelete(filter).exec();
    if (!deleted) {
      throw new NotFoundException(`Product "${id}" not found`);
    }

    return { success: true, id };
  }
}
