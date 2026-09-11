#!/usr/bin/env node

/**
 * Script to create a test account for Google Play Store review
 * Usage: 
 *   node scripts/create-test-account.js <phone_number> <otp>
 * 
 * Example:
 *   node scripts/create-test-account.js 9999999999 1234
 */

const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

async function createTestAccount() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node scripts/create-test-account.js <phone_number> <otp>');
    process.exit(1);
  }
  
  const phoneNumber = args[0];
  const otp = args[1];
  const description = args[2] || 'Test account for Google Play Store review';
  
  try {
    // Connect to database
    const sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false
    });
    
    // Authenticate
    await sequelize.authenticate();
    console.log('Connected to the database');
    
    // Define test account model
    const TestAccount = sequelize.define('TestAccount', {
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      otp: {
        type: DataTypes.STRING,
        allowNull: false
      },
      isTestAccount: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true
      }
    }, {
      tableName: 'test_accounts',
      timestamps: true
    });
    
    // Create or update test account
    const [testAccount, created] = await TestAccount.findOrCreate({
      where: { phone: phoneNumber },
      defaults: {
        phone: phoneNumber,
        otp,
        isTestAccount: true,
        description
      }
    });
    
    if (!created) {
      testAccount.otp = otp;
      testAccount.description = description;
      await testAccount.save();
      console.log(`Updated test account for phone number ${phoneNumber} with OTP ${otp}`);
    } else {
      console.log(`Created test account for phone number ${phoneNumber} with OTP ${otp}`);
    }
    
    // Set environment variables for test account
    console.log('\nTo enable this test account, add the following to your .env file:');
    console.log('TEST_ACCOUNT_ENABLED=true');
    console.log(`TEST_ACCOUNT_PHONE=${phoneNumber}`);
    console.log(`TEST_ACCOUNT_OTP=${otp}`);
    
    await sequelize.close();
  } catch (error) {
    console.error('Error creating test account:', error);
    process.exit(1);
  }
}

createTestAccount(); 