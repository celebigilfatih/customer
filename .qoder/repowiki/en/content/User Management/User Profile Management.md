# User Profile Management

<cite>
**Referenced Files in This Document**
- [schema.prisma](file://prisma/schema.prisma)
- [prisma.ts](file://src/lib/prisma.ts)
- [validations.ts](file://src/lib/validations.ts)
- [auth.ts](file://src/lib/auth.ts)
- [routes.ts](file://src/lib/routes.ts)
- [users route.ts](file://src/app/api/users/route.ts)
- [user route.ts](file://src/app/api/users/[id]/route.ts)
- [login route.ts](file://src/app/api/auth/login/route.ts)
- [admin users page.tsx](file://src/app/admin/users/page.tsx)
- [admin users add page.tsx](file://src/app/admin/users/add/page.tsx)
- [admin users edit page.tsx](file://src/app/admin/users/[id]/edit/page.tsx)
- [users page.tsx](file://src/app/users/page.tsx)
- [users add page.tsx](file://src/app/users/add/page.tsx)
- [users edit page.tsx](file://src/app/users/[id]/edit/page.tsx)
- [portal profile page.tsx](file://src/app/portal/profile/page.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document provides comprehensive user profile management documentation for the customer.webmahsul application. It covers user creation, editing, and profile updates across admin and customer portals, including the registration workflow, form validation, data persistence, and profile modification processes. It also explains user profile fields, validation rules, data integrity constraints, profile views, visibility controls, and integration between user forms, validation schemas, and backend API endpoints.

## Project Structure
User profile management spans frontend pages, backend API routes, validation schemas, and the Prisma database schema. The system supports two primary user roles: administrative users and customer users, each with distinct portals and capabilities.

```mermaid
graph TB
subgraph "Frontend"
AdminUsersList["Admin Users List<br/>src/app/admin/users/page.tsx"]
AdminUsersAdd["Admin Users Add<br/>src/app/admin/users/add/page.tsx"]
AdminUsersEdit["Admin Users Edit<br/>src/app/admin/users/[id]/edit/page.tsx"]
UsersList["Users List<br/>src/app/users/page.tsx"]
UsersAdd["Users Add<br/>src/app/users/add/page.tsx"]
UsersEdit["Users Edit<br/>src/app/users/[id]/edit/page.tsx"]
PortalProfile["Portal Profile<br/>src/app/portal/profile/page.tsx"]
end
subgraph "Backend"
UsersRoute["Users API Route<br/>src/app/api/users/route.ts"]
UserRoute["User API Route<br/>src/app/api/users/[id]/route.ts"]
LoginRoute["Login API Route<br/>src/app/api/auth/login/route.ts"]
PrismaClient["Prisma Client<br/>src/lib/prisma.ts"]
Schema["Database Schema<br/>prisma/schema.prisma"]
end
subgraph "Validation & Routing"
Validations["Validation Schemas<br/>src/lib/validations.ts"]
Routes["Routes<br/>src/lib/routes.ts"]
end
AdminUsersList --> UsersRoute
AdminUsersAdd --> UsersRoute
AdminUsersEdit --> UserRoute
UsersList --> UsersRoute
UsersAdd --> UsersRoute
UsersEdit --> UserRoute
PortalProfile --> LoginRoute
UsersRoute --> PrismaClient
UserRoute --> PrismaClient
LoginRoute --> PrismaClient
PrismaClient --> Schema
AdminUsersAdd --> Validations
AdminUsersEdit --> Validations
UsersAdd --> Validations
UsersEdit --> Validations
LoginRoute --> Validations
AdminUsersList --> Routes
AdminUsersAdd --> Routes
AdminUsersEdit --> Routes
UsersList --> Routes
UsersAdd --> Routes
UsersEdit --> Routes
PortalProfile --> Routes
```

**Diagram sources**
- [admin users page.tsx:46-314](file://src/app/admin/users/page.tsx#L46-L314)
- [admin users add page.tsx:36-228](file://src/app/admin/users/add/page.tsx#L36-L228)
- [admin users edit page.tsx:45-309](file://src/app/admin/users/[id]/edit/page.tsx#L45-L309)
- [users page.tsx:17-196](file://src/app/users/page.tsx#L17-L196)
- [users add page.tsx:13-174](file://src/app/users/add/page.tsx#L13-L174)
- [users edit page.tsx:13-221](file://src/app/users/[id]/edit/page.tsx#L13-L221)
- [portal profile page.tsx:21-55](file://src/app/portal/profile/page.tsx#L21-L55)
- [users route.ts:1-93](file://src/app/api/users/route.ts#L1-L93)
- [user route.ts:1-164](file://src/app/api/users/[id]/route.ts#L1-L164)
- [login route.ts:1-86](file://src/app/api/auth/login/route.ts#L1-L86)
- [prisma.ts:1-9](file://src/lib/prisma.ts#L1-L9)
- [schema.prisma:724-743](file://prisma/schema.prisma#L724-L743)
- [validations.ts:76-90](file://src/lib/validations.ts#L76-L90)
- [routes.ts:1-43](file://src/lib/routes.ts#L1-L43)

**Section sources**
- [admin users page.tsx:46-314](file://src/app/admin/users/page.tsx#L46-L314)
- [admin users add page.tsx:36-228](file://src/app/admin/users/add/page.tsx#L36-L228)
- [admin users edit page.tsx:45-309](file://src/app/admin/users/[id]/edit/page.tsx#L45-L309)
- [users page.tsx:17-196](file://src/app/users/page.tsx#L17-L196)
- [users add page.tsx:13-174](file://src/app/users/add/page.tsx#L13-L174)
- [users edit page.tsx:13-221](file://src/app/users/[id]/edit/page.tsx#L13-L221)
- [portal profile page.tsx:21-55](file://src/app/portal/profile/page.tsx#L21-L55)
- [users route.ts:1-93](file://src/app/api/users/route.ts#L1-L93)
- [user route.ts:1-164](file://src/app/api/users/[id]/route.ts#L1-L164)
- [login route.ts:1-86](file://src/app/api/auth/login/route.ts#L1-L86)
- [prisma.ts:1-9](file://src/lib/prisma.ts#L1-L9)
- [schema.prisma:724-743](file://prisma/schema.prisma#L724-L743)
- [validations.ts:76-90](file://src/lib/validations.ts#L76-L90)
- [routes.ts:1-43](file://src/lib/routes.ts#L1-L43)

## Core Components
- User model: Defines user fields, uniqueness constraints, and relations to other entities.
- Validation schemas: Enforce field requirements, formats, and constraints for user creation and updates.
- API routes: Handle CRUD operations for users, including retrieval, creation, update, and deletion.
- Frontend pages: Provide admin and customer portals for viewing, creating, editing, and managing user profiles.
- Authentication utilities: Support admin session management and basic login flow.

Key user profile fields and constraints:
- Username: Unique, minimum length enforced.
- Email: Optional but validated if provided.
- Password: Required for creation, optional for updates; hashed before persistence.
- Full name: Optional.
- Active status: Boolean flag controlling account activity.
- Role: Enumerated role values (e.g., ADMIN, SUPPORT, CUSTOMER).
- Customer association: Optional foreign key linking users to customer records.

**Section sources**
- [schema.prisma:724-743](file://prisma/schema.prisma#L724-L743)
- [validations.ts:76-90](file://src/lib/validations.ts#L76-L90)
- [users route.ts:35-93](file://src/app/api/users/route.ts#L35-L93)
- [user route.ts:44-164](file://src/app/api/users/[id]/route.ts#L44-L164)

## Architecture Overview
The user profile management system follows a layered architecture:
- Presentation layer: Next.js pages for admin and customer portals.
- Validation layer: Zod schemas ensuring data integrity.
- API layer: Next.js API routes handling HTTP requests and responses.
- Persistence layer: Prisma ORM interacting with PostgreSQL.

```mermaid
sequenceDiagram
participant AdminUI as "Admin UI<br/>admin users add/edit pages"
participant API as "Users API<br/>users route.ts"
participant Validator as "Validation<br/>validations.ts"
participant DB as "Database<br/>schema.prisma"
AdminUI->>API : POST /api/users (create)
API->>Validator : userCreateSchema.safeParse()
Validator-->>API : Validation result
API->>DB : prisma.user.create()
DB-->>API : Created user record
API-->>AdminUI : 201 Created + user data
```

**Diagram sources**
- [admin users add page.tsx:51-74](file://src/app/admin/users/add/page.tsx#L51-L74)
- [users route.ts:35-93](file://src/app/api/users/route.ts#L35-L93)
- [validations.ts:76-85](file://src/lib/validations.ts#L76-L85)
- [schema.prisma:724-743](file://prisma/schema.prisma#L724-L743)

**Section sources**
- [admin users add page.tsx:51-74](file://src/app/admin/users/add/page.tsx#L51-L74)
- [users route.ts:35-93](file://src/app/api/users/route.ts#L35-L93)
- [validations.ts:76-85](file://src/lib/validations.ts#L76-L85)
- [schema.prisma:724-743](file://prisma/schema.prisma#L724-L743)

## Detailed Component Analysis

### User Model and Data Integrity
The User model defines the core attributes and constraints:
- Unique identifiers for username and email.
- Password hashing for security.
- Role enumeration and active status flag.
- Optional customer association for customer portal users.
- Timestamps for creation and updates.

```mermaid
erDiagram
USER {
string id PK
string username UK
string email UK
string password
string fullName
string role
boolean isActive
string customerId FK
timestamp createdAt
timestamp updatedAt
}
CUSTOMER {
string id PK
string fullName
string phoneNumber
string city
string district
string club
string sportsSchoolOfficial
string hosting
string duration
string startDate
string endDate
string offer
string address
enum status
decimal openingBalance
timestamp openingBalanceDate
timestamp createdAt
timestamp updatedAt
}
USER }o--|| CUSTOMER : "belongsTo"
```

**Diagram sources**
- [schema.prisma:724-743](file://prisma/schema.prisma#L724-L743)
- [schema.prisma:94-134](file://prisma/schema.prisma#L94-L134)

**Section sources**
- [schema.prisma:724-743](file://prisma/schema.prisma#L724-L743)
- [schema.prisma:94-134](file://prisma/schema.prisma#L94-L134)

### Validation Rules and Constraints
Validation schemas enforce strict rules for user data:
- Creation schema requires username, password, and optionally full name and email; includes length and format checks.
- Update schema allows partial updates with optional fields.
- Login schema validates credentials presence.

```mermaid
flowchart TD
Start(["Form Submission"]) --> Parse["Parse with Zod Schema"]
Parse --> Valid{"Validation Success?"}
Valid --> |No| Errors["Return Validation Errors"]
Valid --> |Yes| Process["Process Request"]
Process --> Persist["Persist to Database"]
Persist --> Done(["Success Response"])
Errors --> Done
```

**Diagram sources**
- [validations.ts:76-90](file://src/lib/validations.ts#L76-L90)
- [users route.ts:35-93](file://src/app/api/users/route.ts#L35-L93)
- [user route.ts:44-164](file://src/app/api/users/[id]/route.ts#L44-L164)

**Section sources**
- [validations.ts:76-90](file://src/lib/validations.ts#L76-L90)
- [users route.ts:35-93](file://src/app/api/users/route.ts#L35-L93)
- [user route.ts:44-164](file://src/app/api/users/[id]/route.ts#L44-L164)

### Admin User Management Portal
The admin portal provides comprehensive user management:
- Listing users with filtering, sorting, and status toggling.
- Creating new users via a structured form with validation.
- Editing existing users with optional password updates.
- Deleting users with confirmation.

```mermaid
sequenceDiagram
participant Admin as "Admin User"
participant UI as "Admin Users Page"
participant API as "Users API"
participant DB as "Database"
Admin->>UI : Navigate to Users List
UI->>API : GET /api/users
API->>DB : Find all users
DB-->>API : Users list
API-->>UI : JSON users
UI-->>Admin : Render table with actions
Admin->>UI : Click "New User"
UI->>API : POST /api/users
API->>DB : Create user
DB-->>API : New user
API-->>UI : 201 Created
UI-->>Admin : Redirect to users list
```

**Diagram sources**
- [admin users page.tsx:56-112](file://src/app/admin/users/page.tsx#L56-L112)
- [admin users add page.tsx:51-74](file://src/app/admin/users/add/page.tsx#L51-L74)
- [users route.ts:8-33](file://src/app/api/users/route.ts#L8-L33)
- [users route.ts:35-93](file://src/app/api/users/route.ts#L35-L93)

**Section sources**
- [admin users page.tsx:46-314](file://src/app/admin/users/page.tsx#L46-L314)
- [admin users add page.tsx:36-228](file://src/app/admin/users/add/page.tsx#L36-L228)
- [users route.ts:8-33](file://src/app/api/users/route.ts#L8-L33)
- [users route.ts:35-93](file://src/app/api/users/route.ts#L35-L93)

### Customer User Management Portal
The customer portal offers simplified user management:
- Listing users with basic actions.
- Creating and editing users with straightforward forms.
- Status toggling and deletion support.

```mermaid
sequenceDiagram
participant Customer as "Customer User"
participant UI as "Customers Users Page"
participant API as "Users API"
participant DB as "Database"
Customer->>UI : Navigate to Users List
UI->>API : GET /api/users
API->>DB : Find all users
DB-->>API : Users list
API-->>UI : JSON users
UI-->>Customer : Render table with actions
```

**Diagram sources**
- [users page.tsx:27-81](file://src/app/users/page.tsx#L27-L81)
- [users route.ts:8-33](file://src/app/api/users/route.ts#L8-L33)

**Section sources**
- [users page.tsx:17-196](file://src/app/users/page.tsx#L17-L196)
- [users add page.tsx:13-174](file://src/app/users/add/page.tsx#L13-L174)
- [users edit page.tsx:13-221](file://src/app/users/[id]/edit/page.tsx#L13-L221)
- [users route.ts:8-33](file://src/app/api/users/route.ts#L8-L33)

### Customer Portal Profile View
The customer portal profile displays user information retrieved from local storage:
- Retrieves user data from localStorage under the "user" key.
- Renders username, full name, and email if available.
- Provides navigation back to the portal dashboard.

```mermaid
sequenceDiagram
participant User as "Logged-in User"
participant UI as "Portal Profile Page"
participant Storage as "localStorage"
User->>UI : Navigate to /portal/profile
UI->>Storage : getItem("user")
Storage-->>UI : User JSON
UI-->>User : Render profile info
```

**Diagram sources**
- [portal profile page.tsx:10-27](file://src/app/portal/profile/page.tsx#L10-L27)

**Section sources**
- [portal profile page.tsx:21-55](file://src/app/portal/profile/page.tsx#L21-L55)

### Authentication Integration
Authentication integrates with user management:
- Login endpoint validates credentials, checks user activity, compares passwords, and returns user data.
- Admin session utilities manage admin authentication state in browser storage.

```mermaid
sequenceDiagram
participant Client as "Client App"
participant LoginAPI as "Login API"
participant Validator as "Validation"
participant DB as "Database"
Client->>LoginAPI : POST /api/auth/login
LoginAPI->>Validator : loginSchema.safeParse()
Validator-->>LoginAPI : Validation result
LoginAPI->>DB : Find user by username
DB-->>LoginAPI : User record
LoginAPI->>DB : Compare password hash
DB-->>LoginAPI : Match result
LoginAPI-->>Client : {message, user}
```

**Diagram sources**
- [login route.ts:7-86](file://src/app/api/auth/login/route.ts#L7-L86)
- [validations.ts:87-90](file://src/lib/validations.ts#L87-L90)
- [schema.prisma:724-743](file://prisma/schema.prisma#L724-L743)

**Section sources**
- [login route.ts:7-86](file://src/app/api/auth/login/route.ts#L7-L86)
- [validations.ts:87-90](file://src/lib/validations.ts#L87-L90)
- [auth.ts:1-35](file://src/lib/auth.ts#L1-L35)

### API Endpoints and Data Persistence
The backend API exposes endpoints for user management:
- GET /api/users: Returns paginated and ordered user lists with selected fields.
- POST /api/users: Creates a new user after validation and password hashing.
- GET /api/users/[id]: Retrieves a single user by ID.
- PUT /api/users/[id]: Updates user details with optional password change.
- DELETE /api/users/[id]: Removes a user by ID.

```mermaid
sequenceDiagram
participant Client as "Client App"
participant UsersAPI as "Users API"
participant UserAPI as "User API"
participant Validator as "Validation"
participant DB as "Database"
Client->>UsersAPI : GET /api/users
UsersAPI->>DB : FindMany users
DB-->>UsersAPI : Users array
UsersAPI-->>Client : JSON users
Client->>UsersAPI : POST /api/users
UsersAPI->>Validator : userCreateSchema
Validator-->>UsersAPI : Validated data
UsersAPI->>DB : Create user
DB-->>UsersAPI : User created
UsersAPI-->>Client : 201 Created
Client->>UserAPI : PUT /api/users/ : id
UserAPI->>Validator : userUpdateSchema
Validator-->>UserAPI : Validated data
UserAPI->>DB : Update user
DB-->>UserAPI : Updated user
UserAPI-->>Client : JSON updated user
```

**Diagram sources**
- [users route.ts:8-33](file://src/app/api/users/route.ts#L8-L33)
- [users route.ts:35-93](file://src/app/api/users/route.ts#L35-L93)
- [user route.ts:8-42](file://src/app/api/users/[id]/route.ts#L8-L42)
- [user route.ts:44-164](file://src/app/api/users/[id]/route.ts#L44-L164)

**Section sources**
- [users route.ts:8-33](file://src/app/api/users/route.ts#L8-L33)
- [users route.ts:35-93](file://src/app/api/users/route.ts#L35-L93)
- [user route.ts:8-42](file://src/app/api/users/[id]/route.ts#L8-L42)
- [user route.ts:44-164](file://src/app/api/users/[id]/route.ts#L44-L164)

## Dependency Analysis
The user profile management system exhibits clear separation of concerns:
- Frontend pages depend on validation schemas and routes for user interactions.
- API routes depend on validation schemas and Prisma client for data operations.
- Prisma client depends on the database schema for type-safe queries.
- Authentication utilities integrate with the login API for session management.

```mermaid
graph TB
AdminUsersAdd["Admin Users Add<br/>page.tsx"] --> Validations["validations.ts"]
AdminUsersEdit["Admin Users Edit<br/>page.tsx"] --> Validations
UsersAdd["Users Add<br/>page.tsx"] --> Validations
UsersEdit["Users Edit<br/>page.tsx"] --> Validations
LoginRoute["Login API<br/>login route.ts"] --> Validations
UsersRoute["Users API<br/>users route.ts"] --> Validations
UserRoute["User API<br/>user route.ts"] --> Validations
AdminUsersAdd --> UsersRoute
AdminUsersEdit --> UserRoute
UsersAdd --> UsersRoute
UsersEdit --> UserRoute
PortalProfile["Portal Profile<br/>page.tsx"] --> LoginRoute
UsersRoute --> PrismaClient["prisma.ts"]
UserRoute --> PrismaClient
LoginRoute --> PrismaClient
PrismaClient --> Schema["schema.prisma"]
```

**Diagram sources**
- [admin users add page.tsx:36-228](file://src/app/admin/users/add/page.tsx#L36-L228)
- [admin users edit page.tsx:45-309](file://src/app/admin/users/[id]/edit/page.tsx#L45-L309)
- [users add page.tsx:13-174](file://src/app/users/add/page.tsx#L13-L174)
- [users edit page.tsx:13-221](file://src/app/users/[id]/edit/page.tsx#L13-L221)
- [portal profile page.tsx:21-55](file://src/app/portal/profile/page.tsx#L21-L55)
- [login route.ts:1-86](file://src/app/api/auth/login/route.ts#L1-L86)
- [users route.ts:1-93](file://src/app/api/users/route.ts#L1-L93)
- [user route.ts:1-164](file://src/app/api/users/[id]/route.ts#L1-L164)
- [validations.ts:76-90](file://src/lib/validations.ts#L76-L90)
- [prisma.ts:1-9](file://src/lib/prisma.ts#L1-L9)
- [schema.prisma:724-743](file://prisma/schema.prisma#L724-L743)

**Section sources**
- [admin users add page.tsx:36-228](file://src/app/admin/users/add/page.tsx#L36-L228)
- [admin users edit page.tsx:45-309](file://src/app/admin/users/[id]/edit/page.tsx#L45-L309)
- [users add page.tsx:13-174](file://src/app/users/add/page.tsx#L13-L174)
- [users edit page.tsx:13-221](file://src/app/users/[id]/edit/page.tsx#L13-L221)
- [portal profile page.tsx:21-55](file://src/app/portal/profile/page.tsx#L21-L55)
- [login route.ts:1-86](file://src/app/api/auth/login/route.ts#L1-L86)
- [users route.ts:1-93](file://src/app/api/users/route.ts#L1-L93)
- [user route.ts:1-164](file://src/app/api/users/[id]/route.ts#L1-L164)
- [validations.ts:76-90](file://src/lib/validations.ts#L76-L90)
- [prisma.ts:1-9](file://src/lib/prisma.ts#L1-L9)
- [schema.prisma:724-743](file://prisma/schema.prisma#L724-L743)

## Performance Considerations
- Validation overhead: Zod schemas provide runtime validation but add minimal overhead compared to database round-trips.
- Password hashing: bcrypt hashing occurs during user creation and updates; consider batching operations for bulk updates.
- Database queries: Select only required fields to minimize payload sizes.
- Caching: Implement caching for frequently accessed user lists if scalability demands arise.

## Troubleshooting Guide
Common issues and resolutions:
- Validation errors: Ensure form data matches validation rules (length, format, presence).
- Duplicate usernames: The system prevents duplicate usernames; choose a unique identifier.
- Password mismatches: Verify password hashes match during login attempts.
- Database connectivity: Confirm Prisma client initialization and connection string configuration.
- Session management: For admin portal, verify session storage keys and authentication state.

**Section sources**
- [users route.ts:35-93](file://src/app/api/users/route.ts#L35-L93)
- [user route.ts:44-164](file://src/app/api/users/[id]/route.ts#L44-L164)
- [login route.ts:7-86](file://src/app/api/auth/login/route.ts#L7-L86)
- [prisma.ts:1-9](file://src/lib/prisma.ts#L1-L9)

## Conclusion
The user profile management system provides robust functionality for creating, editing, and maintaining user profiles across admin and customer portals. It leverages strong validation schemas, secure password handling, and a clear API design to ensure data integrity and usability. The modular architecture supports future enhancements such as user data export, advanced visibility controls, and expanded role-based permissions.