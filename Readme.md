# 🚗 Automobile Inventory Management System

A complete, scalable, role-based garage management software built with modern web technologies.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Database Setup](#database-setup)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Default Credentials](#default-credentials)
- [API Documentation](#api-documentation)
- [Module Details](#module-details)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### Core Functionality

- **Job Cards & Servicing Workflow**
  - Create and manage job cards for vehicle servicing
  - Track job status (Created → In Progress → Washing → Completed)
  - Assign mechanics to jobs
  - Add products/spare parts during servicing
  - Auto-generate bills on job completion

- **Inventory & Spare Parts Management**
  - Centralized inventory system
  - Barcode generation and scanning support
  - Manufacturer product database
  - Low stock alerts
  - Auto-deduction of inventory on job completion
  - Track supplier information

- **Employee Management**
  - Employee records with personal details
  - Commission-based system
  - Attendance tracking
  - Salary management
  - Performance metrics

- **Billing & Invoicing**
  - Auto-generated bills from job cards
  - Tax calculation
  - Discount support
  - Payment tracking
  - Commission calculation

- **Reports & Analytics**
  - Revenue reports (Daily/Monthly/Yearly)
  - Inventory usage reports
  - Employee performance reports
  - Vehicle servicing analytics
  - Low stock reports

- **Role-Based Access Control**
  - Admin/Owner: Full access
  - Manager: Jobs, inventory, reports access
  - Mechanic: Assigned jobs only
  - Secure JWT authentication

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: React Icons
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Logging**: Winston & Morgan
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator
- **Barcode Generation**: bwip-js
- **PDF Generation**: PDFKit

### Database
- **DBMS**: PostgreSQL 14+
- **Features**: 
  - Triggers for auto-timestamps
  - Views for common queries
  - Indexes for performance
  - JSONB for flexible data
  - Transaction support

---

## 📁 Project Structure

```
Automobile_Inventory/
├── database/
│   ├── schema.sql              # Complete database schema
│   ├── setup.sh                # Database setup script
│   └── ER_DIAGRAM.md           # Entity relationship diagram
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js     # Database connection
│   │   ├── controllers/        # Route controllers
│   │   ├── middleware/
│   │   ├── routes/             # API routes
│   │   ├── utils/
│   │   └── server.js           # Entry point
│   ├── .env                    # Environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/      # Dashboard pages
│   │   │   ├── page.tsx        # Login page
│   │   │   └── globals.css
│   │   └── components/
│   │       └── layout/
│   ├── .env.local
│   ├── tailwind.config.js
│   └── package.json
└── Readme.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14.0 or higher
- **Git**: Latest version

### Clone the Repository

```bash
cd Automobile_Inventory
```

---

## 🗄️ Database Setup

### Option 1: Automated Setup (Recommended)

```bash
cd database
chmod +x setup.sh
./setup.sh
```

This script will:
- Create the database user `nishikesh` with password `admin123`
- Create the database `automotive_inventory`
- Run the schema.sql file to create all tables, views, and triggers
- Insert seed data

### Option 2: Manual Setup

1. **Create Database and User**

```bash
psql -U postgres
```

```sql
CREATE USER nishikesh WITH PASSWORD 'admin123';
CREATE DATABASE automotive_inventory OWNER nishikesh;
GRANT ALL PRIVILEGES ON DATABASE automotive_inventory TO nishikesh;
\q
```

2. **Run Schema**

```bash
psql -U nishikesh -d automotive_inventory -f database/schema.sql
```

### Verify Database

```bash
psql -U nishikesh -d automotive_inventory -c "SELECT COUNT(*) FROM users;"
```

You should see 1 admin user created.

---

## ⚙️ Backend Setup

1. **Navigate to Backend Directory**

```bash
cd backend
```

2. **Install Dependencies**

```bash
npm install
```

3. **Configure Environment Variables**

The `.env` file is already configured with default values:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=automotive_inventory
DB_USER=nishikesh
DB_PASSWORD=admin123
JWT_SECRET=automobile-inventory-secret-key-2026-change-in-production
```

4. **Start Development Server**

```bash
npm run dev
```

The backend API will be available at: `http://localhost:5000`

5. **Verify Backend**

```bash
curl http://localhost:5000/health
```

You should see:
```json
{
  "status": "OK",
  "timestamp": "2026-02-08T...",
  "uptime": 1.234
}
```

---

## 🎨 Frontend Setup

1. **Navigate to Frontend Directory**

```bash
cd frontend
```

2. **Install Dependencies**

```bash
npm install
```

3. **Configure Environment Variables**

The `.env.local` file is already configured:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_GARAGE_NAME=My Auto Garage
```

4. **Start Development Server**

```bash
npm run dev
```

The frontend will be available at: `http://localhost:3000`

5. **Build for Production**

```bash
npm run build
npm start
```

---

## 🔐 Default Credentials

After running the database setup, you can login with:

```
Email: admin@garage.com
Password: admin123
```

**⚠️ Important**: Change the default password after first login!

---

## 📡 API Documentation

### Base URL

```
http://localhost:5000/api/v1
```

### Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Main Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user
- `PUT /auth/change-password` - Change password
- `POST /auth/refresh` - Refresh token

#### Job Cards
- `GET /jobs` - Get all jobs (supports filtering)
- `GET /jobs/:id` - Get single job
- `POST /jobs` - Create job
- `PUT /jobs/:id` - Update job
- `POST /jobs/:id/products` - Add product to job
- `DELETE /jobs/:id/products/:productId` - Remove product
- `POST /jobs/:id/complete` - Complete job & generate bill

#### Inventory
- `GET /inventory` - Get all inventory items
- `GET /inventory/:id` - Get single item
- `POST /inventory` - Create item
- `PUT /inventory/:id` - Update item
- `POST /inventory/:id/restock` - Restock item
- `GET /inventory/alerts/low-stock` - Get low stock items
- `GET /inventory/barcode/:barcode` - Search by barcode

#### Dashboard
- `GET /dashboard` - Get dashboard overview
- `GET /dashboard/revenue-chart` - Revenue chart data
- `GET /dashboard/activities` - Recent activities

---

## 📦 Module Details

### 1. Dashboard
- Real-time statistics
- Revenue graphs
- Top performing mechanics
- Most used spare parts
- Low stock alerts
- Quick actions

### 2. Job Cards
**Create Job**
- Customer details (name, phone, email)
- Vehicle details (number, type, brand, model)
- Reported issues
- Assign mechanic
- Estimated cost

**During Job**
- Add products from inventory
- Track labor charges
- Update status

**Complete Job**
- Auto-generate bill
- Deduct inventory
- Calculate commissions
- Record payment

### 3. Inventory Management
**Features**
- Add/Edit/Delete products
- Barcode generation
- Category management
- Manufacturer database
- Supplier tracking
- Low stock alerts
- Restock management

### 4. Employee Management
**Records**
- Personal information
- Role assignment
- Documents (ID, PF)
- Commission percentage
- Base salary

**Tracking**
- Attendance
- Leave records
- Performance metrics
- Commission earnings
- Salary history

### 5. Billing System
**Invoice Generation**
- Auto-populated from job cards
- Line items (products + labor)
- Tax calculation (configurable %)
- Discount support
- Payment tracking

**Commission**
- Auto-calculated on job completion
- Based on employee percentage
- Track pending/paid status

### 6. Reports & Analytics
- Daily/Monthly/Yearly revenue
- Profit analysis
- Inventory turnover
- Employee productivity
- Popular services
- Vehicle servicing trends

---

## 🎯 Workflow Example

### Complete Job Flow

1. **Customer arrives** → Create Job Card
2. **Vehicle inspection** → Add reported issues
3. **Assign mechanic** → Select from employee list
4. **During service** → Add used products/parts
5. **Update status** → In Progress → Washing
6. **Complete job** → Click "Complete"
7. **Auto-generate bill** → Calculate total (parts + labor + tax)
8. **Deduct inventory** → Reduce stock quantities
9. **Calculate commission** → Add to mechanic's account
10. **Process payment** → Record payment method
11. **Print invoice** → Give to customer

---

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Role-Based Access**: Granular permissions
- **Rate Limiting**: Prevent brute force
- **Helmet**: Security headers
- **CORS**: Controlled origins
- **SQL Injection Prevention**: Parameterized queries
- **Audit Logs**: Track all critical operations

---

## 📊 Database Schema

See [database/ER_DIAGRAM.md](database/ER_DIAGRAM.md) for detailed schema documentation.

### Key Tables
- **roles** - User roles and permissions
- **users** - Authentication
- **employees** - Employee records
- **manufacturers** - Product manufacturers
- **categories** - Product categories
- **product_master** - Master product catalog
- **inventory** - Current stock
- **job_cards** - Service jobs
- **job_products** - Products used in jobs
- **bills** - Invoices
- **bill_items** - Invoice line items
- **employee_commissions** - Commission tracking
- **salary_payments** - Salary records
- **attendance** - Daily attendance
- **audit_logs** - System audit trail

---

## 🚀 Deployment

### Backend Deployment

1. **Environment Variables**
   - Update JWT secret
   - Set production database credentials
   - Configure CORS origins

2. **Build**
   ```bash
   npm install --production
   ```

3. **Start**
   ```bash
   npm start
   ```

### Frontend Deployment

1. **Build**
   ```bash
   npm run build
   ```

2. **Start**
   ```bash
   npm start
   ```

### Recommended Platforms
- **Backend**: Heroku, AWS EC2, DigitalOcean
- **Frontend**: Vercel, Netlify, AWS Amplify
- **Database**: AWS RDS, DigitalOcean Managed PostgreSQL

---

## 📝 Future Enhancements

- [ ] WhatsApp/SMS notifications
- [ ] Email invoices
- [ ] PDF export for reports
- [ ] Mobile app (React Native)
- [ ] Customer portal
- [ ] Online booking
- [ ] Payment gateway integration
- [ ] Multi-garage support
- [ ] Advanced analytics dashboard
- [ ] Automated backup system

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Support

For support, create an issue in the repository.

---

**Made with ❤️ for Auto Garages**
