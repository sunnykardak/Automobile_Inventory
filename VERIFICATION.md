# ✓ Setup Verification Checklist

Use this checklist to verify your installation is working correctly.

---

## 📋 Pre-Installation Checks

### System Requirements

- [ ] Node.js v18+ installed
  ```bash
  node --version
  # Should show: v18.x.x or higher
  ```

- [ ] npm v9+ installed
  ```bash
  npm --version
  # Should show: 9.x.x or higher
  ```

- [ ] PostgreSQL 14+ installed
  ```bash
  psql --version
  # Should show: psql (PostgreSQL) 14.x or higher
  ```

- [ ] PostgreSQL service running
  ```bash
  # macOS
  brew services list | grep postgresql
  
  # Linux
  sudo systemctl status postgresql
  
  # Should show: started/active
  ```

---

## 🗄️ Database Verification

### After running `database/setup.sh`:

- [ ] Database created
  ```bash
  psql -U postgres -c "\l" | grep automotive_inventory
  # Should show: automotive_inventory
  ```

- [ ] User created
  ```bash
  psql -U postgres -c "\du" | grep nishikesh
  # Should show: nishikesh
  ```

- [ ] Tables created (15 tables)
  ```bash
  psql -U nishikesh -d automotive_inventory -c "\dt"
  # Should list 15 tables
  ```

- [ ] Verify roles table
  ```bash
  psql -U nishikesh -d automotive_inventory -c "SELECT COUNT(*) FROM roles;"
  # Should show: count = 4
  ```

- [ ] Verify admin user created
  ```bash
  psql -U nishikesh -d automotive_inventory -c "SELECT username, email FROM users;"
  # Should show: admin | admin@garage.com
  ```

- [ ] Verify manufacturers loaded
  ```bash
  psql -U nishikesh -d automotive_inventory -c "SELECT COUNT(*) FROM manufacturers;"
  # Should show: count = 17
  ```

- [ ] Verify categories loaded
  ```bash
  psql -U nishikesh -d automotive_inventory -c "SELECT COUNT(*) FROM categories;"
  # Should show: count = 12
  ```

- [ ] Verify sample inventory
  ```bash
  psql -U nishikesh -d automotive_inventory -c "SELECT COUNT(*) FROM inventory;"
  # Should show: count = 11
  ```

- [ ] Test database connection
  ```bash
  psql -U nishikesh -d automotive_inventory -c "SELECT NOW();"
  # Should show current timestamp
  ```

---

## ⚙️ Backend Verification

### After running `npm install` in backend folder:

- [ ] Dependencies installed
  ```bash
  cd backend
  ls node_modules | wc -l
  # Should show: 200+ packages
  ```

- [ ] .env file exists
  ```bash
  cat .env | grep PORT
  # Should show: PORT=5000
  ```

- [ ] Can start server
  ```bash
  npm run dev
  # Should show: Server running on port 5000
  # Should show: Database connected successfully
  ```

- [ ] Health endpoint works
  ```bash
  # In new terminal:
  curl http://localhost:5000/health
  # Should return: {"status":"OK","timestamp":"...","uptime":...}
  ```

- [ ] API base responds
  ```bash
  curl http://localhost:5000/api/v1
  # Should return 404 or root message
  ```

- [ ] Database connection from backend
  ```bash
  # Check server logs for:
  # ✅ Database connected successfully
  ```

- [ ] No errors in console
  ```bash
  # Server logs should not show any errors
  ```

### Test API Endpoints:

- [ ] Login endpoint works
  ```bash
  curl -X POST http://localhost:5000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@garage.com","password":"admin123"}'
  
  # Should return: {"success":true,"data":{"user":{...},"token":"..."}}
  ```

- [ ] Protected route requires auth
  ```bash
  curl http://localhost:5000/api/v1/dashboard
  # Should return: {"success":false,"message":"No token provided"}
  ```

- [ ] Get dashboard with token
  ```bash
  TOKEN="<paste-token-from-login>"
  curl http://localhost:5000/api/v1/dashboard \
    -H "Authorization: Bearer $TOKEN"
  
  # Should return dashboard data
  ```

---

## 🎨 Frontend Verification

### After running `npm install` in frontend folder:

- [ ] Dependencies installed
  ```bash
  cd frontend
  ls node_modules | wc -l
  # Should show: 200+ packages
  ```

- [ ] .env.local file exists
  ```bash
  cat .env.local | grep API_URL
  # Should show: NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
  ```

- [ ] Can start development server
  ```bash
  npm run dev
  # Should show: ▲ Next.js 14.x.x
  # Should show: - Local: http://localhost:3000
  # Should show: ✓ Ready in X.Xs
  ```

- [ ] Homepage loads
  ```bash
  # Open browser: http://localhost:3000
  # Should show: Login page with garage name
  ```

- [ ] No compile errors
  ```bash
  # Terminal should not show TypeScript or build errors
  ```

- [ ] Console has no errors
  ```bash
  # Open browser DevTools (F12)
  # Console tab should have no red errors
  ```

### Test Frontend Features:

- [ ] Login page displays
  - [ ] Garage name shows
  - [ ] Email input field
  - [ ] Password input field
  - [ ] Login button
  - [ ] Default credentials hint

- [ ] Can login
  - [ ] Enter: admin@garage.com / admin123
  - [ ] Click "Login"
  - [ ] Should redirect to /dashboard

- [ ] Dashboard loads
  - [ ] See statistics cards
  - [ ] See "Total Jobs Today"
  - [ ] See "Today's Revenue"
  - [ ] See "Pending Jobs"
  - [ ] See quick action buttons

- [ ] Sidebar works
  - [ ] Sidebar visible on left
  - [ ] Can see all 7 menu items
  - [ ] Dashboard item highlighted
  - [ ] Can click other menu items

- [ ] Header works
  - [ ] Search bar visible
  - [ ] Notification icon
  - [ ] User profile shows
  - [ ] Can click profile dropdown
  - [ ] See "My Profile", "Change Password", "Logout"

- [ ] Responsive design
  - [ ] Resize browser window
  - [ ] Sidebar collapses on mobile
  - [ ] Can open mobile menu

- [ ] Logout works
  - [ ] Click user profile > Logout
  - [ ] Should redirect to login page
  - [ ] Token removed from localStorage

---

## 🔐 Authentication & Security Verification

- [ ] Password hashing works
  ```bash
  psql -U nishikesh -d automotive_inventory -c "SELECT password_hash FROM users LIMIT 1;"
  # Should show: $2b$10$... (bcrypt hash, not plain text)
  ```

- [ ] JWT tokens generated
  - [ ] Login returns token
  - [ ] Token starts with "eyJ"
  - [ ] Token has 3 parts (xxx.yyy.zzz)

- [ ] Protected routes blocked
  - [ ] Try accessing /dashboard without logging in
  - [ ] Should redirect to login

- [ ] Token validation works
  - [ ] Login and get token
  - [ ] API calls include Authorization header
  - [ ] Dashboard data loads successfully

- [ ] Role-based access
  - [ ] Admin user can access all features
  - [ ] Check user role in profile

---

## 📊 Functional Verification

### Dashboard Statistics:

- [ ] Today's stats show
  - [ ] Total Jobs Today: 0 (or actual count)
  - [ ] Pending Jobs: 0 (or actual count)
  - [ ] Today's Revenue: ₹0
  - [ ] Low Stock Items: Shows count

- [ ] Top sections load
  - [ ] Top Used Parts section visible
  - [ ] Top Mechanics section visible
  - [ ] "No data available" if empty (expected)

- [ ] Quick actions work
  - [ ] Click "+ New Job Card" (may not be implemented yet)
  - [ ] Click "View Inventory" (may not be implemented yet)
  - [ ] Buttons are clickable

### Inventory Check:

- [ ] Can access inventory API
  ```bash
  curl http://localhost:5000/api/v1/inventory \
    -H "Authorization: Bearer $TOKEN"
  
  # Should return array of 11 inventory items
  ```

- [ ] Low stock endpoint works
  ```bash
  curl http://localhost:5000/api/v1/inventory/alerts/low-stock \
    -H "Authorization: Bearer $TOKEN"
  
  # Should return low stock items
  ```

### Job Cards Check:

- [ ] Can fetch jobs
  ```bash
  curl http://localhost:5000/api/v1/jobs \
    -H "Authorization: Bearer $TOKEN"
  
  # Should return empty array or existing jobs
  ```

---

## 🚨 Common Issues & Fixes

### Issue: Database connection fails

**Symptom:** `Failed to connect to database`

**Checklist:**
- [ ] PostgreSQL running? `brew services list`
- [ ] Correct credentials in .env?
- [ ] Database exists? `psql -l | grep automotive`
- [ ] User has access? `psql -U nishikesh -d automotive_inventory`

**Fix:**
```bash
# Restart PostgreSQL
brew services restart postgresql@14
# Or run setup.sh again
```

### Issue: Port already in use

**Symptom:** `Port 5000 already in use`

**Checklist:**
- [ ] Another server running on 5000?
- [ ] Check running processes

**Fix:**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
# Or change PORT in backend/.env to 5001
```

### Issue: Module not found

**Symptom:** `Cannot find module 'express'`

**Checklist:**
- [ ] Ran npm install?
- [ ] node_modules folder exists?
- [ ] package.json exists?

**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Frontend won't start

**Symptom:** TypeScript errors or build fails

**Checklist:**
- [ ] Ran npm install?
- [ ] .env.local exists?
- [ ] Correct Node version (18+)?

**Fix:**
```bash
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

### Issue: Login fails with correct credentials

**Symptom:** "Invalid credentials" despite using admin@garage.com/admin123

**Checklist:**
- [ ] Admin user created in database?
- [ ] Backend running?
- [ ] CORS properly configured?
- [ ] Check browser console for errors

**Fix:**
```bash
# Verify admin user exists
psql -U nishikesh -d automotive_inventory -c \
  "SELECT email FROM users WHERE email='admin@garage.com';"

# If no rows, run database/schema.sql again
```

---

## ✅ Final Verification

All systems operational when:

- [x] Database has 15 tables
- [x] Backend running on port 5000
- [x] Frontend running on port 3000
- [x] Can login with default credentials
- [x] Dashboard shows statistics
- [x] API returns data
- [x] No errors in logs
- [x] No console errors in browser

---

## 🎉 Success Indicators

When everything works, you should:

1. ✅ See login page at http://localhost:3000
2. ✅ Login successfully with admin@garage.com
3. ✅ See dashboard with statistics
4. ✅ Navigate between menu items
5. ✅ See user profile in header
6. ✅ Backend logs show no errors
7. ✅ Database queries work
8. ✅ API responds to requests

---

## 📞 Getting Help

If any check fails:

1. Review error messages carefully
2. Check the [QUICKSTART.md](QUICKSTART.md) guide
3. Verify all prerequisites installed
4. Check database connection strings
5. Ensure correct versions of software
6. Look at logs in terminal
7. Check browser console (F12)

---

## 🎯 Next Steps After Verification

Once all checks pass:

1. Explore the dashboard
2. Try creating a job card (API works)
3. Add products to inventory
4. Generate a test bill
5. Customize garage settings
6. Add your employees
7. Start using the system!

---

**Verification Version:** 1.0.0  
**Last Updated:** February 2026  
**Status:** Ready for Production ✅
