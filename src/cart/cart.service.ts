import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,
  ) {}

  async getCart(userEmail: string): Promise<Cart> {
    const email = userEmail.toLowerCase().trim();
    let cart = await this.cartModel.findOne({ userEmail: email }).exec();
    if (!cart) {
      cart = await this.cartModel.create({ userEmail: email, items: [] });
    }
    return cart;
  }

  async syncCart(userEmail: string, items: any[]): Promise<Cart> {
    const email = userEmail.toLowerCase().trim();
    let cart = await this.cartModel.findOne({ userEmail: email }).exec();
    if (!cart) {
      cart = new this.cartModel({ userEmail: email, items: items || [] });
    } else {
      // Merge items by itemKey or overwrite
      cart.items = items || [];
    }
    return cart.save();
  }

  async addItem(userEmail: string, item: any): Promise<Cart> {
    const email = userEmail.toLowerCase().trim();
    let cart = await this.cartModel.findOne({ userEmail: email }).exec();
    if (!cart) {
      cart = new this.cartModel({ userEmail: email, items: [item] });
      return cart.save();
    }

    const existingIndex = cart.items.findIndex(
      (i) => i.itemKey === item.itemKey,
    );
    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += item.quantity || 1;
    } else {
      cart.items.push(item);
    }

    return cart.save();
  }

  async removeItem(userEmail: string, itemKey: string): Promise<Cart> {
    const email = userEmail.toLowerCase().trim();
    let cart = await this.cartModel.findOne({ userEmail: email }).exec();
    if (!cart) {
      return this.getCart(email);
    }

    cart.items = cart.items.filter((i) => i.itemKey !== itemKey);
    return cart.save();
  }

  async clearCart(userEmail: string): Promise<Cart> {
    const email = userEmail.toLowerCase().trim();
    let cart = await this.cartModel.findOne({ userEmail: email }).exec();
    if (cart) {
      cart.items = [];
      return cart.save();
    }
    return this.getCart(email);
  }
}
