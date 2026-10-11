import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wishlist, WishlistDocument } from './schemas/wishlist.schema';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name)
    private readonly wishlistModel: Model<WishlistDocument>,
  ) {}

  async getWishlist(userEmail: string): Promise<Wishlist> {
    const email = userEmail.toLowerCase().trim();
    let wishlist = await this.wishlistModel.findOne({ userEmail: email }).exec();
    if (!wishlist) {
      wishlist = await this.wishlistModel.create({
        userEmail: email,
        products: [],
      });
    }
    return wishlist;
  }

  /**
   * Intelligently merges guest wishlist items with the user's database wishlist.
   * Deduplicates by product id, _id, or sku, preserving items from both.
   */
  async syncWishlist(userEmail: string, guestItems: any[]): Promise<Wishlist> {
    const email = userEmail.toLowerCase().trim();
    let wishlist = await this.wishlistModel.findOne({ userEmail: email }).exec();
    if (!wishlist) {
      wishlist = new this.wishlistModel({
        userEmail: email,
        products: guestItems || [],
      });
      return wishlist.save();
    }

    const existingProducts = (wishlist.products || []).filter(
      (p) => p && typeof p === 'object' && !Array.isArray(p)
    );
    const productMap = new Map<string, any>();

    const getProductKey = (p: any): string => {
      if (!p || typeof p !== 'object' || Array.isArray(p)) return '';
      return String(p.id || p._id || p.sku || p.customId || p.slug || p.name || '').trim();
    };

    // 1. Index existing database products
    for (const p of existingProducts) {
      const key = getProductKey(p);
      if (key) {
        productMap.set(key, p);
      }
    }

    // 2. Merge guest items into map (preserving union of items)
    for (const p of guestItems || []) {
      const key = getProductKey(p);
      if (key && !productMap.has(key)) {
        productMap.set(key, p);
      }
    }

    wishlist.products = Array.from(productMap.values());
    return wishlist.save();
  }

  /**
   * Explicitly replaces user's wishlist with the provided array of products.
   */
  async replaceWishlist(userEmail: string, products: any[]): Promise<Wishlist> {
    const email = userEmail.toLowerCase().trim();
    let wishlist = await this.wishlistModel.findOne({ userEmail: email }).exec();
    if (!wishlist) {
      wishlist = new this.wishlistModel({
        userEmail: email,
        products: products || [],
      });
    } else {
      wishlist.products = products || [];
    }
    return wishlist.save();
  }

  async toggleProduct(
    userEmail: string,
    product: any,
  ): Promise<{ added: boolean; wishlist: Wishlist }> {
    const email = userEmail.toLowerCase().trim();
    let wishlist = await this.wishlistModel.findOne({ userEmail: email }).exec();
    if (!wishlist) {
      wishlist = new this.wishlistModel({
        userEmail: email,
        products: [product],
      });
      await wishlist.save();
      return { added: true, wishlist };
    }

    const prodId = String(product.id || product._id || product.sku || product.customId);
    const existingIndex = (wishlist.products || []).findIndex(
      (p) => String(p.id || p._id || p.sku || p.customId) === prodId,
    );

    let added = false;
    if (existingIndex > -1) {
      wishlist.products.splice(existingIndex, 1);
      added = false;
    } else {
      wishlist.products.push(product);
      added = true;
    }

    await wishlist.save();
    return { added, wishlist };
  }

  async removeProduct(userEmail: string, productId: string): Promise<Wishlist> {
    const email = userEmail.toLowerCase().trim();
    let wishlist = await this.wishlistModel.findOne({ userEmail: email }).exec();
    if (!wishlist) {
      return this.getWishlist(email);
    }

    const targetId = String(productId);
    wishlist.products = (wishlist.products || []).filter(
      (p) => String(p.id || p._id || p.sku || p.customId) !== targetId,
    );
    return wishlist.save();
  }

  async clearWishlist(userEmail: string): Promise<Wishlist> {
    const email = userEmail.toLowerCase().trim();
    let wishlist = await this.wishlistModel.findOne({ userEmail: email }).exec();
    if (!wishlist) {
      return this.getWishlist(email);
    }
    wishlist.products = [];
    return wishlist.save();
  }
}
