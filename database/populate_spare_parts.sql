-- =========================================
-- COMPREHENSIVE 2-WHEELER SPARE PARTS DATABASE
-- =========================================
-- This script populates the database with extensive spare parts data
-- for motorcycles, scooters, and electric 2-wheelers

-- Add more manufacturers (2-wheeler specific)
INSERT INTO manufacturers (name, country) VALUES
-- Indian Brands
('TVS', 'India'),
('Royal Enfield', 'India'),
('KTM India', 'India'),
('Ather', 'India'),
('Ola Electric', 'India'),
('Revolt', 'India'),
('Ampere', 'India'),
('Okinawa', 'India'),
('Hero Electric', 'India'),
('Benelli India', 'India'),
-- Japanese Brands  
('Suzuki', 'Japan'),
('Kawasaki', 'Japan'),
('Ducati', 'Italy'),
('Harley-Davidson', 'USA'),
('BMW Motorrad', 'Germany'),
('Triumph', 'UK'),
('Vespa', 'Italy'),
('Aprilia', 'Italy'),
-- Chinese/International EV
('NIU', 'China'),
('Simple Energy', 'India')
ON CONFLICT (name) DO NOTHING;

-- Add comprehensive categories for 2-wheeler parts
INSERT INTO categories (name, description) VALUES
('Engine Parts', 'Engine components and assemblies'),
('Electrical Parts', 'Electrical system components'),
('Body Parts', 'Body panels and fairings'),
('Transmission', 'Clutch, gearbox, and drive system'),
('Suspension', 'Front and rear suspension components'),
('Braking System', 'Brake parts and components'),
('Fuel System', 'Fuel tank, carburetor, injector parts'),
('Exhaust System', 'Exhaust pipes, silencers, catalytic converters'),
('Lighting', 'Headlights, tail lights, indicators'),
('Wheels & Tyres', 'Rims, spokes, tyres, tubes'),
('Filters', 'Oil, air, and fuel filters'),
('Lubricants', 'Engine oils, gear oils, greases'),
('Battery & Charging', 'Batteries, chargers, charging cables'),
('Electronics', 'ECU, sensors, displays'),
('Accessories', 'Mirrors, grips, footrests'),
('Safety Equipment', 'Guards, crash bars, frame sliders'),
('EV Specific', 'Electric motor, controller, BMS')
ON CONFLICT (name) DO NOTHING;

-- Populate product_master with common spare parts

-- ENGINE PARTS
INSERT INTO product_master (category_id, name, part_number, description) VALUES
((SELECT id FROM categories WHERE name = 'Engine Parts'), 'Piston Kit', 'ENG-PISTON-001', 'Complete piston assembly with rings'),
((SELECT id FROM categories WHERE name = 'Engine Parts'), 'Cylinder Block', 'ENG-CYL-001', 'Engine cylinder block'),
((SELECT id FROM categories WHERE name = 'Engine Parts'), 'Cylinder Head', 'ENG-HEAD-001', 'Complete cylinder head assembly'),
((SELECT id FROM categories WHERE name = 'Engine Parts'), 'Crankshaft', 'ENG-CRANK-001', 'Engine crankshaft'),
((SELECT id FROM categories WHERE name = 'Engine Parts'), 'Camshaft', 'ENG-CAM-001', 'Engine camshaft'),
((SELECT id FROM categories WHERE name = 'Engine Parts'), 'Connecting Rod', 'ENG-CONROD-001', 'Piston connecting rod'),
((SELECT id FROM categories WHERE name = 'Engine Parts'), 'Valve Set', 'ENG-VALVE-001', 'Intake and exhaust valves'),
((SELECT id FROM categories WHERE name = 'Engine Parts'), 'Valve Spring', 'ENG-VALSP-001', 'Valve spring set'),
((SELECT id FROM categories WHERE name = 'Engine Parts'), 'Piston Ring Set', 'ENG-PRING-001', 'Complete piston rings'),
((SELECT id FROM categories WHERE name = 'Engine Parts'), 'Engine Gasket Kit', 'ENG-GASKT-001', 'Complete engine gasket set'),
((SELECT id FROM categories WHERE name = 'Engine Parts'), 'Rocker Arm', 'ENG-ROCK-001', 'Valve rocker arm'),
((SELECT id FROM categories WHERE name = 'Engine Parts'), 'Timing Chain', 'ENG-CHAIN-001', 'Engine timing chain'),
((SELECT id FROM categories WHERE name = 'Engine Parts'), 'Oil Pump', 'ENG-OILP-001', 'Engine oil pump'),
((SELECT id FROM categories WHERE name = 'Engine Parts'), 'Water Pump', 'ENG-WATP-001', 'Coolant water pump'),
((SELECT id FROM categories WHERE name = 'Engine Parts'), 'Radiator', 'ENG-RAD-001', 'Engine cooling radiator'),

-- ELECTRICAL PARTS
((SELECT id FROM categories WHERE name = 'Electrical Parts'), 'Spark Plug', 'ELEC-SPARK-001', 'Engine spark plug'),
((SELECT id FROM categories WHERE name = 'Electrical Parts'), 'Ignition Coil', 'ELEC-IGN-001', 'Ignition coil assembly'),
((SELECT id FROM categories WHERE name = 'Electrical Parts'), 'CDI Unit', 'ELEC-CDI-001', 'Capacitor discharge ignition'),
((SELECT id FROM categories WHERE name = 'Electrical Parts'), 'Regulator Rectifier', 'ELEC-REG-001', 'Voltage regulator rectifier'),
((SELECT id FROM categories WHERE name = 'Electrical Parts'), 'Starter Motor', 'ELEC-START-001', 'Electric starter motor'),
((SELECT id FROM categories WHERE name = 'Electrical Parts'), 'Alternator', 'ELEC-ALT-001', 'Charging alternator'),
((SELECT id FROM categories WHERE name = 'Electrical Parts'), 'Wiring Harness', 'ELEC-WIRE-001', 'Complete wiring harness'),
((SELECT id FROM categories WHERE name = 'Electrical Parts'), 'Horn', 'ELEC-HORN-001', 'Electric horn'),
((SELECT id FROM categories WHERE name = 'Electrical Parts'), 'Relay Set', 'ELEC-RELAY-001', 'Electrical relay set'),
((SELECT id FROM categories WHERE name = 'Electrical Parts'), 'Fuse Box', 'ELEC-FUSE-001', 'Fuse box assembly'),
((SELECT id FROM categories WHERE name = 'Electrical Parts'), 'Switch Assembly', 'ELEC-SWITCH-001', 'Handle switch assembly'),

-- BODY PARTS
((SELECT id FROM categories WHERE name = 'Body Parts'), 'Front Fender', 'BODY-FEND-F-001', 'Front mudguard fender'),
((SELECT id FROM categories WHERE name = 'Body Parts'), 'Rear Fender', 'BODY-FEND-R-001', 'Rear mudguard fender'),
((SELECT id FROM categories WHERE name = 'Body Parts'), 'Fuel Tank', 'BODY-TANK-001', 'Fuel tank assembly'),
((SELECT id FROM categories WHERE name = 'Body Parts'), 'Side Panel Left', 'BODY-PANEL-L-001', 'Left side panel'),
((SELECT id FROM categories WHERE name = 'Body Parts'), 'Side Panel Right', 'BODY-PANEL-R-001', 'Right side panel'),
((SELECT id FROM categories WHERE name = 'Body Parts'), 'Seat Assembly', 'BODY-SEAT-001', 'Complete seat assembly'),
((SELECT id FROM categories WHERE name = 'Body Parts'), 'Headlight Cowl', 'BODY-COWL-H-001', 'Headlight cowl fairing'),
((SELECT id FROM categories WHERE name = 'Body Parts'), 'Tail Cowl', 'BODY-COWL-T-001', 'Tail section cowl'),
((SELECT id FROM categories WHERE name = 'Body Parts'), 'Visor', 'BODY-VISOR-001', 'Windshield visor'),
((SELECT id FROM categories WHERE name = 'Body Parts'), 'Number Plate Holder', 'BODY-NUMPL-001', 'License plate holder'),
((SELECT id FROM categories WHERE name = 'Body Parts'), 'Chain Guard', 'BODY-CHGRD-001', 'Chain cover guard'),

-- TRANSMISSION
((SELECT id FROM categories WHERE name = 'Transmission'), 'Clutch Plate Set', 'TRANS-CLUTCH-001', 'Clutch friction plates'),
((SELECT id FROM categories WHERE name = 'Transmission'), 'Clutch Spring', 'TRANS-CLSP-001', 'Clutch pressure springs'),
((SELECT id FROM categories WHERE name = 'Transmission'), 'Clutch Cable', 'TRANS-CLCAB-001', 'Clutch control cable'),
((SELECT id FROM categories WHERE name = 'Transmission'), 'Drive Chain', 'TRANS-CHAIN-001', 'Drive chain'),
((SELECT id FROM categories WHERE name = 'Transmission'), 'Chain Sprocket Kit', 'TRANS-SPKT-001', 'Front and rear sprocket'),
((SELECT id FROM categories WHERE name = 'Transmission'), 'Gearbox Assembly', 'TRANS-GEAR-001', 'Complete gearbox'),
((SELECT id FROM categories WHERE name = 'Transmission'), 'Gear Shift Lever', 'TRANS-SHIFT-001', 'Gear shift pedal'),
((SELECT id FROM categories WHERE name = 'Transmission'), 'Kick Starter', 'TRANS-KICK-001', 'Kick start lever'),
((SELECT id FROM categories WHERE name = 'Transmission'), 'CVT Belt', 'TRANS-BELT-001', 'CVT transmission belt'),
((SELECT id FROM categories WHERE name = 'Transmission'), 'Variator Assembly', 'TRANS-VAR-001', 'CVT variator'),

-- SUSPENSION
((SELECT id FROM categories WHERE name = 'Suspension'), 'Front Fork Assembly', 'SUSP-FORK-001', 'Complete front fork'),
((SELECT id FROM categories WHERE name = 'Suspension'), 'Fork Oil Seal', 'SUSP-SEAL-001', 'Fork oil seal set'),
((SELECT id FROM categories WHERE name = 'Suspension'), 'Rear Shock Absorber', 'SUSP-SHOCK-R-001', 'Rear suspension shock'),
((SELECT id FROM categories WHERE name = 'Suspension'), 'Monoshock', 'SUSP-MONO-001', 'Monoshock suspension'),
((SELECT id FROM categories WHERE name = 'Suspension'), 'Swing Arm', 'SUSP-SWING-001', 'Rear swing arm assembly'),
((SELECT id FROM categories WHERE name = 'Suspension'), 'Swing Arm Bearing', 'SUSP-BEAR-001', 'Swing arm bearings'),
((SELECT id FROM categories WHERE name = 'Suspension'), 'Steering Head Bearing', 'SUSP-STEER-001', 'Steering head bearing set'),

-- BRAKING SYSTEM
((SELECT id FROM categories WHERE name = 'Braking System'), 'Front Brake Pads', 'BRAKE-PAD-F-001', 'Front disc brake pads'),
((SELECT id FROM categories WHERE name = 'Braking System'), 'Rear Brake Pads', 'BRAKE-PAD-R-001', 'Rear disc brake pads'),
((SELECT id FROM categories WHERE name = 'Braking System'), 'Front Brake Disc', 'BRAKE-DISC-F-001', 'Front brake rotor disc'),
((SELECT id FROM categories WHERE name = 'Braking System'), 'Rear Brake Disc', 'BRAKE-DISC-R-001', 'Rear brake rotor disc'),
((SELECT id FROM categories WHERE name = 'Braking System'), 'Brake Caliper Front', 'BRAKE-CAL-F-001', 'Front brake caliper'),
((SELECT id FROM categories WHERE name = 'Braking System'), 'Brake Caliper Rear', 'BRAKE-CAL-R-001', 'Rear brake caliper'),
((SELECT id FROM categories WHERE name = 'Braking System'), 'Brake Shoe Set', 'BRAKE-SHOE-001', 'Drum brake shoes'),
((SELECT id FROM categories WHERE name = 'Braking System'), 'Brake Cable', 'BRAKE-CABLE-001', 'Brake control cable'),
((SELECT id FROM categories WHERE name = 'Braking System'), 'Brake Fluid', 'BRAKE-FLUID-001', 'DOT 3/4 brake fluid'),
((SELECT id FROM categories WHERE name = 'Braking System'), 'Master Cylinder', 'BRAKE-MAST-001', 'Brake master cylinder'),
((SELECT id FROM categories WHERE name = 'Braking System'), 'ABS Sensor', 'BRAKE-ABS-001', 'ABS wheel sensor'),

-- FUEL SYSTEM
((SELECT id FROM categories WHERE name = 'Fuel System'), 'Carburetor', 'FUEL-CARB-001', 'Engine carburetor'),
((SELECT id FROM categories WHERE name = 'Fuel System'), 'Fuel Injector', 'FUEL-INJ-001', 'Fuel injection nozzle'),
((SELECT id FROM categories WHERE name = 'Fuel System'), 'Fuel Pump', 'FUEL-PUMP-001', 'Electric fuel pump'),
((SELECT id FROM categories WHERE name = 'Fuel System'), 'Fuel Filter', 'FUEL-FILT-001', 'Inline fuel filter'),
((SELECT id FROM categories WHERE name = 'Fuel System'), 'Throttle Cable', 'FUEL-THROT-001', 'Throttle control cable'),
((SELECT id FROM categories WHERE name = 'Fuel System'), 'Choke Cable', 'FUEL-CHOKE-001', 'Choke cable'),
((SELECT id FROM categories WHERE name = 'Fuel System'), 'Fuel Tap', 'FUEL-TAP-001', 'Fuel petcock valve'),
((SELECT id FROM categories WHERE name = 'Fuel System'), 'Air Filter', 'FUEL-AIR-001', 'Engine air filter'),

-- EXHAUST SYSTEM
((SELECT id FROM categories WHERE name = 'Exhaust System'), 'Exhaust Pipe', 'EXH-PIPE-001', 'Exhaust header pipe'),
((SELECT id FROM categories WHERE name = 'Exhaust System'), 'Silencer/Muffler', 'EXH-SIL-001', 'Exhaust silencer'),
((SELECT id FROM categories WHERE name = 'Exhaust System'), 'Exhaust Gasket', 'EXH-GASKT-001', 'Exhaust gasket set'),
((SELECT id FROM categories WHERE name = 'Exhaust System'), 'Catalytic Converter', 'EXH-CAT-001', 'Catalytic converter'),
((SELECT id FROM categories WHERE name = 'Exhaust System'), 'Heat Shield', 'EXH-SHIELD-001', 'Exhaust heat shield'),

-- LIGHTING
((SELECT id FROM categories WHERE name = 'Lighting'), 'Headlight Bulb', 'LIGHT-HEAD-001', 'Headlight bulb H4/LED'),
((SELECT id FROM categories WHERE name = 'Lighting'), 'Tail Light Bulb', 'LIGHT-TAIL-001', 'Tail/brake light bulb'),
((SELECT id FROM categories WHERE name = 'Lighting'), 'Indicator Bulb', 'LIGHT-IND-001', 'Turn signal bulb'),
((SELECT id FROM categories WHERE name = 'Lighting'), 'Headlight Assembly', 'LIGHT-ASSY-H-001', 'Complete headlight unit'),
((SELECT id FROM categories WHERE name = 'Lighting'), 'Tail Light Assembly', 'LIGHT-ASSY-T-001', 'Complete tail light'),
((SELECT id FROM categories WHERE name = 'Lighting'), 'Indicator Set', 'LIGHT-IND-SET-001', 'Turn signal set (4pcs)'),
((SELECT id FROM categories WHERE name = 'Lighting'), 'LED Strip', 'LIGHT-LED-001', 'LED DRL strip'),

-- WHEELS & TYRES
((SELECT id FROM categories WHERE name = 'Wheels & Tyres'), 'Front Tyre', 'WHEEL-TYRE-F-001', 'Front wheel tyre'),
((SELECT id FROM categories WHERE name = 'Wheels & Tyres'), 'Rear Tyre', 'WHEEL-TYRE-R-001', 'Rear wheel tyre'),
((SELECT id FROM categories WHERE name = 'Wheels & Tyres'), 'Tube Front', 'WHEEL-TUBE-F-001', 'Front wheel tube'),
((SELECT id FROM categories WHERE name = 'Wheels & Tyres'), 'Tube Rear', 'WHEEL-TUBE-R-001', 'Rear wheel tube'),
((SELECT id FROM categories WHERE name = 'Wheels & Tyres'), 'Rim Front', 'WHEEL-RIM-F-001', 'Front wheel rim'),
((SELECT id FROM categories WHERE name = 'Wheels & Tyres'), 'Rim Rear', 'WHEEL-RIM-R-001', 'Rear wheel rim'),
((SELECT id FROM categories WHERE name = 'Wheels & Tyres'), 'Spoke Set', 'WHEEL-SPOKE-001', 'Wheel spokes'),
((SELECT id FROM categories WHERE name = 'Wheels & Tyres'), 'Wheel Bearing', 'WHEEL-BEAR-001', 'Wheel hub bearing'),
((SELECT id FROM categories WHERE name = 'Wheels & Tyres'), 'Tyre Valve', 'WHEEL-VALVE-001', 'Tubeless tyre valve'),
((SELECT id FROM categories WHERE name = 'Wheels & Tyres'), 'Rim Tape', 'WHEEL-TAPE-001', 'Spoke wheel rim tape'),

-- FILTERS
((SELECT id FROM categories WHERE name = 'Filters'), 'Engine Oil Filter', 'FILT-OIL-001', 'Engine oil filter'),
((SELECT id FROM categories WHERE name = 'Filters'), 'Air Filter Element', 'FILT-AIR-001', 'Air filter element'),
((SELECT id FROM categories WHERE name = 'Filters'), 'Fuel Filter Inline', 'FILT-FUEL-001', 'Inline fuel filter'),

-- LUBRICANTS
((SELECT id FROM categories WHERE name = 'Lubricants'), 'Engine Oil 10W-30', 'LUB-OIL-10W30', '4-stroke engine oil 10W-30'),
((SELECT id FROM categories WHERE name = 'Lubricants'), 'Engine Oil 20W-40', 'LUB-OIL-20W40', '4-stroke engine oil 20W-40'),
((SELECT id FROM categories WHERE name = 'Lubricants'), '2T Engine Oil', 'LUB-OIL-2T', '2-stroke engine oil'),
((SELECT id FROM categories WHERE name = 'Lubricants'), 'Gear Oil', 'LUB-GEAR-001', 'Transmission gear oil'),
((SELECT id FROM categories WHERE name = 'Lubricants'), 'Fork Oil', 'LUB-FORK-001', 'Suspension fork oil'),
((SELECT id FROM categories WHERE name = 'Lubricants'), 'Chain Lube', 'LUB-CHAIN-001', 'Chain lubricant spray'),
((SELECT id FROM categories WHERE name = 'Lubricants'), 'Grease', 'LUB-GREASE-001', 'Multi-purpose grease'),
((SELECT id FROM categories WHERE name = 'Lubricants'), 'Coolant', 'LUB-COOL-001', 'Engine coolant liquid'),

-- BATTERY & CHARGING
((SELECT id FROM categories WHERE name = 'Battery & Charging'), 'Battery 12V 5Ah', 'BAT-12V5-001', '12V 5Ah lead-acid battery'),
((SELECT id FROM categories WHERE name = 'Battery & Charging'), 'Battery 12V 7Ah', 'BAT-12V7-001', '12V 7Ah lead-acid battery'),
((SELECT id FROM categories WHERE name = 'Battery & Charging'), 'Battery 12V 9Ah', 'BAT-12V9-001', '12V 9Ah lead-acid battery'),
((SELECT id FROM categories WHERE name = 'Battery & Charging'), 'Lithium Battery', 'BAT-LITH-001', 'Lithium-ion battery pack'),
((SELECT id FROM categories WHERE name = 'Battery & Charging'), 'Battery Charger', 'BAT-CHRG-001', 'Smart battery charger'),
((SELECT id FROM categories WHERE name = 'Battery & Charging'), 'Fast Charger', 'BAT-FAST-001', 'Fast charging adapter'),

-- ELECTRONICS
((SELECT id FROM categories WHERE name = 'Electronics'), 'ECU/ECM', 'ELEC-ECU-001', 'Engine control unit'),
((SELECT id FROM categories WHERE name = 'Electronics'), 'Speedometer', 'ELEC-SPEEDO-001', 'Digital speedometer'),
((SELECT id FROM categories WHERE name = 'Electronics'), 'Tachometer', 'ELEC-TACHO-001', 'Engine RPM meter'),
((SELECT id FROM categories WHERE name = 'Electronics'), 'Fuel Gauge', 'ELEC-GAUGE-001', 'Fuel level sensor'),
((SELECT id FROM categories WHERE name = 'Electronics'), 'Temperature Sensor', 'ELEC-TEMP-001', 'Engine temp sensor'),
((SELECT id FROM categories WHERE name = 'Electronics'), 'Oxygen Sensor', 'ELEC-O2-001', 'Lambda oxygen sensor'),
((SELECT id FROM categories WHERE name = 'Electronics'), 'Throttle Position Sensor', 'ELEC-TPS-001', 'TPS sensor'),
((SELECT id FROM categories WHERE name = 'Electronics'), 'Display Console', 'ELEC-DISP-001', 'Digital display console'),

-- ACCESSORIES
((SELECT id FROM categories WHERE name = 'Accessories'), 'Side Mirror Left', 'ACC-MIRR-L-001', 'Left side mirror'),
((SELECT id FROM categories WHERE name = 'Accessories'), 'Side Mirror Right', 'ACC-MIRR-R-001', 'Right side mirror'),
((SELECT id FROM categories WHERE name = 'Accessories'), 'Handle Grip Set', 'ACC-GRIP-001', 'Rubber handle grips'),
((SELECT id FROM categories WHERE name = 'Accessories'), 'Footrest Set', 'ACC-FOOT-001', 'Footrest pegs'),
((SELECT id FROM categories WHERE name = 'Accessories'), 'Center Stand', 'ACC-STAND-C-001', 'Center stand assembly'),
((SELECT id FROM categories WHERE name = 'Accessories'), 'Side Stand', 'ACC-STAND-S-001', 'Side stand assembly'),
((SELECT id FROM categories WHERE name = 'Accessories'), 'Grab Rail', 'ACC-RAIL-001', 'Rear grab handle'),
((SELECT id FROM categories WHERE name = 'Accessories'), 'Mobile Holder', 'ACC-PHONE-001', 'Phone mount holder'),
((SELECT id FROM categories WHERE name = 'Accessories'), 'Saree Guard', 'ACC-SAREE-001', 'Saree guard'),

-- SAFETY EQUIPMENT
((SELECT id FROM categories WHERE name = 'Safety Equipment'), 'Crash Guard', 'SAFE-GUARD-001', 'Engine crash guard'),
((SELECT id FROM categories WHERE name = 'Safety Equipment'), 'Frame Slider', 'SAFE-SLIDE-001', 'Frame slider set'),
((SELECT id FROM categories WHERE name = 'Safety Equipment'), 'Hand Guard', 'SAFE-HAND-001', 'Handlebar hand guards'),
((SELECT id FROM categories WHERE name = 'Safety Equipment'), 'Leg Guard', 'SAFE-LEG-001', 'Leg crash guard'),
((SELECT id FROM categories WHERE name = 'Safety Equipment'), 'Belly Pan', 'SAFE-BELLY-001', 'Engine belly pan'),

-- EV SPECIFIC PARTS
((SELECT id FROM categories WHERE name = 'EV Specific'), 'Electric Motor', 'EV-MOTOR-001', 'BLDC hub motor'),
((SELECT id FROM categories WHERE name = 'EV Specific'), 'Motor Controller', 'EV-CTRL-001', 'Motor speed controller'),
((SELECT id FROM categories WHERE name = 'EV Specific'), 'BMS (Battery Management)', 'EV-BMS-001', 'Battery management system'),
((SELECT id FROM categories WHERE name = 'EV Specific'), 'Charging Port', 'EV-PORT-001', 'Charging socket'),
((SELECT id FROM categories WHERE name = 'EV Specific'), 'Charging Cable', 'EV-CABLE-001', 'Type-2 charging cable'),
((SELECT id FROM categories WHERE name = 'EV Specific'), 'DC-DC Converter', 'EV-DCDC-001', 'Voltage converter'),
((SELECT id FROM categories WHERE name = 'EV Specific'), 'Throttle Sensor', 'EV-THROT-001', 'Electric throttle sensor'),
((SELECT id FROM categories WHERE name = 'EV Specific'), 'Display Unit', 'EV-DISP-001', 'Digital instrument cluster'),
((SELECT id FROM categories WHERE name = 'EV Specific'), 'Regen Sensor', 'EV-REGEN-001', 'Regenerative braking sensor');

-- Update manufacturers with specific popular 2-wheeler models
UPDATE manufacturers SET country = 'India' WHERE name IN ('Hero', 'Bajaj', 'TVS', 'Royal Enfield');
UPDATE manufacturers SET country = 'Japan' WHERE name IN ('Honda', 'Yamaha', 'Suzuki', 'Kawasaki');

SELECT 'Spare parts database populated successfully with ' || COUNT(*) || ' products' 
FROM product_master;
