-- Insert 5 employee records into the employees table

INSERT INTO employees (
  first_name,
  last_name,
  phone,
  address,
  date_of_birth,
  date_of_joining,
  designation,
  commission_percentage,
  base_salary,
  id_proof_type,
  id_proof_number,
  is_active
) VALUES
  ('Rajesh', 'Kumar', '9876543210', '123 MG Road, Mumbai', '1990-05-15', '2023-01-15', 'Senior Mechanic', 5.00, 25000.00, 'Aadhaar', '1234-5678-9012', true),
  ('Amit', 'Sharma', '9876543211', '456 Park Street, Delhi', '1992-08-20', '2023-03-10', 'Junior Mechanic', 3.00, 18000.00, 'Aadhaar', '2345-6789-0123', true),
  ('Priya', 'Patel', '9876543212', '789 Brigade Road, Bangalore', '1988-12-10', '2022-06-01', 'Service Advisor', 4.00, 22000.00, 'PAN Card', 'ABCD1234E', true),
  ('Vikram', 'Singh', '9876543213', '321 Anna Salai, Chennai', '1995-03-25', '2024-01-05', 'Parts Manager', 3.50, 20000.00, 'Driving License', 'DL1234567890', true),
  ('Sunita', 'Reddy', '9876543214', '654 FC Road, Pune', '1991-07-18', '2023-09-15', 'Accountant', 2.00, 23000.00, 'Aadhaar', '3456-7890-1234', true);

-- Display the inserted employees
SELECT id, first_name, last_name, designation, phone, is_active, date_of_joining 
FROM employees 
ORDER BY id;
