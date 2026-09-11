#!/usr/bin/env node

/**
 * Script to disable all test accounts
 * This should be run before deploying to production
 * 
 * Usage: 
 *   node scripts/disable-test-accounts.js
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

async function disableTestAccounts() {
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
    
    // Update environment variable in .env file
    console.log('To disable test accounts, set the following in your .env file:');
    console.log('TEST_ACCOUNT_ENABLED=false');
    
    // Get test accounts
    const result = await sequelize.query(
      'SELECT id, phone, description FROM test_accounts WHERE "isTestAccount" = true',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (result.length === 0) {
      console.log('No test accounts found');
    } else {
      console.log('\nFound the following test accounts:');
      result.forEach(account => {
        console.log(`- ID: ${account.id}, Phone: ${account.phone}, Description: ${account.description}`);
      });
      
      // Ask for confirmation to delete
      console.log('\nTo delete all test accounts, uncomment and run the following query:');
      console.log('-- DELETE FROM test_accounts WHERE "isTestAccount" = true;');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('Error disabling test accounts:', error);
    process.exit(1);
  }
}

disableTestAccounts(); 