from flask import Blueprint, jsonify, request

from database.db import mysql

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/dashboard/stats", methods=["GET"])
def dashboard_stats():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT COUNT(*), SUM(CASE WHEN risk_level = 'HIGH' THEN 1 ELSE 0 END) FROM claims")
        row = cursor.fetchone()
        total_claims = row[0] or 0
        high_risk = int(row[1]) if row[1] else 0
        fraud_percentage = (high_risk / total_claims * 100) if total_claims > 0 else 0
        cursor.close()
        return jsonify({
            "total_claims": total_claims,
            "high_risk_claims": high_risk,
            "fraud_percentage": round(fraud_percentage, 1)
        })
    except Exception as e:
        print("DB error dashboard stats", e)
        return jsonify({"success": False, "error": "Database error"}), 500

@dashboard_bp.route("/analytics/fraud-summary", methods=["GET"])
def fraud_summary():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT COUNT(*), SUM(CASE WHEN status = 'flagged' OR risk_level = 'HIGH' THEN 1 ELSE 0 END), AVG(risk_score) FROM claims")
        row = cursor.fetchone()
        total = row[0] or 0
        flagged = int(row[1]) if row[1] else 0
        avg_risk = float(row[2]) if row[2] else 0
        fraud_rate = (flagged / total * 100) if total > 0 else 0
        
        period = request.args.get("period", "week")
        limit = 30 if period == "month" else 7
        
        # Calculate changes compared to previous period
        cursor.execute(f"SELECT COUNT(*), SUM(CASE WHEN status = 'flagged' OR risk_level = 'HIGH' THEN 1 ELSE 0 END), AVG(risk_score) FROM claims WHERE created_at >= NOW() - INTERVAL {limit} DAY")
        curr_row = cursor.fetchone()
        curr_total = curr_row[0] or 0
        curr_flagged = int(curr_row[1]) if curr_row[1] else 0
        curr_avg_risk = float(curr_row[2]) if curr_row[2] else 0
        curr_fraud_rate = (curr_flagged / curr_total * 100) if curr_total > 0 else 0

        cursor.execute(f"SELECT COUNT(*), SUM(CASE WHEN status = 'flagged' OR risk_level = 'HIGH' THEN 1 ELSE 0 END), AVG(risk_score) FROM claims WHERE created_at >= NOW() - INTERVAL {limit*2} DAY AND created_at < NOW() - INTERVAL {limit} DAY")
        prev_row = cursor.fetchone()
        prev_total = prev_row[0] or 0
        prev_flagged = int(prev_row[1]) if prev_row[1] else 0
        prev_avg_risk = float(prev_row[2]) if prev_row[2] else 0
        prev_fraud_rate = (prev_flagged / prev_total * 100) if prev_total > 0 else 0

        def calc_change(curr, prev):
            if prev == 0 and curr > 0: return "+100%"
            if prev == 0 and curr == 0: return "0%"
            change = ((curr - prev) / prev) * 100
            return f"+{change:.1f}%" if change > 0 else f"{change:.1f}%"

        changes = {
            "total_claims": calc_change(curr_total, prev_total),
            "flagged_claims": calc_change(curr_flagged, prev_flagged),
            "fraud_rate": calc_change(curr_fraud_rate, prev_fraud_rate),
            "avg_risk": calc_change(curr_avg_risk, prev_avg_risk)
        }
        
        # Simple trends for the last X days from DB
        cursor.execute("SELECT DATE(created_at), SUM(amount), SUM(CASE WHEN status = 'flagged' OR risk_level = 'HIGH' THEN 1 ELSE 0 END) FROM claims GROUP BY DATE(created_at) ORDER BY DATE(created_at) DESC LIMIT %s", (limit,))
        trend_rows = cursor.fetchall()
        trends = [{"day": str(tr[0]), "amount": float(tr[1]) if tr[1] else 0, "flagged": int(tr[2]) if tr[2] else 0} for tr in reversed(trend_rows)]
        
        cursor.close()
        
        return jsonify({
            "total_claims": total,
            "flagged_claims": flagged,
            "fraud_rate": round(fraud_rate, 1),
            "avg_risk": round(avg_risk, 1),
            "changes": changes,
            "trends": trends
        })
    except Exception as e:
        print("DB error fraud summary", e)
        return jsonify({"success": False, "error": "Database error"}), 500