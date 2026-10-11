import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  private mapProductToInventoryItem(p: any) {
    const stockVal = Math.max(0, Number(p.stock) || 0);
    const thresholdVal = Number(p.lowStockThreshold) || 5;
    const pid = p.customId || p.id || (p._id ? p._id.toString() : '');
    const skuCode =
      p.sku ||
      `SAI-${(p.category || 'IT').slice(0, 2).toUpperCase()}-${pid.slice(-4)}`;

    let status = 'In Stock';
    if (stockVal === 0) {
      status = 'Out of Stock';
    } else if (stockVal <= thresholdVal) {
      status = 'Low Stock';
    }

    return {
      id: `inv-${pid}`,
      productId: pid,
      _id: p._id ? p._id.toString() : pid,
      name: p.name,
      sku: skuCode,
      category: p.category
        ? p.category.charAt(0).toUpperCase() + p.category.slice(1)
        : 'Suits',
      subCategory: p.subCategory || '',
      price: Number(p.price) || 0,
      currentStock: stockVal,
      reserved: 0,
      available: stockVal,
      threshold: thresholdVal,
      status,
      cardImage:
        p.cardImage ||
        p.coverImage ||
        (Array.isArray(p.images) && p.images[0]) ||
        '/images/05_shop_product_card_1.jpg',
    };
  }

  async findAll(query: any = {}) {
    const products = await this.productModel.find().sort({ createdAt: -1 }).exec();
    let inventory = products.map((p) => this.mapProductToInventoryItem(p));

    if (query.status && query.status !== 'All') {
      inventory = inventory.filter((item) => item.status === query.status);
    }

    if (query.category && query.category !== 'All') {
      const qCat = query.category.toLowerCase();
      inventory = inventory.filter((item) => item.category.toLowerCase() === qCat);
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim().toLowerCase();
      inventory = inventory.filter(
        (item) =>
          item.name.toLowerCase().includes(s) ||
          item.sku.toLowerCase().includes(s) ||
          item.category.toLowerCase().includes(s),
      );
    }

    return inventory;
  }

  async getSummary() {
    const products = await this.productModel.find().exec();
    const inventory = products.map((p) => this.mapProductToInventoryItem(p));

    const totalSkus = inventory.length;
    const totalUnits = inventory.reduce((sum, item) => sum + item.currentStock, 0);
    const inStockCount = inventory.filter((i) => i.status === 'In Stock').length;
    const lowStockCount = inventory.filter((i) => i.status === 'Low Stock').length;
    const outOfStockCount = inventory.filter((i) => i.status === 'Out of Stock').length;
    const totalInventoryValue = inventory.reduce(
      (sum, item) => sum + item.currentStock * item.price,
      0,
    );

    return {
      totalSkus,
      totalUnits,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      totalInventoryValue,
    };
  }

  async adjustStock(skuOrId: string, adjustStockDto: AdjustStockDto) {
    const cleanQuery = skuOrId.trim();
    const isObjectId = Types.ObjectId.isValid(cleanQuery);

    const filter: any = isObjectId
      ? {
          $or: [
            { _id: cleanQuery },
            { customId: cleanQuery },
            { sku: cleanQuery.toUpperCase() },
          ],
        }
      : {
          $or: [
            { sku: cleanQuery.toUpperCase() },
            { sku: cleanQuery },
            { customId: cleanQuery },
            { customId: `inv-${cleanQuery}` },
            { slug: cleanQuery.toLowerCase() },
          ],
        };

    const product = await this.productModel.findOne(filter).exec();
    if (!product) {
      throw new NotFoundException(
        `Product with SKU/identifier "${skuOrId}" not found in inventory catalog`,
      );
    }

    const newStock = Math.max(0, Number(adjustStockDto.stock));
    product.stock = newStock;
    product.inStock = newStock > 0;
    product.status = newStock > 0 ? 'Active' : 'Out of Stock';

    if (adjustStockDto.lowStockThreshold !== undefined) {
      product.lowStockThreshold = Math.max(0, Number(adjustStockDto.lowStockThreshold));
    }

    await product.save();

    return this.mapProductToInventoryItem(product);
  }
}
