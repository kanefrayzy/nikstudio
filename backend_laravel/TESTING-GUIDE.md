# Backend Testing Guide - Admin Auth Improvements

This document provides comprehensive testing instructions for the admin authentication improvements implemented in tasks 2-6.

## Prerequisites

Before running tests, ensure:
1. PostgreSQL server is running
2. Test database exists (or SQLite extension is installed for in-memory testing)
3. Laravel dependencies are installed (`composer install`)

## Test Setup

### Option 1: Using PostgreSQL (Recommended)

1. Create a test database:
```bash
createdb nik_studio_test
```

2. Run migrations for test database:
```bash
php artisan migrate --env=testing --force
```

### Option 2: Using SQLite (Alternative)

If you prefer SQLite for testing, update `phpunit.xml`:

```xml
<env name="DB_CONNECTION" value="sqlite"/>
<env name="DB_DATABASE" value=":memory:"/>
```

Note: Requires PHP SQLite extension to be enabled.

## Running Automated Tests

### Run All Tests
```bash
php artisan test
```

### Run Specific Test Suites

**Change Password Tests:**
```bash
php artisan test --filter=ChangePasswordTest
```

**Login with Remember Me Tests:**
```bash
php artisan test --filter=LoginWithRememberMeTest
```

**Token Refresh Middleware Tests:**
```bash
php artisan test --filter=TokenRefreshMiddlewareTest
```

### Run Unit Tests Only
```bash
php artisan test --testsuite=Unit
```

### Run Feature Tests Only
```bash
php artisan test --testsuite=Feature
```

## Test Coverage

### 1. Change Password Tests (`tests/Unit/ChangePasswordTest.php`)

Tests the `/api/admin/change-password` endpoint:

- ✅ User can change password with valid data
- ✅ Password change fails with incorrect current password
- ✅ Password change fails with short password (< 8 characters)
- ✅ Password change fails when passwords don't match
- ✅ Password change requires authentication
- ✅ Password change validates required fields

**Expected Behavior:**
- Current password must be correct
- New password must be at least 8 characters
- New password and confirmation must match
- Password is properly hashed in database
- Endpoint requires authentication

### 2. Login with Remember Me Tests (`tests/Unit/LoginWithRememberMeTest.php`)

Tests the `/api/login` endpoint with remember me functionality:

- ✅ Login without remember me creates standard token (8 hours)
- ✅ Login with remember me creates long-term token (30 days)
- ✅ Login with username instead of email works
- ✅ Login fails with incorrect credentials
- ✅ Login deletes old tokens
- ✅ Login validates required fields
- ✅ Login returns user data

**Expected Behavior:**
- Standard token expires in 480 minutes (8 hours)
- Remember me token expires in 43200 minutes (30 days)
- Old tokens are deleted on new login
- Returns token, user data, and expires_at timestamp

### 3. Token Refresh Middleware Tests (`tests/Feature/TokenRefreshMiddlewareTest.php`)

Tests the `RefreshTokenMiddleware` functionality:

- ✅ Middleware refreshes token expiring within 30 minutes
- ✅ Middleware does not refresh token with more than 30 minutes
- ✅ Middleware does not refresh expired token
- ✅ Middleware handles request without token
- ✅ Middleware preserves original token lifetime when refreshing
- ✅ Middleware works with remember me tokens (30 days)
- ✅ Middleware handles token without expiration

**Expected Behavior:**
- Tokens expiring in ≤30 minutes are automatically refreshed
- New token is returned in `X-New-Token` header
- New expiration is returned in `X-Token-Expires-At` header
- Original token lifetime is preserved
- Old token is deleted after refresh

## Manual Testing with Postman/Insomnia

### Setup

1. **Base URL:** `http://localhost:8000/api`
2. **Headers for authenticated requests:**
   ```
   Authorization: Bearer {your_token}
   Content-Type: application/json
   Accept: application/json
   ```

### Test 1: Login without Remember Me

**Request:**
```http
POST /api/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "your_password",
  "remember": false
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "token": "1|abc123...",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@example.com"
  },
  "expires_at": "2025-10-06T16:00:00.000000Z"
}
```

**Verify:**
- Token expires in approximately 8 hours from now
- Save the token for subsequent requests

### Test 2: Login with Remember Me

**Request:**
```http
POST /api/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "your_password",
  "remember": true
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "token": "2|xyz789...",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@example.com"
  },
  "expires_at": "2025-11-05T08:00:00.000000Z"
}
```

**Verify:**
- Token expires in approximately 30 days from now
- Old token from Test 1 is no longer valid

### Test 3: Change Password - Success

**Request:**
```http
POST /api/admin/change-password
Authorization: Bearer {your_token}
Content-Type: application/json

{
  "current_password": "your_current_password",
  "new_password": "new_password_123",
  "new_password_confirmation": "new_password_123"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Пароль успешно изменён"
}
```

**Verify:**
- Can login with new password
- Cannot login with old password

### Test 4: Change Password - Wrong Current Password

**Request:**
```http
POST /api/admin/change-password
Authorization: Bearer {your_token}
Content-Type: application/json

{
  "current_password": "wrong_password",
  "new_password": "new_password_123",
  "new_password_confirmation": "new_password_123"
}
```

**Expected Response (422):**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "current_password": ["Текущий пароль неверен"]
  }
}
```

### Test 5: Change Password - Short Password

**Request:**
```http
POST /api/admin/change-password
Authorization: Bearer {your_token}
Content-Type: application/json

{
  "current_password": "your_current_password",
  "new_password": "short",
  "new_password_confirmation": "short"
}
```

**Expected Response (422):**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "new_password": ["Пароль должен содержать минимум 8 символов"]
  }
}
```

### Test 6: Change Password - Passwords Don't Match

**Request:**
```http
POST /api/admin/change-password
Authorization: Bearer {your_token}
Content-Type: application/json

{
  "current_password": "your_current_password",
  "new_password": "new_password_123",
  "new_password_confirmation": "different_password"
}
```

**Expected Response (422):**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "new_password": ["Пароли не совпадают"]
  }
}
```

### Test 7: Token Refresh - Token Expiring Soon

**Setup:**
1. Login and get a token
2. Manually update the token's `expires_at` in database to 25 minutes from now:
   ```sql
   UPDATE personal_access_tokens 
   SET expires_at = NOW() + INTERVAL '25 minutes'
   WHERE token = 'your_hashed_token';
   ```

**Request:**
```http
GET /api/me
Authorization: Bearer {your_token}
```

**Expected Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@example.com"
  }
}
```

**Verify Response Headers:**
- `X-New-Token`: Contains new token string
- `X-Token-Expires-At`: Contains new expiration timestamp

**Verify:**
- Old token is no longer valid
- New token from header works for subsequent requests

### Test 8: Token Refresh - Token Not Expiring Soon

**Setup:**
1. Login and get a fresh token (expires in 8 hours)

**Request:**
```http
GET /api/me
Authorization: Bearer {your_token}
```

**Expected Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@example.com"
  }
}
```

**Verify Response Headers:**
- `X-New-Token`: Header should NOT be present
- `X-Token-Expires-At`: Header should NOT be present

### Test 9: Unauthenticated Request

**Request:**
```http
POST /api/admin/change-password
Content-Type: application/json

{
  "current_password": "password",
  "new_password": "new_password_123",
  "new_password_confirmation": "new_password_123"
}
```

**Expected Response (401):**
```json
{
  "message": "Unauthenticated."
}
```

### Test 10: Rate Limiting

**Request (repeat 6 times quickly):**
```http
POST /api/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "wrong_password"
}
```

**Expected Response (429) after 5 attempts:**
```json
{
  "message": "Too Many Attempts."
}
```

## Testing Checklist

Use this checklist to verify all functionality:

### Authentication
- [ ] Login with email works
- [ ] Login with username works
- [ ] Login with wrong credentials fails
- [ ] Login without remember me creates 8-hour token
- [ ] Login with remember me creates 30-day token
- [ ] Old tokens are deleted on new login
- [ ] Logout deletes current token

### Password Change
- [ ] Can change password with valid data
- [ ] Password is properly hashed in database
- [ ] Cannot change password with wrong current password
- [ ] Cannot use password shorter than 8 characters
- [ ] Passwords must match
- [ ] All fields are required
- [ ] Requires authentication
- [ ] Can login with new password after change

### Token Refresh
- [ ] Token expiring in <30 minutes is refreshed
- [ ] Token with >30 minutes is not refreshed
- [ ] New token is returned in X-New-Token header
- [ ] New expiration is returned in X-Token-Expires-At header
- [ ] Old token is deleted after refresh
- [ ] Original token lifetime is preserved
- [ ] Works with both standard and remember me tokens
- [ ] Expired tokens are rejected (401)

### Error Handling
- [ ] 401 for unauthenticated requests
- [ ] 422 for validation errors with field-specific messages
- [ ] 429 for rate limit exceeded
- [ ] Error messages are in Russian

## Troubleshooting

### Tests Fail with Database Connection Error

**Problem:** `could not find driver` or connection refused

**Solutions:**
1. Ensure PostgreSQL is running: `pg_ctl status`
2. Create test database: `createdb nik_studio_test`
3. Check database credentials in `.env` and `phpunit.xml`
4. Alternatively, use SQLite (see Option 2 above)

### Tests Fail with "Table not found"

**Problem:** Migrations haven't run on test database

**Solution:**
```bash
php artisan migrate --env=testing --force
```

### Token Refresh Tests Fail

**Problem:** Middleware not registered

**Solution:** Verify `RefreshTokenMiddleware` is registered in `app/Http/Kernel.php`:
```php
protected $middlewareGroups = [
    'api' => [
        // ...
        \App\Http\Middleware\RefreshTokenMiddleware::class,
    ],
];
```

## Continuous Integration

For CI/CD pipelines, add this to your workflow:

```yaml
- name: Run Tests
  run: |
    php artisan migrate --env=testing --force
    php artisan test
```

## Next Steps

After all tests pass:
1. Proceed to frontend implementation (tasks 8-15)
2. Perform integration testing with frontend
3. Conduct end-to-end testing
4. Verify in production-like environment
