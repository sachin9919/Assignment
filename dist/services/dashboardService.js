"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardSummary = getDashboardSummary;
const fileDb_1 = require("../storage/fileDb");
function inRange(recordDateISO, from, to) {
    const t = Date.parse(recordDateISO);
    if (Number.isNaN(t))
        return false;
    if (from) {
        const f = Date.parse(from);
        if (!Number.isNaN(f) && t < f)
            return false;
    }
    if (to) {
        const tt = Date.parse(to);
        if (!Number.isNaN(tt) && t > tt)
            return false;
    }
    return true;
}
function parseMonth(iso) {
    // expects YYYY-MM-DD or ISO; we extract YYYY-MM for grouping
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return null;
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
}
function subtractMonths(date, months) {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    d.setUTCMonth(d.getUTCMonth() - months);
    return d;
}
async function getDashboardSummary(params) {
    const db = await (0, fileDb_1.readDb)();
    const effectiveOwnerId = params.viewerRole === "admin" ? params.userId ?? params.viewerUserId : params.viewerUserId;
    let records = db.records.filter((r) => r.ownerUserId === effectiveOwnerId);
    // Apply date and optional type filters to totals.
    records = records.filter((r) => inRange(r.date, params.from, params.to));
    if (params.type)
        records = records.filter((r) => r.type === params.type);
    const totalIncome = records.filter((r) => r.type === "income").reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = records
        .filter((r) => r.type === "expense")
        .reduce((sum, r) => sum + r.amount, 0);
    const netBalance = totalIncome - totalExpenses;
    // Category-wise totals (within the same filtered set).
    const categoryMap = new Map();
    for (const r of records) {
        const key = r.category;
        const existing = categoryMap.get(key) ?? { category: key, incomeTotal: 0, expenseTotal: 0 };
        if (r.type === "income")
            existing.incomeTotal += r.amount;
        else
            existing.expenseTotal += r.amount;
        categoryMap.set(key, existing);
    }
    const categoryWiseTotals = Array.from(categoryMap.values()).sort((a, b) => b.incomeTotal + b.expenseTotal - (a.incomeTotal + a.expenseTotal));
    // Recent activity: last 10 items by date (ignores type filter, but respects date range).
    const recentActivity = db.records
        .filter((r) => r.ownerUserId === effectiveOwnerId)
        .filter((r) => inRange(r.date, params.from, params.to))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 10)
        .map((r) => ({
        id: r.id,
        amount: r.amount,
        type: r.type,
        category: r.category,
        date: r.date,
        notes: r.notes,
    }));
    // Monthly trends: default last 6 months if from/to not provided.
    let trendFrom = params.from;
    let trendTo = params.to;
    if (!trendFrom && !trendTo) {
        const now = new Date();
        const start = subtractMonths(now, 5);
        // Start at beginning of month (UTC) and include through now.
        trendFrom = start.toISOString().slice(0, 10);
        trendTo = now.toISOString().slice(0, 10);
    }
    let trendRecords = db.records.filter((r) => r.ownerUserId === effectiveOwnerId);
    trendRecords = trendRecords.filter((r) => inRange(r.date, trendFrom, trendTo));
    if (params.type)
        trendRecords = trendRecords.filter((r) => r.type === params.type);
    const monthMap = new Map();
    for (const r of trendRecords) {
        const m = parseMonth(r.date);
        if (!m)
            continue;
        const existing = monthMap.get(m) ?? { month: m, incomeTotal: 0, expenseTotal: 0 };
        if (r.type === "income")
            existing.incomeTotal += r.amount;
        else
            existing.expenseTotal += r.amount;
        monthMap.set(m, existing);
    }
    const monthlyTrends = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month)).map((t) => ({
        ...t,
        netBalance: t.incomeTotal - t.expenseTotal,
    }));
    return {
        totals: {
            totalIncome,
            totalExpenses,
            netBalance,
        },
        categoryWiseTotals,
        recentActivity,
        monthlyTrends,
    };
}
