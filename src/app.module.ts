import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './core/infrastructure/database/database.module';
import { AccountModule } from './modules/account/account.module';
import { PaymentModule } from './modules/payment/payment.module';

@Module({
  imports: [DatabaseModule, AccountModule, PaymentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
