import { IsString, IsNotEmpty } from 'class-validator';

export class RejectDesignSubmissionDto {
  @IsString() @IsNotEmpty()
  rejectedReason: string;
}
