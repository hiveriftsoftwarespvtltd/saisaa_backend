import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { Order, OrderDocument } from './schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { CouponsService } from '../coupons/coupons.service';
import {
  CreateOrderDto,
  CreateRazorpayOrderDto,
  OrderItemDto,
} from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { escapeRegex } from '../common/utils/regex.util';

@Injectable()
export class OrdersService implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);
  private razorpayInstance: any = null;

  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly couponsService: CouponsService,
    private readonly configService: ConfigService,
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

  /**
   * CANONICAL SERVER-SIDE PRICING ENGINE:
   * Recalculates subtotal, discounts, GST tax, and totals
   * by querying product documents directly from MongoDB.
   * Completely immune to client-side price tampering.
   */
  async calculateOrderPricing(
    items: OrderItemDto[],
    couponCode?: string,
  ): Promise<{
    verifiedItems: any[];
    subtotal: number;
    discount: number;
    couponCode: string;
    tax: number;
    shipping: number;
    grandTotal: number;
  }> {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const verifiedItems: any[] = [];

    for (const item of items) {
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

      const product = await this.productModel.findOne(filter).exec();
      if (!product) {
        throw new NotFoundException(
          `Product "${item.name || item.id}" was not found in catalog`,
        );
      }

      if (product.status && product.status !== 'Active') {
        throw new BadRequestException(
          `Product "${product.name}" is currently unavailable for purchase`,
        );
      }

      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const availableStock = Math.max(0, Number(product.stock) || 0);

      if (availableStock < qty) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}". Only ${availableStock} units remaining.`,
        );
      }

      // Canonical price directly from MongoDB document
      const unitPrice = Number(product.price) || 0;
      const customStitching = Boolean(item.customStitching);
      const stitchingFee = customStitching ? 1200 : 0;
      const itemGst = Math.round(((unitPrice + stitchingFee) * qty) * 0.05);

      verifiedItems.push({
        id: product._id.toString(),
        name: product.name,
        size: item.size || 'Standard',
        quantity: qty,
        price: unitPrice, // CANONICAL PRICE ENFORCED FROM DATABASE
        image:
          product.cardImage ||
          product.coverImage ||
          (product.images && product.images[0]) ||
          item.image ||
          '/images/hero-model.jpg',
        customStitching,
        stitchingFee,
        gstRate: 5,
        gstAmount: itemGst,
      });
    }

    const subtotal = verifiedItems.reduce(
      (sum, it) => sum + (it.price + (it.stitchingFee || 0)) * it.quantity,
      0,
    );

    let discount = 0;
    let validatedCouponCode = '';

    if (couponCode && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      try {
        const validation = await this.couponsService.validate({
          code: cleanCode,
          orderAmount: subtotal,
        });
        if (validation && validation.valid) {
          discount = Math.min(Number(validation.discountAmount) || 0, subtotal);
          validatedCouponCode = cleanCode;
        }
      } catch (couponErr: any) {
        throw new BadRequestException(
          `Invalid or expired coupon "${cleanCode}": ${couponErr?.message || 'Verification failed'}`,
        );
      }
    }

    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableAmount * 0.05); // 5% GST
    const shipping = 0; // Complimentary Royal Free Shipping
    const grandTotal = Math.max(0, taxableAmount + tax + shipping);

    return {
      verifiedItems,
      subtotal,
      discount,
      couponCode: validatedCouponCode,
      tax,
      shipping,
      grandTotal,
    };
  }

  async create(createOrderDto: CreateOrderDto, userEmail?: string): Promise<Order> {
    const orderId =
      createOrderDto.orderId ||
      `SAI${Math.floor(10000 + Math.random() * 90000)}`;

    const existing = await this.orderModel.findOne({ orderId }).exec();
    if (existing) {
      throw new ConflictException(`Order with ID ${orderId} already exists`);
    }

    // Server-side recalculate pricing for every order to ensure 100% price integrity
    const pricing = await this.calculateOrderPricing(
      createOrderDto.items,
      createOrderDto.couponCode,
    );

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

    const isPaidOnline =
      !isCod &&
      Boolean(createOrderDto.razorpayPaymentId) &&
      createOrderDto.paymentStatus === 'Paid';

    const defaultTimeline = [
      { status: 'Placed', date: nowTimeStr, done: true },
      { status: 'Confirmed', date: isPaidOnline ? nowTimeStr : (isCod ? nowTimeStr : 'Pending'), done: isPaidOnline || isCod },
      { status: 'Processing', date: 'Pending', done: false },
      { status: 'Shipped', date: 'Pending', done: false },
      { status: 'Delivered', date: 'Pending', done: false },
    ];

    const newOrder = new this.orderModel({
      ...createOrderDto,
      orderId,
      userEmail: userEmail || createOrderDto.customer.email.toLowerCase(),
      date: formattedDate,
      items: pricing.verifiedItems,
      amount: pricing.grandTotal,
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      couponCode: pricing.couponCode,
      shipping: pricing.shipping,
      tax: pricing.tax,
      grandTotal: pricing.grandTotal,
      paymentMethod: createOrderDto.paymentMethod || 'Razorpay Online',
      transactionId:
        createOrderDto.transactionId ||
        createOrderDto.razorpayPaymentId ||
        `TXN-${Date.now().toString().slice(-8)}`,
      paymentStatus: isPaidOnline ? 'Paid' : (isCod ? 'Pending' : 'Pending'),
      razorpayOrderId: createOrderDto.razorpayOrderId || '',
      razorpayPaymentId: createOrderDto.razorpayPaymentId || '',
      razorpaySignature: createOrderDto.razorpaySignature || '',
      orderStatus: isPaidOnline ? 'Confirmed' : (isCod ? 'Confirmed' : 'Pending'),
      timeline: defaultTimeline,
    });

    const savedOrder = await newOrder.save();

    // Atomic Stock Decrement Engine: Prevents overselling & race conditions
    const decrementedItems: { id: string; qty: number }[] = [];
    try {
      for (const item of pricing.verifiedItems) {
        const qty = Math.max(1, Number(item.quantity) || 1);
        const cleanId = (item.id || '').trim();
        const isObjectId = Types.ObjectId.isValid(cleanId);

        const filter: any = isObjectId
          ? { _id: cleanId, stock: { $gte: qty } }
          : {
              $or: [
                { customId: cleanId },
                { sku: cleanId.toUpperCase() },
              ],
              stock: { $gte: qty },
            };

        const updatedProduct = await this.productModel.findOneAndUpdate(
          filter,
          { $inc: { stock: -qty } },
          { new: true },
        );

        if (!updatedProduct) {
          throw new ConflictException(
            `Creation "${item.name}" ran out of available stock while finalizing your order. Please adjust your bag.`,
          );
        }

        decrementedItems.push({ id: cleanId, qty });

        if (updatedProduct.stock <= 0) {
          await this.productModel.updateOne(
            { _id: updatedProduct._id },
            { $set: { inStock: false, status: 'Out of Stock' } },
          );
        }
      }
    } catch (stockErr: any) {
      // Rollback any items that were decremented in this failed order attempt
      for (const dec of decrementedItems) {
        try {
          const isObjectId = Types.ObjectId.isValid(dec.id);
          const rollbackFilter: any = isObjectId
            ? { _id: dec.id }
            : { $or: [{ customId: dec.id }, { sku: dec.id.toUpperCase() }] };
          await this.productModel.updateOne(rollbackFilter, {
            $inc: { stock: dec.qty },
            $set: { inStock: true, status: 'Active' },
          });
        } catch (rbErr: any) {
          console.error(
            `[Inventory Rollback Error] Failed to restore stock for item ${dec.id}:`,
            rbErr?.message,
          );
        }
      }
      throw stockErr;
    }

    // Record Coupon Usage
    if (pricing.couponCode) {
      try {
        await this.couponsService.recordUsage(pricing.couponCode);
      } catch (cpnErr: any) {
        console.warn('[Coupons] Failed to record usage:', cpnErr?.message);
      }
    }

    // Offload email dispatch to non-blocking background task via setImmediate
    setImmediate(() => {
      this.sendOrderNotificationEmails(savedOrder).catch((mailErr) => {
        this.logger.warn(
          '[OrdersService] Background order notification email failed: ' +
            (mailErr?.message || mailErr),
        );
      });
    });

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
      const s = escapeRegex(query.search.trim());
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
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return [];
    }
    return this.orderModel
      .find({
        $or: [
          { userEmail: cleanEmail },
          { 'customer.email': cleanEmail },
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

  // ==========================================
  // RAZORPAY PAYMENT GATEWAY ENGINE
  // ==========================================

  private getRazorpay(): any {
    if (!this.razorpayInstance) {
      const key_id = this.configService.get<string>('RAZORPAY_KEY_ID');
      const key_secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
      if (!key_id || !key_secret) {
        throw new InternalServerErrorException(
          'Razorpay payment gateway credentials are not configured on server',
        );
      }
      const Razorpay = require('razorpay');
      this.razorpayInstance = new Razorpay({
        key_id,
        key_secret,
      });
    }
    return this.razorpayInstance;
  }

  getRazorpayKey(): { keyId: string } {
    return {
      keyId: this.configService.get<string>('RAZORPAY_KEY_ID') || '',
    };
  }

  async createRazorpayOrder(body: {
    amount?: number;
    items?: OrderItemDto[];
    couponCode?: string;
    receipt?: string;
  }) {
    let payableAmount = 0;
    let serverCalculated: any = null;

    if (Array.isArray(body.items) && body.items.length > 0) {
      const pricing = await this.calculateOrderPricing(body.items, body.couponCode);
      payableAmount = pricing.grandTotal;
      serverCalculated = pricing;
    } else if (body.amount && Number(body.amount) > 0) {
      payableAmount = Number(body.amount);
    } else {
      throw new BadRequestException('Order items are required to initialize secure checkout');
    }

    if (payableAmount <= 0) {
      throw new BadRequestException('Payable amount must be greater than zero');
    }

    const razorpay = this.getRazorpay();
    const amountInPaise = Math.round(payableAmount * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: body.receipt || `rcpt_${Date.now().toString().slice(-8)}`,
      payment_capture: 1,
    };

    try {
      const order = await razorpay.orders.create(options);
      return {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        keyId: this.getRazorpayKey().keyId,
        serverCalculated,
      };
    } catch (err: any) {
      console.error('Razorpay order creation error:', err);
      throw new BadRequestException(
        err?.error?.description || err?.message || 'Failed to initialize Razorpay checkout order',
      );
    }
  }

  async verifyRazorpayPayment(
    data: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      orderPayload: CreateOrderDto;
    },
    userEmail?: string,
  ): Promise<Order> {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderPayload,
    } = data;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new BadRequestException('Incomplete payment verification payload');
    }

    if (!orderPayload || !Array.isArray(orderPayload.items)) {
      throw new BadRequestException('Order payload with items is required to finalize order');
    }

    // 1. Cryptographic HMAC-SHA256 signature verification
    const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (!secret) {
      throw new InternalServerErrorException(
        'Razorpay payment gateway credentials not configured on server',
      );
    }
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      throw new BadRequestException('Invalid payment signature. Verification failed.');
    }

    // 2. Replay attack protection: Ensure payment ID hasn't been used previously
    const existingOrderWithPayment = await this.orderModel
      .findOne({ razorpayPaymentId })
      .exec();
    if (existingOrderWithPayment) {
      throw new ConflictException(
        `Payment ${razorpayPaymentId} has already been fulfilled for Order #${existingOrderWithPayment.orderId}.`,
      );
    }

    // 3. Fetch transaction from Razorpay API to verify status and exact captured paise
    let capturedPaise = 0;
    try {
      const razorpay = this.getRazorpay();
      const rzpPayment = await razorpay.payments.fetch(razorpayPaymentId);
      if (rzpPayment) {
        if (rzpPayment.order_id && rzpPayment.order_id !== razorpayOrderId) {
          throw new BadRequestException('Razorpay order ID mismatch in gateway record.');
        }
        if (rzpPayment.status !== 'captured' && rzpPayment.status !== 'authorized') {
          throw new BadRequestException(
            `Payment is in '${rzpPayment.status}' state and not captured.`,
          );
        }
        capturedPaise = Number(rzpPayment.amount) || 0;
      }
    } catch (rzpFetchErr: any) {
      console.warn('[Razorpay API verify warning]:', rzpFetchErr?.message || rzpFetchErr);
      if (rzpFetchErr instanceof BadRequestException) {
        throw rzpFetchErr;
      }
    }

    // 4. Server-Side Canonical Recalculation
    const pricing = await this.calculateOrderPricing(
      orderPayload.items,
      orderPayload.couponCode,
    );

    const expectedPaise = Math.round(pricing.grandTotal * 100);

    // Verify paid amount matches server calculation (allowing max ₹1 rounding margin)
    if (capturedPaise > 0 && Math.abs(capturedPaise - expectedPaise) > 100) {
      throw new BadRequestException(
        `Price Tampering Detected: Captured amount (₹${capturedPaise / 100}) does not match server-verified order total (₹${pricing.grandTotal}). Order rejected.`,
      );
    }

    // 5. Populate verified payment & canonical numbers
    const verifiedOrderPayload: CreateOrderDto = {
      ...orderPayload,
      items: pricing.verifiedItems,
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      couponCode: pricing.couponCode,
      shipping: pricing.shipping,
      tax: pricing.tax,
      grandTotal: pricing.grandTotal,
      paymentMethod: orderPayload.paymentMethod || 'Razorpay / Online',
      transactionId: razorpayPaymentId,
      paymentStatus: 'Paid',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    };

    return this.create(verifiedOrderPayload, userEmail);
  }

  /**
   * Configures Nodemailer transporter using active SMTP credentials
   */
  private getMailTransporter() {
    const host = this.configService.get<string>('EMAIL_HOST', 'smtp.gmail.com');
    const port = Number(this.configService.get<number>('EMAIL_PORT', 587));
    const user = this.configService.get<string>('EMAIL_USER');
    const rawPass = this.configService.get<string>('EMAIL_PASS');
    const pass = (rawPass || '').replace(/\s+/g, '');

    if (!user || !pass) {
      return null;
    }

    const isGmail =
      host.toLowerCase().includes('gmail') ||
      (user && user.toLowerCase().includes('@gmail.com'));

    return isGmail
      ? nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user,
            pass,
          },
        })
      : nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: {
            user,
            pass,
          },
        });
  }

  /**
   * Dispatches luxury email notification to the Admin and Customer upon order confirmation
   */
  async sendOrderNotificationEmails(order: any) {
    try {
      const transporter = this.getMailTransporter();
      if (!transporter) {
        this.logger.warn(
          '[OrdersService] SMTP credentials not configured. Skipping order notification email dispatch.',
        );
        return;
      }
      const mailFrom =
        this.configService.get<string>('MAIL_FROM') ||
        this.configService.get<string>('EMAIL_USER') ||
        '"SAISAA Atelier" <orders@saisaa.com>';
      const clientUrl =
        this.configService.get<string>('CLIENT_URL') ||
        this.configService.get<string>('FRONTEND_URL') ||
        'https://www.saisaa.com';
      const adminOrdersUrl = `${clientUrl}/admin/orders`;

      // 1. Gather all admin receiver emails
      const adminRecipients: string[] = [];
      const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
      if (adminEmail) {
        adminRecipients.push(adminEmail.trim());
      }
      const contactReceiver =
        this.configService.get<string>('CONTACT_RECEIVER_EMAIL');
      if (
        contactReceiver &&
        !adminRecipients.includes(contactReceiver.trim())
      ) {
        adminRecipients.push(contactReceiver.trim());
      }
      if (adminRecipients.length === 0 && adminEmail) {
        adminRecipients.push(adminEmail);
      }

      // Generate HTML items list
      const itemsHtml = Array.isArray(order.items)
        ? order.items
            .map(
              (item: any) => `
            <tr style="border-bottom: 1px solid #E5E0D8;">
              <td style="padding: 12px 8px; font-size: 13px; color: #111827;">
                <strong>${item.name || 'Creation'}</strong>
                <div style="font-size: 11px; color: #6B7280; margin-top: 2px;">
                  Size: ${item.size || 'Standard'} ${item.customStitching ? '• Custom Stitching (+₹' + (item.stitchingFee || 0) + ')' : ''}
                </div>
              </td>
              <td style="padding: 12px 8px; font-size: 13px; color: #4B5563; text-align: center;">${item.quantity || 1}</td>
              <td style="padding: 12px 8px; font-size: 13px; color: #111827; font-weight: 600; text-align: right;">₹${(((Number(item.price) || 0) + (Number(item.stitchingFee) || 0)) * (Number(item.quantity) || 1)).toLocaleString('en-IN')}</td>
            </tr>`,
            )
            .join('')
        : '<tr><td colspan="3" style="padding: 10px;">No items recorded</td></tr>';

      // ==========================================
      // A. DISPATCH NOTIFICATION EMAIL TO ADMIN
      // ==========================================
      const adminSubject = `🛍️ New Order Received: #${order.orderId} - ₹${(order.grandTotal || 0).toLocaleString('en-IN')} by ${order.customer?.name || 'Customer'}`;
      const adminHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Order Alert - SAISAA</title>
      </head>
      <body style="margin:0;padding:0;background-color:#F5F3EF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#222222;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F3EF;padding:30px 10px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e0d8;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                <tr>
                  <td style="background-color:#09231A;padding:28px 24px;text-align:center;">
                    <h1 style="margin:0;color:#D4AF37;font-size:26px;letter-spacing:3px;font-family:Georgia,serif;font-weight:700;">SAISAA</h1>
                    <p style="margin:6px 0 0 0;color:#F5F3EF;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.9;">Artisanal Haute Luxury • New Order Notification</p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#FAF7F2;padding:16px 24px;border-bottom:1px solid #e5e0d8;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <span style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:1px;display:block;">Order Reference</span>
                          <strong style="font-size:16px;color:#09231A;">#${order.orderId}</strong>
                        </td>
                        <td align="right">
                          <span style="display:inline-block;background-color:#E6F4EA;color:#137333;font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;border:1px solid #CEEAD6;">
                            ✓ PAID VIA ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'ONLINE'}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 16px 0;font-size:15px;color:#111827;font-weight:600;">
                      Namaste Admin, a new luxury order has just been placed!
                    </p>
                    <div style="background-color:#FBFBF9;border:1px solid #E5E0D8;border-radius:12px;padding:16px 18px;margin-bottom:24px;">
                      <h3 style="margin:0 0 10px 0;font-size:12px;color:#09231A;text-transform:uppercase;letter-spacing:1px;">Patron & Delivery Information</h3>
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;line-height:1.6;color:#374151;">
                        <tr>
                          <td style="width:30%;color:#6B7280;padding:2px 0;">Patron Name:</td>
                          <td style="font-weight:600;color:#111827;">${order.customer?.name || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td style="color:#6B7280;padding:2px 0;">Contact Phone:</td>
                          <td><a href="tel:${order.customer?.phone}" style="color:#09231A;text-decoration:none;font-weight:600;">${order.customer?.phone || 'N/A'}</a></td>
                        </tr>
                        <tr>
                          <td style="color:#6B7280;padding:2px 0;">Email Address:</td>
                          <td><a href="mailto:${order.customer?.email}" style="color:#09231A;text-decoration:none;">${order.customer?.email || 'N/A'}</a></td>
                        </tr>
                        <tr>
                          <td style="color:#6B7280;padding:4px 0 2px 0;vertical-align:top;">Shipping Address:</td>
                          <td style="padding:4px 0 2px 0;color:#111827;font-weight:500;">
                            ${order.customer?.address || ''}<br/>
                            ${[order.customer?.city, order.customer?.state].filter(Boolean).join(', ')} ${order.customer?.pincode ? '- ' + order.customer?.pincode : ''}
                          </td>
                        </tr>
                      </table>
                    </div>

                    <h3 style="margin:0 0 10px 0;font-size:12px;color:#09231A;text-transform:uppercase;letter-spacing:1px;">Ordered Creations</h3>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:20px;">
                      <thead>
                        <tr style="background-color:#FAF7F2;border-bottom:2px solid #D4AF37;">
                          <th style="padding:10px 8px;font-size:11px;text-align:left;color:#09231A;text-transform:uppercase;">Item</th>
                          <th style="padding:10px 8px;font-size:11px;text-align:center;color:#09231A;text-transform:uppercase;">Qty</th>
                          <th style="padding:10px 8px;font-size:11px;text-align:right;color:#09231A;text-transform:uppercase;">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;line-height:1.8;color:#4B5563;margin-bottom:24px;">
                      <tr>
                        <td style="padding:2px 0;">Subtotal</td>
                        <td align="right" style="color:#111827;font-weight:600;">₹${(order.subtotal || 0).toLocaleString('en-IN')}</td>
                      </tr>
                      ${order.discount > 0 ? `
                      <tr>
                        <td style="padding:2px 0;color:#059669;">Discount ${order.couponCode ? '(' + order.couponCode + ')' : ''}</td>
                        <td align="right" style="color:#059669;font-weight:600;">-₹${order.discount.toLocaleString('en-IN')}</td>
                      </tr>` : ''}
                      <tr>
                        <td style="padding:2px 0;">GST (5%)</td>
                        <td align="right" style="color:#111827;font-weight:600;">₹${(order.tax || 0).toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td style="padding:2px 0;">Shipping</td>
                        <td align="right" style="color:#059669;font-weight:600;">${order.shipping > 0 ? '₹' + order.shipping : 'FREE (Complimentary)'}</td>
                      </tr>
                      <tr style="border-top:1px solid #E5E0D8;font-size:16px;">
                        <td style="padding:10px 0 0 0;font-weight:700;color:#09231A;">Grand Total Paid</td>
                        <td align="right" style="padding:10px 0 0 0;font-weight:700;color:#09231A;font-size:18px;">₹${(order.grandTotal || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    </table>

                    <div style="background-color:#FAF7F2;border-left:4px solid #D4AF37;border-radius:6px;padding:12px 16px;margin-bottom:24px;font-size:12px;color:#4B5563;">
                      <strong>Payment Gateway Reference:</strong><br/>
                      Transaction ID: <span style="font-family:monospace;color:#09231A;">${order.transactionId || order.razorpayPaymentId || 'N/A'}</span><br/>
                      Razorpay Order: <span style="font-family:monospace;color:#09231A;">${order.razorpayOrderId || 'N/A'}</span>
                    </div>

                    <div style="text-align:center;margin:28px 0 10px 0;">
                      <a href="${adminOrdersUrl}" style="display:inline-block;background-color:#09231A;color:#F7E7BE;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:14px 28px;border-radius:10px;text-decoration:none;border:1px solid #D4AF37;">
                        View Order In Admin Console →
                      </a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#FAF7F2;padding:20px;text-align:center;border-top:1px solid #E5E0D8;font-size:11px;color:#9CA3AF;">
                    This is an automated administrative notification dispatched by SAISAA Luxury E-Commerce Engine.<br/>
                    © ${new Date().getFullYear()} SAISAA Haute Couture. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;

      await transporter.sendMail({
        from: `"SAISAA Orders" <${mailFrom}>`,
        to: adminRecipients.join(', '),
        subject: adminSubject,
        html: adminHtml,
      });

      console.log(`[OrdersService] Admin order notification sent to: ${adminRecipients.join(', ')} for order #${order.orderId}`);

      // ==========================================
      // B. DISPATCH CONFIRMATION TO CUSTOMER
      // ==========================================
      const customerEmail = (order.customer?.email || '').trim().toLowerCase();
      if (customerEmail && customerEmail.includes('@') && !customerEmail.includes('example.com')) {
        const customerSubject = `Order Confirmed: #${order.orderId} • SAISAA Haute Luxury`;
        const customerHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Order Confirmation - SAISAA</title>
        </head>
        <body style="margin:0;padding:0;background-color:#F5F3EF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#222222;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F3EF;padding:30px 10px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e0d8;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                  <tr>
                    <td style="background-color:#09231A;padding:28px 24px;text-align:center;">
                      <h1 style="margin:0;color:#D4AF37;font-size:26px;letter-spacing:3px;font-family:Georgia,serif;font-weight:700;">SAISAA</h1>
                      <p style="margin:6px 0 0 0;color:#F5F3EF;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.9;">Artisanal Haute Luxury • Order Confirmation</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px;">
                      <p style="margin:0 0 16px 0;font-size:16px;color:#111827;font-weight:600;">
                        Namaste ${order.customer?.name || 'Patron'},
                      </p>
                      <p style="margin:0 0 20px 0;font-size:14px;color:#4B5563;line-height:1.6;">
                        Thank you for choosing SAISAA. Your order <strong>#${order.orderId}</strong> has been successfully placed and confirmed. Our artisans are meticulously preparing your piece.
                      </p>

                      <h3 style="margin:0 0 10px 0;font-size:12px;color:#09231A;text-transform:uppercase;letter-spacing:1px;">Summary of Creations</h3>
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:20px;">
                        <tbody>
                          ${itemsHtml}
                        </tbody>
                      </table>

                      <div style="background-color:#FAF7F2;padding:14px 18px;border-radius:10px;margin-bottom:24px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;line-height:1.8;color:#4B5563;">
                          <tr>
                            <td>Total Amount Paid</td>
                            <td align="right" style="font-weight:700;color:#09231A;font-size:16px;">₹${(order.grandTotal || 0).toLocaleString('en-IN')}</td>
                          </tr>
                          <tr>
                            <td>Delivery Address</td>
                            <td align="right" style="font-weight:500;color:#111827;">${order.customer?.address || ''}, ${order.customer?.city || ''}</td>
                          </tr>
                        </table>
                      </div>

                      <div style="text-align:center;margin:24px 0 10px 0;">
                        <a href="${clientUrl}/account" style="display:inline-block;background-color:#09231A;color:#F7E7BE;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:12px 24px;border-radius:8px;text-decoration:none;">
                          Track Your Order →
                        </a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color:#FAF7F2;padding:16px;text-align:center;border-top:1px solid #E5E0D8;font-size:11px;color:#9CA3AF;">
                      For any questions or custom styling requests, reach out to <a href="mailto:contact@saisaa.com" style="color:#09231A;">contact@saisaa.com</a>.<br/>
                      © ${new Date().getFullYear()} SAISAA Haute Couture.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        `;

        await transporter.sendMail({
          from: `"SAISAA Haute Couture" <${mailFrom}>`,
          to: customerEmail,
          subject: customerSubject,
          html: customerHtml,
        });

        console.log(`[OrdersService] Customer order confirmation email sent to: ${customerEmail}`);
      }
    } catch (err: any) {
      console.error('[OrdersService] Failed to send order notification emails:', err?.message || err);
    }
  }
}

