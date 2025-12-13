"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDataDirectory = setDataDirectory;
exports.getDataDirectory = getDataDirectory;
exports.getBacktests = getBacktests;
exports.getPredictions = getPredictions;
exports.getGreeks = getGreeks;
exports.paginate = paginate;
exports.addUploadedData = addUploadedData;
exports.getUploadedData = getUploadedData;
exports.getAllUploadedIds = getAllUploadedIds;
exports.getUniqueAssets = getUniqueAssets;
exports.getUniqueModels = getUniqueModels;
exports.getUniqueExperiments = getUniqueExperiments;
exports.clearCache = clearCache;
exports.parseUploadedCSV = parseUploadedCSV;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sync_1 = require("csv-parse/sync");
const cache = {
    backtests: [],
    predictions: [],
    greeks: [],
    uploaded: new Map(),
    lastUpdated: new Map(),
};
const CACHE_TTL = 5000; // 5 seconds
// Configurable data directory
let dataDir = path_1.default.join(__dirname, '../../sample_data');
function setDataDirectory(dir) {
    dataDir = dir;
}
function getDataDirectory() {
    return dataDir;
}
// Generic CSV parser with best-effort column mapping
function parseCSV(filePath, mapper) {
    try {
        if (!fs_1.default.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`);
            return [];
        }
        const content = fs_1.default.readFileSync(filePath, 'utf-8');
        const records = (0, sync_1.parse)(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relaxColumnCount: true,
        });
        return records.map(mapper).filter((r) => r !== null);
    }
    catch (error) {
        console.error(`Error parsing CSV ${filePath}:`, error);
        return [];
    }
}
// Safe number parser
function safeFloat(value, defaultVal = 0) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultVal : parsed;
}
// Backtest record mapper
function mapBacktestRecord(row) {
    if (!row.timestamp)
        return null;
    return {
        timestamp: row.timestamp,
        asset: row.asset || 'UNKNOWN',
        model: row.model || 'default',
        experiment_id: row.experiment_id || 'exp-1',
        predicted_price: safeFloat(row.predicted_price),
        actual_price: safeFloat(row.actual_price),
        position: safeFloat(row.position),
        pnl: safeFloat(row.pnl),
        equity: safeFloat(row.equity),
        drawdown: safeFloat(row.drawdown),
    };
}
// Prediction record mapper
function mapPredictionRecord(row) {
    if (!row.timestamp)
        return null;
    return {
        timestamp: row.timestamp,
        asset: row.asset || 'UNKNOWN',
        model: row.model || 'default',
        predicted_price: safeFloat(row.predicted_price),
        confidence: safeFloat(row.confidence, 0.5),
        horizon_seconds: safeFloat(row.horizon_seconds, 3600),
    };
}
// Greek record mapper
function mapGreekRecord(row) {
    if (!row.timestamp)
        return null;
    return {
        timestamp: row.timestamp,
        asset: row.asset || 'UNKNOWN',
        option_id: row.option_id || 'opt-1',
        strike: safeFloat(row.strike),
        expiry: row.expiry || '',
        delta: safeFloat(row.delta),
        gamma: safeFloat(row.gamma),
        theta: safeFloat(row.theta),
        vega: safeFloat(row.vega),
        rho: safeFloat(row.rho),
        implied_vol: safeFloat(row.implied_vol),
    };
}
// Load data with caching
function loadWithCache(key, fileName, mapper, cacheArray) {
    const filePath = path_1.default.join(dataDir, fileName);
    const lastUpdated = cache.lastUpdated.get(key) || 0;
    const now = Date.now();
    if (now - lastUpdated < CACHE_TTL && cacheArray.length > 0) {
        return cacheArray;
    }
    const data = parseCSV(filePath, mapper);
    cache.lastUpdated.set(key, now);
    return data;
}
// Data access functions
function getBacktests(params = {}) {
    cache.backtests = loadWithCache('backtests', 'backtest_results.csv', mapBacktestRecord, cache.backtests);
    return filterData(cache.backtests, params);
}
function getPredictions(params = {}) {
    cache.predictions = loadWithCache('predictions', 'predictions.csv', mapPredictionRecord, cache.predictions);
    return filterData(cache.predictions, params);
}
function getGreeks(params = {}) {
    cache.greeks = loadWithCache('greeks', 'greeks.csv', mapGreekRecord, cache.greeks);
    return filterData(cache.greeks, params);
}
// Generic filter function
function filterData(data, params) {
    let filtered = [...data];
    if (params.asset) {
        filtered = filtered.filter((r) => r.asset === params.asset);
    }
    if (params.model) {
        filtered = filtered.filter((r) => r.model === params.model);
    }
    if (params.from) {
        const fromDate = new Date(params.from);
        filtered = filtered.filter((r) => new Date(r.timestamp) >= fromDate);
    }
    if (params.to) {
        const toDate = new Date(params.to);
        filtered = filtered.filter((r) => new Date(r.timestamp) <= toDate);
    }
    // Filter by experiment_id if applicable
    if (params.experiment_id && 'experiment_id' in filtered[0]) {
        filtered = filtered.filter((r) => r.experiment_id === params.experiment_id);
    }
    // Filter by option_id if applicable
    if (params.option_id && 'option_id' in (filtered[0] || {})) {
        filtered = filtered.filter((r) => r.option_id === params.option_id);
    }
    return filtered;
}
// Pagination helper
function paginate(data, page = 1, limit = 100) {
    const total = data.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = data.slice(start, end);
    return {
        data: paginatedData,
        total,
        page,
        limit,
        hasMore: end < total,
    };
}
// Handle uploaded CSV files
function addUploadedData(id, data) {
    cache.uploaded.set(id, data);
}
function getUploadedData(id) {
    return cache.uploaded.get(id);
}
function getAllUploadedIds() {
    return Array.from(cache.uploaded.keys());
}
// Get unique values for filters
function getUniqueAssets() {
    const backtests = getBacktests();
    const predictions = getPredictions();
    const greeks = getGreeks();
    const assets = new Set();
    [...backtests, ...predictions, ...greeks].forEach((r) => {
        if (r.asset)
            assets.add(r.asset);
    });
    return Array.from(assets).sort();
}
function getUniqueModels() {
    const backtests = getBacktests();
    const predictions = getPredictions();
    const models = new Set();
    [...backtests, ...predictions].forEach((r) => {
        if (r.model)
            models.add(r.model);
    });
    return Array.from(models).sort();
}
function getUniqueExperiments() {
    const backtests = getBacktests();
    const experiments = new Set();
    backtests.forEach((r) => {
        if (r.experiment_id)
            experiments.add(r.experiment_id);
    });
    return Array.from(experiments).sort();
}
// Clear cache (useful for testing or when new data is uploaded)
function clearCache() {
    cache.backtests = [];
    cache.predictions = [];
    cache.greeks = [];
    cache.lastUpdated.clear();
}
// Parse uploaded CSV buffer
function parseUploadedCSV(buffer) {
    try {
        const content = buffer.toString('utf-8');
        return (0, sync_1.parse)(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relaxColumnCount: true,
        });
    }
    catch (error) {
        console.error('Error parsing uploaded CSV:', error);
        return [];
    }
}
//# sourceMappingURL=csvParser.js.map