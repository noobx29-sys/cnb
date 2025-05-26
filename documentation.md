# NEWTEX App Documentation

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Technology Stack](#technology-stack)
5. [Project Structure](#project-structure)
6. [Setup and Installation](#setup-and-installation)
7. [User Roles and Permissions](#user-roles-and-permissions)
8. [Core Functionality](#core-functionality)
9. [Admin Panel](#admin-panel)
10. [Firebase Integration](#firebase-integration)
11. [Development Guidelines](#development-guidelines)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)

## Overview

**NEWTEX** is a comprehensive React Native mobile application designed for Newtex Carpets Sdn Bhd, a carpet and textile company. The app serves as a digital catalog and business management platform, enabling customers to browse products, view promotions, and contact the company, while providing administrators with powerful tools to manage inventory, categories, promotions, and user accounts.

### Company Information
- **Company**: Newtex Carpets Sdn Bhd
- **App Version**: 1.0.3
- **Bundle ID**: com.cnb.app
- **Platform**: iOS and Android

## Features

### Customer Features
- **Product Catalog**: Browse comprehensive product listings with high-quality images
- **Category Navigation**: Hierarchical category system with subcategories and sub-subcategories
- **Search & Filter**: Advanced search functionality with sorting options
- **Promotions**: View active promotions and special offers
- **Company Information**: Access contact details, locations, and company information
- **Interactive Maps**: View office locations with integrated maps
- **Guest Mode**: Browse products without registration (limited features)
- **User Authentication**: Secure sign-up and sign-in functionality

### Administrative Features
- **Product Management**: Add, edit, delete, and manage product inventory
- **Category Management**: Create and organize hierarchical category structures
- **Promotion Management**: Create and manage promotional campaigns
- **User Management**: Manage user accounts and permissions
- **Role-Based Access Control**: Different permission levels for various user types
- **Stock Monitoring**: Track low stock products and inventory levels
- **Image Management**: Upload and manage product images with optimization

## Architecture

The app follows a modern React Native architecture with the following key principles:

### Design Patterns
- **Component-Based Architecture**: Modular, reusable UI components
- **Context API**: Global state management for authentication and theme
- **Custom Hooks**: Reusable logic for permissions and utilities
- **File-Based Routing**: Expo Router for navigation structure
- **Service Layer**: Centralized Firebase integration

### Key Architectural Decisions
- **Expo Framework**: For rapid development and deployment
- **TypeScript**: Type safety and better developer experience
- **Firebase Backend**: Real-time database, authentication, and storage
- **Responsive Design**: Adaptive layouts for different screen sizes
- **Performance Optimization**: Image caching, lazy loading, and optimized rendering

## Technology Stack

### Frontend
- **React Native**: 0.76.5
- **Expo**: ~52.0.20
- **TypeScript**: ^5.3.3
- **Expo Router**: ~4.0.14 (File-based routing)
- **React Navigation**: ^7.0.0

### UI/UX
- **React Native Paper**: ^5.12.5 (Material Design components)
- **Expo Vector Icons**: ^14.0.4
- **React Native Reanimated**: ~3.16.1 (Animations)
- **React Native Gesture Handler**: ~2.20.2
- **TailwindCSS**: ^3.4.17

### Backend & Services
- **Firebase**: ^11.2.0
  - Authentication
  - Firestore Database
  - Cloud Storage
  - Security Rules
- **Expo Updates**: Over-the-air updates

### Development Tools
- **Jest**: Testing framework
- **ESLint**: Code linting
- **Babel**: JavaScript compilation
- **Metro**: React Native bundler

### Device Features
- **Camera**: Image capture and selection
- **Location Services**: Maps and location-based features
- **File System**: Local storage and caching
- **Haptic Feedback**: Enhanced user experience
- **Push Notifications**: User engagement

## Project Structure

```
cnb/
├── app/                          # Main application screens (Expo Router)
│   ├── (auth)/                   # Authentication flow
│   │   ├── sign-in.tsx          # Sign-in screen
│   │   ├── sign-up.tsx          # Sign-up screen
│   │   └── _layout.tsx          # Auth layout
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── index.tsx            # Home screen (promotions & dashboard)
│   │   ├── product.tsx          # Product catalog
│   │   ├── contact.tsx          # Contact information & maps
│   │   ├── profile.tsx          # User profile & settings
│   │   ├── admin.tsx            # Admin dashboard
│   │   └── _layout.tsx          # Tab layout
│   ├── admin/                    # Admin panel screens
│   │   ├── product.tsx          # Product management
│   │   ├── category.tsx         # Category management
│   │   ├── promotion.tsx        # Promotion management
│   │   ├── users.tsx            # User management
│   │   └── product/[id].tsx     # Individual product editing
│   ├── product/[id].tsx         # Product detail view
│   ├── _layout.tsx              # Root layout
│   ├── index.tsx                # App entry point
│   └── +not-found.tsx           # 404 page
├── components/                   # Reusable UI components
│   ├── ui/                      # Base UI components
│   ├── Map/                     # Map-related components
│   ├── ThemedText.tsx           # Themed text component
│   ├── ThemedView.tsx           # Themed view component
│   ├── OptimizedImage.tsx       # Optimized image component
│   ├── CachedImage.tsx          # Cached image component
│   └── HeaderWithBack.tsx       # Navigation header
├── context/                      # React Context providers
│   ├── AuthContext.tsx          # Authentication state
│   └── ColorSchemeContext.tsx   # Theme management
├── hooks/                        # Custom React hooks
│   ├── usePermissions.ts        # User permissions logic
│   ├── useColorScheme.ts        # Theme hook
│   └── useThemeColor.ts         # Color theme utilities
├── services/                     # External service integrations
│   └── firebase.ts             # Firebase service layer
├── utils/                        # Utility functions
│   ├── auth.ts                  # Authentication utilities
│   └── responsive.ts           # Responsive design helpers
├── constants/                    # App constants
│   └── Colors.ts               # Color definitions
├── types/                        # TypeScript type definitions
├── assets/                       # Static assets (images, fonts)
├── credentials/                  # App credentials and certificates
├── functions/                    # Firebase Cloud Functions
├── scripts/                      # Build and deployment scripts
├── app.json                     # Expo configuration
├── package.json                 # Dependencies and scripts
├── firebaseConfig.ts           # Firebase configuration
├── eas.json                    # Expo Application Services config
└── firebase.json               # Firebase project configuration
```

## Setup and Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)
- Firebase project setup

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cnb
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   - Create a Firebase project
   - Enable Authentication, Firestore, and Storage
   - Configure security rules
   - Update `firebaseConfig.ts` with your project credentials

4. **Environment Configuration**
   - Update `app.json` with your app configuration
   - Configure EAS build settings in `eas.json`

5. **Start the development server**
   ```bash
   npx expo start
   ```

6. **Run on devices**
   ```bash
   # iOS
   npx expo run:ios
   
   # Android
   npx expo run:android
   ```

### Development Scripts
- `npm start`: Start Expo development server
- `npm run android`: Run on Android device/emulator
- `npm run ios`: Run on iOS device/simulator
- `npm run web`: Run web version
- `npm test`: Run test suite
- `npm run lint`: Run ESLint

## User Roles and Permissions

The app implements a comprehensive role-based access control system:

### User Roles

1. **Guest**
   - Browse products (no prices visible)
   - View promotions
   - Access contact information
   - Limited functionality

2. **User - No Price**
   - All Guest permissions
   - User account features
   - Cannot view product prices

3. **User - Price**
   - All User - No Price permissions
   - View product prices
   - Full customer experience

4. **Manager**
   - All User - Price permissions
   - Limited admin capabilities
   - Can manage some content

5. **Admin**
   - Full system access
   - Product management
   - Category management
   - Promotion management
   - User management
   - System configuration

6. **Pending**
   - Newly registered users
   - Limited access until approved
   - Requires admin approval

### Permission System

The `usePermissions` hook provides role-based access control:

```typescript
const { 
  canManageProducts,
  canSeePrice,
  canManageUsers,
  canManagePromotions 
} = usePermissions();
```

## Core Functionality

### Authentication System

The app uses Firebase Authentication with the following features:

- **Email/Password Authentication**: Secure user registration and login
- **Guest Mode**: Anonymous access with limited features
- **Persistent Sessions**: Users remain logged in across app restarts
- **Role-Based Access**: Different user types with varying permissions
- **Account Management**: Profile editing and account deletion

### Product Management

#### Product Data Structure
```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string | null;
  subcategory: string | null;
  subsubcategory: string | null;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Features
- **Hierarchical Categories**: Three-level category system
- **Image Management**: Multiple images per product with optimization
- **Stock Tracking**: Real-time inventory monitoring
- **Search & Filter**: Advanced product discovery
- **Responsive Grid**: Adaptive product layouts

### Category System

The app supports a three-level hierarchical category structure:

1. **Main Categories**: Top-level product categories
2. **Subcategories**: Second-level categorization
3. **Sub-subcategories**: Third-level detailed categorization

#### Category Management Features
- **Dynamic Creation**: Add categories at any level
- **Ordering**: Custom sort order for categories
- **Nested Structure**: Unlimited depth support
- **Bulk Operations**: Efficient category management

### Promotion System

#### Promotion Data Structure
```typescript
interface Promotion {
  id: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: Date;
  endDate: Date;
  minimumPurchase: number;
  active: boolean;
  productId: string;
  images: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Features
- **Carousel Display**: Attractive promotion showcase
- **Time-Based Activation**: Automatic promotion scheduling
- **Discount Types**: Percentage and fixed amount discounts
- **Product Association**: Link promotions to specific products
- **Image Support**: Visual promotion materials

## Admin Panel

The admin panel provides comprehensive management tools for authorized users:

### Product Management
- **Add New Products**: Complete product creation workflow
- **Edit Existing Products**: Update product information and images
- **Stock Management**: Monitor and update inventory levels
- **Bulk Operations**: Efficient product management
- **Image Optimization**: Automatic image compression and resizing

### Category Management
- **Hierarchical Structure**: Create and manage category trees
- **Drag & Drop Ordering**: Intuitive category organization
- **Bulk Import/Export**: Efficient category management
- **Category Analytics**: Usage statistics and insights

### Promotion Management
- **Campaign Creation**: Design and schedule promotions
- **Visual Editor**: Rich promotion content creation
- **Performance Tracking**: Monitor promotion effectiveness
- **A/B Testing**: Compare promotion variants

### User Management
- **Role Assignment**: Manage user permissions
- **Account Approval**: Review and approve new registrations
- **Activity Monitoring**: Track user engagement
- **Bulk Operations**: Efficient user management

## Firebase Integration

### Database Structure

#### Collections
- **users**: User profiles and authentication data
- **products**: Product catalog and inventory
- **categories**: Hierarchical category structure
- **promotions**: Marketing campaigns and offers

#### Security Rules
The app implements comprehensive Firestore security rules:

```javascript
// Example security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Products are readable by authenticated users
    match /products/{productId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['Admin', 'Manager'];
    }
  }
}
```

### Storage Organization
```
gs://cnb-app-f2ed6.firebasestorage.app/
├── products/
│   ├── {productId}/
│   │   ├── image1.jpg
│   │   ├── image2.jpg
│   │   └── thumbnail.jpg
├── promotions/
│   ├── {promotionId}/
│   │   └── banner.jpg
└── categories/
    ├── {categoryId}/
    │   └── icon.jpg
```

### Image Optimization
- **Automatic Compression**: Reduces file sizes for faster loading
- **Multiple Formats**: WebP support with fallbacks
- **Responsive Images**: Different sizes for different screen densities
- **Caching Strategy**: Efficient image caching and loading

## Development Guidelines

### Code Style
- **TypeScript**: Strict type checking enabled
- **ESLint**: Consistent code formatting
- **Component Structure**: Functional components with hooks
- **File Naming**: PascalCase for components, camelCase for utilities

### Performance Best Practices
- **Image Optimization**: Use OptimizedImage component
- **List Virtualization**: FlashList for large datasets
- **Memoization**: React.memo for expensive components
- **Lazy Loading**: Dynamic imports for large screens

### Testing Strategy
- **Unit Tests**: Jest for utility functions
- **Component Tests**: React Native Testing Library
- **Integration Tests**: End-to-end testing with Detox
- **Manual Testing**: Device testing on iOS and Android

### Security Considerations
- **Input Validation**: Client and server-side validation
- **Authentication**: Secure token management
- **Data Encryption**: Sensitive data protection
- **API Security**: Rate limiting and access controls

## Deployment

### Build Configuration

#### iOS Deployment
```json
{
  "ios": {
    "bundleIdentifier": "com.cnb.app",
    "buildNumber": "6",
    "supportsTablet": true,
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "Location access for office maps",
      "NSLocationAlwaysUsageDescription": "Location access for office maps"
    }
  }
}
```

#### Android Deployment
```json
{
  "android": {
    "package": "com.cnb.app",
    "versionCode": 2,
    "permissions": [
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.RECORD_AUDIO"
    ]
  }
}
```

### EAS Build
```bash
# Build for development
eas build --platform all --profile development

# Build for production
eas build --platform all --profile production

# Submit to app stores
eas submit --platform all
```

### Over-the-Air Updates
```bash
# Publish update
eas update --branch production --message "Bug fixes and improvements"
```

## Troubleshooting

### Common Issues

#### Build Errors
- **Metro bundler issues**: Clear cache with `npx expo start --clear`
- **Dependency conflicts**: Delete `node_modules` and reinstall
- **iOS build failures**: Check Xcode version compatibility
- **Android build failures**: Verify Android SDK configuration

#### Runtime Errors
- **Firebase connection**: Verify configuration and network connectivity
- **Image loading**: Check storage permissions and URLs
- **Navigation issues**: Ensure proper route configuration
- **Performance problems**: Profile with Flipper or React DevTools

#### Authentication Issues
- **Login failures**: Check Firebase Auth configuration
- **Permission errors**: Verify Firestore security rules
- **Token expiration**: Implement proper token refresh logic

### Debug Tools
- **Flipper**: React Native debugging platform
- **React DevTools**: Component inspection and profiling
- **Firebase Console**: Backend monitoring and debugging
- **Expo DevTools**: Development server debugging

### Performance Monitoring
- **Firebase Performance**: Real-time performance metrics
- **Crashlytics**: Crash reporting and analysis
- **Analytics**: User behavior tracking
- **Custom Metrics**: Application-specific monitoring

## Support and Maintenance

### Contact Information
- **Company**: Newtex Carpets Sdn Bhd
- **Phone**: 1300 22 2622 (CNBC)
- **Email**: [Contact through app]

### Office Locations
1. **Petaling Jaya Office**
   - Address: No. 18, Jalan SS 2/3, SS 2, 47300 Petaling Jaya, Selangor, Malaysia
   - Coordinates: 3.11125, 101.61162

2. **Kuala Lumpur Office**
   - Address: No.59, Jalan 10/152, Taman Industrial O.U.G., Off Batu 6 1/2, Jalan Puchong, 58200, Kuala Lumpur, Malaysia
   - Coordinates: 3.06942, 101.66206

### Version History
- **v1.0.3**: Current production version
- **v1.0.2**: Bug fixes and performance improvements
- **v1.0.1**: Initial feature additions
- **v1.0.0**: Initial release

---

*This documentation is maintained by the development team and updated with each major release. For technical support or feature requests, please contact the development team.* 