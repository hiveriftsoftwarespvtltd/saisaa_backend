import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { CartModule } from './cart/cart.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { UploadModule } from './upload/upload.module';
import { CustomersModule } from './customers/customers.module';
import { CouponsModule } from './coupons/coupons.module';
import { ReviewsModule } from './reviews/reviews.module';
import { InventoryModule } from './inventory/inventory.module';

@Module({
  imports: [
    // Global environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // MongoDB connection via Mongoose
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),

    // Auth module (User registration and authentication)
    AuthModule,

    // Categories module (Suits, Kurtis, Sarees & subcategories)
    CategoriesModule,

    // Products module (Artisanal luxury products catalog & management)
    ProductsModule,

    // Orders module (Checkout, customer order tracking, admin status workflows)
    OrdersModule,

    // Cart module (Persistent user shopping bag & sync)
    CartModule,

    // Wishlist module (Persistent user wishlist & toggle)
    WishlistModule,

    // Upload module (Images and cover photos)
    UploadModule,

    // Customers module (Patron directory, order metrics & profiles)
    CustomersModule,

    // Coupons module (Promo codes, discounts & checkout validation)
    CouponsModule,

    // Reviews module (Patron reviews, ratings & moderation)
    ReviewsModule,

    // Inventory module (Stock control, warehouse levels & reorder thresholds)
    InventoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
