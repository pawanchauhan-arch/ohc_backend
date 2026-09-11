-- =====================================================
-- HEALTH TEST TABLES CREATION SCRIPT
-- Last Mile Care - Health Records Segmentation
-- =====================================================

-- SPO2 Tests
CREATE TABLE spo2_tests (
    id SERIAL PRIMARY KEY,
    health_checkup_id INTEGER NOT NULL REFERENCES driverhealthcheckups(id) ON DELETE CASCADE,
    value DECIMAL(5,2),
    units VARCHAR(10) DEFAULT '%',
    status VARCHAR(20), -- success, warning, danger, null
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(health_checkup_id)
);

-- Blood Pressure Tests (Systolic & Diastolic)
CREATE TABLE blood_pressure_tests (
    id SERIAL PRIMARY KEY,
    health_checkup_id INTEGER NOT NULL REFERENCES driverhealthcheckups(id) ON DELETE CASCADE,
    systolic_value INTEGER,
    diastolic_value INTEGER,
    units VARCHAR(10) DEFAULT 'mm Hg',
    systolic_status VARCHAR(20),
    diastolic_status VARCHAR(20),
    systolic_remark TEXT,
    diastolic_remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(health_checkup_id)
);

-- Temperature Tests
CREATE TABLE temperature_tests (
    id SERIAL PRIMARY KEY,
    health_checkup_id INTEGER NOT NULL REFERENCES driverhealthcheckups(id) ON DELETE CASCADE,
    value DECIMAL(4,1),
    units VARCHAR(10) DEFAULT 'F',
    status VARCHAR(20),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(health_checkup_id)
);

-- Pulse Tests
CREATE TABLE pulse_tests (
    id SERIAL PRIMARY KEY,
    health_checkup_id INTEGER NOT NULL REFERENCES driverhealthcheckups(id) ON DELETE CASCADE,
    value INTEGER,
    units VARCHAR(10) DEFAULT 'bpm',
    status VARCHAR(20),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(health_checkup_id)
);

-- BMI Tests
CREATE TABLE bmi_tests (
    id SERIAL PRIMARY KEY,
    health_checkup_id INTEGER NOT NULL REFERENCES driverhealthcheckups(id) ON DELETE CASCADE,
    value DECIMAL(4,2),
    units VARCHAR(10) DEFAULT 'kg/m2',
    status VARCHAR(20),
    remark TEXT,
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(health_checkup_id)
);

-- Random Blood Sugar Tests
CREATE TABLE random_blood_sugar_tests (
    id SERIAL PRIMARY KEY,
    health_checkup_id INTEGER NOT NULL REFERENCES driverhealthcheckups(id) ON DELETE CASCADE,
    value INTEGER,
    units VARCHAR(10) DEFAULT 'mg/dl',
    status VARCHAR(20),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(health_checkup_id)
);

-- Haemoglobin Tests
CREATE TABLE haemoglobin_tests (
    id SERIAL PRIMARY KEY,
    health_checkup_id INTEGER NOT NULL REFERENCES driverhealthcheckups(id) ON DELETE CASCADE,
    value INTEGER,
    units VARCHAR(10) DEFAULT 'g/dl',
    status VARCHAR(20),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(health_checkup_id)
);

-- Alcohol Tests
CREATE TABLE alcohol_tests (
    id SERIAL PRIMARY KEY,
    health_checkup_id INTEGER NOT NULL REFERENCES driverhealthcheckups(id) ON DELETE CASCADE,
    value VARCHAR(10),
    units VARCHAR(10) DEFAULT 'mg/ml',
    status VARCHAR(20),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(health_checkup_id)
);

-- ECG Tests
CREATE TABLE ecg_tests (
    id SERIAL PRIMARY KEY,
    health_checkup_id INTEGER NOT NULL REFERENCES driverhealthcheckups(id) ON DELETE CASCADE,
    value VARCHAR(50),
    status VARCHAR(20),
    remark TEXT,
    doc_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(health_checkup_id)
);

-- Vision Tests
CREATE TABLE vision_tests (
    id SERIAL PRIMARY KEY,
    health_checkup_id INTEGER NOT NULL REFERENCES driverhealthcheckups(id) ON DELETE CASCADE,
    value VARCHAR(20),
    status VARCHAR(20),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(health_checkup_id)
);

-- Romberg Tests
CREATE TABLE romberg_tests (
    id SERIAL PRIMARY KEY,
    health_checkup_id INTEGER NOT NULL REFERENCES driverhealthcheckups(id) ON DELETE CASCADE,
    value VARCHAR(20),
    status VARCHAR(20),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(health_checkup_id)
);

-- Pulmonary Function Tests
CREATE TABLE pulmonary_function_tests (
    id SERIAL PRIMARY KEY,
    health_checkup_id INTEGER NOT NULL REFERENCES driverhealthcheckups(id) ON DELETE CASCADE,
    value INTEGER,
    units VARCHAR(10) DEFAULT 'L/min',
    status VARCHAR(20),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(health_checkup_id)
);

-- HIV Tests
CREATE TABLE hiv_tests (
    id SERIAL PRIMARY KEY,
    health_checkup_id INTEGER NOT NULL REFERENCES driverhealthcheckups(id) ON DELETE CASCADE,
    value VARCHAR(20),
    status VARCHAR(20),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(health_checkup_id)
);

-- Eye Tests (for spherical/cylindrical measurements)
CREATE TABLE eye_tests (
    id SERIAL PRIMARY KEY,
    health_checkup_id INTEGER NOT NULL REFERENCES driverhealthcheckups(id) ON DELETE CASCADE,
    spherical_right DECIMAL(4,2),
    spherical_left DECIMAL(4,2),
    cylindrical_right DECIMAL(4,2),
    cylindrical_left DECIMAL(4,2),
    colour_blindness VARCHAR(20),
    units VARCHAR(10) DEFAULT 'D',
    spherical_right_status VARCHAR(20),
    spherical_left_status VARCHAR(20),
    cylindrical_right_status VARCHAR(20),
    cylindrical_left_status VARCHAR(20),
    colour_blindness_status VARCHAR(20),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(health_checkup_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================

-- Primary indexes on health_checkup_id for all tables
CREATE INDEX idx_spo2_tests_health_checkup_id ON spo2_tests(health_checkup_id);
CREATE INDEX idx_blood_pressure_tests_health_checkup_id ON blood_pressure_tests(health_checkup_id);
CREATE INDEX idx_temperature_tests_health_checkup_id ON temperature_tests(health_checkup_id);
CREATE INDEX idx_pulse_tests_health_checkup_id ON pulse_tests(health_checkup_id);
CREATE INDEX idx_bmi_tests_health_checkup_id ON bmi_tests(health_checkup_id);
CREATE INDEX idx_random_blood_sugar_tests_health_checkup_id ON random_blood_sugar_tests(health_checkup_id);
CREATE INDEX idx_haemoglobin_tests_health_checkup_id ON haemoglobin_tests(health_checkup_id);
CREATE INDEX idx_alcohol_tests_health_checkup_id ON alcohol_tests(health_checkup_id);
CREATE INDEX idx_ecg_tests_health_checkup_id ON ecg_tests(health_checkup_id);
CREATE INDEX idx_vision_tests_health_checkup_id ON vision_tests(health_checkup_id);
CREATE INDEX idx_romberg_tests_health_checkup_id ON romberg_tests(health_checkup_id);
CREATE INDEX idx_pulmonary_function_tests_health_checkup_id ON pulmonary_function_tests(health_checkup_id);
CREATE INDEX idx_hiv_tests_health_checkup_id ON hiv_tests(health_checkup_id);
CREATE INDEX idx_eye_tests_health_checkup_id ON eye_tests(health_checkup_id);

-- Status indexes for common queries
CREATE INDEX idx_spo2_tests_status ON spo2_tests(status);
CREATE INDEX idx_blood_pressure_tests_systolic_status ON blood_pressure_tests(systolic_status);
CREATE INDEX idx_blood_pressure_tests_diastolic_status ON blood_pressure_tests(diastolic_status);
CREATE INDEX idx_temperature_tests_status ON temperature_tests(status);
CREATE INDEX idx_pulse_tests_status ON pulse_tests(status);
CREATE INDEX idx_bmi_tests_status ON bmi_tests(status);
CREATE INDEX idx_random_blood_sugar_tests_status ON random_blood_sugar_tests(status);
CREATE INDEX idx_haemoglobin_tests_status ON haemoglobin_tests(status);

-- Timestamp indexes for reporting
CREATE INDEX idx_spo2_tests_created_at ON spo2_tests(created_at);
CREATE INDEX idx_blood_pressure_tests_created_at ON blood_pressure_tests(created_at);
CREATE INDEX idx_temperature_tests_created_at ON temperature_tests(created_at);
CREATE INDEX idx_pulse_tests_created_at ON pulse_tests(created_at);
CREATE INDEX idx_bmi_tests_created_at ON bmi_tests(created_at);
CREATE INDEX idx_random_blood_sugar_tests_created_at ON random_blood_sugar_tests(created_at);
CREATE INDEX idx_haemoglobin_tests_created_at ON haemoglobin_tests(created_at);

-- =====================================================
-- TABLE COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE spo2_tests IS 'SPO2 (Oxygen Saturation) test results';
COMMENT ON TABLE blood_pressure_tests IS 'Blood pressure test results with systolic and diastolic values';
COMMENT ON TABLE temperature_tests IS 'Body temperature test results';
COMMENT ON TABLE pulse_tests IS 'Pulse rate test results';
COMMENT ON TABLE bmi_tests IS 'BMI (Body Mass Index) test results with height and weight';
COMMENT ON TABLE random_blood_sugar_tests IS 'Random blood sugar test results';
COMMENT ON TABLE haemoglobin_tests IS 'Haemoglobin level test results';
COMMENT ON TABLE alcohol_tests IS 'Alcohol level test results';
COMMENT ON TABLE ecg_tests IS 'ECG (Electrocardiogram) test results';
COMMENT ON TABLE vision_tests IS 'Vision test results';
COMMENT ON TABLE romberg_tests IS 'Romberg test results for balance assessment';
COMMENT ON TABLE pulmonary_function_tests IS 'Pulmonary function test results';
COMMENT ON TABLE hiv_tests IS 'HIV test results';
COMMENT ON TABLE eye_tests IS 'Eye examination results including spherical and cylindrical measurements';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Uncomment these queries to verify table creation
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%_tests';
-- SELECT indexname FROM pg_indexes WHERE tablename LIKE '%_tests';
