# Email Insights Pro

A powerful email campaign analytics dashboard built with Next.js and Firebase, integrated with EP MailPro/MailWizz API.

## 🚀 Features

- **Real-time Campaign Analytics**: View campaign performance, open rates, click rates, and more
- **Email List Management**: Track subscriber data and unsubscribes
- **Automated Sync**: Manual and scheduled sync with EP MailPro API
- **Modern Dashboard**: Clean, responsive interface built with Tailwind CSS
- **Firebase Integration**: Authentication and data storage
- **Development-Friendly**: Works with mock data when API is not configured

## 🔧 Setup & Configuration

### 1. Clone and Install
```bash
git clone <repository-url>
cd Email-Insights-Pro
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# EP MailPro / MailWizz API Configuration
# Get your API key from: https://app.epmailpro.com/customer/api-keys
EPMAILPRO_PUBLIC_KEY=your_mailwizz_api_key_here

# Firebase Configuration (optional - for production)
# Get these from your Firebase project settings
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (for server-side operations in production)
FIREBASE_SERVICE_ACCOUNT_KEY_JSON=your_service_account_json_here
```

### 3. Development Mode

The application works perfectly in development mode with mock data:

```bash
npm run dev
```

Visit `http://localhost:9002` to see the application running.

## 🔌 API Integration

### EP MailPro Configuration

1. **Get your API Key**: 
   - Login to your EP MailPro/MailWizz account
   - Go to API Keys section
   - Generate a new public API key

2. **Update Environment**:
   - Replace `test_api_key_replace_with_real_key` with your actual API key in `.env.local`

3. **API Endpoints**:
   - Campaigns: `https://app.bluespaghetti1.com/api/index.php/campaigns`
   - Lists: `https://app.bluespaghetti1.com/api/index.php/lists`
   - Stats: `https://app.bluespaghetti1.com/api/index.php/campaigns/{id}/stats`

### Mock Data for Development

When the EP MailPro API is not available or not configured, the application automatically uses mock data:

- ✅ **Mock Campaigns**: 2 sample campaigns with realistic data
- ✅ **Mock Stats**: Random campaign statistics (opens, clicks, etc.)
- ✅ **Mock Lists**: 2 sample email lists
- ✅ **Mock Unsubscribers**: Sample unsubscribed users

## 📊 API Endpoints

The application provides these API endpoints:

- `GET /api/campaigns` - Fetch campaign data
- `GET /api/unsubscribers` - Fetch unsubscriber data
- `GET /api/manual-sync` - Trigger manual sync
- All endpoints return JSON and include proper error handling

## 🚨 Fixed Issues

This version fixes several critical issues:

1. **✅ API 500 Errors**: All API endpoints now return proper JSON responses
2. **✅ Sync Button JSON Errors**: Manual sync now returns JSON instead of HTML error pages
3. **✅ Firebase Configuration**: Graceful handling when Firebase is not configured
4. **✅ Network Connectivity**: Fallback to mock data when EP MailPro API is unreachable
5. **✅ Development Experience**: Fully functional without external dependencies

## 🏗️ Building for Production

```bash
npm run build
npm start
```

## 🔍 Debugging

Check the browser console and server logs for detailed information:

- **Development**: All API calls are logged with detailed status information
- **Mock Data Indicators**: Clear messages when using mock data vs real API data
- **Firebase Status**: Clear logging of Firebase initialization status

## 📝 Notes

- The application is designed to work seamlessly in development without any external API configuration
- Mock data provides realistic testing scenarios
- All error conditions are handled gracefully with proper JSON responses
- Firebase integration is optional and degrades gracefully when not configured
