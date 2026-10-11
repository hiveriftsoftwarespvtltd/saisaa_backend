import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async onModuleInit() {
    await this.seedInitialPatrons();
  }

  private async seedInitialPatrons() {
    const hashedPassword = await bcrypt.hash('Saisaa@123', 10);
    const defaultPatrons = [
        {
          customId: 'CUST-001',
          fullName: 'Ravinder Singh',
          email: 'ravinder@example.com',
          phone: '+91 88149 30229',
          password: hashedPassword,
          role: 'customer',
          tier: 'Royal Privé Member',
          status: 'Active',
          loyaltyPoints: 1250,
          avatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          notes: 'High-value patron, prefers unstitched custom silk tailoring.',
          addresses: [
            {
              type: 'Home',
              line: '255/5 - 1, Karol Bagh, New Delhi, Delhi - 110005',
              isDefault: true,
            },
            {
              type: 'Office',
              line: 'NX One, Tower 3, Office A-1310, Greater Noida West - 201306',
              isDefault: false,
            },
          ],
        },
        {
          customId: 'CUST-002',
          fullName: 'Meera Singhania',
          email: 'meera.s@heritage.in',
          phone: '+91 98765 43210',
          password: hashedPassword,
          role: 'customer',
          tier: 'Royal Connoisseur',
          status: 'VIP',
          loyaltyPoints: 3400,
          avatar:
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
          notes: 'Member of Royal Heritage Club. Collects heirloom sarees.',
          addresses: [
            {
              type: 'Residence',
              line: '42, Amrita Sher-Gil Marg, New Delhi - 110003',
              isDefault: true,
            },
          ],
        },
        {
          customId: 'CUST-003',
          fullName: 'Ananya Deshmukh',
          email: 'ananya.d@gmail.com',
          phone: '+91 99234 56789',
          password: hashedPassword,
          role: 'customer',
          tier: 'Royal Privé Member',
          status: 'Active',
          loyaltyPoints: 850,
          avatar:
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
          notes: 'Frequent buyer of Banarasi festive silk drapes.',
          addresses: [
            {
              type: 'Home',
              line: 'B-402, Sea Green Apts, Worli Sea Face, Mumbai - 400030',
              isDefault: true,
            },
          ],
        },
        {
          customId: 'CUST-004',
          fullName: 'Rohit Verma',
          email: 'rohit.v@tcs.com',
          phone: '+91 97654 32109',
          password: hashedPassword,
          role: 'customer',
          tier: 'Royal Privé Member',
          status: 'Active',
          loyaltyPoints: 600,
          avatar:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
          notes: 'Corporate gifting buyer.',
          addresses: [
            {
              type: 'Home',
              line: 'Tower 4, Flat 1202, Palm Meadows, Whitefield, Bengaluru - 560066',
              isDefault: true,
            },
          ],
        },
      ];

      for (const patron of defaultPatrons) {
        const exists = await this.userModel.findOne({ email: patron.email });
        if (!exists) {
          await this.userModel.create(patron);
        }
      }
  }

  async findAll(query: any = {}) {
    const filter: any = {};
    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }

    const users = await this.userModel.find(filter).sort({ createdAt: -1 }).exec();

    // Enrich each user with real orders count and spending from orders collection
    const enriched = await Promise.all(
      users.map(async (u) => {
        const userEmail = u.email.toLowerCase().trim();
        const userOrders = await this.orderModel
          .find({
            $or: [
              { 'customer.email': userEmail },
              { 'customer.name': { $regex: new RegExp(`^${u.fullName}$`, 'i') } },
            ],
          })
          .sort({ createdAt: -1 })
          .exec();

        const orderCount = userOrders.length;
        const totalSpent = userOrders.reduce(
          (sum, o) => sum + (Number(o.grandTotal) || Number(o.amount) || 0),
          0,
        );

        const latestOrder = userOrders[0];
        const joinedDate = u.createdAt
          ? new Date(u.createdAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : 'Recent';

        return {
          id: u.customId || u._id.toString(),
          _id: u._id.toString(),
          customId: u.customId,
          name: u.fullName,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone || latestOrder?.customer?.phone || '+91 88149 30229',
          orders: orderCount,
          totalSpent,
          joined: joinedDate,
          status: u.status || (totalSpent > 50000 ? 'VIP' : 'Active'),
          tier: u.tier || (totalSpent > 50000 ? 'Royal Connoisseur' : 'Royal Privé Member'),
          loyaltyPoints: u.loyaltyPoints ?? 500,
          avatar:
            u.avatar ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          addresses:
            u.addresses && u.addresses.length > 0
              ? u.addresses
              : latestOrder?.customer?.address
              ? [{ type: 'Primary Delivery', line: latestOrder.customer.address, isDefault: true }]
              : [],
          notes: u.notes || '',
          createdAt: u.createdAt,
        };
      }),
    );

    return enriched;
  }

  async findOne(idOrEmail: string) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrEmail);
    const filter = isObjectId
      ? { _id: idOrEmail }
      : {
          $or: [
            { customId: idOrEmail },
            { email: idOrEmail.toLowerCase().trim() },
          ],
        };

    const user = await this.userModel.findOne(filter).exec();
    if (!user) {
      throw new NotFoundException(`Customer "${idOrEmail}" not found`);
    }

    const userEmail = user.email.toLowerCase().trim();
    const customerOrders = await this.orderModel
      .find({
        $or: [
          { 'customer.email': userEmail },
          { 'customer.name': { $regex: new RegExp(`^${user.fullName}$`, 'i') } },
        ],
      })
      .sort({ createdAt: -1 })
      .exec();

    const orderCount = customerOrders.length;
    const totalSpent = customerOrders.reduce(
      (sum, o) => sum + (Number(o.grandTotal) || Number(o.amount) || 0),
      0,
    );
    const aov = orderCount > 0 ? Math.round(totalSpent / orderCount) : 0;

    const joinedDate = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : 'Recent';

    const latestOrder = customerOrders[0];

    return {
      id: user.customId || user._id.toString(),
      _id: user._id.toString(),
      customId: user.customId,
      name: user.fullName,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || latestOrder?.customer?.phone || '+91 88149 30229',
      orders: orderCount,
      totalSpent,
      averageOrderValue: aov,
      joined: joinedDate,
      status: user.status || (totalSpent > 50000 ? 'VIP' : 'Active'),
      tier: user.tier || (totalSpent > 50000 ? 'Royal Connoisseur' : 'Royal Privé Member'),
      loyaltyPoints: user.loyaltyPoints ?? 500,
      avatar:
        user.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      addresses:
        user.addresses && user.addresses.length > 0
          ? user.addresses
          : latestOrder?.customer?.address
          ? [{ type: 'Primary Delivery', line: latestOrder.customer.address, isDefault: true }]
          : [],
      notes: user.notes || '',
      orderHistory: customerOrders,
      createdAt: user.createdAt,
    };
  }

  async update(idOrEmail: string, updateCustomerDto: UpdateCustomerDto) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrEmail);
    const filter = isObjectId
      ? { _id: idOrEmail }
      : {
          $or: [
            { customId: idOrEmail },
            { email: idOrEmail.toLowerCase().trim() },
          ],
        };

    const updated = await this.userModel
      .findOneAndUpdate(filter, { $set: updateCustomerDto }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Customer "${idOrEmail}" not found`);
    }

    return this.findOne(idOrEmail);
  }
}
