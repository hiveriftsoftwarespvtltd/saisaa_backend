import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';

@Injectable()
export class ReviewsService implements OnModuleInit {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultReviews();
  }

  private async seedDefaultReviews() {
    const count = await this.reviewModel.countDocuments();
    if (count > 0) return;

    // Seed default reviews for showcasing
    const defaultReviews = [
      {
        productId: '6ac88bfe2ccf2056aa24db11',
        productName: 'Embroidered Suit Set',
        productImage: '/images/hero-model.jpg',
        customer: 'Meera Singhania',
        customerEmail: 'meera.singhania@heritage.in',
        rating: 5,
        title: 'Extraordinarily Fine Craftsmanship',
        review:
          'The karigari needlework on the neckline is extraordinarily fine. Pure heritage luxury feel. Wore it for a family engagement and received countless compliments.',
        images: ['/images/hero-model.jpg'],
        date: '04 Oct 2026',
        verifiedPurchase: true,
        status: 'Approved',
      },
      {
        productId: '6ac88bfe2ccf2056aa24db12',
        productName: 'Heirloom Katan Silk Saree',
        productImage: '/images/saree-arch.jpg',
        customer: 'Ananya Deshmukh',
        customerEmail: 'ananya.deshmukh@royal.in',
        rating: 5,
        title: 'Authentic Banarasi Kadwa Weave',
        review:
          'Authentic Banarasi kadwa weave. The pure silk drape is heavy yet effortlessly comfortable. Exactly what you expect from an atelier brand.',
        images: ['/images/saree-arch.jpg'],
        date: '02 Oct 2026',
        verifiedPurchase: true,
        status: 'Approved',
      },
      {
        productId: '6ac88bfe2ccf2056aa24db13',
        productName: 'Printed Royal Kurti',
        productImage: '/images/blue-kurti.jpg',
        customer: 'Shreya Chatterjee',
        customerEmail: 'shreya.c@kolkata.in',
        rating: 4,
        title: 'Breathable Pure Fabric',
        review:
          'Fabric quality is very breathable, but the sizing runs slightly larger than standard charts. Needed minor alteration at the bust.',
        images: [],
        date: '30 Sep 2026',
        verifiedPurchase: true,
        status: 'Pending',
      },
      {
        productId: '6ac88bfe2ccf2056aa24db14',
        productName: 'Festive Velvet Anarkali Set',
        productImage: '/images/maroon-story.jpg',
        customer: 'Priyanka Kapoor',
        customerEmail: 'priyanka.k@delhi.in',
        rating: 5,
        title: 'Fit for a Royal Court',
        review:
          'Fit for a royal court! The micro-velvet sheen and dull gold zardozi are breathtaking. Delivery was exceptionally quick in Delhi.',
        images: ['/images/maroon-story.jpg'],
        date: '28 Sep 2026',
        verifiedPurchase: true,
        status: 'Approved',
      },
      {
        productId: '6ac88bfe2ccf2056aa24db15',
        productName: 'Royal Tissue Metallic Saree',
        productImage: '/images/saree-editorial.jpg',
        customer: 'Simran Jolly',
        customerEmail: 'simran.j@mumbai.in',
        rating: 2,
        title: 'Stiffer than expected',
        review:
          'The fabric is stiffer than pictured in the photos. Found it difficult to pleat without a professional draper.',
        images: [],
        date: '25 Sep 2026',
        verifiedPurchase: true,
        status: 'Rejected',
      },
    ];

    try {
      await this.reviewModel.insertMany(defaultReviews);
    } catch (e) {
      console.warn('Failed to seed default reviews:', e.message);
    }
  }

  /**
   * Check whether a customer is eligible to review a given product.
   * Requirement: User can only review if they have purchased the product.
   */
  async checkEligibility(productId: string, email: string) {
    if (!productId || !email) {
      return {
        canReview: false,
        hasPurchased: false,
        hasReviewed: false,
        reason: 'Product ID and patron email are required.',
      };
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Check if user already reviewed this product
    const existingReview = await this.reviewModel.findOne({
      productId,
      customerEmail: cleanEmail,
    });

    if (existingReview) {
      return {
        canReview: false,
        hasPurchased: true,
        hasReviewed: true,
        existingReview,
        reason: 'You have already submitted a review for this creation.',
      };
    }

    // 2. Resolve product identifiers to match in orders
    let product: ProductDocument | null = null;
    if (Types.ObjectId.isValid(productId)) {
      product = await this.productModel.findById(productId);
    }
    if (!product) {
      product = await this.productModel.findOne({
        $or: [{ customId: productId }, { slug: productId }],
      });
    }

    const matchIds = [productId];
    if (product) {
      if (product._id) matchIds.push(product._id.toString());
      if (product.customId) matchIds.push(product.customId);
    }

    const itemQueryConditions: any[] = [{ 'items.id': { $in: matchIds } }];
    if (product?.name) {
      itemQueryConditions.push({ 'items.name': product.name });
    }

    // 3. Query orders to verify purchase
    const order = await this.orderModel.findOne({
      $and: [
        {
          $or: [{ userEmail: cleanEmail }, { 'customer.email': cleanEmail }],
        },
        {
          $or: itemQueryConditions,
        },
      ],
    });

    if (!order) {
      return {
        canReview: false,
        hasPurchased: false,
        hasReviewed: false,
        reason:
          'Only verified patrons who have purchased this bespoke creation can submit a review.',
      };
    }

    return {
      canReview: true,
      hasPurchased: true,
      hasReviewed: false,
      orderId: order.orderId,
    };
  }

  /**
   * Submit a new customer review (Strict purchase verification)
   */
  async create(dto: CreateReviewDto) {
    const cleanEmail = dto.customerEmail.toLowerCase().trim();

    // Verify eligibility
    const eligibility = await this.checkEligibility(dto.productId, cleanEmail);

    if (eligibility.hasReviewed) {
      throw new BadRequestException(
        'You have already submitted a review for this creation.',
      );
    }

    if (!eligibility.hasPurchased) {
      throw new BadRequestException(
        'Only verified patrons who have purchased this bespoke creation can leave a review.',
      );
    }

    // Retrieve product metadata if not supplied
    let pName = dto.productName;
    let pImage = dto.productImage;

    if (!pName || !pImage) {
      let product: ProductDocument | null = null;
      if (Types.ObjectId.isValid(dto.productId)) {
        product = await this.productModel.findById(dto.productId);
      }
      if (!product) {
        product = await this.productModel.findOne({
          $or: [{ customId: dto.productId }, { slug: dto.productId }],
        });
      }
      if (product) {
        pName = pName || product.name;
        pImage =
          pImage ||
          product.cardImage ||
          product.coverImage ||
          (product.images && product.images[0]) ||
          '';
      }
    }

    const formattedDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const newReview = await this.reviewModel.create({
      productId: dto.productId,
      productName: pName || 'Artisanal Piece',
      productImage: pImage || '',
      customer: dto.customer.trim(),
      customerEmail: cleanEmail,
      rating: Number(dto.rating),
      title: dto.title?.trim() || '',
      review: dto.review.trim(),
      images: Array.isArray(dto.images) ? dto.images : [],
      verifiedPurchase: true,
      status: 'Pending', // Subject to admin moderation
      date: formattedDate,
    });

    return newReview;
  }

  /**
   * Recalculates average rating and reviewCount for a product
   */
  private async recalculateProductRating(productId: string) {
    try {
      const approvedReviews = await this.reviewModel.find({
        productId,
        status: 'Approved',
      });

      const count = approvedReviews.length;
      const averageRating =
        count > 0
          ? Number(
              (
                approvedReviews.reduce((sum, r) => sum + r.rating, 0) / count
              ).toFixed(1),
            )
          : 4.8;

      if (Types.ObjectId.isValid(productId)) {
        await this.productModel.findByIdAndUpdate(productId, {
          rating: averageRating,
          reviewCount: count,
        });
      }

      await this.productModel.updateMany(
        { $or: [{ customId: productId }, { slug: productId }] },
        { rating: averageRating, reviewCount: count },
      );
    } catch (e) {
      console.warn('Error recalculating product rating:', e.message);
    }
  }

  /**
   * Moderation status update (Approve, Reject, Pending)
   */
  async updateStatus(id: string, updateDto: UpdateReviewStatusDto) {
    const review = await this.reviewModel.findById(id);
    if (!review) {
      throw new NotFoundException(`Review with ID "${id}" not found`);
    }

    review.status = updateDto.status;
    await review.save();

    // Recalculate rating on status change
    await this.recalculateProductRating(review.productId);

    return review;
  }

  /**
   * Delete review
   */
  async remove(id: string) {
    const review = await this.reviewModel.findById(id);
    if (!review) {
      throw new NotFoundException(`Review with ID "${id}" not found`);
    }

    await this.reviewModel.findByIdAndDelete(id);
    await this.recalculateProductRating(review.productId);

    return { message: 'Review deleted successfully', id };
  }

  /**
   * Find all reviews for Admin
   */
  async findAll(query: any = {}) {
    const filter: Record<string, any> = {};

    if (query.status && query.status !== 'All') {
      filter.status = query.status;
    }

    if (query.productId) {
      filter.productId = query.productId;
    }

    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [
        { customer: regex },
        { productName: regex },
        { review: regex },
        { title: regex },
      ];
    }

    return this.reviewModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  /**
   * Find approved reviews for a specific product
   */
  async findByProduct(productId: string) {
    // Resolve product IDs if multiple match
    let product: ProductDocument | null = null;
    if (Types.ObjectId.isValid(productId)) {
      product = await this.productModel.findById(productId);
    }
    if (!product) {
      product = await this.productModel.findOne({
        $or: [{ customId: productId }, { slug: productId }],
      });
    }

    const matchIds = [productId];
    if (product) {
      if (product._id) matchIds.push(product._id.toString());
      if (product.customId) matchIds.push(product.customId);
    }

    const reviews = await this.reviewModel
      .find({
        productId: { $in: matchIds },
        status: 'Approved',
      })
      .sort({ createdAt: -1 })
      .exec();

    const count = reviews.length;
    const avgRating =
      count > 0
        ? Number(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1),
          )
        : (product?.rating || 4.8);

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      distribution[star] = (distribution[star] || 0) + 1;
    });

    return {
      reviews,
      totalCount: count,
      averageRating: avgRating,
      distribution,
    };
  }
}
