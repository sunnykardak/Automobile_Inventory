-- =========================================
-- MECHANIC PERFORMANCE TRACKING
-- =========================================
-- This script creates views and tables for tracking mechanic performance
-- including job completion rates, revenue generated, efficiency metrics, etc.

-- Drop existing views if they exist
DROP VIEW IF EXISTS mechanic_performance_overview CASCADE;
DROP VIEW IF EXISTS mechanic_monthly_performance CASCADE;

-- =========================================
-- 1. MECHANIC PERFORMANCE OVERVIEW VIEW
-- =========================================
-- Comprehensive view of each mechanic's overall performance
CREATE OR REPLACE VIEW mechanic_performance_overview AS
SELECT 
    e.id as mechanic_id,
    e.first_name || ' ' || e.last_name as mechanic_name,
    e.designation,
    e.commission_percentage,
    e.is_active,
    e.date_of_joining,
    
    -- Job Statistics
    COUNT(DISTINCT jc.id) as total_jobs_assigned,
    COUNT(DISTINCT CASE WHEN jc.status = 'Completed' THEN jc.id END) as jobs_completed,
    COUNT(DISTINCT CASE WHEN jc.status = 'In Progress' THEN jc.id END) as jobs_in_progress,
    COUNT(DISTINCT CASE WHEN jc.status = 'Created' THEN jc.id END) as jobs_pending,
    
    -- Completion Rate
    CASE 
        WHEN COUNT(DISTINCT jc.id) > 0 
        THEN ROUND((COUNT(DISTINCT CASE WHEN jc.status = 'Completed' THEN jc.id END)::DECIMAL / COUNT(DISTINCT jc.id)::DECIMAL * 100), 2)
        ELSE 0 
    END as completion_rate_percentage,
    
    -- Revenue Generated
    COALESCE(SUM(CASE WHEN jc.status = 'Completed' THEN b.total_amount ELSE 0 END), 0) as total_revenue_generated,
    COALESCE(AVG(CASE WHEN jc.status = 'Completed' THEN b.total_amount END), 0) as avg_job_value,
    
    -- Cost Efficiency
    COALESCE(SUM(CASE WHEN jc.status = 'Completed' THEN jc.estimated_cost END), 0) as total_estimated_cost,
    COALESCE(SUM(CASE WHEN jc.status = 'Completed' THEN jc.actual_cost END), 0) as total_actual_cost,
    CASE 
        WHEN SUM(CASE WHEN jc.status = 'Completed' THEN jc.estimated_cost END) > 0 
        THEN ROUND((SUM(CASE WHEN jc.status = 'Completed' THEN jc.actual_cost END) / SUM(CASE WHEN jc.status = 'Completed' THEN jc.estimated_cost END) * 100), 2)
        ELSE 0 
    END as cost_efficiency_percentage,
    
    -- Time Efficiency (average days to complete)
    ROUND(AVG(
        CASE 
            WHEN jc.status = 'Completed' AND jc.completed_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (jc.completed_at - jc.created_at)) / 86400.0 
        END
    ), 2) as avg_completion_days,
    
    -- Commission Earned
    COALESCE(SUM(ec.commission_amount), 0) as total_commission_earned,
    COALESCE(SUM(CASE WHEN ec.status = 'Paid' THEN ec.commission_amount ELSE 0 END), 0) as commission_paid,
    COALESCE(SUM(CASE WHEN ec.status = 'Pending' THEN ec.commission_amount ELSE 0 END), 0) as commission_pending,
    
    -- Attendance Metrics (last 30 days)
    (SELECT COUNT(*) FROM attendance a 
     WHERE a.employee_id = e.id 
     AND a.date >= CURRENT_DATE - INTERVAL '30 days'
     AND a.status IN ('Present', 'Half Day')) as days_present_last_30,
    
    (SELECT COUNT(*) FROM attendance a 
     WHERE a.employee_id = e.id 
     AND a.date >= CURRENT_DATE - INTERVAL '30 days'
     AND a.status = 'Absent') as days_absent_last_30,
    
    -- Recent Performance
    MAX(jc.completed_at) as last_job_completed_at,
    COUNT(CASE WHEN jc.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as jobs_last_7_days,
    COUNT(CASE WHEN jc.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as jobs_last_30_days,
    
    -- Quality Metrics (jobs without rework)
    COUNT(DISTINCT CASE 
        WHEN jc.status = 'Completed' 
        AND NOT EXISTS (
            SELECT 1 FROM job_cards jc2 
            WHERE jc2.vehicle_number = jc.vehicle_number 
            AND jc2.created_at BETWEEN jc.completed_at AND jc.completed_at + INTERVAL '7 days'
        )
        THEN jc.id 
    END) as jobs_without_rework,
    
    e.created_at as employee_since
FROM employees e
LEFT JOIN job_cards jc ON e.id = jc.assigned_mechanic_id
LEFT JOIN bills b ON jc.id = b.job_card_id
LEFT JOIN employee_commissions ec ON e.id = ec.employee_id
GROUP BY e.id, e.first_name, e.last_name, e.designation, e.commission_percentage, e.is_active, e.date_of_joining, e.created_at;

-- =========================================
-- 2. MECHANIC MONTHLY PERFORMANCE VIEW
-- =========================================
-- Monthly breakdown of mechanic performance
CREATE OR REPLACE VIEW mechanic_monthly_performance AS
WITH monthly_jobs AS (
    SELECT 
        e.id as mechanic_id,
        e.first_name || ' ' || e.last_name as mechanic_name,
        DATE_TRUNC('month', jc.created_at) as performance_month,
        TO_CHAR(DATE_TRUNC('month', jc.created_at), 'Mon YYYY') as month_name,
        COUNT(DISTINCT jc.id) as jobs_assigned,
        COUNT(DISTINCT CASE WHEN jc.status = 'Completed' THEN jc.id END) as jobs_completed,
        COALESCE(SUM(CASE WHEN jc.status = 'Completed' THEN b.total_amount ELSE 0 END), 0) as revenue_generated,
        ROUND(AVG(
            CASE 
                WHEN jc.status = 'Completed' AND jc.completed_at IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (jc.completed_at - jc.created_at)) / 86400.0 
            END
        ), 2) as avg_completion_days
    FROM employees e
    LEFT JOIN job_cards jc ON e.id = jc.assigned_mechanic_id
    LEFT JOIN bills b ON jc.id = b.job_card_id
    WHERE jc.created_at IS NOT NULL
    GROUP BY e.id, e.first_name, e.last_name, DATE_TRUNC('month', jc.created_at)
),
monthly_commission AS (
    SELECT 
        employee_id,
        DATE_TRUNC('month', created_at) as month,
        COALESCE(SUM(commission_amount), 0) as commission_earned
    FROM employee_commissions
    GROUP BY employee_id, DATE_TRUNC('month', created_at)
),
monthly_attendance AS (
    SELECT 
        employee_id,
        DATE_TRUNC('month', date) as month,
        COUNT(*) as days_present
    FROM attendance
    WHERE status IN ('Present', 'Half Day')
    GROUP BY employee_id, DATE_TRUNC('month', date)
)
SELECT 
    mj.mechanic_id,
    mj.mechanic_name,
    mj.performance_month,
    mj.month_name,
    mj.jobs_assigned,
    mj.jobs_completed,
    mj.revenue_generated,
    COALESCE(mc.commission_earned, 0) as commission_earned,
    COALESCE(ma.days_present, 0) as days_present,
    mj.avg_completion_days
FROM monthly_jobs mj
LEFT JOIN monthly_commission mc ON mj.mechanic_id = mc.employee_id 
    AND mj.performance_month = mc.month
LEFT JOIN monthly_attendance ma ON mj.mechanic_id = ma.employee_id 
    AND mj.performance_month = ma.month
ORDER BY mj.mechanic_id, mj.performance_month DESC;

-- =========================================
-- 3. CREATE PERFORMANCE SUMMARY FUNCTION
-- =========================================
-- Function to get mechanic performance for a specific date range
CREATE OR REPLACE FUNCTION get_mechanic_performance(
    p_mechanic_id INTEGER DEFAULT NULL,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    mechanic_id INTEGER,
    mechanic_name TEXT,
    total_jobs BIGINT,
    completed_jobs BIGINT,
    in_progress_jobs BIGINT,
    avg_completion_hours NUMERIC,
    total_revenue NUMERIC,
    total_commission NUMERIC,
    attendance_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.first_name || ' ' || e.last_name,
        COUNT(DISTINCT jc.id)::BIGINT,
        COUNT(DISTINCT CASE WHEN jc.status = 'Completed' THEN jc.id END)::BIGINT,
        COUNT(DISTINCT CASE WHEN jc.status = 'In Progress' THEN jc.id END)::BIGINT,
        ROUND(AVG(
            CASE 
                WHEN jc.status = 'Completed' AND jc.completed_at IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (jc.completed_at - jc.created_at)) / 3600.0 
            END
        ), 2),
        COALESCE(SUM(CASE WHEN jc.status = 'Completed' THEN b.total_amount ELSE 0 END), 0),
        COALESCE(SUM(ec.commission_amount), 0),
        ROUND(
            (SELECT COUNT(*) FROM attendance a 
             WHERE a.employee_id = e.id 
             AND a.date BETWEEN p_start_date AND p_end_date
             AND a.status IN ('Present', 'Half Day'))::NUMERIC / 
            NULLIF((p_end_date - p_start_date + 1), 0)::NUMERIC * 100,
        2)
    FROM employees e
    LEFT JOIN job_cards jc ON e.id = jc.assigned_mechanic_id 
        AND jc.created_at BETWEEN p_start_date AND p_end_date
    LEFT JOIN bills b ON jc.id = b.job_card_id
    LEFT JOIN employee_commissions ec ON e.id = ec.employee_id 
        AND ec.created_at BETWEEN p_start_date AND p_end_date
    WHERE (p_mechanic_id IS NULL OR e.id = p_mechanic_id)
        AND e.is_active = true
    GROUP BY e.id, e.first_name, e.last_name
    ORDER BY total_jobs DESC;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =========================================
-- These indexes will speed up performance queries
CREATE INDEX IF NOT EXISTS idx_job_cards_mechanic_status ON job_cards(assigned_mechanic_id, status);
CREATE INDEX IF NOT EXISTS idx_job_cards_mechanic_created ON job_cards(assigned_mechanic_id, created_at);
CREATE INDEX IF NOT EXISTS idx_job_cards_mechanic_completed ON job_cards(assigned_mechanic_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_employee_commissions_employee_created ON employee_commissions(employee_id, created_at);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);

-- =========================================
-- VERIFICATION QUERIES
-- =========================================
-- Test the views and functions

-- View all mechanics performance
SELECT * FROM mechanic_performance_overview ORDER BY total_revenue_generated DESC;

-- View monthly performance trends
SELECT * FROM mechanic_monthly_performance 
WHERE performance_month >= CURRENT_DATE - INTERVAL '6 months'
ORDER BY mechanic_id, performance_month DESC;

-- Get specific mechanic performance for last 30 days
SELECT * FROM get_mechanic_performance(NULL, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE);

-- Summary
SELECT 
    'Mechanic Performance Views Created' as status,
    (SELECT COUNT(*) FROM mechanic_performance_overview) as total_mechanics,
    (SELECT COUNT(DISTINCT mechanic_id) FROM mechanic_monthly_performance) as mechanics_with_monthly_data;
