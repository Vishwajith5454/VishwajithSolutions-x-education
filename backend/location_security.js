
/**
 * VISHWAJITH SOLUTIONS - LOCATION SECURITY LAYER
 * Node.js + Express Reference Implementation
 * 
 * Dependencies: express, pg (or similar), body-parser
 */

const express = require('express');
const app = express();
app.use(express.json());

// --- CONFIGURATION ---
const TOLERANCE_METERS = 50000; // 50km

// --- UTILITIES ---

/**
 * Calculates Great Circle distance between two points in meters
 */
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * MOCK: Returns Geo-Location based on IP
 * In production, replace with MaxMind GeoIP2 or API call
 */
function getIpGeo(ip) {
    // Return sample data for New Delhi
    return { 
        lat: 28.6139, 
        lon: 77.2090, 
        accuracy_meters: 1000 
    };
}

/**
 * MOCK: OTP Sender
 */
function sendEmailOtp(email, otp) {
    console.log(`[EMAIL_SERVICE] Sending OTP ${otp} to ${email}`);
}

// --- ROUTES ---

/**
 * POST /auth/register
 * Body: { email, password, consent_location: boolean, client_gps?: { lat, lon, accuracy_meters } }
 */
app.post('/auth/register', async (req, res) => {
    const { email, password, consent_location, client_gps } = req.body;
    
    // 1. Get Authoritative IP Geo
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const serverGeo = getIpGeo(ip);

    let savedLocation = { ...serverGeo, source: 'ip_geo' };
    let note = "Registered via IP";

    // 2. Validate Client GPS against IP Geo (Anti-Spoofing)
    if (client_gps && consent_location) {
        const integrityDist = haversine(client_gps.lat, client_gps.lon, serverGeo.lat, serverGeo.lon);
        
        if (integrityDist <= TOLERANCE_METERS) {
            savedLocation = { lat: client_gps.lat, lon: client_gps.lon, source: 'client_gps' };
            note = "Registered via GPS (Confirmed)";
        } else {
            note = "GPS rejected (Distance > Tolerance). Defaulted to IP.";
        }
    }

    // 3. DB Insert (Pseudo-code)
    /*
    const userId = await db.insertUser({
        email, password,
        saved_lat: savedLocation.lat,
        saved_lon: savedLocation.lon,
        saved_location_source: savedLocation.source
    });
    */
    const userId = "user_123"; // Mock

    res.status(201).json({
        user_id: userId,
        saved_location: {
            lat: Number(savedLocation.lat.toFixed(3)), // Rounded for UI
            lon: Number(savedLocation.lon.toFixed(3)),
            source: savedLocation.source
        }
    });
});

/**
 * POST /auth/login
 * Body: { email, password, client_gps?: { lat, lon } }
 */
app.post('/auth/login', async (req, res) => {
    const { email, password, client_gps } = req.body;

    // 1. Validate Password (Mock)
    // const user = await db.getUser(email);
    const user = { 
        id: "user_123", 
        saved_lat: 28.6139, 
        saved_lon: 77.2090 
    };

    // 2. Get Current Context
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const serverGeo = getIpGeo(ip);

    // 3. Calculate Distances
    const distServer = haversine(serverGeo.lat, serverGeo.lon, user.saved_lat, user.saved_lon);
    
    let distClient = Infinity;
    let distIntegrity = Infinity;

    if (client_gps) {
        distClient = haversine(client_gps.lat, client_gps.lon, user.saved_lat, user.saved_lon);
        distIntegrity = haversine(client_gps.lat, client_gps.lon, serverGeo.lat, serverGeo.lon);
    }

    // 4. Decision Tree
    
    // ALLOW: Server IP matches saved location
    if (distServer <= TOLERANCE_METERS) {
        return res.status(200).json({ token: "session_token_123", status: "ALLOWED" });
    }

    // ALLOW: Client GPS matches saved location AND matches IP (Integrity Check)
    if (client_gps && distClient <= TOLERANCE_METERS && distIntegrity <= TOLERANCE_METERS) {
        return res.status(200).json({ token: "session_token_123", status: "ALLOWED_GPS" });
    }

    // OTP: Low Severity (Within 2x Tolerance)
    if (distServer <= (TOLERANCE_METERS * 2)) {
        const otp = Math.floor(100000 + Math.random() * 900000);
        sendEmailOtp(email, otp);
        // Save OTP to Redis/DB with expiry
        return res.status(202).json({ 
            action: "require_otp", 
            otp_sent_to: email.replace(/(.{2})(.*)(@.*)/, "$1***$3") 
        });
    }

    // OTP + ALERT: Medium Severity (Within 10x Tolerance)
    if (distServer <= (TOLERANCE_METERS * 10)) {
        const otp = Math.floor(100000 + Math.random() * 900000);
        sendEmailOtp(email, otp);
        console.log(`[ALERT] Medium severity location mismatch for user ${user.id}`);
        return res.status(202).json({ 
            action: "require_otp", 
            severity: "medium",
            otp_sent_to: email.replace(/(.{2})(.*)(@.*)/, "$1***$3") 
        });
    }

    // DENY: High Severity
    return res.status(403).json({ 
        action: "denied", 
        reason: "high_location_mismatch" 
    });
});

/**
 * POST /auth/verify-location-otp
 */
app.post('/auth/verify-location-otp', (req, res) => {
    const { email, otp } = req.body;
    // Verify OTP logic...
    res.status(200).json({ token: "session_token_restored" });
});

// --- SQL MIGRATIONS (PostgreSQL Style) ---
/*
-- 1. Users Table
ALTER TABLE users ADD COLUMN saved_lat DOUBLE PRECISION;
ALTER TABLE users ADD COLUMN saved_lon DOUBLE PRECISION;
ALTER TABLE users ADD COLUMN saved_location_source VARCHAR(20); -- 'ip_geo' or 'client_gps'
ALTER TABLE users ADD COLUMN location_consent BOOLEAN DEFAULT FALSE;

-- 2. Audit Log
CREATE TABLE location_checks (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    checked_at TIMESTAMP DEFAULT NOW(),
    server_ip VARCHAR(45),
    server_lat DOUBLE PRECISION,
    server_lon DOUBLE PRECISION,
    client_lat DOUBLE PRECISION,
    client_lon DOUBLE PRECISION,
    distance_to_saved_meters INTEGER,
    action_taken VARCHAR(50), -- 'ALLOWED', 'REQUIRE_OTP', 'DENIED'
    note TEXT
);
*/

module.exports = app;
