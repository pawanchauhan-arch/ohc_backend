import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
// import { JwtStrategy } from './strategies/jwt.strategy';
// import { auth } from 'firebase-admin';
import { AuthService } from './auth.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: 'LASTMILECAREHEALTH'  // stataic value only for the testing purpose
    //   process.env.JWT_SECRET, 
    //   LASTMILECAREHEALTH
    }),
  ],
  providers: [AuthService],
  exports: [PassportModule, AuthService],
})
export class AuthModule {}
