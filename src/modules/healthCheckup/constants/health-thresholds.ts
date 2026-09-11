export const HEALTH_THRESHOLDS = {
    BLOOD_SUGAR: {
        MODERATE: { min: 141, max: 349 },
        HIGH: { min: 350, max: Infinity }
    },
    BLOOD_PRESSURE: {
        MODERATE: { systolic: { min: 130, max: 179 }, diastolic: { min: 81, max: 119 } },
        HIGH: { systolic: { min: 160, max: Infinity }, diastolic: { min: 102, max: Infinity } }
    },
    PULSE: {
        MODERATE: { low: { min: 51, max: 59 }, high: { min: 101, max: 119 } },
        HIGH: { low: { min: 0, max: 49 }, high: { min: 140, max: Infinity } }
    },
    HEMOGLOBIN: {
        HIGH: { min: 8, max: 20 }
    },
    EYE_VISION: {
        HIGH: { value: '6/60' }
    }
};