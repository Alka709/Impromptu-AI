const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const http = require('http');
const https = require('https');
const { eq } = require('drizzle-orm');
const { db } = require('../db');
const { users } = require('../db/schema/users');
const { signup, login } = require('../controllers/authController');
const { handleGoogleCallback } = require('../controllers/googleAuthController');

// ==========================================
// MOCK HTTP/HTTPS GLOBALLY FOR GOOGLE OAUTH TEST
// ==========================================
const originalRequest = https.request;
let mockGoogleTokenResponse = { access_token: 'mock-access-token' };
let mockGoogleProfileResponse = {
  id: 'google-oauth-test-id',
  email: 'TESTGOOGLEOAUTH@GMAIL.COM',
  name: 'Google Test User',
  verified_email: true,
};

https.request = function(options, callback) {
  const hostname = options.hostname || options.host;
  const path = options.path;

  // Intercept Google OAuth requests
  if (hostname === 'oauth2.googleapis.com' && path === '/token') {
    const mockRes = new http.IncomingMessage();
    mockRes.statusCode = 200;
    
    // Simulate data stream
    setTimeout(() => {
      mockRes.emit('data', Buffer.from(JSON.stringify(mockGoogleTokenResponse)));
      mockRes.emit('end');
    }, 10);
    
    if (callback) callback(mockRes);
    
    return {
      on: () => {},
      write: () => {},
      end: () => {},
    };
  }

  if (hostname === 'www.googleapis.com' && path === '/oauth2/v2/userinfo') {
    const mockRes = new http.IncomingMessage();
    mockRes.statusCode = 200;
    
    // Simulate data stream
    setTimeout(() => {
      mockRes.emit('data', Buffer.from(JSON.stringify(mockGoogleProfileResponse)));
      mockRes.emit('end');
    }, 10);
    
    if (callback) callback(mockRes);
    
    return {
      on: () => {},
      write: () => {},
      end: () => {},
    };
  }

  // Fallback to original request
  return originalRequest.apply(this, arguments);
};

// ==========================================
// MOCK EXPRESS RESPONSES
// ==========================================
const mockResponse = () => {
  const res = {};
  res.statusCode = 200;
  res.redirectUrl = null;
  res.status = function(code) {
    this.statusCode = code;
    return this;
  };
  res.json = function(data) {
    this.jsonData = data;
    return this;
  };
  res.cookie = function(name, val, options) {
    this.cookieData = { name, val, options };
    return this;
  };
  res.redirect = function(url) {
    this.redirectUrl = url;
    return this;
  };
  return res;
};

// ==========================================
// RUN TESTS
// ==========================================
async function main() {
  console.log('--- STARTING AUTH & GOOGLE OAUTH VALIDATION TESTS (REAL DB) ---\n');

  try {
    // Clean up any stale test users from previous runs
    await db.delete(users).where(eq(users.email, 'testcaseinsensitive@gmail.com'));
    await db.delete(users).where(eq(users.email, 'testgoogleoauth@gmail.com'));

    // --------------------------------------------------
    // Test 1: Signup with a non-Gmail address
    // --------------------------------------------------
    console.log('Test 1: Signup with non-Gmail address (test@yahoo.com)...');
    const req1 = {
      body: {
        email: 'test@yahoo.com',
        name: 'Yahoo User',
        password: 'Password123',
        confirmPassword: 'Password123',
      },
    };
    const res1 = mockResponse();
    await signup(req1, res1);
    console.log('Result Status:', res1.statusCode);
    console.log('Result Data:', JSON.stringify(res1.jsonData));
    if (res1.statusCode === 400 && res1.jsonData.error.includes('Only Gmail addresses')) {
      console.log('✅ Test 1 Passed!\n');
    } else {
      console.error('❌ Test 1 Failed!\n');
    }

    // --------------------------------------------------
    // Test 2: Signup with weak password (no number)
    // --------------------------------------------------
    console.log('Test 2: Signup with weak password (no number)...');
    const req2 = {
      body: {
        email: 'testcaseinsensitive@gmail.com',
        name: 'Gmail User',
        password: 'password',
        confirmPassword: 'password',
      },
    };
    const res2 = mockResponse();
    await signup(req2, res2);
    console.log('Result Status:', res2.statusCode);
    console.log('Result Data:', JSON.stringify(res2.jsonData));
    if (res2.statusCode === 400 && res2.jsonData.error.includes('Password must be at least 8 characters')) {
      console.log('✅ Test 2 Passed!\n');
    } else {
      console.error('❌ Test 2 Failed!\n');
    }

    // --------------------------------------------------
    // Test 3: Signup Success & Case Normalization
    // --------------------------------------------------
    console.log('Test 3: Signup with valid Gmail in mixed case (TestCaseInsensitive@Gmail.com)...');
    const req3 = {
      body: {
        email: 'TestCaseInsensitive@Gmail.com',
        name: 'Case Insensitive User',
        password: 'Password123',
        confirmPassword: 'Password123',
      },
    };
    const res3 = mockResponse();
    await signup(req3, res3);
    console.log('Result Status:', res3.statusCode);
    console.log('Result Data:', JSON.stringify(res3.jsonData));
    
    // Verify it exists in the database with lowercased email
    const dbUser = await db.select().from(users).where(eq(users.email, 'testcaseinsensitive@gmail.com'));
    console.log(`Database Lookup result for lowercase email: ${dbUser.length} user(s) found.`);
    
    if (res3.statusCode === 201 && dbUser.length === 1 && dbUser[0].email === 'testcaseinsensitive@gmail.com') {
      console.log('✅ Test 3 Passed! (Account created & email normalized to lowercase)\n');
    } else {
      console.error('❌ Test 3 Failed!\n');
    }

    // --------------------------------------------------
    // Test 4: Regression Test - Case Insensitive Login
    // --------------------------------------------------
    console.log('Test 4: Logging in with UPPERCASE email variant (TESTCASEINSENSITIVE@GMAIL.COM)...');
    const req4 = {
      body: {
        email: 'TESTCASEINSENSITIVE@GMAIL.COM',
        password: 'Password123',
      },
    };
    const res4 = mockResponse();
    await login(req4, res4);
    console.log('Result Status:', res4.statusCode);
    console.log('Result Data:', JSON.stringify(res4.jsonData));
    
    if (res4.statusCode === 200 && res4.jsonData.user.email === 'testcaseinsensitive@gmail.com') {
      console.log('✅ Test 4 Passed! (Authenticated successfully into lowercase account)\n');
    } else {
      console.error('❌ Test 4 Failed!\n');
    }

    // --------------------------------------------------
    // Test 5: Duplicate Prevention
    // --------------------------------------------------
    console.log('Test 5: Signup with duplicate email in lowercase (testcaseinsensitive@gmail.com)...');
    const req5 = {
      body: {
        email: 'testcaseinsensitive@gmail.com',
        name: 'Duplicate User',
        password: 'Password123',
        confirmPassword: 'Password123',
      },
    };
    const res5 = mockResponse();
    await signup(req5, res5);
    console.log('Result Status:', res5.statusCode);
    console.log('Result Data:', JSON.stringify(res5.jsonData));
    if (res5.statusCode === 400 && res5.jsonData.error.includes('already exists')) {
      console.log('✅ Test 5 Passed!\n');
    } else {
      console.error('❌ Test 5 Failed!\n');
    }

    // --------------------------------------------------
    // Test 6: Google OAuth Callback Normalization
    // --------------------------------------------------
    console.log('Test 6: Google OAuth Callback flow for user with uppercase email (TESTGOOGLEOAUTH@GMAIL.COM)...');
    const req6 = {
      query: { code: 'mock-code' },
    };
    const res6 = mockResponse();
    await handleGoogleCallback(req6, res6);
    console.log('Result Redirect:', res6.redirectUrl);
    
    // Check if user was created with lowercase email
    const googleUserDb = await db.select().from(users).where(eq(users.email, 'testgoogleoauth@gmail.com'));
    console.log(`Database Lookup result for lowercase Google email: ${googleUserDb.length} user(s) found.`);
    
    if (googleUserDb.length === 1 && googleUserDb[0].email === 'testgoogleoauth@gmail.com' && googleUserDb[0].google_id === 'google-oauth-test-id') {
      console.log('✅ Test 6 Passed! (Google account created with lowercase email normalization)\n');
    } else {
      console.error('❌ Test 6 Failed!\n');
    }

    // --------------------------------------------------
    // Test 7: Google OAuth Existing Sign-in check
    // --------------------------------------------------
    console.log('Test 7: Second Google OAuth Callback for existing Google user (should log in, not duplicate)...');
    const res7 = mockResponse();
    await handleGoogleCallback(req6, res7);
    console.log('Result Redirect:', res7.redirectUrl);
    
    const countUsers = await db.select().from(users).where(eq(users.email, 'testgoogleoauth@gmail.com'));
    if (res7.redirectUrl && !res7.redirectUrl.includes('error') && countUsers.length === 1) {
      console.log('✅ Test 7 Passed! (Successfully logged in existing user without duplication)\n');
    } else {
      console.error('❌ Test 7 Failed!\n');
    }

    // --------------------------------------------------
    // Test 8: Login for existing non-Gmail users
    // --------------------------------------------------
    console.log('Checking for any non-Gmail users in the database...');
    const allUsers = await db.select().from(users);
    const nonGmailUser = allUsers.find(u => u.email && !u.email.endsWith('@gmail.com'));
    if (nonGmailUser) {
      console.log(`Found existing non-Gmail user: "${nonGmailUser.email}".`);
      console.log('Test 8: Testing login for non-Gmail user with wrong password...');
      const req8 = {
        body: {
          email: nonGmailUser.email,
          password: 'wrong_password',
        },
      };
      const res8 = mockResponse();
      await login(req8, res8);
      console.log('Result Status (should be 401, not 400):', res8.statusCode);
      console.log('Result Data:', JSON.stringify(res8.jsonData));
      if (res8.statusCode === 401 && res8.jsonData.error === 'Invalid email or password') {
        console.log('✅ Test 8 Passed! (Existing non-Gmail user login bypassed signup check correctly)\n');
      } else {
        console.error('❌ Test 8 Failed!\n');
      }
    } else {
      console.log('No non-Gmail users found in database. Skipping Test 8.\n');
    }

  } catch (error) {
    console.error('Test suite error:', error);
  } finally {
    // --------------------------------------------------
    // CLEANUP
    // --------------------------------------------------
    console.log('Cleaning up temporary test users...');
    const del1 = await db.delete(users).where(eq(users.email, 'testcaseinsensitive@gmail.com')).returning();
    const del2 = await db.delete(users).where(eq(users.email, 'testgoogleoauth@gmail.com')).returning();
    console.log(`Cleanup complete: deleted ${del1.length + del2.length} user(s).`);
    
    // Restore global request handler
    https.request = originalRequest;
    console.log('\n--- ALL TESTS COMPLETED ---');
    process.exit(0);
  }
}

main();
