# 📊 Database Schema Documentation

## Entity Relationship Diagram

```mermaid
erDiagram
    roles ||--o{ users : has
    users ||--o{ employees : has
    users ||--o{ job_cards : creates
    users ||--o{ bills : generates
    users ||--o{ audit_logs : performs
    users ||--o{ attendance : marks
    users ||--o{ salary_payments : processes
    
    manufacturers ||--o{ product_master : manufactures
    categories ||--o{ product_master : categorizes
    categories ||--o{ categories : "parent-child"
    
    product_master ||--o{ inventory : "stock of"
    
    employees ||--o{ job_cards : "assigned to"
    employees ||--o{ employee_commissions : earns
    employees ||--o{ salary_payments : receives
    employees ||--o{ attendance : records
    
    job_cards ||--o{ job_products : contains
    job_cards ||--|| bills : generates
    job_cards ||--o{ employee_commissions : "earns commission from"
    
    inventory ||--o{ job_products : "used in"
    
    bills ||--o{ bill_items : contains
    bills ||--o{ employee_commissions : "triggers commission"
    
    roles {
        int id PK
        string name UK
        text description
        jsonb permissions
        timestamp created_at
        timestamp updated_at
    }
    
    users {
        int id PK
        string username UK
        string email UK
        string password_hash
        int role_id FK
        boolean is_active
        timestamp last_login
        timestamp created_at
        timestamp updated_at
    }
    
    employees {
        int id PK
        int user_id FK
        string first_name
        string last_name
        string phone
        text address
        date date_of_birth
        date date_of_joining
        string designation
        decimal commission_percentage
        decimal base_salary
        string id_proof_type
        string id_proof_number
        string pf_number
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    manufacturers {
        int id PK
        string name UK
        string country
        string website
        jsonb contact_info
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    categories {
        int id PK
        string name UK
        int parent_id FK
        text description
        timestamp created_at
        timestamp updated_at
    }
    
    product_master {
        int id PK
        int manufacturer_id FK
        int category_id FK
        string name
        string part_number
        text description
        jsonb specifications
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    inventory {
        int id PK
        int product_master_id FK
        string barcode UK
        string brand
        int current_quantity
        int minimum_stock_level
        decimal unit_price
        decimal selling_price
        string storage_location
        string supplier_name
        jsonb supplier_contact
        date last_restocked_date
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    job_cards {
        int id PK
        string job_number UK
        string customer_name
        string customer_phone
        string customer_email
        string vehicle_number
        string vehicle_type
        string vehicle_brand
        string vehicle_model
        text reported_issues
        int assigned_mechanic_id FK
        decimal estimated_cost
        decimal actual_cost
        decimal labor_charges
        string status
        int created_by FK
        timestamp completed_at
        timestamp created_at
        timestamp updated_at
    }
    
    job_products {
        int id PK
        int job_card_id FK
        int inventory_id FK
        int quantity
        decimal unit_price
        decimal total_price
        timestamp added_at
    }
    
    bills {
        int id PK
        string bill_number UK
        int job_card_id FK
        string customer_name
        string customer_phone
        decimal subtotal
        decimal tax_amount
        decimal discount_amount
        decimal total_amount
        string payment_method
        string payment_status
        decimal paid_amount
        int generated_by FK
        timestamp created_at
        timestamp updated_at
    }
    
    bill_items {
        int id PK
        int bill_id FK
        string item_type
        string description
        int quantity
        decimal unit_price
        decimal total_price
        timestamp created_at
    }
    
    employee_commissions {
        int id PK
        int employee_id FK
        int bill_id FK
        int job_card_id FK
        decimal commission_amount
        decimal commission_percentage
        string status
        date paid_date
        timestamp created_at
    }
    
    salary_payments {
        int id PK
        int employee_id FK
        date payment_month
        decimal base_salary
        decimal total_commission
        decimal deductions
        decimal total_amount
        date payment_date
        string payment_method
        string status
        int paid_by FK
        text notes
        timestamp created_at
        timestamp updated_at
    }
    
    attendance {
        int id PK
        int employee_id FK
        date date UK
        time check_in
        time check_out
        string status
        string leave_type
        text notes
        int marked_by FK
        timestamp created_at
        timestamp updated_at
    }
    
    audit_logs {
        int id PK
        int user_id FK
        string action
        string table_name
        int record_id
        jsonb old_values
        jsonb new_values
        string ip_address
        text user_agent
        timestamp created_at
    }
```

## Table Descriptions

### 1. **roles**
Defines user roles and their permissions.
- **Primary Key**: id
- **Unique**: name
- **Relationships**: One-to-Many with users

### 2. **users**
Core authentication and user management table.
- **Primary Key**: id
- **Foreign Keys**: role_id → roles(id)
- **Unique**: username, email
- **Relationships**: 
  - One-to-One with employees
  - One-to-Many with job_cards (as creator)
  - One-to-Many with bills (as generator)

### 3. **employees**
Complete employee records with commission settings.
- **Primary Key**: id
- **Foreign Keys**: user_id → users(id)
- **Relationships**:
  - One-to-Many with job_cards (as assigned mechanic)
  - One-to-Many with employee_commissions
  - One-to-Many with salary_payments
  - One-to-Many with attendance

### 4. **manufacturers**
Master list of all product manufacturers.
- **Primary Key**: id
- **Unique**: name
- **Relationships**: One-to-Many with product_master

### 5. **categories**
Hierarchical product categorization (supports parent-child).
- **Primary Key**: id
- **Foreign Keys**: parent_id → categories(id) (self-referencing)
- **Unique**: name
- **Relationships**: One-to-Many with product_master

### 6. **product_master**
Master catalog of all available products across manufacturers.
- **Primary Key**: id
- **Foreign Keys**: 
  - manufacturer_id → manufacturers(id)
  - category_id → categories(id)
- **Relationships**: One-to-Many with inventory

### 7. **inventory**
Actual stock/inventory with pricing and quantity.
- **Primary Key**: id
- **Foreign Keys**: product_master_id → product_master(id)
- **Unique**: barcode
- **Relationships**: One-to-Many with job_products

### 8. **job_cards**
Core job/task management for vehicle servicing.
- **Primary Key**: id
- **Foreign Keys**: 
  - assigned_mechanic_id → employees(id)
  - created_by → users(id)
- **Unique**: job_number
- **Status Flow**: Created → In Progress → Washing → Completed
- **Relationships**: 
  - One-to-Many with job_products
  - One-to-One with bills
  - One-to-Many with employee_commissions

### 9. **job_products**
Junction table linking job cards with inventory items used.
- **Primary Key**: id
- **Foreign Keys**: 
  - job_card_id → job_cards(id)
  - inventory_id → inventory(id)
- **Purpose**: Tracks which products were used in which jobs

### 10. **bills**
Invoice/billing records generated from completed jobs.
- **Primary Key**: id
- **Foreign Keys**: 
  - job_card_id → job_cards(id)
  - generated_by → users(id)
- **Unique**: bill_number
- **Relationships**: 
  - One-to-Many with bill_items
  - One-to-Many with employee_commissions

### 11. **bill_items**
Individual line items in a bill.
- **Primary Key**: id
- **Foreign Keys**: bill_id → bills(id)
- **Item Types**: Product, Labor, Other

### 12. **employee_commissions**
Tracks commissions earned by employees from jobs.
- **Primary Key**: id
- **Foreign Keys**: 
  - employee_id → employees(id)
  - bill_id → bills(id)
  - job_card_id → job_cards(id)
- **Status**: Pending, Paid

### 13. **salary_payments**
Monthly salary payment records including commissions.
- **Primary Key**: id
- **Foreign Keys**: 
  - employee_id → employees(id)
  - paid_by → users(id)

### 14. **attendance**
Daily attendance tracking for employees.
- **Primary Key**: id
- **Foreign Keys**: 
  - employee_id → employees(id)
  - marked_by → users(id)
- **Unique**: (employee_id, date)

### 15. **audit_logs**
System-wide audit trail for all critical operations.
- **Primary Key**: id
- **Foreign Keys**: user_id → users(id)
- **Purpose**: Track all changes for compliance and debugging

## Views

### vw_low_stock_items
Shows inventory items at or below minimum stock level.

### vw_active_jobs
Lists all jobs that are not yet completed.

### vw_employee_performance
Aggregated performance metrics per employee.

### vw_daily_revenue
Daily revenue summary with payment status.

## Key Features

### Auto-Generated Fields
- **job_number**: Auto-generated as `JOB{YYYYMMDD}{00001}`
- **bill_number**: Auto-generated as `BILL{YYYYMMDD}{00001}`
- **barcode**: Auto-generated as `BAR{0000000001}`

### Automatic Timestamps
All tables have `created_at` and most have `updated_at` with automatic triggers.

### Indexes
Optimized indexes on:
- Foreign keys
- Frequently queried fields (email, barcode, job_number, etc.)
- Date fields for reporting
- Status fields for filtering

### Constraints
- **Check Constraints**: vehicle_type, status fields, payment_status
- **Foreign Key Constraints**: Maintain referential integrity
- **Unique Constraints**: Prevent duplicates
- **Not Null Constraints**: Ensure data quality

## Workflow Summary

```
1. Create Job Card
   ↓
2. Assign Mechanic
   ↓
3. Add Products to Job (from Inventory)
   ↓
4. Update Job Status (Created → In Progress → Washing)
   ↓
5. Complete Job
   ↓
6. Generate Bill (auto-calculate from job_products + labor)
   ↓
7. Deduct Inventory
   ↓
8. Calculate & Record Commission
   ↓
9. Process Payment
   ↓
10. Mark Salary Payment (Monthly)
```

## Security Features

1. **Role-based Access Control**: Via roles table
2. **Audit Logging**: All critical operations logged
3. **Soft Deletes**: is_active flags instead of hard deletes
4. **Data Integrity**: Foreign key constraints
5. **Password Security**: Hashed passwords (bcrypt)

## Performance Optimizations

1. **Strategic Indexes**: On frequently queried columns
2. **Views**: Pre-computed queries for common reports
3. **Partitioning Ready**: Can partition audit_logs by date
4. **JSONB**: For flexible metadata storage with indexing support
