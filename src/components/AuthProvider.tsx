# EP MailPro / MailWizz API Configuration
# Get your API key from: https://app.epmailpro.com/customer/api-keys
EPMAILPRO_PUBLIC_KEY=your_mailwizz_api_key_here

# Firebase Configuration (if using Firebase for authentication and data storage)
# Get these from your Firebase project settings
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (for server-side operations)
# This should be the private key JSON as a single line
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PROJECT_ID=your_project_id

# Email Configuration (for sending reports)
EMAIL_FROM=your-email@domain.com
EMAIL_PASSWORD=your_email_password_or_app_password
EMAIL_TO=recipient@domain.com