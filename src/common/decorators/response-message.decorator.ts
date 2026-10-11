import { SetMetadata } from '@nestjs/common';
import { RESPONSE_MESSAGE_METADATA } from '../constants/response.constants';

/**
 * Decorator to assign a custom success message to any route handler.
 * Example: @ResponseMessage('User details retrieved successfully')
 */
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_METADATA, message);
