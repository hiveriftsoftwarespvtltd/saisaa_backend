# SAISAA Backend Service

Enterprise NestJS Backend with MongoDB (Mongoose) and Unified API Response Architecture for **SAISAA Luxury Ethnic Wear**.

---

## 🌟 Architecture Highlights

1. **NestJS 11 + TypeScript** core architecture.
2. **MongoDB Integration with Mongoose**:
   - Asynchronous `MongooseModule.forRootAsync` via `@nestjs/mongoose`.
   - Global `ConfigModule` management for environment variables.
   - Base document schema with automatic timestamps (`createdAt`, `updatedAt`) and clean JSON serialization (`_id` to `id`, removal of `__v`).
   - Sample domain schema (`SampleProduct`) demonstrating indexing, validation, and `SchemaFactory`.
3. **Unified API Response Architecture**:
   - **`ResponseInterceptor`**: All successful responses are automatically wrapped in a standardized JSON payload.
   - **`@ResponseMessage('...')`**: Custom metadata decorator to specify human-friendly response messages on any route handler.
   - **`HttpExceptionFilter`**: Catches all HTTP and runtime exceptions, formatting them in the exact same unified structure.
   - **`ValidationPipe`**: Automatic DTO validation with `class-validator` and `class-transformer`.

---

## 📦 Standard API Response Formats

### 1. Success Response Structure (`200 OK`, `201 Created`, etc.)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "SAISAA backend service is operational",
  "data": {
    "name": "SAISAA API Services",
    "version": "1.0.0",
    "status": "healthy",
    "environment": "development",
    "timestamp": "2026-10-07T16:25:00.000Z"
  },
  "timestamp": "2026-10-07T16:25:00.000Z",
  "path": "/api/v1/health"
}
```

### 2. Error Response Structure (`400 Bad Request`, `404 Not Found`, etc.)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "price must not be less than 0",
    "sku should not be empty"
  ],
  "timestamp": "2026-10-07T16:25:00.000Z",
  "path": "/api/v1/products"
}
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```env
NODE_ENV=development
PORT=5000
API_PREFIX=api/v1
MONGODB_URI=mongodb://localhost:27017/saisaa_db
CLIENT_URL=http://localhost:5173
```

### 3. Start Development Server
```bash
npm run start:dev
```

### 4. Build for Production
```bash
npm run build
npm run start:prod
```

---

## 📁 Project Directory Layout

```
saisaa_beckend/
├── src/
│   ├── common/
│   │   ├── constants/
│   │   │   └── response.constants.ts        # Metadata keys
│   │   ├── decorators/
│   │   │   └── response-message.decorator.ts # @ResponseMessage decorator
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts     # Global unified error filter
│   │   ├── interceptors/
│   │   │   └── response.interceptor.ts      # Global unified response transformer
│   │   ├── interfaces/
│   │   │   └── api-response.interface.ts    # Response TypeScript interfaces
│   │   └── schemas/
│   │       ├── base.schema.ts               # Base Mongoose document class
│   │       └── sample.schema.ts             # Sample Mongoose model & indexes
│   ├── config/
│   │   └── database.config.ts               # Database options factory
│   ├── app.controller.ts                    # Root health controller
│   ├── app.module.ts                        # Master module with Mongoose & Config
│   ├── app.service.ts                       # Health service
│   └── main.ts                              # Bootstrap with Pipes, Filters, Interceptors
├── .env
├── .env.example
├── .gitignore
├── nest-cli.json
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```
