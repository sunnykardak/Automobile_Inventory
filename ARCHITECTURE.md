# 🏗️ System Architecture

## Overview

The Automobile Inventory Management System follows a modern three-tier architecture with clear separation of concerns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
│                      (Web Browser / Mobile)                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────────┐
│                      PRESENTATION LAYER                              │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Next.js Frontend (Port 3000)                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │  │
│  │  │  Login   │  │Dashboard │  │   Jobs   │  │Inventory │      │  │
│  │  │  Page    │  │   Page   │  │   Page   │  │   Page   │      │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │  │
│  │                                                                 │  │
│  │  ┌───────────────────┐  ┌──────────────┐                      │  │
│  │  │  Sidebar Layout   │  │   Header     │                      │  │
│  │  └───────────────────┘  └──────────────┘                      │  │
│  │                                                                 │  │
│  │  Components: React + TypeScript + Tailwind CSS                 │  │
│  └───────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │ REST API (JSON)
┌────────────────────────────▼────────────────────────────────────────┐
│                      APPLICATION LAYER                               │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │            Node.js + Express Backend (Port 5000)               │  │
│  │                                                                 │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │              Middleware                                  │  │  │
│  │  │  • Authentication (JWT)                                  │  │  │
│  │  │  • Authorization (Role-based)                            │  │  │
│  │  │  • Rate Limiting                                         │  │  │
│  │  │  • CORS                                                  │  │  │
│  │  │  • Helmet (Security)                                     │  │  │
│  │  │  • Logging (Winston + Morgan)                            │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                                                                 │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │              API Routes                                  │  │  │
│  │  │  /api/v1/auth       - Authentication                     │  │  │
│  │  │  /api/v1/jobs       - Job Cards                          │  │  │
│  │  │  /api/v1/inventory  - Inventory Management               │  │  │
│  │  │  /api/v1/employees  - Employee Management                │  │  │
│  │  │  /api/v1/bills      - Billing & Invoicing                │  │  │
│  │  │  /api/v1/reports    - Analytics & Reports                │  │  │
│  │  │  /api/v1/dashboard  - Dashboard Data                     │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                                                                 │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │              Controllers                                 │  │  │
│  │  │  • Auth Controller    • Job Controller                   │  │  │
│  │  │  • Inventory Ctrl     • Employee Controller              │  │  │
│  │  │  • Bill Controller    • Dashboard Controller             │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                                                                 │  │
│  └───────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │ SQL Queries
┌────────────────────────────▼────────────────────────────────────────┐
│                        DATA LAYER                                    │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                               │  │
│  │                                                                 │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │  │
│  │  │    Users &   │  │   Products   │  │  Operations  │        │  │
│  │  │   Employees  │  │  & Inventory │  │  & Billing   │        │  │
│  │  │──────────────│  │──────────────│  │──────────────│        │  │
│  │  │ • roles      │  │• manufacturers│  │• job_cards   │        │  │
│  │  │ • users      │  │• categories  │  │• job_products│        │  │
│  │  │ • employees  │  │• product_    │  │• bills       │        │  │
│  │  │ • attendance │  │  master      │  │• bill_items  │        │  │
│  │  │ • salary_    │  │• inventory   │  │• employee_   │        │  │
│  │  │  payments    │  │              │  │ commissions  │        │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘        │  │
│  │                                                                 │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │              Database Features                           │  │  │
│  │  │  • Auto-increment sequences                              │  │  │
│  │  │  • Triggers for timestamps                               │  │  │
│  │  │  • Views for common queries                              │  │  │
│  │  │  • Indexes for performance                               │  │  │
│  │  │  • Foreign key constraints                               │  │  │
│  │  │  • JSONB for flexible data                               │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Login Flow

```
User Input (Email/Password)
    ↓
Frontend validates
    ↓
POST /api/v1/auth/login
    ↓
Backend validates credentials
    ↓
Hash comparison (bcrypt)
    ↓
Generate JWT token
    ↓
Return token + user data
    ↓
Store token in localStorage
    ↓
Redirect to Dashboard
```

### 2. Job Card Creation Flow

```
User fills job form
    ↓
Frontend validates
    ↓
POST /api/v1/jobs with JWT
    ↓
Auth middleware verifies token
    ↓
Authorization check (role)
    ↓
Controller processes request
    ↓
INSERT INTO job_cards
    ↓
Auto-generate job_number (trigger)
    ↓
Return created job
    ↓
Update UI with new job
```

### 3. Job Completion Flow

```
User clicks "Complete Job"
    ↓
POST /api/v1/jobs/:id/complete
    ↓
Start database transaction
    ↓
┌─────────────────────────┐
│ Fetch job details       │
│ Calculate totals        │
│ Create bill record      │
│ Add bill items          │
│ Deduct inventory        │
│ Calculate commission    │
│ Update job status       │
└─────────────────────────┘
    ↓
Commit transaction
    ↓
Return bill data
    ↓
Display success + bill
```

### 4. Inventory Deduction on Job Completion

```
Job products list
    ↓
For each product:
  ├─ Get inventory_id
  ├─ Get quantity used
  └─ UPDATE inventory SET
      current_quantity = current_quantity - quantity
    ↓
Check if qty <= min_stock_level
    ↓
If yes: Trigger low stock alert
    ↓
Log audit entry
```

## Security Layers

```
┌──────────────────────────────────────┐
│         Security Measures             │
├──────────────────────────────────────┤
│                                       │
│  Layer 1: Frontend                   │
│  • Form validation                   │
│  • XSS prevention                    │
│  • CSRF tokens (planned)             │
│                                       │
├──────────────────────────────────────┤
│                                       │
│  Layer 2: API Gateway                │
│  • CORS (allowed origins)            │
│  • Rate limiting                     │
│  • Helmet (security headers)         │
│  • Request size limits               │
│                                       │
├──────────────────────────────────────┤
│                                       │
│  Layer 3: Authentication             │
│  • JWT tokens (stateless)            │
│  • Token expiration (24h)            │
│  • Refresh tokens (7d)               │
│  • Password hashing (bcrypt)         │
│                                       │
├──────────────────────────────────────┤
│                                       │
│  Layer 4: Authorization              │
│  • Role-based access control         │
│  • Permission checks                 │
│  • Resource ownership validation     │
│                                       │
├──────────────────────────────────────┤
│                                       │
│  Layer 5: Database                   │
│  • Parameterized queries             │
│  • Foreign key constraints           │
│  • Row-level security (planned)      │
│  • Audit logging                     │
│                                       │
└──────────────────────────────────────┘
```

## Technology Stack Details

### Frontend Stack

```
Next.js 14
  ├── React 18 (UI components)
  ├── TypeScript (type safety)
  ├── Tailwind CSS (styling)
  │   └── Custom theme
  ├── Axios (HTTP client)
  ├── React Icons (icons)
  ├── React Hot Toast (notifications)
  └── Recharts (analytics)
```

### Backend Stack

```
Node.js + Express
  ├── Authentication
  │   ├── JWT (jsonwebtoken)
  │   └── bcryptjs (password hashing)
  ├── Database
  │   ├── pg (PostgreSQL driver)
  │   └── pg-hstore (JSON storage)
  ├── Security
  │   ├── helmet (HTTP headers)
  │   ├── cors (cross-origin)
  │   └── express-rate-limit
  ├── Validation
  │   └── express-validator
  ├── Logging
  │   ├── winston (app logs)
  │   └── morgan (HTTP logs)
  └── Utils
      ├── bwip-js (barcode)
      └── pdfkit (invoices)
```

### Database Design Principles

1. **Normalization**: 3NF compliance
2. **Referential Integrity**: Foreign keys
3. **Performance**: Strategic indexes
4. **Flexibility**: JSONB for metadata
5. **Audit Trail**: Comprehensive logging
6. **Scalability**: Connection pooling

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│           Load Balancer / CDN            │
│              (Cloudflare)                │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┴──────────┐
    ↓                     ↓
┌─────────┐          ┌─────────┐
│Frontend │          │Backend  │
│(Vercel) │          │(AWS EC2)│
│Next.js  │          │Node.js  │
└─────────┘          └────┬────┘
                          │
                          ↓
                    ┌──────────┐
                    │PostgreSQL│
                    │(AWS RDS) │
                    └──────────┘
```

## Scalability Considerations

### Horizontal Scaling
- **Frontend**: Deploy to CDN (Vercel/Netlify)
- **Backend**: Multiple instances behind load balancer
- **Database**: Read replicas for queries

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Add caching layer (Redis)

### Performance Optimization
- Database indexes on frequently queried columns
- Connection pooling
- API response caching
- Image optimization
- Code splitting in frontend

## Monitoring & Logging

```
Application Logs
  ├── Winston (structured logging)
  ├── Log levels (error, warn, info, debug)
  └── Log files (error.log, combined.log)

Database Logs
  ├── Slow query log
  ├── Connection pool stats
  └── Transaction logs

Audit Logs
  ├── User actions
  ├── Data modifications
  └── Access attempts

Metrics (Future)
  ├── Response times
  ├── Error rates
  ├── Database performance
  └── User analytics
```

## API Design Patterns

### RESTful Principles
- Resource-based URLs
- HTTP methods (GET, POST, PUT, DELETE)
- Status codes (200, 201, 400, 401, 404, 500)
- JSON responses

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Error Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (dev mode only)"
}
```

---

## Future Enhancements

### Phase 2
- Redis caching layer
- WebSocket for real-time updates
- Elasticsearch for advanced search
- S3 for file storage

### Phase 3
- Microservices architecture
- Message queue (RabbitMQ)
- Kubernetes deployment
- Multi-tenancy support

---

**Architecture Version**: 1.0.0  
**Last Updated**: February 2026
