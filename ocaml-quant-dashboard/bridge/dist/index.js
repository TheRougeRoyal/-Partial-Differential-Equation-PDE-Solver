"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
exports.broadcastLiveUpdate = broadcastLiveUpdate;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const ws_1 = require("ws");
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const child_process_1 = require("child_process");
// Generate UUID using built-in crypto
const uuidv4 = () => crypto_1.default.randomUUID();
const csvParser_1 = require("./csvParser");
// Configuration
const PORT = process.env.PORT || 3001;
const DATA_DIR = process.env.DATA_DIR || path_1.default.resolve(__dirname, '../../sample_data');
const OCAML_BIN_DIR = process.env.OCAML_BIN_DIR || path_1.default.resolve(__dirname, '../../../../_build/default/bin');
// Set data directory
(0, csvParser_1.setDataDirectory)(DATA_DIR);
// Express app setup
const app = (0, express_1.default)();
exports.app = app;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Multer for file uploads
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});
// Create HTTP server
const server = http_1.default.createServer(app);
exports.server = server;
// WebSocket server for live updates
const wss = new ws_1.WebSocketServer({ server, path: '/ws/live' });
// Store connected WebSocket clients
const clients = new Set();
wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');
    clients.add(ws);
    ws.on('close', () => {
        console.log('WebSocket client disconnected');
        clients.delete(ws);
    });
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
    });
    // Send welcome message
    ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to OCaml Quant Dashboard live updates',
        timestamp: new Date().toISOString()
    }));
});
// Broadcast live update to all connected clients
function broadcastLiveUpdate(update) {
    const message = JSON.stringify(update);
    clients.forEach((client) => {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(message);
        }
    });
}
// Expose broadcast function for external use (OCaml process can POST to /api/v1/live-update)
app.post('/api/v1/live-update', (req, res) => {
    const update = req.body;
    if (!update.type || !update.timestamp) {
        res.status(400).json({
            success: false,
            error: 'Invalid update format. Required: type, timestamp'
        });
        return;
    }
    broadcastLiveUpdate(update);
    res.json({ success: true, message: 'Update broadcasted', clientCount: clients.size });
});
// Helper to parse query params
function parseQueryParams(query) {
    return {
        asset: query.asset,
        model: query.model,
        experiment_id: query.experiment_id,
        option_id: query.option_id,
        from: query.from,
        to: query.to,
        page: query.page ? parseInt(query.page, 10) : 1,
        limit: query.limit ? parseInt(query.limit, 10) : 100,
    };
}
// API Routes
// GET /api/v1/backtests - Get backtest results
app.get('/api/v1/backtests', (req, res) => {
    try {
        const params = parseQueryParams(req.query);
        const data = (0, csvParser_1.getBacktests)(params);
        const paginated = (0, csvParser_1.paginate)(data, params.page, params.limit);
        const response = {
            success: true,
            data: paginated.data,
            meta: {
                total: paginated.total,
                page: paginated.page,
                limit: paginated.limit,
                hasMore: paginated.hasMore,
            },
        };
        res.json(response);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            data: [],
            error: error.message
        });
    }
});
// GET /api/v1/predictions - Get predictions
app.get('/api/v1/predictions', (req, res) => {
    try {
        const params = parseQueryParams(req.query);
        const data = (0, csvParser_1.getPredictions)(params);
        const paginated = (0, csvParser_1.paginate)(data, params.page, params.limit);
        const response = {
            success: true,
            data: paginated.data,
            meta: {
                total: paginated.total,
                page: paginated.page,
                limit: paginated.limit,
                hasMore: paginated.hasMore,
            },
        };
        res.json(response);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            data: [],
            error: error.message
        });
    }
});
// GET /api/v1/greeks - Get Greek values
app.get('/api/v1/greeks', (req, res) => {
    try {
        const params = parseQueryParams(req.query);
        const data = (0, csvParser_1.getGreeks)(params);
        const paginated = (0, csvParser_1.paginate)(data, params.page, params.limit);
        const response = {
            success: true,
            data: paginated.data,
            meta: {
                total: paginated.total,
                page: paginated.page,
                limit: paginated.limit,
                hasMore: paginated.hasMore,
            },
        };
        res.json(response);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            data: [],
            error: error.message
        });
    }
});
// GET /api/v1/filters - Get available filter options
app.get('/api/v1/filters', (req, res) => {
    try {
        const response = {
            success: true,
            data: {
                assets: (0, csvParser_1.getUniqueAssets)(),
                models: (0, csvParser_1.getUniqueModels)(),
                experiments: (0, csvParser_1.getUniqueExperiments)(),
            },
        };
        res.json(response);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            data: {},
            error: error.message
        });
    }
});
// POST /api/v1/upload - Upload CSV file
app.post('/api/v1/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
            return;
        }
        const records = (0, csvParser_1.parseUploadedCSV)(req.file.buffer);
        const uploadId = uuidv4();
        (0, csvParser_1.addUploadedData)(uploadId, records);
        res.json({
            success: true,
            data: {
                uploadId,
                filename: req.file.originalname,
                recordCount: records.length,
                columns: records.length > 0 ? Object.keys(records[0]) : [],
                preview: records.slice(0, 5),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// GET /api/v1/uploads - List all uploaded files
app.get('/api/v1/uploads', (req, res) => {
    try {
        const uploadIds = (0, csvParser_1.getAllUploadedIds)();
        res.json({
            success: true,
            data: uploadIds.map(id => ({
                uploadId: id,
                recordCount: (0, csvParser_1.getUploadedData)(id)?.length || 0,
            })),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            data: [],
            error: error.message
        });
    }
});
// GET /api/v1/uploads/:id - Get uploaded file data
app.get('/api/v1/uploads/:id', (req, res) => {
    try {
        const data = (0, csvParser_1.getUploadedData)(req.params.id);
        if (!data) {
            res.status(404).json({
                success: false,
                error: 'Upload not found'
            });
            return;
        }
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 100;
        const paginated = (0, csvParser_1.paginate)(data, page, limit);
        res.json({
            success: true,
            data: paginated.data,
            meta: {
                total: paginated.total,
                page: paginated.page,
                limit: paginated.limit,
                hasMore: paginated.hasMore,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            data: [],
            error: error.message
        });
    }
});
// GET /api/v1/metrics - Get performance metrics
app.get('/api/v1/metrics', (req, res) => {
    try {
        const params = parseQueryParams(req.query);
        const backtests = (0, csvParser_1.getBacktests)(params);
        if (backtests.length === 0) {
            res.json({
                success: true,
                data: {
                    totalReturn: 0,
                    sharpeRatio: 0,
                    sortinoRatio: 0,
                    maxDrawdown: 0,
                    winRate: 0,
                    avgPnl: 0,
                    totalTrades: 0,
                },
            });
            return;
        }
        // Calculate metrics
        const pnls = backtests.map(b => b.pnl);
        const returns = pnls.map((pnl, i) => {
            const prevEquity = i === 0 ? 100000 : backtests[i - 1].equity;
            return prevEquity > 0 ? pnl / prevEquity : 0;
        });
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
        const negativeReturns = returns.filter(r => r < 0);
        const downstdDev = negativeReturns.length > 0
            ? Math.sqrt(negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length)
            : 0;
        const sharpeRatio = stdDev > 0 ? (avgReturn * Math.sqrt(252)) / stdDev : 0;
        const sortinoRatio = downstdDev > 0 ? (avgReturn * Math.sqrt(252)) / downstdDev : 0;
        const maxDrawdown = Math.max(...backtests.map(b => b.drawdown));
        const winRate = pnls.filter(p => p > 0).length / pnls.length;
        const avgPnl = pnls.reduce((a, b) => a + b, 0) / pnls.length;
        const firstEquity = backtests[0].equity - backtests[0].pnl;
        const lastEquity = backtests[backtests.length - 1].equity;
        const totalReturn = ((lastEquity - firstEquity) / firstEquity) * 100;
        res.json({
            success: true,
            data: {
                totalReturn: parseFloat(totalReturn.toFixed(4)),
                sharpeRatio: parseFloat(sharpeRatio.toFixed(4)),
                sortinoRatio: parseFloat(sortinoRatio.toFixed(4)),
                maxDrawdown: parseFloat((maxDrawdown * 100).toFixed(4)),
                winRate: parseFloat((winRate * 100).toFixed(2)),
                avgPnl: parseFloat(avgPnl.toFixed(2)),
                totalTrades: backtests.length,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            data: {},
            error: error.message
        });
    }
});
// GET /api/v1/prediction-accuracy - Get prediction accuracy metrics
app.get('/api/v1/prediction-accuracy', (req, res) => {
    try {
        const params = parseQueryParams(req.query);
        const backtests = (0, csvParser_1.getBacktests)(params);
        if (backtests.length === 0) {
            res.json({
                success: true,
                data: {
                    mae: 0,
                    rmse: 0,
                    mape: 0,
                    directionAccuracy: 0,
                },
            });
            return;
        }
        const errors = backtests.map(b => b.predicted_price - b.actual_price);
        const absErrors = errors.map(e => Math.abs(e));
        const squaredErrors = errors.map(e => e * e);
        const percentageErrors = backtests.map(b => Math.abs((b.predicted_price - b.actual_price) / b.actual_price) * 100);
        // Direction accuracy
        let correctDirections = 0;
        for (let i = 1; i < backtests.length; i++) {
            const actualDirection = backtests[i].actual_price > backtests[i - 1].actual_price ? 1 : -1;
            const predictedDirection = backtests[i].predicted_price > backtests[i - 1].actual_price ? 1 : -1;
            if (actualDirection === predictedDirection)
                correctDirections++;
        }
        const mae = absErrors.reduce((a, b) => a + b, 0) / absErrors.length;
        const rmse = Math.sqrt(squaredErrors.reduce((a, b) => a + b, 0) / squaredErrors.length);
        const mape = percentageErrors.reduce((a, b) => a + b, 0) / percentageErrors.length;
        const directionAccuracy = backtests.length > 1
            ? (correctDirections / (backtests.length - 1)) * 100
            : 0;
        res.json({
            success: true,
            data: {
                mae: parseFloat(mae.toFixed(2)),
                rmse: parseFloat(rmse.toFixed(2)),
                mape: parseFloat(mape.toFixed(4)),
                directionAccuracy: parseFloat(directionAccuracy.toFixed(2)),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            data: {},
            error: error.message
        });
    }
});
// POST /api/v1/cache/clear - Clear data cache
app.post('/api/v1/cache/clear', (req, res) => {
    try {
        (0, csvParser_1.clearCache)();
        res.json({ success: true, message: 'Cache cleared' });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// POST /api/v1/pricing - Solve PDE using OCaml backend
app.post('/api/v1/pricing', (req, res) => {
    const { spot, strike, maturity, rate, volatility, optionType, scheme } = req.body;
    if (!spot || !strike || !maturity || rate === undefined || !volatility || !optionType) {
        res.status(400).json({
            success: false,
            error: 'Missing required fields: spot, strike, maturity, rate, volatility, optionType',
        });
        return;
    }
    // Map scheme names from frontend to OCaml
    const schemeMap = {
        'crank-nicolson': 'CN',
        'backward-euler': 'BE',
        'CN': 'CN',
        'BE': 'BE',
    };
    const input = JSON.stringify({
        spot: Number(spot),
        strike: Number(strike),
        maturity: Number(maturity),
        rate: Number(rate),
        volatility: Number(volatility),
        optionType: optionType,
        scheme: schemeMap[scheme] || 'CN',
    });
    const binaryPath = path_1.default.join(OCAML_BIN_DIR, 'pricing_api.exe');
    const child = (0, child_process_1.execFile)(binaryPath, [], { timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
            console.error('OCaml pricing error:', error.message, stderr);
            res.status(500).json({
                success: false,
                error: `PDE solver error: ${error.message}`,
            });
            return;
        }
        try {
            const result = JSON.parse(stdout.trim());
            res.json(result);
        }
        catch (parseError) {
            console.error('Failed to parse OCaml output:', stdout);
            res.status(500).json({
                success: false,
                error: 'Failed to parse PDE solver output',
            });
        }
    });
    // Send input via stdin
    child.stdin?.write(input);
    child.stdin?.end();
});
// Health check endpoint
app.get('/api/v1/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            wsClients: clients.size,
            dataDir: DATA_DIR,
        },
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error',
    });
});
// Start server
server.listen(PORT, () => {
    console.log(`🚀 OCaml Quant Bridge Server running at http://localhost:${PORT}`);
    console.log(`📊 Data directory: ${DATA_DIR}`);
    console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}/ws/live`);
    console.log('\nAvailable endpoints:');
    console.log('  GET  /api/v1/backtests');
    console.log('  GET  /api/v1/predictions');
    console.log('  GET  /api/v1/greeks');
    console.log('  GET  /api/v1/filters');
    console.log('  GET  /api/v1/metrics');
    console.log('  GET  /api/v1/prediction-accuracy');
    console.log('  POST /api/v1/pricing          ← OCaml PDE solver');
    console.log('  POST /api/v1/upload');
    console.log('  GET  /api/v1/uploads');
    console.log('  GET  /api/v1/uploads/:id');
    console.log('  POST /api/v1/live-update');
    console.log('  POST /api/v1/cache/clear');
    console.log('  GET  /api/v1/health');
});
//# sourceMappingURL=index.js.map