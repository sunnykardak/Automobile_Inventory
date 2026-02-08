# 🚀 Quick Start Guide

Get your Automobile Inventory Management System up and running in 5 minutes!

## ⚡ Prerequisites Check

Before starting, ensure you have:

- ✅ Node.js v18+ installed (`node --version`)
- ✅ PostgreSQL 14+ installed (`psql --version`)
- ✅ npm v9+ installed (`npm --version`)

## 📦 Step-by-Step Setup

### Step 1: Database Setup (2 minutes)

```bash
# Navigate to database folder
cd database

# Make setup script executable
chmod +x setup.sh

# Run automated setup
./setup.sh
```

**What this does:**
- Creates PostgreSQL user: `nishikesh` / `admin123`
- Creates database: `automotive_inventory`
- Sets up all tables, views, triggers
- Inserts seed data (roles, admin user, sample manufacturers, etc.)

**Expected output:**
```
✅ Database setup completed successfully!
```

---

### Step 2: Backend Setup (1 minute)

```bash
# Navigate to backend folder
cd ../backend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Expected output:**
```
🚀 Server running on port 5000
✅ Database connected successfully
```

**Test it:**
Open browser: `http://localhost:5000/health`

Should see: `{"status":"OK"}`

---

### Step 3: Frontend Setup (2 minutes)

```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Expected output:**
```
▲ Next.js 14.0.4
- Local: http://localhost:3000
✓ Ready in 2.5s
```

**Open application:**
Browse to: `http://localhost:3000`

---

## 🔐 Login

Use the default admin credentials:

```
Email: admin@garage.com
Password: admin123
```

---

## 🎉 You're All Set!

You should now see the dashboard with:
- Today's statistics
- Revenue graphs
- Top mechanics
- Quick action buttons

---

## 📱 What You Can Do Now

### Create Your First Job Card

1. Click **"+ New Job Card"** on dashboard
2. Fill in customer details:
   - Name: John Doe
   - Phone: +91-9876543210
   - Vehicle: KA-01-AB-1234
   - Type: Car
   - Issues: Brake service required

3. Assign mechanic (select from dropdown)
4. Save job card

### Add Products to Inventory

1. Go to **Inventory** from sidebar
2. Click **"+ Add Product"**
3. Select manufacturer and category
4. Enter product details
5. Barcode will be auto-generated

### Complete a Job

1. Go to **Tasks / Jobs**
2. Open a job card
3. Add products used (click "+ Add Product")
4. Update status to "In Progress"
5. Click **"Complete Job"**
6. Bill will be auto-generated!

---

## 🛠️ Troubleshooting

### Database Connection Error

**Error:** `Failed to connect to database`

**Fix:**
```bash
# Check if PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Start PostgreSQL if stopped
brew services start postgresql@14  # macOS
sudo systemctl start postgresql  # Linux
```

### Port Already in Use

**Error:** `Port 5000 already in use`

**Fix:**
```bash
# Change port in backend/.env
PORT=5001

# Or kill process using port 5000
lsof -ti:5000 | xargs kill -9
```

### Module Not Found

**Error:** `Cannot find module 'express'`

**Fix:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Next Steps

1. **Explore Modules**
   - Try creating employees
   - Add more inventory items
   - Generate reports

2. **Customize Settings**
   - Update garage name in `.env` files
   - Change tax percentage
   - Add your logo

3. **Read Full Documentation**
   - See [README.md](README.md) for complete docs
   - Check [ER_DIAGRAM.md](database/ER_DIAGRAM.md) for database schema

---

## 💡 Pro Tips

- Use **Ctrl/Cmd + K** for global search (coming soon)
- Barcode scanner works with USB scanners
- Export reports as CSV (coming soon)
- Mobile responsive - works on tablets!

---

## 🆘 Need Help?

If something doesn't work:

1. Check the logs in terminal
2. Verify database is running
3. Ensure all dependencies installed
4. Check environment variables
5. Create an issue on GitHub

---

## 🎉 Happy Managing!

Your garage management system is ready to streamline operations!

**Useful Commands:**

```bash
# Backend
npm run dev      # Development mode
npm start        # Production mode

# Frontend
npm run dev      # Development mode
npm run build    # Build for production
npm start        # Serve production build

# Database
psql -U nishikesh -d automotive_inventory  # Connect to DB
```

---

Made with ❤️ for efficient garage management
