import {
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Inquiry, InquiryDocument, InquiryStatus } from './schemas/inquiry.schema';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryStatusDto } from './dto/update-inquiry-status.dto';

@Injectable()
export class InquiriesService implements OnModuleInit {
  constructor(
    @InjectModel(Inquiry.name) private inquiryModel: Model<InquiryDocument>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultInquiries();
  }

  private async seedDefaultInquiries() {
    const count = await this.inquiryModel.countDocuments();
    if (count > 0) return;

    const defaultInquiries = [
      {
        name: 'Kavita Singhania',
        email: 'kavita.singhania@heritage.in',
        phone: '+91 98765 43210',
        message:
          'Seeking a bridal consultation for an upcoming December wedding. Interested in exploring pure Banarasi silk trousseau pieces and custom hand embroidery.',
        status: InquiryStatus.NEW,
        notes: 'Requested private Saturday afternoon preview.',
        date: '17 Oct 2026',
      },
      {
        name: 'Rhea Mehra',
        email: 'rhea.mehra@atelier.com',
        phone: '+91 99123 45678',
        message:
          'Would love to customize the sleeve silhouette and neckline depth on the Royal Emerald 3 Pcs Stitched Suit Set for a family gala.',
        status: InquiryStatus.IN_PROGRESS,
        notes: 'Measurement sheet sent via WhatsApp.',
        date: '16 Oct 2026',
      },
      {
        name: 'Ananya Deshmukh',
        email: 'ananya.deshmukh@gmail.com',
        phone: '+91 91234 56789',
        message:
          'Inquiring if the Jamdani unstitched collection can be tailored with a matching Organza dupatta in royal pastel blush.',
        status: InquiryStatus.RESOLVED,
        notes: 'Custom swatch approved and dispatched.',
        date: '14 Oct 2026',
      },
      {
        name: 'Devika Sen',
        email: 'devika.sen@outlook.com',
        phone: '+91 98450 11223',
        message:
          'Do you offer express insured delivery to London, UK? Looking to order 2 silk sarees for Diwali celebrations.',
        status: InquiryStatus.ARCHIVED,
        notes: 'DHL Express rate card shared. Client completed online checkout.',
        date: '10 Oct 2026',
      },
    ];

    try {
      await this.inquiryModel.insertMany(defaultInquiries);
      console.log('Seed inquiries successfully inserted.');
    } catch (e: any) {
      console.warn('Failed to seed default inquiries:', e.message);
    }
  }

  /**
   * Create a new inquiry (Public Contact / Consultation Form)
   */
  async create(createInquiryDto: CreateInquiryDto): Promise<InquiryDocument> {
    const formattedDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const inquiry = await this.inquiryModel.create({
      name: createInquiryDto.name.trim(),
      email: createInquiryDto.email.trim().toLowerCase(),
      phone: createInquiryDto.phone ? createInquiryDto.phone.trim() : '',
      message: createInquiryDto.message.trim(),
      status: InquiryStatus.NEW,
      notes: '',
      date: formattedDate,
    });

    return inquiry;
  }

  /**
   * Find all inquiries with optional status filtering & full-text search
   */
  async findAll(query: any = {}): Promise<InquiryDocument[]> {
    const filter: Record<string, any> = {};

    if (query.status && query.status !== 'All') {
      filter.status = query.status;
    }

    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { message: regex },
      ];
    }

    return this.inquiryModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  /**
   * Find a single inquiry by ID
   */
  async findOne(id: string): Promise<InquiryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid inquiry ID: "${id}"`);
    }

    const inquiry = await this.inquiryModel.findById(id).exec();
    if (!inquiry) {
      throw new NotFoundException(`Inquiry with ID "${id}" not found`);
    }

    return inquiry;
  }

  /**
   * Update status & optional notes of an inquiry (Admin workflow)
   */
  async updateStatus(
    id: string,
    updateDto: UpdateInquiryStatusDto,
  ): Promise<InquiryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid inquiry ID: "${id}"`);
    }

    const inquiry = await this.inquiryModel.findById(id);
    if (!inquiry) {
      throw new NotFoundException(`Inquiry with ID "${id}" not found`);
    }

    if (updateDto.status) {
      inquiry.status = updateDto.status;
    }

    if (updateDto.notes !== undefined) {
      inquiry.notes = updateDto.notes;
    }

    await inquiry.save();
    return inquiry;
  }

  /**
   * Delete an inquiry (Admin workflow)
   */
  async remove(id: string): Promise<{ message: string; id: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid inquiry ID: "${id}"`);
    }

    const inquiry = await this.inquiryModel.findById(id);
    if (!inquiry) {
      throw new NotFoundException(`Inquiry with ID "${id}" not found`);
    }

    await this.inquiryModel.findByIdAndDelete(id);
    return { message: 'Inquiry deleted successfully', id };
  }
}
