# Mechanic Performance Tracking Feature

## Overview
Complete mechanic performance tracking system with comprehensive metrics, leaderboards, and detailed analytics.

## Database Components

### Views Created

#### 1. mechanic_performance_overview
Comprehensive view of each mechanic's performance metrics:
- **Job Statistics**: Total jobs, completed, in progress, pending
- **Completion Rate**: Percentage of jobs completed successfully
- **Revenue Metrics**: Total revenue generated, average job value
- **Cost Efficiency**: Estimated vs actual cost comparison
- **Time Efficiency**: Average days to complete jobs
- **Commission**: Earned, paid, and pending commission amounts
- **Attendance**: Last 30 days present/absent records
- **Recent Performance**: Jobs in last 7 and 30 days
- **Quality Metrics**: Jobs without rework within 7 days

#### 2. mechanic_monthly_performance
Monthly breakdown showing trends over time:
- Jobs assigned and completed per month
- Revenue generated each month
- Commission earned monthly
- Attendance days per month
- Average completion time trends

### Indexes Created
For optimal query performance:
- `idx_job_cards_mechanic_status` - Mechanic + status lookup
- `idx_job_cards_mechanic_created` - Mechanic + creation date
- `idx_job_cards_mechanic_completed` - Mechanic + completion date
- `idx_employee_commissions_employee_created` - Commission lookups
- `idx_attendance_employee_date` - Attendance queries

## Backend API Endpoints

### Base URL: `/api/v1/employees/performance`

### 1. GET `/overview`
Get all mechanics performance overview

**Query Parameters:**
- `sortBy` - Column to sort by (default: total_revenue_generated)
  - Options: mechanic_name, total_jobs_assigned, jobs_completed, completion_rate_percentage, total_revenue_generated, avg_job_value, avg_completion_days, total_commission_earned
- `order` - Sort order (default: DESC)
  - Options: ASC, DESC
- `active` - Filter by active status (default: true)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "mechanic_id": 3,
      "mechanic_name": "Amit Sharma",
      "designation": "Junior Mechanic",
      "total_jobs_assigned": 15,
      "jobs_completed": 12,
      "completion_rate_percentage": 80.00,
      "total_revenue_generated": 45000.00,
      "avg_job_value": 3750.00,
      "avg_completion_days": 0.75,
      "total_commission_earned": 1350.00,
      "jobs_last_30_days": 10,
      ...
    }
  ],
  "meta": {
    "total": 5,
    "sortBy": "total_revenue_generated",
    "order": "DESC"
  }
}
```

### 2. GET `/:id`
Get specific mechanic's detailed performance

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": { /* Overall metrics */ },
    "monthlyPerformance": [ /* Last 12 months data */ ],
    "recentJobs": [ /* Last 20 jobs */ ],
    "attendance": [ /* Last 30 days summary */ ]
  }
}
```

### 3. GET `/compare`
Compare multiple mechanics' performance

**Query Parameters:**
- `ids` - Comma-separated mechanic IDs (required)
  - Example: `ids=2,3,5`

**Response:**
```json
{
  "success": true,
  "data": [ /* Performance data for selected mechanics */ ]
}
```

### 4. GET `/trends`
Get monthly performance trends for charts

**Query Parameters:**
- `months` - Number of months to retrieve (default: 6)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "mechanic_id": 3,
      "mechanic_name": "Amit Sharma",
      "data": [
        {
          "month": "Feb 2026",
          "month_date": "2026-02-01",
          "jobs_assigned": 5,
          "jobs_completed": 4,
          "revenue": 15000,
          "commission": 450,
          "attendance": 22,
          "avg_completion_days": 0.8
        },
        ...
      ]
    }
  ]
}
```

### 5. GET `/leaderboard`
Get top performing mechanics

**Query Parameters:**
- `metric` - Performance metric (default: revenue)
  - Options: revenue, jobs, efficiency, speed
- `period` - Time period for jobs_last_X_days (default: 30)
- `limit` - Number of top performers (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [ /* Top performers sorted by selected metric */ ],
  "meta": {
    "metric": "revenue",
    "period": "30",
    "limit": 10
  }
}
```

## Frontend Dashboard

### URL: `/dashboard/performance`

### Features

#### 1. Summary Cards
- **Total Mechanics** - Count of all mechanics with active status
- **Total Revenue** - Sum of all revenue generated
- **Total Jobs** - Count of all jobs with completed count
- **Average Completion Rate** - Team-wide average percentage

#### 2. Top Performers Leaderboard
- Medal rankings (🥇🥈🥉) for top 3
- Switchable metrics:
  - By Revenue - Total revenue generated
  - By Jobs - Number of jobs completed
  - By Completion Rate - Success percentage
  - By Speed - Average completion time
- Visual ranking with colored badges

#### 3. Detailed Performance Table
Comprehensive table showing:
- Mechanic name and designation
- Job statistics (completed/total, ongoing)
- Completion rate with color coding:
  - Green: ≥80% (Excellent)
  - Yellow: 60-79% (Good)
  - Red: <60% (Needs improvement)
- Revenue generated and average job value
- Average completion speed
- Commission earned (total and pending)
- Last 30 days activity
- Attendance (present/absent days)

#### 4. Sorting & Filtering
- Sort by any column (name, jobs, revenue, etc.)
- Toggle ASC/DESC order
- Real-time updates

#### 5. Export Functionality
- Download performance report as CSV
- Includes all key metrics
- Timestamped filename

### Color Coding System

**Completion Rate:**
- 🟢 Green (≥80%): Excellent performance
- 🟡 Yellow (60-79%): Good performance
- 🔴 Red (<60%): Needs improvement

**Speed Rating:**
- Calculated as: 100 - (avg_days * 10)
- Similar color coding based on efficiency

## Performance Metrics Explained

### 1. Completion Rate
```
(Jobs Completed / Total Jobs Assigned) × 100
```
Measures success rate in completing assigned jobs.

### 2. Cost Efficiency
```
(Total Actual Cost / Total Estimated Cost) × 100
```
Shows how accurately mechanics estimate job costs.
- Below 100%: Under budget (good)
- Above 100%: Over budget (needs attention)

### 3. Average Completion Days
```
Average of (Completed Date - Created Date) for all completed jobs
```
Measures how quickly mechanic completes jobs.

### 4. Jobs Without Rework
```
Count of jobs with no follow-up service within 7 days
```
Quality metric - higher is better.

### 5. Revenue Generated
```
Sum of total_amount from bills for completed jobs
```
Direct financial contribution.

## Usage Examples

### Get Top Revenue Generators
```bash
GET /api/v1/employees/performance/overview?sortBy=total_revenue_generated&order=DESC
```

### Compare Two Mechanics
```bash
GET /api/v1/employees/performance/compare?ids=2,3
```

### Get 6-Month Trends
```bash
GET /api/v1/employees/performance/trends?months=6
```

### Get Speed Leaderboard
```bash
GET /api/v1/employees/performance/leaderboard?metric=speed&limit=5
```

## Business Value

### For Management
- **Identify top performers** for rewards and recognition
- **Spot underperformers** who need training
- **Track revenue contribution** per mechanic
- **Monitor attendance** patterns
- **Measure quality** through rework rates

### For Mechanics
- **Transparent performance** metrics
- **Clear commission** tracking
- **Goal setting** based on data
- **Competitive motivation** through leaderboards

### For Operations
- **Optimize job assignment** based on performance
- **Track efficiency trends** over time
- **Identify training needs** from metrics
- **Forecast capacity** based on completion rates

## Files Modified/Created

### Database
- `database/add_mechanic_performance.sql` - Views, indexes, and functions

### Backend
- `backend/src/routes/employee.routes.js` - 5 new performance endpoints

### Frontend
- `frontend/src/app/dashboard/performance/page.tsx` - Complete dashboard (600+ lines)
- `frontend/src/components/layout/Sidebar.tsx` - Added Performance menu item

## Testing

### Database Queries
```sql
-- View all mechanics performance
SELECT * FROM mechanic_performance_overview ORDER BY total_revenue_generated DESC;

-- View monthly trends
SELECT * FROM mechanic_monthly_performance 
WHERE performance_month >= CURRENT_DATE - INTERVAL '6 months'
ORDER BY mechanic_id, performance_month DESC;

-- Get specific mechanic
SELECT * FROM mechanic_performance_overview WHERE mechanic_id = 3;
```

### API Testing
```bash
# Overview
curl "http://localhost:5001/api/v1/employees/performance/overview" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Leaderboard
curl "http://localhost:5001/api/v1/employees/performance/leaderboard?metric=revenue" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Frontend
Navigate to: `http://localhost:3001/dashboard/performance`

## Future Enhancements

### Potential Additions
1. **Real-time notifications** when mechanic completes a milestone
2. **Performance goals** with progress tracking
3. **Peer comparison** charts
4. **Customer satisfaction** scores per mechanic
5. **Skill-based tracking** (engine work, electrical, body work, etc.)
6. **Certification tracking** linked to performance
7. **Bonus calculation** based on performance metrics
8. **Mobile app** for mechanics to view their stats
9. **Weekly/monthly reports** auto-emailed to mechanics
10. **Gamification** badges and achievements

## Notes
- Views automatically update when job/commission/attendance data changes
- Indexes ensure fast query performance even with large datasets
- All monetary values in INR (₹)
- Dates are timezone-aware
- Performance calculations exclude inactive employees by default
