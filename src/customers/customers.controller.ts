import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ResponseMessage('Customers list retrieved successfully')
  async findAll(@Query() query: any) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @ResponseMessage('Customer profile retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Put(':id')
  @ResponseMessage('Customer profile updated successfully')
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, updateCustomerDto);
  }
}
