import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './routes/authRoutes';
import zoneRoutes from './routes/zoneRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import violationRoutes from './routes/violationRoutes';
import responseRoutes from './routes/responseRoutes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*', // In production, replace with specific origin
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api/response', responseRoutes);

// In-memory store for deployments (Simulating DB table for now)
let deployments: any[] = [
    { id: 'd1', zone_id: 'z1', deployed_by: 'System', team_size: 2, status: 'arrived', deployed_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() }
];

// Deployment Routes (Directly in index.ts for speed, matching previous pattern)
app.get('/api/deployments', (req, res) => {
    res.json(deployments);
});

app.post('/api/deployments', (req, res) => {
    const newDeployment = { ...req.body, id: `d${Date.now()}` };
    deployments.unshift(newDeployment);
    res.json(newDeployment);
});

app.patch('/api/deployments/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const idx = deployments.findIndex(d => d.id === id);
    if (idx !== -1) {
        deployments[idx] = { ...deployments[idx], status };
        if (status === 'resolved') {
            deployments[idx].resolved_at = new Date().toISOString();
        }
        res.json(deployments[idx]);
    } else {
        res.status(404).json({ error: 'Deployment not found' });
    }
});

// WebSocket logic
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Officer Incident Broadcasting
    socket.on('report_incident', (incident) => {
        console.log('🚨 TACTICAL ALERT:', incident.type);
        // Broadcast to all admins instantly
        io.emit('new_incident', {
            ...incident,
            server_time: new Date().toISOString()
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });

    // Real-time Dashboard subscriptions
    socket.on('subscribe_zones', () => {
        socket.join('zones_room');
    });

    socket.on('deploy_response_team', (data) => {
        // Broadcast deployment to all admins
        io.emit('team_deployed', {
            ...data,
            deployed_at: new Date(),
            status: 'dispatched'
        });
    });
});

// Make io accessible in request object
app.use((req: any, res, next) => {
    req.io = io;
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// --- DATA SIMULATION LOOP (MOCK IoT SENSORS) ---
const MOCK_ZONES = ['z1', 'z2', 'z3', 'z4', 'z5', 'z6'];
setInterval(() => {
    const randomZoneId = MOCK_ZONES[Math.floor(Math.random() * MOCK_ZONES.length)];
    const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
    // In a real app, we'd fetch current from DB, update, and emit.
    // Here we just broadcast a "randomized" valid count for visual effect
    const mockCount = Math.floor(Math.random() * 100) + 20;

    io.emit('occupancy_update', {
        zone_id: randomZoneId,
        current_count: mockCount,
        timestamp: new Date().toISOString()
    });

    // Occasionally emit a violation
    if (Math.random() > 0.7) {
        const types = ['Overstay', 'No Parking', 'Double Parking', 'Wrong Way'];
        io.emit('violation_detected', {
            id: `v-live-${Date.now()}`,
            zone_id: randomZoneId,
            zone_name: 'Simulated Zone', // In real app, fetch name
            vehicle_number: `DL-${Math.floor(Math.random() * 99)}C-${Math.floor(Math.random() * 9999)}`,
            violation_type: types[Math.floor(Math.random() * types.length)],
            status: 'pending',
            detected_at: new Date().toISOString(),
            evidence_url: '/mock-evidence.jpg'
        });
    }
}, 3000); // Updates every 3 seconds

// AI Voice Command Interpretation
import OpenAI from 'openai';

app.post('/api/voice/process', async (req, res) => {
    const { text } = req.body;
    const apiKey = process.env.VOICE_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'AI Key not configured' });

    // Step 1: Instant Fuzzy Response (Speed)
    const lower = text.toLowerCase();
    if (lower === 'map' || lower === 'navigation') {
        return res.json({ command: 'SHOW_MAP', feedback: 'Opening map instantly.' });
    }

    // Step 2: Advanced AI Interpretation (Accuracy)
    try {
        const openai = new OpenAI({ apiKey });
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a Smart City Assistant. Map user input (English/Hindi) to: [SHOW_MAP, GET_STATUS, SHOW_LEDGER, SHOW_CITIZEN, PROCESS_PAYMENT, SHOW_RESPONSE, LOGOUT]. Output ONLY JSON: { \"command\": \"...\", \"feedback\": \"...\" }" },
                { role: "user", content: text }
            ]
        });

        // Safe Parsing
        const content = completion.choices[0].message.content || '{}';
        const startJson = content.indexOf('{');
        const endJson = content.lastIndexOf('}') + 1;
        const jsonStr = content.substring(startJson, endJson);
        const response = JSON.parse(jsonStr || '{"command":"UNKNOWN", "feedback": "I heard you but I need more details."}');
        
        res.json(response);
    } catch (error: any) {
        console.error('OpenAI Error:', error.message);
        res.status(500).json({ error: 'AI Brain failure', detail: error.message });
    }
});

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Live Parking Simulator Active (Mock Data Mode)`);
});

export { io };
