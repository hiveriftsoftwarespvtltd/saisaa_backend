import {
  Injectable,
  NotFoundException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultOrders();
  }

  async seedDefaultOrders() {
    const count = await this.orderModel.countDocuments();
    if (count === 0) {
      const defaultOrders = [
        {
          orderId: 'SAI12568',
          userEmail: 'ravinder@example.com',
          customer: {
            name: 'Ravinder Singh',
            email: 'ravinder@example.com',
            phone: '+91 88149 30229',
            address: '255/5 - 1, Karol Bagh, New Delhi, Delhi - 110005',
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '110005',
          },
          items: [
            {
              id: 'saisaa-suit-01',
              name: 'Embroidered Suit Set',
              size: 'L',
              quantity: 1,
              price: 12999,
              image: '/images/05_shop_product_card_1.jpg',
            },
          ],
          date: '06 Oct 2026',
          amount: 12999,
          subtotal: 12999,
          discount: 1950,
          shipping: 0,
          tax: 0,
          grandTotal: 11049,
          paymentMethod: 'UPI',
          transactionId: 'UPI-TXN-90283401',
          paymentStatus: 'Paid',
          orderStatus: 'Delivered',
          timeline: [
            { status: 'Placed', date: '06 Oct 2026, 11:20 AM', done: true },
            { status: 'Confirmed', date: '06 Oct 2026, 01:15 PM', done: true },
            { status: 'Processing', date: '07 Oct 2026, 10:00 AM', done: true },
            { status: 'Shipped', date: '08 Oct 2026, 04:45 PM', done: true },
            { status: 'Delivered', date: '08 Oct 2026, 02:30 PM', done: true },
          ],
        },
        {
          orderId: 'SAI12567',
          userEmail: 'meera.s@heritage.in',
          customer: {
            name: 'Meera Singhania',
            email: 'meera.s@heritage.in',
            phone: '+91 98765 43210',
            address: '42, Amrita Sher-Gil Marg, New Delhi - 110003',
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '110003',
          },
          items: [
            {
              id: 'saisaa-saree-01',
              name: 'Heirloom Katan Silk Saree',
              size: 'Standard',
              quantity: 1,
              price: 18999,
              image: '/images/07_shop_product_card_3.jpg',
            },
            {
              id: 'saisaa-kurti-02',
              name: 'Elegant Chikankari Kurti Set',
              size: 'M',
              quantity: 1,
              price: 6899,
              image: '/images/09_shop_product_card_5.jpg',
            },
          ],
          date: '05 Oct 2026',
          amount: 25898,
          subtotal: 25898,
          discount: 3885,
          shipping: 0,
          tax: 0,
          grandTotal: 22013,
          paymentMethod: 'Credit Card',
          transactionId: 'CC-TXN-88492019',
          paymentStatus: 'Paid',
          orderStatus: 'Shipped',
          timeline: [
            { status: 'Placed', date: '05 Oct 2026, 03:10 PM', done: true },
            { status: 'Confirmed', date: '05 Oct 2026, 04:30 PM', done: true },
            { status: 'Processing', date: '06 Oct 2026, 11:00 AM', done: true },
            { status: 'Shipped', date: '07 Oct 2026, 05:20 PM', done: true },
            { status: 'Delivered', date: 'Pending', done: false },
          ],
        },
      ];

      await this.orderModel.insertMany(defaultOrders);
    }
  }

  async create(createOrderDto: CreateOrderDto, userEmail?: string): Promise<Order> {
    const orderId =
      createOrderDto.orderId ||
      `SAI${Math.floor(10000 + Math.random() * 90000)}`;

    const existing = await this.orderModel.findOne({ orderId }).exec();
    if (existing) {
      throw new ConflictException(`Order with ID ${orderId} already exists`);
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const nowTimeStr = `${formattedDate}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    const isCod =
      createOrderDto.paymentMethod?.toLowerCase().includes('cod') ||
      createOrderDto.paymentMethod?.toLowerCase().includes('cash');

    const defaultTimeline = [
      { status: 'Placed', date: nowTimeStr, done: true },
      { status: 'Confirmed', date: 'Pending', done: false },
      { status: 'Processing', date: 'Pending', done: false },
      { status: 'Shipped', date: 'Pending', done: false },
      { status: 'Delivered', date: 'Pending', done: false },
    ];

    const newOrder = new this.orderModel({
      ...createOrderDto,
      orderId,
      userEmail: userEmail || createOrderDto.customer.email.toLowerCase(),
      date: formattedDate,
      amount: createOrderDto.subtotal,
      subtotal: createOrderDto.subtotal,
      discount: createOrderDto.discount || 0,
      couponCode: createOrderDto.couponCode || '',
      shipping: createOrderDto.shipping || 0,
      tax: createOrderDto.tax || 0,
      grandTotal: createOrderDto.grandTotal,
      paymentMethod: createOrderDto.paymentMethod || 'UPI',
      transactionId:
        createOrderDto.transactionId ||
        `${(createOrderDto.paymentMethod || 'TXN').toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-8)}`,
      paymentStatus: isCod ? 'Pending' : 'Paid',
      orderStatus: 'Pending',
      timeline: defaultTimeline,
    });

    const savedOrder = await newOrder.save();

    // Real-Time Inventory Engine: Auto-decrement physical stock for each ordered creation
    if (Array.isArray(createOrderDto.items)) {
      for (const item of createOrderDto.items) {
        try {
          const qty = Math.max(1, Number(item.quantity) || 1);
          const cleanId = (item.id || '').trim();
          const isObjectId = Types.ObjectId.isValid(cleanId);

          const filter: any = isObjectId
            ? {
                $or: [
                  { _id: cleanId },
                  { customId: cleanId },
                  { sku: cleanId.toUpperCase() },
                ],
              }
            : {
                $or: [
                  { customId: cleanId },
                  { sku: cleanId.toUpperCase() },
                  { slug: cleanId.toLowerCase() },
                  ...(item.name ? [{ name: item.name }] : []),
                ],
              };

          const product = await this.productModel.findOne(filter);
          if (product) {
            const currentStock = Math.max(0, Number(product.stock) || 0);
            const newStock = Math.max(0, currentStock - qty);
            product.stock = newStock;
            product.inStock = newStock > 0;
            if (newStock === 0) {
              product.status = 'Out of Stock';
            }
            await product.save();
          }
        } catch (stockErr) {
          console.warn(`Failed to decrement stock for item ${item.id}:`, stockErr.message);
        }
      }
    }

    return savedOrder;
  }

  async findAll(query: any = {}): Promise<{
    items: Order[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const filter: any = {};

    if (query.orderStatus && query.orderStatus !== 'all') {
      filter.orderStatus = query.orderStatus;
    }

    if (query.paymentStatus && query.paymentStatus !== 'all') {
      filter.paymentStatus = query.paymentStatus;
    }

    if (query.userEmail) {
      filter.userEmail = query.userEmail.toLowerCase();
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      filter.$or = [
        { orderId: { $regex: s, $options: 'i' } },
        { 'customer.name': { $regex: s, $options: 'i' } },
        { 'customer.email': { $regex: s, $options: 'i' } },
        { 'customer.phone': { $regex: s, $options: 'i' } },
      ];
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(idOrOrderId: string): Promise<Order> {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrOrderId);
    const filter = isObjectId
      ? { $or: [{ _id: idOrOrderId }, { orderId: idOrOrderId }] }
      : { orderId: idOrOrderId };

    const order = await this.orderModel.findOne(filter).exec();
    if (!order) {
      throw new NotFoundException(`Order "${idOrOrderId}" not found`);
    }
    return order;
  }

  async findByUser(email: string): Promise<Order[]> {
    return this.orderModel
      .find({
        $or: [
          { userEmail: email.toLowerCase() },
          { 'customer.email': email.toLowerCase() },
        ],
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateStatus(
    idOrOrderId: string,
    updateDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrOrderId);
    const filter = isObjectId
      ? { $or: [{ _id: idOrOrderId }, { orderId: idOrOrderId }] }
      : { orderId: idOrOrderId };

    const order = await this.orderModel.findOne(filter).exec();
    if (!order) {
      throw new NotFoundException(`Order "${idOrOrderId}" not found`);
    }

    order.orderStatus = updateDto.orderStatus;
    if (updateDto.paymentStatus) {
      order.paymentStatus = updateDto.paymentStatus;
    } else if (updateDto.orderStatus === 'Delivered') {
      order.paymentStatus = 'Paid';
    }

    const now = new Date();
    const nowTimeStr = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    // Update timeline step
    const statusOrder = [
      'Placed',
      'Confirmed',
      'Processing',
      'Shipped',
      'Delivered',
    ];
    const targetIndex = statusOrder.indexOf(updateDto.orderStatus);

    order.timeline = order.timeline.map((step) => {
      const stepIndex = statusOrder.indexOf(step.status);
      if (step.status === updateDto.orderStatus) {
        return { status: step.status, date: nowTimeStr, done: true };
      }
      if (targetIndex !== -1 && stepIndex !== -1 && stepIndex <= targetIndex) {
        return {
          status: step.status,
          date: step.date === 'Pending' ? nowTimeStr : step.date,
          done: true,
        };
      }
      return step;
    });

    if (updateDto.notes) {
      order.notes = updateDto.notes;
    }

    return order.save();
  }
}
